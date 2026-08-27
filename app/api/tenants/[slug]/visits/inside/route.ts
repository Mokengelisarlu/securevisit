import { NextRequest } from "next/server";
import { getCurrentlyInside } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "../_helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const result = await getCurrentlyInside(slug);
    return jsonResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
