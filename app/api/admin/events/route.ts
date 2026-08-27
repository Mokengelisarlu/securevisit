import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyAdminAccess } from "@/features/tenants/server/authorization";
import { getDeviceEventsQuery } from "@/features/tenants/queries/tenant-data";
import { deviceEventTypeEnum } from "@/db/tenants/schema";

const VALID_TYPES = deviceEventTypeEnum.enumValues;

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
    const type = url.searchParams.get("type");
    const limitRaw = url.searchParams.get("limit");

    if (!tenantSlug) {
      return NextResponse.json(
        { data: null, error: "Missing tenantSlug query parameter" },
        { status: 400 }
      );
    }

    if (type && !(VALID_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json(
        { data: null, error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const limit = Math.min(Math.max(Number(limitRaw) || 100, 1), 500);

    const rows = await getDeviceEventsQuery(tenantSlug, { deviceId, type, limit });

    return NextResponse.json({ data: rows, error: null });
  } catch (error) {
    console.error("Error fetching device events:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
