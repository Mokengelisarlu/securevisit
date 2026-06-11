import { NextResponse } from "next/server";
import { generateReconnectPairingCode } from "@/features/tenants/queries/tenant-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { deviceId } = body;

    console.log('[reconnect] slug:', slug, 'deviceId:', deviceId);

    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "Missing deviceId" }, { status: 400 });
    }

    const result = await generateReconnectPairingCode(slug, deviceId);

    return NextResponse.json({
      ok: true,
      deviceId: result.deviceId,
      pairingCode: result.pairingCode,
    });
  } catch (error: any) {
    console.error('[reconnect] error:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate reconnect pairing code" },
      { status: 500 }
    );
  }
}