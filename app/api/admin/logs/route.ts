import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyAdminAccess } from "@/features/tenants/server/authorization";
import { getTenantDbBySlug } from "@/db/tenants";
import { devices, commands } from "@/db/tenants/schema";
import { eq, desc, and } from "drizzle-orm";

const VALID_STATUSES = ["pending", "acked", "applied", "failed"];

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await verifyAdminAccess();
    if (!isAdmin) {
      return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const tenantSlug = url.searchParams.get("tenantSlug");
    const deviceId = url.searchParams.get("deviceId");
    const status = url.searchParams.get("status");
    const limitRaw = url.searchParams.get("limit");

    if (!tenantSlug) {
      return NextResponse.json(
        { data: null, error: "Missing tenantSlug query parameter" },
        { status: 400 }
      );
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { data: null, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const limit = Math.min(Math.max(Number(limitRaw) || 100, 1), 500);

    const db = await getTenantDbBySlug(tenantSlug);

    const conditions = [];
    if (deviceId) conditions.push(eq(commands.deviceId, deviceId));
    if (status) conditions.push(eq(commands.status, status as "pending" | "acked" | "applied" | "failed"));

    const rows = await db
      .select({
        id: commands.id,
        deviceId: commands.deviceId,
        deviceName: devices.name,
        deviceLocation: devices.location,
        type: commands.type,
        payload: commands.payload,
        status: commands.status,
        priority: commands.priority,
        ackAt: commands.ackAt,
        appliedAt: commands.appliedAt,
        error: commands.error,
        createdAt: commands.createdAt,
      })
      .from(commands)
      .innerJoin(devices, eq(commands.deviceId, devices.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(commands.createdAt))
      .limit(limit);

    return NextResponse.json({ data: rows, error: null });
  } catch (error) {
    console.error("Error fetching command logs:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch logs";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
