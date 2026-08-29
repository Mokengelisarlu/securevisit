import { NextRequest, NextResponse } from "next/server";
import {
  getPublicDepartments,
  getPublicServices,
  getPublicVisitorTypes,
  getPublicHosts,
  getPublicOnSiteVisitors,
  getPublicDashboard,
  getPublicSettings,
  getPublicBusinessSettings,
  searchPublicVisitors,
  checkoutPublicVisit,
  getPublicVisitors,
  getPublicVisitorById,
  getPublicVisitById,
  getPublicVisitHistory,
  getPublicRecentVisits,
  getPublicVisitorKpis,
  createPublicVisitor,
  getPublicHostSummary,
} from "@/features/tenants/queries/tenant-data";
import {
  createPublicVisitRequest,
  getPublicWaitingVisits,
  getPublicExpectedVisits,
  getPublicCurrentlyInside,
  checkInPublicParticipants,
  checkOutPublicParticipants,
  getPublicVisitDetail,
} from "@/features/tenants/queries/visits-public";
import { getBearerToken } from "@/lib/device-auth";

function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; resource: string | string[] }> }
) {
  try {
    const { slug, resource: rawResource } = await context.params;
    const resource = Array.isArray(rawResource) ? rawResource.join("/") : rawResource;
    const deviceToken = getBearerToken(request);
    const url = new URL(request.url);

    if (deviceToken === null && ["departments", "services", "visitor-types", "hosts", "host-summary", "on-site-visitors", "dashboard", "settings", "search-visitors", "visitors", "visitor-kpis", "visitor-detail", "visit-detail", "recent-visits", "visitor-history", "waiting-visits", "expected-visits", "inside"].includes(resource)) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    switch (resource) {
      case "departments":
        return jsonResponse(await getPublicDepartments(slug, deviceToken!));
      case "services":
        return jsonResponse(await getPublicServices(slug, deviceToken!));
      case "visitor-types":
        return jsonResponse(await getPublicVisitorTypes(slug, deviceToken!));
      case "hosts":
        return jsonResponse(await getPublicHosts(slug, deviceToken!));
      case "host-summary":
        return jsonResponse(await getPublicHostSummary(slug, deviceToken!));
      case "on-site-visitors":
        return jsonResponse(await getPublicOnSiteVisitors(slug, deviceToken!));
      case "dashboard":
        return jsonResponse(await getPublicDashboard(slug, deviceToken!));
      case "settings":
        return jsonResponse(await getPublicSettings(slug, deviceToken!));
      case "business-settings":
        return jsonResponse(await getPublicBusinessSettings(slug, deviceToken ?? undefined));
      case "search-visitors": {
        const query = url.searchParams.get("q") || "";
        return jsonResponse(await searchPublicVisitors(slug, deviceToken!, query));
      }
      case "visitors":
        return jsonResponse(await getPublicVisitors(slug, deviceToken!));
      case "visitor-kpis":
        return jsonResponse(await getPublicVisitorKpis(slug, deviceToken!));
      case "visitor-detail": {
        const visitorId = url.searchParams.get("id");
        if (!visitorId) {
          return jsonResponse({ error: "Missing id query parameter" }, 400);
        }
        return jsonResponse(await getPublicVisitorById(slug, deviceToken!, visitorId));
      }
      case "visit-detail": {
        const visitId = url.searchParams.get("id");
        if (!visitId) {
          return jsonResponse({ error: "Missing id query parameter" }, 400);
        }
        return jsonResponse(await getPublicVisitById(slug, deviceToken!, visitId));
      }
      case "recent-visits":
        return jsonResponse(await getPublicRecentVisits(slug, deviceToken!));
      case "visitor-history": {
        const visitorId = url.searchParams.get("visitorId");
        if (!visitorId) {
          return jsonResponse({ error: "Missing visitorId query parameter" }, 400);
        }
        return jsonResponse(await getPublicVisitHistory(slug, deviceToken!, visitorId));
      }
      case "waiting-visits":
        return jsonResponse(await getPublicWaitingVisits(slug, deviceToken!));
      case "expected-visits":
        return jsonResponse(await getPublicExpectedVisits(slug, deviceToken!));
      case "inside":
        return jsonResponse(await getPublicCurrentlyInside(slug, deviceToken!));
      case "visit-detail-public": {
        const visitId = url.searchParams.get("id");
        if (!visitId) {
          return jsonResponse({ error: "Missing id query parameter" }, 400);
        }
        return jsonResponse(await getPublicVisitDetail(slug, deviceToken!, visitId));
      }
      default:
        return jsonResponse({ error: "Not found" }, 404);
    }
  } catch (error: any) {
    const message = error.message || "Unauthorized";
    if (message === "Tenant not found") {
      return jsonResponse({ error: "Organization not found. Please check your server URL or contact support." }, 404);
    }
    return jsonResponse({ error: message }, message.includes("Missing") ? 401 : 500);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; resource: string | string[] }> }
) {
  try {
    const { slug, resource: rawResource } = await context.params;
    const resource = Array.isArray(rawResource) ? rawResource.join("/") : rawResource;
    const deviceToken = getBearerToken(request);
    const body = await request.json();

    if (!deviceToken) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    switch (resource) {
      case "visits": {
        const visit = await createPublicVisitRequest(slug, deviceToken, body);
        return jsonResponse(visit);
      }
      case "visitors": {
        if (!body.firstName || !body.lastName) {
          return jsonResponse({ error: "firstName and lastName are required" }, 400);
        }
        const visitor = await createPublicVisitor(slug, deviceToken, body);
        return jsonResponse(visitor);
      }
      case "checkouts": {
        const { visitId } = body;
        if (!visitId) {
          return jsonResponse({ error: "Missing visitId" }, 400);
        }
        const result = await checkoutPublicVisit(slug, deviceToken, visitId);
        return jsonResponse(result);
      }
      case "participants/checkin": {
        const visitId = body.visitId;
        if (!visitId) {
          return jsonResponse({ error: "Missing visitId" }, 400);
        }
        const result = await checkInPublicParticipants(slug, deviceToken, visitId, body.participantIds);
        return jsonResponse(result);
      }
      case "participants/checkout": {
        const visitId = body.visitId;
        if (!visitId) {
          return jsonResponse({ error: "Missing visitId" }, 400);
        }
        const result = await checkOutPublicParticipants(slug, deviceToken, visitId, body.participantIds);
        return jsonResponse(result);
      }
      default:
        return jsonResponse({ error: "Not found" }, 404);
    }
  } catch (error: any) {
    const message = error.message || "Request failed";
    if (message === "Tenant not found") {
      return jsonResponse({ error: "Organization not found. Please check your server URL or contact support." }, 404);
    }
    const status = message.includes("Missing") || message.includes("Invalid") ? 400 : 500;
    return jsonResponse({ error: message }, status);
  }
}
