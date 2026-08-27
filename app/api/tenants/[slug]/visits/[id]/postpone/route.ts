import { NextRequest } from "next/server";
import { postponeVisit } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../../_helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json().catch(() => ({}));
    if (!body?.newProposedDate) {
      return jsonResponse({ error: "Missing newProposedDate" }, 400);
    }
    const updated = await postponeVisit(slug, id, new Date(body.newProposedDate), body?.reason ?? null);
    return jsonResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}
