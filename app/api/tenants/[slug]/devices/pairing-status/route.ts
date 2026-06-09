import { NextResponse } from "next/server";
import { checkPairingStatus } from "@/features/tenants/queries/tenant-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "Missing deviceId" }, { status: 400 });
    }

    const result = await checkPairingStatus(slug, deviceId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch pairing status" },
      { status: 500 }
    );
  }
}
