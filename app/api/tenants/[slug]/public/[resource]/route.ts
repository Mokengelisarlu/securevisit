import { NextRequest, NextResponse } from "next/server";
import {
  getPublicDepartments,
  getPublicServices,
  getPublicVisitorTypes,
  getPublicHosts,
  getPublicOnSiteVisitors,
  getPublicSettings,
  getPublicBusinessSettings,
  searchPublicVisitors,
  createPublicVisit,
  checkoutPublicVisit,
} from "@/features/tenants/queries/tenant-data";

function getBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }
  return auth.slice(7);
}

function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; resource: string }> }
) {
  try {
    const { slug, resource } = await context.params;
    const deviceToken = getBearerToken(request);
    const url = new URL(request.url);

    switch (resource) {
      case "departments":
        return jsonResponse(await getPublicDepartments(slug, deviceToken));
      case "services":
        return jsonResponse(await getPublicServices(slug, deviceToken));
      case "visitor-types":
        return jsonResponse(await getPublicVisitorTypes(slug, deviceToken));
      case "hosts":
        return jsonResponse(await getPublicHosts(slug, deviceToken));
      case "on-site-visitors":
        return jsonResponse(await getPublicOnSiteVisitors(slug, deviceToken));
      case "settings":
        return jsonResponse(await getPublicSettings(slug, deviceToken));
      case "business-settings":
        return jsonResponse(await getPublicBusinessSettings(slug));
      case "search-visitors": {
        const query = url.searchParams.get("q") || "";
        return jsonResponse(await searchPublicVisitors(slug, deviceToken, query));
      }
      default:
        return jsonResponse({ error: "Not found" }, 404);
    }
  } catch (error: any) {
    return jsonResponse({ error: error.message || "Unauthorized" }, error?.message?.includes("Missing") ? 401 : 500);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; resource: string }> }
) {
  try {
    const { slug, resource } = await context.params;
    const deviceToken = getBearerToken(request);
    const body = await request.json();

    switch (resource) {
      case "visits": {
        const visit = await createPublicVisit(slug, deviceToken, body);
        return jsonResponse(visit);
      }
      case "checkouts": {
        const { visitId } = body;
        if (!visitId) {
          return jsonResponse({ error: "Missing visitId" }, 400);
        }
        const result = await checkoutPublicVisit(slug, deviceToken, visitId);
        return jsonResponse(result);
      }
      default:
        return jsonResponse({ error: "Not found" }, 404);
    }
  } catch (error: any) {
    const message = error.message || "Request failed";
    const status = message.includes("Missing") || message.includes("Invalid") ? 400 : 500;
    return jsonResponse({ error: message }, status);
  }
}
