import { NextRequest, NextResponse } from "next/server";
import { getCommandsQueue } from "@/features/tenants/queries/tenant-data";
import { getBearerToken } from "@/lib/device-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const commands = await getCommandsQueue(slug, token);

    return NextResponse.json({ commands });
  } catch (error: any) {
    const status = error?.message?.includes("non autorisé") ? 401 : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to fetch commands" },
      { status }
    );
  }
}
