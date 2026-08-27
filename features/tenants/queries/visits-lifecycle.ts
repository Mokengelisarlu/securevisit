"use server";

/* The per-tenant Drizzle client is untyped (`any`), matching the existing
   server-action convention in tenant-data.ts. Type safety is enforced at
   compile time (tsc --noEmit) on the query builders where possible. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@clerk/nextjs/server";
import { getTenantDbBySlug } from "@/db/tenants";
import {
  visits,
  visitors,
  visitParticipants,
  visitStatusHistory,
  auditLogs,
  notifications,
  users,
  notificationTypeEnum,
  participantStatusEnum,
} from "@/db/tenants/schema";
import { and, eq, inArray, isNotNull, desc, asc, gte, lte } from "drizzle-orm";
import { requireRole } from "../server/authorization";

/* =====================================================
   NOTIFICATION / AUDIT HELPERS (internal)
   Every lifecycle mutation emits a notification AND an
   audit record via these helpers so we never double-write.
===================================================== */

type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

async function insertNotification(
  tx: any,
  input: {
    recipientId: string;
    recipientRole?: string | null;
    type: NotificationType;
    title: string;
    body?: string | null;
    visitId?: string | null;
  }
) {
  await tx.insert(notifications).values({
    recipientId: input.recipientId,
    recipientRole: input.recipientRole ?? null,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    visitId: input.visitId ?? null,
  });
}

async function insertAudit(
  tx: any,
  input: {
    actorId: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
  }
) {
  await tx.insert(auditLogs).values({
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    previousValue: input.previousValue ? JSON.stringify(input.previousValue) : null,
    newValue: input.newValue ? JSON.stringify(input.newValue) : null,
  });
}

