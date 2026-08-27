import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyAdminAccess } from "@/features/tenants/server/authorization";
import { getTenantDbBySlug } from "@/db/tenants";
import { devices, commands } from "@/db/tenants/schema";
import { eq, count, and, gte } from "drizzle-orm";

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

    if (!tenantSlug) {
      return NextResponse.json(
        { data: null, error: "Missing tenantSlug query parameter" },
        { status: 400 }
      );
    }

    const db = await getTenantDbBySlug(tenantSlug);

    const devicesWithCommands = await db
      .select({
        id: devices.id,
        name: devices.name,
        location: devices.location,
        deviceType: devices.deviceType,
        isPaired: devices.isPaired,
        lastActiveAt: devices.lastActiveAt,
        createdAt: devices.createdAt,
      })
      .from(devices)
      .where(eq(devices.isPaired, 1));

    const deviceIds = devicesWithCommands.map((d: any) => d.id);
    let pendingCounts: Record<string, number> = {};

    if (deviceIds.length > 0) {
      const counts = await db
        .select({
          deviceId: commands.deviceId,
          pendingCount: count(),
        })
        .from(commands)
        .where(
          and(
            eq(commands.status, "pending"),
            gte(commands.expiresAt, new Date())
          )
        )
        .groupBy(commands.deviceId);

      pendingCounts = Object.fromEntries(
        counts.map((c: any) => [c.deviceId, c.pendingCount])
      );
    }

    const result = devicesWithCommands.map((d: any) => ({
      ...d,
      status:
        d.lastActiveAt &&
        Date.now() - new Date(d.lastActiveAt).getTime() < 5 * 60 * 1000
          ? "online"
          : "offline",
      pendingCommandsCount: pendingCounts[d.id] ?? 0,
    }));

    return NextResponse.json({ data: result, error: null });
  } catch (error: any) {
    console.error("Error fetching admin devices:", error);
    return NextResponse.json(
      { data: null, error: error?.message || "Failed to fetch devices" },
      { status: 500 }
    );
  }
}
