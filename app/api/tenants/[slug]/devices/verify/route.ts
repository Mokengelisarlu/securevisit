import { NextRequest, NextResponse } from "next/server";
import { verifyDeviceToken } from "@/features/tenants/queries/tenant-data";

function getBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing Authorization header" }, { status: 401 });
    }

    const device = await verifyDeviceToken(slug, token);

    return NextResponse.json({
      ok: true,
      deviceId: device.id,
      isPaired: device.isPaired === 1,
      lastActiveAt: device.lastActiveAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unauthorized" },
      { status: 401 }
    );
  }
}