async function insertStatusHistory(
  tx: any,
  input: {
    visitId: string;
    fromStatus?: string | null;
    toStatus: string;
    actorId: string;
    actorRole: string;
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  await tx.insert(visitStatusHistory).values({
    visitId: input.visitId,
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus,
    actorId: input.actorId,
    actorRole: input.actorRole,
    reason: input.reason ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

/* =====================================================
   AUTHORIZATION
===================================================== */

/**
 * Resolve the acting user (Clerk id + role within the tenant).
 * Throws if the user is not authenticated or not a tenant member.
 */
export async function getActor(tenantSlug: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = await getTenantDbBySlug(tenantSlug);
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error("Forbidden: You do not have access to this tenant");
  return { id: user.id, role: user.role, hostId: user.hostId ?? null, email: user.email };
}

/**
 * Enforce that the current HOST owns the given visit.
 * Used for HOST-role approve/reject/postpone mutations.
 */
export async function assertHostOwnsVisit(tenantSlug: string, visitId: string) {
  const actor = await getActor(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);

  const visit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
  });

  if (!visit) throw new Error("Visit not found");

  if (actor.role === "ROOT" || actor.role === "ADMIN") {
    return { actor, visit };
  }

  if (actor.role !== "HOST") {
    throw new Error("Forbidden: Only the assigned host or an admin can act on this visit");
  }

  if (!actor.hostId || actor.hostId !== visit.hostId) {
    throw new Error("Forbidden: You are not the host of this visit");
  }

  return { actor, visit };
}

/* =====================================================
   SETTINGS
===================================================== */

async function getRequireHostApproval(tenantSlug: string): Promise<boolean> {
  const db = await getTenantDbBySlug(tenantSlug);
  const current = await db.query.settings.findFirst();
  return current?.requireHostApproval !== 0;
}

/* =====================================================
   CREATE VISIT REQUEST (individual / group / pre-registered)
===================================================== */

export type VisitParticipantInput = {
  visitorId: string;
  notes?: string | null;
};

export async function createVisitRequest(
  tenantSlug: string,
  input: {
    visitorId?: string;
    newVisitor?: {
      firstName: string;
      lastName: string;
      phone?: string | null;
      company?: string | null;
      visitorTypeId?: string | null;
    };
    hostId?: string | null;
    departmentId?: string | null;
    serviceId?: string | null;
    purpose?: string | null;
    visitType?: "WALK_IN" | "PRE_REGISTERED" | "GROUP";
    groupName?: string | null;
    organization?: string | null;
    participantCount?: number | null;
    participants?: VisitParticipantInput[];
    visitDate?: Date;
    arrivalAt?: Date;
    notes?: string | null;
  }
) {
  const actor = await getActor(tenantSlug);
  void (await requireRole(tenantSlug, ["ROOT", "ADMIN", "SECURITY", "RECEPTION", "HOST"]));

  const db = await getTenantDbBySlug(tenantSlug);
  const now = new Date();

  try {
    return await db.transaction(async (tx: any) => {
      // 1. Resolve the primary visitor
      let primaryVisitorId = input.visitorId || null;
      if (input.newVisitor && !primaryVisitorId) {
        const [nv] = await tx
          .insert(visitors)
          .values({
            firstName: input.newVisitor.firstName,
            lastName: input.newVisitor.lastName,
            phone: input.newVisitor.phone || null,
            company: input.newVisitor.company || null,
            visitorTypeId: input.newVisitor.visitorTypeId || null,
          })
          .returning();
        primaryVisitorId = nv.id;
      }
      if (!primaryVisitorId) {
        throw new Error("Visitor ID or new visitor data is required");
      }

      // 2. Determine workflow status
      //    - Pre-registered by host => approved immediately.
      //    - Walk-in/group created by operator => pending approval (unless host approval disabled).
      const requireApproval = await getRequireHostApproval(tenantSlug);
      const isPreRegistered = input.visitType === "PRE_REGISTERED" || typeof input.visitDate !== "undefined";
      const autoApproved = !requireApproval || (isPreRegistered && ["HOST", "ADMIN", "ROOT"].includes(actor.role));
      const initialStatus = autoApproved ? "APPROVED" : "PENDING_APPROVAL";

      // 3. Build the visit number
      const dateStr = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("");
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const todayVisits = await tx.query.visits.findMany({
        where: and(
          isNotNull(visits.visitDate),
          gte(visits.visitDate, startOfDay),
          lte(visits.visitDate, endOfDay)
        ),
      });
      const sequence = (todayVisits.length + 1).toString().padStart(4, "0");
      const visitNumber = `VIS-${dateStr}-${sequence}`;

      const participants = input.participants ?? [];
      const groupCount = participants.length > 0 ? participants.length : input.participantCount ?? 1;

      // 4. Insert the visit
      const [visit] = await tx
        .insert(visits)
        .values({
          visitNumber,
          visitorId: primaryVisitorId,
          hostId: input.hostId ?? null,
          departmentId: input.departmentId ?? null,
          serviceId: input.serviceId ?? null,
          purpose: input.purpose ?? null,
          visitType: input.visitType ?? "WALK_IN",
          visitDate: input.visitDate || now,
          status: initialStatus,
          checkInAt: null,
          groupName: input.groupName ?? null,
          organization: input.organization ?? null,
          participantCount: groupCount,
          arrivalAt: input.arrivalAt ?? (isPreRegistered ? null : now),
          notes: input.notes ?? null,
        })
        .returning();
      const visitId = visit.id;

      // 5. Insert participants (for group visits); always ensure the primary visitor exists as participant
      const memberVisitorIds = new Set(participants.map((p) => p.visitorId));
      if (!memberVisitorIds.has(primaryVisitorId)) {
        await tx.insert(visitParticipants).values({
          visitId,
          visitorId: primaryVisitorId,
          status: isPreRegistered ? "EXPECTED" : "WAITING",
          notes: input.notes ?? null,
        });
      }
      for (const p of participants) {
        await tx.insert(visitParticipants).values({
          visitId,
          visitorId: p.visitorId,
          status: isPreRegistered ? "EXPECTED" : "WAITING",
          notes: p.notes ?? null,
        });
      }

      // 6. Status history + audit
      await insertStatusHistory(tx, {
        visitId,
        fromStatus: null,
        toStatus: initialStatus,
        actorId: actor.id,
        actorRole: actor.role,
        reason: isPreRegistered ? "Pre-registered" : "Walk-in request",
        metadata: { visitType: visit.visitType },
      });
      await insertAudit(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: "VISIT_CREATED",
        entityType: "visit",
        entityId: visitId,
        newValue: { visitNumber, status: initialStatus, participantCount: groupCount },
      });

      // 7. Notify the host of a new request
      if (input.hostId) {
        const hostUser = await tx.query.users.findFirst({
          where: eq(users.hostId, input.hostId),
        });
        const hostRole = hostUser?.role ?? "HOST";
        await insertNotification(tx, {
          recipientId: hostUser?.id ?? input.hostId,
          recipientRole: hostRole,
          type: "VISIT_REQUEST_CREATED",
          title: "New visit request",
          body: `${visitNumber} — ${input.groupName ?? input.newVisitor ? `${input.newVisitor?.firstName} ${input.newVisitor?.lastName}`.trim() || "Visitor" : "Visit"} awaits your approval.`,
          visitId,
        });
      }

      return { visit, visitNumber, status: initialStatus };
    });
  } catch (error) {
    console.error("createVisitRequest failed:", error);
    throw error;
  }
}

/* =====================================================
   APPROVE / REJECT / POSTPONE / CANCEL
===================================================== */

export async function approveVisit(tenantSlug: string, visitId: string) {
  const { actor, visit } = await assertHostOwnsVisit(tenantSlug, visitId);
  await requireRole(tenantSlug, ["ROOT", "ADMIN", "HOST"]);
  if (visit.status === "REJECTED" || visit.status === "CANCELLED") {
    throw new Error("Cannot approve a rejected or cancelled visit");
  }

  const db = await getTenantDbBySlug(tenantSlug);
  const fromStatus = visit.status;
  const updated = await db.transaction(async (tx: any) => {
    const [u] = await tx
      .update(visits)
      .set({ status: "APPROVED", approvedBy: actor.id, approvedAt: new Date() })
      .where(eq(visits.id, visitId))
      .returning();

    // Approved members move from WAITING to EXPECTED (approved but not yet entered).
    await tx
      .update(visitParticipants)
      .set({ status: "EXPECTED" })
      .where(and(eq(visitParticipants.visitId, visitId), eq(visitParticipants.status, "WAITING")));

    await insertStatusHistory(tx, {
      visitId,
      fromStatus,
      toStatus: "APPROVED",
      actorId: actor.id,
      actorRole: actor.role,
    });
    await insertAudit(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: "VISIT_APPROVED",
      entityType: "visit",
      entityId: visitId,
      previousValue: { status: fromStatus },
      newValue: { status: "APPROVED" },
    });

    const operatorUsers = await tx.query.users.findMany({
      where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
    });
    for (const op of operatorUsers) {
      await insertNotification(tx, {
        recipientId: op.id,
        recipientRole: op.role,
        type: "VISIT_APPROVED",
        title: "Visit approved",
        body: `Visit ${u.visitNumber} was approved.`,
        visitId,
      });
    }

    return u;
  });

  return updated;
}

