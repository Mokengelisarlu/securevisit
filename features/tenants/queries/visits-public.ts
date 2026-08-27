import { and, eq, gte, lte, inArray, isNotNull } from "drizzle-orm";
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
} from "@/db/tenants/schema";
import { verifyDeviceToken, createPublicVisit } from "./tenant-data";

/* The per-tenant Drizzle client is untyped (`any`), matching the existing
   server/module convention. Type safety is enforced at compile time
   (tsc --noEmit) on the query builders where possible. */
/* eslint-disable @typescript-eslint/no-explicit-any */

type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

/**
 * Device-token (kiosk/operator) access to the visit lifecycle.
 *
 * The web lifecycle module (`visits-lifecycle.ts`) is session-based (Clerk).
 * The kiosk authenticates with a paired-device token, so this module verifies
 * the device and performs lifecycle operations on the operator's behalf,
 * recording the device as the actor for audit/status-history purposes.
 */

async function insertStatusHistory(tx: any, input: {
  visitId: string;
  fromStatus?: string | null;
  toStatus: string;
  actorId: string;
  actorRole: string;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
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

async function insertAudit(tx: any, input: {
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
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

async function insertNotification(tx: any, input: {
  recipientId: string;
  recipientRole?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  visitId?: string | null;
}) {
  await tx.insert(notifications).values({
    recipientId: input.recipientId,
    recipientRole: input.recipientRole ?? null,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    visitId: input.visitId ?? null,
  });
}

async function getRequireHostApproval(tenantSlug: string): Promise<boolean> {
  const db = await getTenantDbBySlug(tenantSlug);
  const current = await db.query.settings.findFirst();
  return (current?.requireHostApproval ?? 1) === 1;
}

export interface PublicVisitRequestInput {
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
  participants?: { visitorId: string; notes?: string | null }[];
  vehicle?: {
    plateNumber: string;
    type: "CAR" | "TRUCK" | "MOTORCYCLE" | "OTHER";
    brand?: string;
    color?: string;
  };
  passengerCount?: number;
  visitorPhotoUrl?: string;
  vehiclePhotoUrl?: string;
  signatureData?: string;
}

/**
 * Create a visit from the kiosk with approval-gate semantics.
 * - When `requireHostApproval` is ON: the visit is created as PENDING_APPROVAL
 *   (participants WAITING, not inside) until a host approves.
 * - When OFF: delegates to the existing instant check-in path (status IN).
 */
export async function createPublicVisitRequest(
  tenantSlug: string,
  deviceToken: string,
  data: PublicVisitRequestInput
) {
  const device = await verifyDeviceToken(tenantSlug, deviceToken);
  const actorId = `device:${device.id}`;
  const actorRole = "OPERATOR";

  const requireApproval = await getRequireHostApproval(tenantSlug);

  // Not approval-gated: preserve the existing instant check-in behavior.
  if (!requireApproval) {
    return await createPublicVisit(tenantSlug, deviceToken, {
      visitorId: data.visitorId,
      newVisitor: data.newVisitor ?? undefined,
      hostId: data.hostId ?? undefined,
      departmentId: data.departmentId ?? undefined,
      serviceId: data.serviceId ?? undefined,
      purpose: data.purpose ?? undefined,
      vehicle: data.vehicle,
      passengerCount: data.passengerCount,
      visitorPhotoUrl: data.visitorPhotoUrl,
      vehiclePhotoUrl: data.vehiclePhotoUrl,
      signatureData: data.signatureData,
      visitType: data.visitType === "GROUP" ? "WALK_IN" : data.visitType,
    } as Parameters<typeof createPublicVisit>[2]);
  }

  // Approval-gated path: create a PENDING visit (not inside).
  const db = await getTenantDbBySlug(tenantSlug);
  const now = new Date();

  return await db.transaction(async (tx: any) => {
    let primaryVisitorId = data.visitorId || null;
    if (data.newVisitor && !primaryVisitorId) {
      const [nv] = await tx
        .insert(visitors)
        .values({
          firstName: data.newVisitor.firstName,
          lastName: data.newVisitor.lastName,
          phone: data.newVisitor.phone || null,
          company: data.newVisitor.company || null,
          visitorTypeId: data.newVisitor.visitorTypeId || null,
        })
        .returning();
      primaryVisitorId = nv.id;
    }
    if (!primaryVisitorId) {
      throw new Error("Visitor ID or new visitor data is required");
    }

    // Visit number
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

    const participants = data.participants ?? [];
    const groupCount = participants.length > 0 ? participants.length : data.participantCount ?? 1;
    const isGroup = data.visitType === "GROUP" || participants.length > 0;

    // Check no active PENDING/APPROVED request exists for this primary visitor (avoid dupes).
    const existing = await tx.query.visits.findFirst({
      where: and(
        eq(visits.visitorId, primaryVisitorId),
        inArray(visits.status, ["PENDING_APPROVAL", "APPROVED"])
      ),
    });
    if (existing) {
      throw new Error("Ce visiteur a déjà une demande de visite en cours.");
    }

    const [visit] = await tx
      .insert(visits)
      .values({
        visitNumber,
        visitorId: primaryVisitorId,
        hostId: data.hostId ?? null,
        departmentId: data.departmentId ?? null,
        serviceId: data.serviceId ?? null,
        purpose: data.purpose ?? null,
        visitType: isGroup ? "GROUP" : data.visitType ?? "WALK_IN",
        visitDate: now,
        status: "PENDING_APPROVAL",
        checkInAt: null,
        groupName: data.groupName ?? null,
        organization: data.organization ?? null,
        participantCount: groupCount,
        arrivalAt: now,
        notes: data.organization ?? data.purpose ?? null,
        visitorPhotoUrl: data.visitorPhotoUrl ?? null,
        vehiclePhotoUrl: data.vehiclePhotoUrl ?? null,
        signatureData: data.signatureData ?? null,
      })
      .returning();
    const visitId = visit.id;

    // Participants (WAITING); always ensure the primary visitor is a member.
    const memberVisitorIds = new Set(participants.map((p) => p.visitorId));
    if (!memberVisitorIds.has(primaryVisitorId)) {
      await tx.insert(visitParticipants).values({
        visitId,
        visitorId: primaryVisitorId,
        status: "WAITING",
        notes: null,
      });
    }
    for (const p of participants) {
      await tx.insert(visitParticipants).values({
        visitId,
        visitorId: p.visitorId,
        status: "WAITING",
        notes: p.notes ?? null,
      });
    }

    await insertStatusHistory(tx, {
      visitId,
      fromStatus: null,
      toStatus: "PENDING_APPROVAL",
      actorId,
      actorRole,
      reason: "Kiosk check-in request",
      metadata: { visitType: visit.visitType },
    });
    await insertAudit(tx, {
      actorId,
      actorRole,
      action: "VISIT_CREATED",
      entityType: "visit",
      entityId: visitId,
      newValue: { visitNumber, status: "PENDING_APPROVAL", participantCount: groupCount },
    });

    // Notify every host + operator of the new request.
    if (data.hostId) {
      const hostUser = await tx.query.users.findFirst({ where: eq(users.hostId, data.hostId) });
      await insertNotification(tx, {
        recipientId: hostUser?.id ?? data.hostId,
        recipientRole: hostUser?.role ?? "HOST",
        type: "VISIT_REQUEST_CREATED",
        title: "Nouvelle demande de visite",
        body: `${visitNumber} — en attente d'approbation.`,
        visitId,
      });
    }
    const opUsers = await tx.query.users.findMany({
      where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
    });
    for (const op of opUsers) {
      await insertNotification(tx, {
        recipientId: op.id,
        recipientRole: op.role,
        type: "VISIT_REQUEST_CREATED",
        title: "Nouvelle demande de visite",
        body: `${visitNumber} — en attente d'approbation.`,
        visitId,
      });
    }

    return { visit, visitNumber, status: "PENDING_APPROVAL" as const, requiresApproval: true };
  });
}

/**
 * [PUBLIC] Waiting list (pending approval + approved-but-not-checked-in) with
 * escalation (normal | warning | critical). Requires a valid device token.
 */
export async function getPublicWaitingVisits(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  const current = await db.query.settings.findFirst();
  const warningMin = current?.waitingWarningMinutes ?? 15;
  const criticalMin = current?.waitingCriticalMinutes ?? 30;
  const now = Date.now();

  const pending = await db.query.visits.findMany({
    where: inArray(visits.status, ["PENDING_APPROVAL", "APPROVED"]),
    with: { visitor: true, host: true, department: true, participants: true },
    orderBy: (v: any, { asc }: any) => [asc(v.arrivalAt) as any],
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

/**
 * [PUBLIC] Expected visits (approved, not yet arrived). Requires device token.
 */
export async function getPublicExpectedVisits(tenantSlug: string, deviceToken: string, date?: Date) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  const base = date || new Date();
  const startOfDay = new Date(base);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(base);
  endOfDay.setHours(23, 59, 59, 999);

  return await db.query.visits.findMany({
    where: and(eq(visits.status, "APPROVED"), gte(visits.visitDate, startOfDay), lte(visits.visitDate, endOfDay)),
    with: { visitor: true, host: true, department: true, participants: { with: { visitor: true } } },
    orderBy: (v: any, { asc }: any) => [asc(v.visitDate) as any],
  });
}

/**
 * [PUBLIC] Currently inside = participants with CHECKED_IN + individual IN visits.
 */
export async function getPublicCurrentlyInside(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  const participants = await db.query.visitParticipants.findMany({
    where: eq(visitParticipants.status, "CHECKED_IN"),
    with: { visit: { with: { host: true, department: true } }, visitor: true },
  });

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
    onSite: participants.length + individuals.length,
  };
}

/**
 * [GROUP] Check in arrived participants of an approved visit from the kiosk.
 * Accepts an explicit list of participant ids; if empty, checks in everyone who
 * is WAITING/EXPECTED/CANCELED (i.e. all arrived).
 */
export async function checkInPublicParticipants(
  tenantSlug: string,
  deviceToken: string,
  visitId: string,
  participantIds?: string[]
) {
  const device = await verifyDeviceToken(tenantSlug, deviceToken);
  const actorId = `device:${device.id}`;
  const actorRole = "OPERATOR";

  const db = await getTenantDbBySlug(tenantSlug);
  const visit = await db.query.visits.findFirst({ where: eq(visits.id, visitId) });
  if (!visit) throw new Error("Visit not found");
  if (visit.status !== "APPROVED") {
    throw new Error("Impossible d'enregistrer un visiteur sur une visite non approuvée.");
  }

  const now = new Date();
  const where = participantIds && participantIds.length > 0
    ? and(eq(visitParticipants.visitId, visitId), inArray(visitParticipants.id, participantIds))
    : and(eq(visitParticipants.visitId, visitId), inArray(visitParticipants.status, ["WAITING", "EXPECTED", "CANCELED"]));

  const participants = await db.query.visitParticipants.findMany({ where });
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
      actorId,
      actorRole,
      metadata: { bulk: true, participantIds: updatedIds },
    });
    await insertAudit(tx, {
      actorId,
      actorRole,
      action: "PARTICIPANT_CHECKED_IN",
      entityType: "visit",
      entityId: visitId,
      newValue: { status: "IN", participantIds: updatedIds },
    });

    const opUsers = await tx.query.users.findMany({
      where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
    });
    for (const op of opUsers) {
      await insertNotification(tx, {
        recipientId: op.id,
        recipientRole: op.role,
        type: "VISITOR_CHECKED_IN",
        title: "Visiteur enregistré",
        body: `Visite ${visit.visitNumber} — ${updatedIds.length} participant(s) à l'intérieur.`,
        visitId,
      });
    }
  });

  return { checkedIn: updatedIds.length, total: participants.length };
}

/**
 * [GROUP] Check out participant(s) from the kiosk. Accepts explicit ids; if
 * empty, checks out everyone currently CHECKED_IN. Visit goes OUT when none
 * remain inside.
 */
export async function checkOutPublicParticipants(
  tenantSlug: string,
  deviceToken: string,
  visitId: string,
  participantIds?: string[]
) {
  const device = await verifyDeviceToken(tenantSlug, deviceToken);
  const actorId = `device:${device.id}`;
  const actorRole = "OPERATOR";

  const db = await getTenantDbBySlug(tenantSlug);
  const visit = await db.query.visits.findFirst({ where: eq(visits.id, visitId) });
  if (!visit) throw new Error("Visit not found");

  const now = new Date();
  const where = participantIds && participantIds.length > 0
    ? and(eq(visitParticipants.visitId, visitId), inArray(visitParticipants.id, participantIds))
    : and(eq(visitParticipants.visitId, visitId), eq(visitParticipants.status, "CHECKED_IN"));

  const participants = await db.query.visitParticipants.findMany({ where });
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

    const remaining = await tx.query.visitParticipants.findMany({
      where: and(eq(visitParticipants.visitId, visitId), eq(visitParticipants.status, "CHECKED_IN")),
      columns: { id: true },
    });
    if (remaining.length === 0 && visit.status !== "OUT") {
      await tx.update(visits).set({ status: "OUT", checkOutAt: now }).where(eq(visits.id, visitId));
      await insertStatusHistory(tx, {
        visitId,
        fromStatus: visit.status,
        toStatus: "OUT",
        actorId,
        actorRole,
        metadata: { bulk: true, participantIds: updatedIds },
      });
      await insertAudit(tx, {
        actorId,
        actorRole,
        action: "VISIT_CHECKED_OUT",
        entityType: "visit",
        entityId: visitId,
        newValue: { status: "OUT" },
      });
    }

    if (updatedIds.length > 0) {
      const opUsers = await tx.query.users.findMany({
        where: inArray(users.role, ["SECURITY", "RECEPTION", "ADMIN", "ROOT"]),
      });
      for (const op of opUsers) {
        await insertNotification(tx, {
          recipientId: op.id,
          recipientRole: op.role,
          type: "VISITOR_CHECKED_OUT",
          title: "Visiteur sorti",
          body: `Visite ${visit.visitNumber} — ${updatedIds.length} participant(s) sorti(s).`,
          visitId,
        });
      }
    }
  });

  return { checkedOut: updatedIds.length, total: participants.length };
}

/**
 * [PUBLIC] Fetch a visit detail (with participants + status history) for the
 * operator screens. Requires a valid device token.
 */
export async function getPublicVisitDetail(
  tenantSlug: string,
  deviceToken: string,
  visitId: string
) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  const visit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
    with: {
      visitor: true,
      host: true,
      department: true,
      service: true,
      participants: { with: { visitor: true } },
    },
  });
  if (!visit) throw new Error("Visit not found");
  return visit;
}
