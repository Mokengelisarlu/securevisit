import { NextResponse } from "next/server";
import { generatePairingCode } from "@/features/tenants/queries/tenant-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const result = await generatePairingCode(slug);

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
