import { NextRequest } from "next/server";
import { approveVisit } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../../_helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const updated = await approveVisit(slug, id);
    return jsonResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}
