import { NextResponse } from "next/server";
import { checkPairingStatus } from "@/features/tenants/queries/tenant-data";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit: 30 polls per minute per IP per tenant (pairing polls every 2s)
    const ip = getClientIp(request);
    const rateKey = `pairing-status:${slug}:${ip}`;
    const rateResult = checkRateLimit(rateKey, {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });

    if (!rateResult.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");

    if (!deviceId) {
      return NextResponse.json({ ok: false, error: "Missing deviceId" }, { status: 400 });
    }

    const result = await checkPairingStatus(slug, deviceId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[pairing-status] error:', error);
    const detail = error?.cause || error?.stack || null;
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to fetch pairing status", detail },
      { status: 500 }
    );
  }
}
