import { NextResponse } from "next/server";
import { generatePairingCode } from "@/features/tenants/queries/tenant-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const body = await request.json();
    // Accept either new `deviceId` or legacy `diviceId` key from older clients
    const deviceId = body.deviceId || body.diviceId;

    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "Missing deviceId" }, { status: 400 });
    }

    const result = await generatePairingCode(slug, deviceId);

    return NextResponse.json({
      ok: true,
      deviceId: result.deviceId,
      pairingCode: result.pairingCode,
    });
  } catch (error: any) {
    console.error(`[pairing-code] Error for slug="${slug}":`, error?.message || error);
    console.error(`[pairing-code] Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate pairing code" },
      { status: 500 }
    );
  }
}

