import { NextRequest, NextResponse } from "next/server";
import { deviceAuth } from "@/lib/device-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const device = await deviceAuth(request, slug);

    return NextResponse.json({
      ok: true,
      deviceId: device.id,
      isPaired: device.isPaired === 1,
      lastActiveAt: device.lastActiveAt,
    });
  } catch (error: any) {
    const status = error?.message === "Missing Authorization header" ? 401 : 401;
    return NextResponse.json(
      { ok: false, error: error?.message || "Unauthorized" },
      { status }
    );
  }
}
