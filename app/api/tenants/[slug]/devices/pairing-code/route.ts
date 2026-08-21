import { NextResponse } from "next/server";
import { generatePairingCode } from "@/features/tenants/queries/tenant-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[pairing-code] Failed to generate pairing code", {
      operation: "generate_pairing_code",
      slug: (await params).slug,
      error: message,
    });

    return NextResponse.json(
      { ok: false, error: "Failed to generate pairing code" },
      { status: 500 }
    );
  }
}

