import { NextRequest } from "next/server";
import { cancelVisit } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../../_helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json().catch(() => ({}));
    const updated = await cancelVisit(slug, id, body?.reason ?? body?.cancelReason ?? null);
    return jsonResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}
