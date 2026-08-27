import { NextRequest, NextResponse } from "next/server";
import { ackCommand } from "@/features/tenants/queries/tenant-data";
import { getBearerToken } from "@/lib/device-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; commandId: string }> }
) {
  try {
    const { slug, commandId } = await params;
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const command = await ackCommand(slug, token, commandId);

    return NextResponse.json({ ok: true, commandId: command.id, status: command.status });
  } catch (error: any) {
    const message = error?.message || "Failed to ack command";
    const status = message.includes("non autorisé") ? 401 : 404;
    return NextResponse.json({ error: message }, { status });
  }
}
