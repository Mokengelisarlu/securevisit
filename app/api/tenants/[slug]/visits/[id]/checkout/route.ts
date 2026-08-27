import { NextRequest } from "next/server";
import { checkOutVisitParticipants } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../../_helpers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const result = await checkOutVisitParticipants(slug, id);
    return jsonResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
