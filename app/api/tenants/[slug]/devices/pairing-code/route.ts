import { NextResponse } from "next/server";
import { generatePairingCode } from "@/features/tenants/queries/tenant-data";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Rate limit: 5 pairing code requests per 10 minutes per IP per tenant
    const ip = getClientIp(request);
    const rateKey = `pairing-code:${slug}:${ip}`;
    const rateResult = checkRateLimit(rateKey, {
      maxRequests: 5,
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

