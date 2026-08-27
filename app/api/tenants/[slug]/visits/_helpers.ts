import { NextResponse } from "next/server";

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";

  if (message === "Tenant not found") {
    return jsonResponse({ error: "Organization not found" }, 404);
  }
  if (
    message.includes("Unauthorized") ||
    message.includes("Not authenticated") ||
    message.includes("Access to this tenant")
  ) {
    return jsonResponse({ error: message }, 401);
  }
  if (
    message.includes("Forbidden") ||
    message.includes("Insufficient permissions") ||
    message.includes("not the host")
  ) {
    return jsonResponse({ error: message }, 403);
  }
  if (message.includes("Missing") || message.includes("Invalid") || message.includes("not found")) {
    return jsonResponse({ error: message }, 400);
  }
  return jsonResponse({ error: message }, 500);
}