export async function rejectVisit(tenantSlug: string, visitId: string, reason?: string | null) {
  const { actor, visit } = await assertHostOwnsVisit(tenantSlug, visitId);
  await requireRole(tenantSlug, ["ROOT", "ADMIN", "HOST"]);
  if (visit.status === "REJECTED" || visit.status === "CANCELLED") {
    throw new Error("Visit is already in a terminal state");
  }

  const db = await getTenantDbBySlug(tenantSlug);
  const fromStatus = visit.status;
  const updated = await db.transaction(async (tx: any) => {
    const [u] = await tx
      .update(visits)
      .set({ status: "REJECTED", rejectedBy: actor.id, rejectedAt: new Date(), rejectionReason: reason ?? null })
      .where(eq(visits.id, visitId))
      .returning();

    await insertStatusHistory(tx, {
      visitId,
      fromStatus,
      toStatus: "REJECTED",
      actorId: actor.id,
      actorRole: actor.role,
      reason: reason ?? null,
    });
    await insertAudit(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: "VISIT_REJECTED",
      entityType: "visit",
      entityId: visitId,
      previousValue: { status: fromStatus },
      newValue: { status: "REJECTED", reason },
    });

    const operatorUsers = await tx.query.users.findMany({
      where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
    });
    for (const op of operatorUsers) {
      await insertNotification(tx, {
        recipientId: op.id,
        recipientRole: op.role,
        type: "VISIT_REJECTED",
        title: "Visit rejected",
        body: `Visit ${u.visitNumber} was rejected.${reason ? ` Reason: ${reason}` : ""}`,
        visitId,
      });
    }

    return u;
  });

  return updated;
}

