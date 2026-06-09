import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pingDevice } from "@/features/tenants/queries/tenant-data";

const PingBodySchema = z.object({
  timestamp: z.string().datetime().optional(),
  deviceInfo: z.object({
    appVersion: z.string().optional(),
    osVersion: z.string().optional(),
    deviceModel: z.string().optional(),
    memoryUsed: z.number().int().optional(),
    batteryLevel: z.number().int().min(0).max(100).optional(),
    isCharging: z.boolean().optional(),
    wifiSignal: z.number().int().optional(),
  }).optional(),
});

function getBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing Authorization header" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    PingBodySchema.parse(body);

    const result = await pingDevice(slug, token);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "Invalid device token" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    const status = error?.name === "ZodError" ? 400 : 401;
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to process ping" },
      { status }
    );
  }
}
