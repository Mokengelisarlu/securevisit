import { NextRequest } from "next/server";
import { getWaitingVisits } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../_helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const visits = await getWaitingVisits(slug);
    return jsonResponse(visits);
  } catch (error) {
    return handleError(error);
  }
}