export async function postponeVisit(
  tenantSlug: string,
  visitId: string,
  newProposedDate: Date,
  reason?: string | null
) {
  const { actor, visit } = await assertHostOwnsVisit(tenantSlug, visitId);
  await requireRole(tenantSlug, ["ROOT", "ADMIN", "HOST"]);
  if (visit.status === "REJECTED" || visit.status === "CANCELLED") {
    throw new Error("Cannot postpone a rejected or cancelled visit");
  }

  const db = await getTenantDbBySlug(tenantSlug);
  const fromStatus = visit.status;
  const updated = await db.transaction(async (tx: any) => {
    const [u] = await tx
      .update(visits)
      .set({
        status: "POSTPONED",
        postponedBy: actor.id,
        postponedAt: new Date(),
        postponeReason: reason ?? null,
        newProposedDate,
      })
      .where(eq(visits.id, visitId))
      .returning();

    await insertStatusHistory(tx, {
      visitId,
      fromStatus,
      toStatus: "POSTPONED",
      actorId: actor.id,
      actorRole: actor.role,
      reason: reason ?? null,
      metadata: { newProposedDate: newProposedDate.toISOString() },
    });
    await insertAudit(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: "VISIT_POSTPONED",
      entityType: "visit",
      entityId: visitId,
      previousValue: { status: fromStatus, visitDate: visit.visitDate?.toISOString() },
      newValue: { status: "POSTPONED", newProposedDate: newProposedDate.toISOString(), reason },
    });

    const operatorUsers = await tx.query.users.findMany({
      where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
    });
    for (const op of operatorUsers) {
      await insertNotification(tx, {
        recipientId: op.id,
        recipientRole: op.role,
        type: "VISIT_POSTPONED",
        title: "Visit postponed",
        body: `Visit ${u.visitNumber} postponed.${reason ? ` Reason: ${reason}` : ""}`,
        visitId,
      });
    }

    return u;
  });

  return updated;
}

export async function cancelVisit(tenantSlug: string, visitId: string, reason?: string | null) {
  const { actor, visit } = await assertHostOwnsVisit(tenantSlug, visitId);
  await requireRole(tenantSlug, ["ROOT", "ADMIN", "SECURITY", "RECEPTION", "HOST"]);
  if (visit.status === "REJECTED" || visit.status === "CANCELLED") {
    throw new Error("Visit is already in a terminal state");
  }

  const db = await getTenantDbBySlug(tenantSlug);
  const fromStatus = visit.status;
  const updated = await db.transaction(async (tx: any) => {
    const [u] = await tx
      .update(visits)
      .set({ status: "CANCELLED", canceledBy: actor.id, canceledAt: new Date(), cancelReason: reason ?? null })
      .where(eq(visits.id, visitId))
      .returning();

    await insertStatusHistory(tx, {
      visitId,
      fromStatus,
      toStatus: "CANCELLED",
      actorId: actor.id,
      actorRole: actor.role,
      reason: reason ?? null,
    });
    await insertAudit(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: "VISIT_CANCELLED",
      entityType: "visit",
      entityId: visitId,
      previousValue: { status: fromStatus },
      newValue: { status: "CANCELLED", reason },
    });

    const operatorUsers = await tx.query.users.findMany({
      where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
    });
    for (const op of operatorUsers) {
      await insertNotification(tx, {
        recipientId: op.id,
        recipientRole: op.role,
        type: "VISIT_CANCELLED",
        title: "Visit cancelled",
        body: `Visit ${u.visitNumber} was cancelled.${reason ? ` Reason: ${reason}` : ""}`,
        visitId,
      });
    }

    return u;
  });

  return updated;
}

/* =====================================================
   PARTICIPANT MANAGEMENT
===================================================== */

