import { NextResponse } from "next/server";
import { generateReconnectPairingCode } from "@/features/tenants/queries/tenant-data";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit: 3 reconnect requests per 10 minutes per IP per tenant
    const ip = getClientIp(request);
    const rateKey = `reconnect:${slug}:${ip}`;
    const rateResult = checkRateLimit(rateKey, {
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
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

    const body = await request.json();
    const { deviceId } = body;

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