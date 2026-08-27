import { NextRequest } from "next/server";
import { setParticipantStatus } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../../../_helpers";

const ALLOWED = ["CHECKED_IN", "CHECKED_OUT", "NO_SHOW", "CANCELED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string; participantId: string }> }
) {
  try {
    const { slug, id, participantId } = await params;
    const body = await request.json();
    if (!ALLOWED.includes(body?.status)) {
      return jsonResponse({ error: `status must be one of ${ALLOWED.join(", ")}` }, 400);
    }
    const updated = await setParticipantStatus(
      slug,
      id,
      participantId,
      body.status as "CHECKED_IN" | "CHECKED_OUT" | "NO_SHOW" | "CANCELED"
    );
    return jsonResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}