export async function addVisitParticipant(
  tenantSlug: string,
  visitId: string,
  input: { visitorId: string; notes?: string | null }
) {
  const actor = await getActor(tenantSlug);
  await requireRole(tenantSlug, ["ROOT", "ADMIN", "SECURITY", "RECEPTION"]);

  const db = await getTenantDbBySlug(tenantSlug);
  const visit = await db.query.visits.findFirst({ where: eq(visits.id, visitId) });
  if (!visit) throw new Error("Visit not found");
  if (visit.status === "REJECTED" || visit.status === "CANCELLED" || visit.status === "OUT") {
    throw new Error("Cannot add participants to a closed visit");
  }

  const status: (typeof participantStatusEnum.enumValues)[number] =
    visit.status === "APPROVED" ? "EXPECTED" : "WAITING";
  const [participant] = await db
    .insert(visitParticipants)
    .values({ visitId, visitorId: input.visitorId, status, notes: input.notes ?? null })
    .onConflictDoNothing({
      target: [visitParticipants.visitId, visitParticipants.visitorId],
    })
    .returning();

  await db.insert(auditLogs).values({
    actorId: actor.id,
    actorRole: actor.role,
    action: "PARTICIPANT_ADDED",
    entityType: "visit_participant",
    entityId: participant?.id ?? null,
    newValue: JSON.stringify({ visitId, visitorId: input.visitorId }),
  });

  // Update participant count
  const count = await db
    .select({ id: visitParticipants.id })
    .from(visitParticipants)
    .where(eq(visitParticipants.visitId, visitId));
  await db
    .update(visits)
    .set({ participantCount: count.length })
    .where(eq(visits.id, visitId));

  return participant;
}

export async function setParticipantStatus(
  tenantSlug: string,
  visitId: string,
  participantId: string,
  status: "CHECKED_IN" | "CHECKED_OUT" | "NO_SHOW" | "CANCELED"
) {
  const actor = await getActor(tenantSlug);
  await requireRole(tenantSlug, ["ROOT", "ADMIN", "SECURITY", "RECEPTION"]);

  const db = await getTenantDbBySlug(tenantSlug);
  const participant = await db.query.visitParticipants.findFirst({
    where: eq(visitParticipants.id, participantId),
  });
  if (!participant || participant.visitId !== visitId) {
    throw new Error("Participant not found for this visit");
  }
  if (participant.status === "CHECKED_OUT" || participant.status === "NO_SHOW") {
    throw new Error("Participant is already in a terminal state");
  }

  const visit = await db.query.visits.findFirst({ where: eq(visits.id, visitId) });
  if (!visit) throw new Error("Visit not found");
  if (status === "CHECKED_IN" && visit.status !== "APPROVED") {
    throw new Error("Cannot check in a participant of a visit that is not approved");
  }

  const now = new Date();
  const previousStatus = participant.status;
  const [updated] = await db
    .update(visitParticipants)
    .set({
      status,
      checkedInAt: status === "CHECKED_IN" ? now : participant.checkedInAt,
      checkedOutAt: status === "CHECKED_OUT" ? now : participant.checkedOutAt,
    })
    .where(eq(visitParticipants.id, participantId))
    .returning();

  const result = await db.transaction(async (tx: any) => {
    await insertStatusHistory(tx, {
      visitId,
      fromStatus: previousStatus,
      toStatus: status,
      actorId: actor.id,
      actorRole: actor.role,
      metadata: { participantId },
    });
    await insertAudit(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: `PARTICIPANT_${status}`,
      entityType: "visit_participant",
      entityId: participantId,
      previousValue: { status: previousStatus },
      newValue: { status },
    });

    // Roll the parent visit status: IN when anyone is checked in; OUT when none remain inside.
    const active = await tx.query.visitParticipants.findMany({
      where: and(eq(visitParticipants.visitId, visitId), eq(visitParticipants.status, "CHECKED_IN")),
    });
    if (status === "CHECKED_IN" && visit.status !== "IN") {
      await tx.update(visits).set({ status: "IN", checkInAt: now }).where(eq(visits.id, visitId));
      const opUsers = await tx.query.users.findMany({
        where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
      });
      for (const op of opUsers) {
        await insertNotification(tx, {
          recipientId: op.id,
          recipientRole: op.role,
          type: "VISITOR_CHECKED_IN",
          title: "Visitor checked in",
          body: `A participant of visit ${visit.visitNumber} has checked in.`,
          visitId,
        });
      }
    } else if (status === "CHECKED_OUT" && active.length === 0 && visit.status !== "OUT") {
      await tx.update(visits).set({ status: "OUT", checkOutAt: now }).where(eq(visits.id, visitId));
      const opUsers = await tx.query.users.findMany({
        where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
      });
      for (const op of opUsers) {
        await insertNotification(tx, {
          recipientId: op.id,
          recipientRole: op.role,
          type: "VISITOR_CHECKED_OUT",
          title: "Visitor checked out",
          body: `All participants of visit ${visit.visitNumber} have checked out.`,
          visitId,
        });
      }
    }

    return updated;
  });

  return result;
}

