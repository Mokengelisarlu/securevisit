import { NextRequest } from "next/server";
import { addVisitParticipant } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../../_helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json();
    if (!body?.visitorId) {
      return jsonResponse({ error: "Missing visitorId" }, 400);
    }
    const participant = await addVisitParticipant(slug, id, {
      visitorId: body.visitorId,
      notes: body?.notes ?? null,
    });
    return jsonResponse(participant, 201);
  } catch (error) {
    return handleError(error);
  }
}
