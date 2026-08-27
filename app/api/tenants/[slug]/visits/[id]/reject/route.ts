import { NextRequest } from "next/server";
import { rejectVisit } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../../_helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json().catch(() => ({}));
    const updated = await rejectVisit(slug, id, body?.reason ?? body?.rejectionReason ?? null);
    return jsonResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}