/**
 * [GROUP] Check in every participant of a visit that is in a non-terminal,
 * non-checked-in state (WAITING / EXPECTED / CANCELED). Returns the updated
 * participants. Used for "Check in all arrived" on the operator device.
 */
export async function checkInVisitParticipants(tenantSlug: string, visitId: string) {
  const actor = await getActor(tenantSlug);
  await requireRole(tenantSlug, ["ROOT", "ADMIN", "SECURITY", "RECEPTION"]);

  const db = await getTenantDbBySlug(tenantSlug);
  const visit = await db.query.visits.findFirst({ where: eq(visits.id, visitId) });
  if (!visit) throw new Error("Visit not found");
  if (visit.status !== "APPROVED") {
    throw new Error("Cannot check in a visit that is not approved");
  }

  const now = new Date();
  const participants = await db.query.visitParticipants.findMany({
    where: and(eq(visitParticipants.visitId, visitId), inArray(visitParticipants.status, ["WAITING", "EXPECTED", "CANCELED"])),
  });

  const updatedIds: string[] = [];
  await db.transaction(async (tx: any) => {
    for (const p of participants) {
      const [u] = await tx
        .update(visitParticipants)
        .set({ status: "CHECKED_IN", checkedInAt: now })
        .where(eq(visitParticipants.id, p.id))
        .returning();
      if (u) updatedIds.push(u.id);
    }

    await tx.update(visits).set({ status: "IN", checkInAt: now }).where(eq(visits.id, visitId));
    await insertStatusHistory(tx, {
      visitId,
      fromStatus: visit.status,
      toStatus: "IN",
      actorId: actor.id,
      actorRole: actor.role,
      metadata: { bulk: true, participantIds: updatedIds },
    });
    await insertAudit(tx, {
      actorId: actor.id,
      actorRole: actor.role,
      action: "VISIT_CHECKED_IN",
      entityType: "visit",
      entityId: visitId,
      previousValue: { status: visit.status },
      newValue: { status: "IN", participantsCheckedIn: updatedIds.length },
    });
  });

  return { checkedInCount: updatedIds.length };
}

/**
 * [GROUP] Check out every CHECKED_IN participant of a visit. Marks the visit OUT
 * when none remain. Returns the updated participants.
 */
export async function checkOutVisitParticipants(tenantSlug: string, visitId: string) {
  const actor = await getActor(tenantSlug);
  await requireRole(tenantSlug, ["ROOT", "ADMIN", "SECURITY", "RECEPTION"]);

  const db = await getTenantDbBySlug(tenantSlug);
  const now = new Date();
  const participants = await db.query.visitParticipants.findMany({
    where: and(eq(visitParticipants.visitId, visitId), eq(visitParticipants.status, "CHECKED_IN")),
  });

  const updatedIds: string[] = [];
  await db.transaction(async (tx: any) => {
    for (const p of participants) {
      const [u] = await tx
        .update(visitParticipants)
        .set({ status: "CHECKED_OUT", checkedOutAt: now })
        .where(eq(visitParticipants.id, p.id))
        .returning();
      if (u) updatedIds.push(u.id);
    }

    if (updatedIds.length > 0) {
      await tx.update(visits).set({ status: "OUT", checkOutAt: now }).where(eq(visits.id, visitId));
      await insertStatusHistory(tx, {
        visitId,
        fromStatus: "IN",
        toStatus: "OUT",
        actorId: actor.id,
        actorRole: actor.role,
        metadata: { bulk: true, participantIds: updatedIds },
      });
      await insertAudit(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: "VISIT_CHECKED_OUT",
        entityType: "visit",
        entityId: visitId,
        previousValue: { status: "IN" },
        newValue: { status: "OUT", participantsCheckedOut: updatedIds.length },
      });
    }
  });

  return { checkedOutCount: updatedIds.length };
}

