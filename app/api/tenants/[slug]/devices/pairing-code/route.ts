import { NextResponse } from "next/server";
import { generatePairingCode } from "@/features/tenants/queries/tenant-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { diviceId } = body;

    if (!diviceId) {
      return NextResponse.json({ ok: false, error: "Missing diviceId" }, { status: 400 });
    }

    const result = await generatePairingCode(slug, diviceId);

    return NextResponse.json({
      ok: true,
      deviceId: result.deviceId,
      pairingCode: result.pairingCode,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate pairing code" },
      { status: 500 }
    );
  }
}

