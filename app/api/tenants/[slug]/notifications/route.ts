import { NextRequest } from "next/server";
import { getMyNotifications } from "@/features/tenants/queries/visits-lifecycle";
import { jsonResponse, handleError } from "../visits/_helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const notifications = await getMyNotifications(slug);
    return jsonResponse(notifications);
  } catch (error) {
    return handleError(error);
  }
}
