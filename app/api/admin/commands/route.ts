import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyAdminAccess } from "@/features/tenants/server/authorization";
import { createCommand } from "@/features/tenants/queries/tenant-data";
import { getTenantDbBySlug } from "@/db/tenants";
import { auditLogs } from "@/db/tenants/schema";

const VALID_TYPES = [
  "CONFIG_UPDATE",
  "REBOOT",
  "EMERGENCY_MESSAGE",
  "CLEAR_CACHE",
  "REFRESH_SETTINGS",
];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { tenantSlug, deviceId, type, payload, priority } = body;

    if (!tenantSlug || !deviceId || !type) {
      return NextResponse.json(
        { data: null, error: "Missing required fields: tenantSlug, deviceId, type" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { data: null, error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { data: null, error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` },
        { status: 400 }
      );
    }

    const command = await createCommand(tenantSlug, deviceId, type, payload ?? null, priority ?? "medium");

    // Record the admin action in the audit log (device activity feed)
    try {
      const db = await getTenantDbBySlug(tenantSlug);
      await db.insert(auditLogs).values({
        actorId: userId,
        actorRole: "admin",
        action: "SEND_COMMAND",
        entityType: "command",
        entityId: command.id,
        newValue: JSON.stringify({ deviceId, type, priority: priority ?? "medium" }),
      });
    } catch (logError) {
      // Audit logging is best-effort; never fail the command over it.
      console.warn("Failed to write audit log for command:", logError instanceof Error ? logError.message : String(logError));
    }

    return NextResponse.json({ data: command, error: null });
  } catch (error: any) {
    console.error("Error creating command:", error);
    return NextResponse.json(
      { data: null, error: error?.message || "Failed to create command" },
      { status: 500 }
    );
  }
}
