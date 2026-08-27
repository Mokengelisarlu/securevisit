import { NextRequest } from "next/server";
import { markNotificationRead } from "@/features/tenants/queries/visits-lifecycle";
import { jsonResponse, handleError } from "../../../visits/_helpers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const updated = await markNotificationRead(slug, id);
    return jsonResponse(updated);
  } catch (error) {
    return handleError(error);
  }
}
