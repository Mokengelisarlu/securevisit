import { NextRequest } from "next/server";
import { getVisitDetail } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../_helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const detail = await getVisitDetail(slug, id);
    return jsonResponse(detail);
  } catch (error) {
    return handleError(error);
  }
}