/* =====================================================
   QUERIES (operator console + host inbox)
===================================================== */

export async function getPendingVisitRequests(tenantSlug: string, hostId?: string | null) {
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visits.findMany({
    where: and(eq(visits.status, "PENDING_APPROVAL"), hostId ? eq(visits.hostId, hostId) : undefined),
    with: { visitor: true, host: true, department: true },
    orderBy: [asc(visits.arrivalAt)],
  });
}

export async function getExpectedVisits(tenantSlug: string, date?: Date) {
  const db = await getTenantDbBySlug(tenantSlug);
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return await db.query.visits.findMany({
      where: and(eq(visits.status, "APPROVED"), gte(visits.visitDate, startOfDay), lte(visits.visitDate, endOfDay)),
      with: { visitor: true, host: true, department: true, participants: true },
      orderBy: [asc(visits.visitDate)],
    });
  }
  return await db.query.visits.findMany({
    where: eq(visits.status, "APPROVED"),
    with: { visitor: true, host: true, department: true, participants: true },
    orderBy: [asc(visits.visitDate)],
  });
}

export async function getWaitingVisits(tenantSlug: string) {
  const db = await getTenantDbBySlug(tenantSlug);
  const current = await db.query.settings.findFirst();
  const warningMin = current?.waitingWarningMinutes ?? 15;
  const criticalMin = current?.waitingCriticalMinutes ?? 30;
  const now = Date.now();

  const pending = await db.query.visits.findMany({
    where: inArray(visits.status, ["PENDING_APPROVAL", "APPROVED"]),
    with: { visitor: true, host: true, department: true },
  });

  return pending.map((v: any) => {
    const base = v.arrivalAt ?? v.createdAt ?? new Date();
    const waitingMin = Math.floor((now - new Date(base).getTime()) / (1000 * 60));
    const waitingFor = v.arrivalAt ? Math.max(0, waitingMin) : null;
    const escalation =
      waitingFor === null ? "normal" : waitingFor >= criticalMin ? "critical" : waitingFor >= warningMin ? "warning" : "normal";
    return { ...v, waitingMinutes: waitingFor, escalation };
  });
}

export async function getCurrentlyInside(tenantSlug: string) {
  const db = await getTenantDbBySlug(tenantSlug);
  const participants = await db.query.visitParticipants.findMany({
    where: eq(visitParticipants.status, "CHECKED_IN"),
    with: { visit: { with: { host: true, department: true } }, visitor: true },
  });

  // Also include individual visits marked IN that have no explicit participant rows.
  const individualInside = await db.query.visits.findMany({
    where: and(eq(visits.status, "IN"), eq(visits.visitType, "WALK_IN")),
    with: { visitor: true, host: true, department: true },
  });

  const insideParticipantIds = new Set(participants.map((p: any) => p.visitId));
  const individuals = individualInside.filter((i: any) => !insideParticipantIds.has(i.id));

  return {
    participants,
    individuals,
    count: participants.length + individuals.length,
  };
}

export async function getVisitDetail(tenantSlug: string, visitId: string) {
  const db = await getTenantDbBySlug(tenantSlug);
  const visit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
    with: {
      visitor: true,
      host: true,
      department: true,
      service: true,
      participants: { with: { visitor: true } },
      statusHistory: { orderBy: desc(visitStatusHistory.createdAt) },
    },
  });
  if (!visit) throw new Error("Visit not found");
  return visit;
}

/* =====================================================
   NOTIFICATIONS (current user)
===================================================== */

export async function getMyNotifications(tenantSlug: string) {
  const actor = await getActor(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.notifications.findMany({
    where: eq(notifications.recipientId, actor.id),
    orderBy: [desc(notifications.createdAt)],
    limit: 100,
  });
}

export async function markNotificationRead(tenantSlug: string, notificationId: string) {
  const actor = await getActor(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  const [updated] = await db
    .update(notifications)
    .set({ isRead: 1, readAt: new Date() })
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, actor.id)))
    .returning();
  return updated ?? null;
}
