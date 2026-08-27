import { NextRequest } from "next/server";
import { createVisitRequest } from "@/features/tenants/queries/visits-lifecycle";
import { handleError, jsonResponse } from "./_helpers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const result = await createVisitRequest(slug, body);
    return jsonResponse(result, 201);
  } catch (error) {
    return handleError(error);
  }
}
