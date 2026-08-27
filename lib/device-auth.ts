import { NextRequest } from "next/server";
import { verifyDeviceToken } from "@/features/tenants/queries/tenant-data";

export function getBearerToken(request: NextRequest): string | null {
  const auth =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  return auth.slice(7);
}

export async function deviceAuth(request: NextRequest, slug: string) {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error("Missing Authorization header");
  }
  return verifyDeviceToken(slug, token);
}
