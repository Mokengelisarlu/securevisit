import { NextRequest, NextResponse } from "next/server";
import { recordDeviceEvent } from "@/features/tenants/queries/tenant-data";
import { getBearerToken } from "@/lib/device-auth";
import { deviceEventTypeEnum } from "@/db/tenants/schema";

const VALID_TYPES = deviceEventTypeEnum.enumValues;
const VALID_SEVERITIES = ["info", "warning", "error"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { type, severity, message, metadata } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(", ")}` },
        { status: 400 }
      );
    }

    const event = await recordDeviceEvent(slug, token, {
      type,
      severity: severity ?? "info",
      message: message ?? null,
      metadata: metadata ?? null,
    });

    return NextResponse.json({ data: event, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("non autorisé") ? 401 : 500;
    return NextResponse.json(
      { error: message || "Failed to record event" },
      { status }
    );
  }
}
