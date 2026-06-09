const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || response.statusText || "Request failed");
  }
  return data;
};

const buildUrl = (tenantSlug: string, resource: string, query?: Record<string, string>) => {
  const url = new URL(`/api/tenants/${tenantSlug}/public/${resource}`, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
};

const authHeaders = (deviceToken: string) => ({
  Authorization: `Bearer ${deviceToken}`,
  "Content-Type": "application/json",
});

export async function verifyDeviceToken(tenantSlug: string, deviceToken: string) {
  const url = `/api/tenants/${tenantSlug}/devices/verify`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return handleResponse(response);
}

export async function generatePairingCode(tenantSlug: string) {
  const response = await fetch(`/api/tenants/${tenantSlug}/devices/pairing-code`, {
    method: "POST",
  });
  return handleResponse(response);
}

export async function checkPairingStatus(tenantSlug: string, deviceId: string) {
  const url = new URL(`/api/tenants/${tenantSlug}/devices/pairing-status`, window.location.origin);
  url.searchParams.set("deviceId", deviceId);
  const response = await fetch(url.toString(), {
    method: "GET",
  });
  return handleResponse(response);
}

export async function pingDevice(tenantSlug: string, deviceToken: string) {
  const response = await fetch(`/api/tenants/${tenantSlug}/devices/ping`, {
    method: "POST",
    headers: authHeaders(deviceToken),
    body: JSON.stringify({ timestamp: new Date().toISOString() }),
  });
  return handleResponse(response);
}

export async function getPublicDepartments(tenantSlug: string, deviceToken: string) {
  const response = await fetch(buildUrl(tenantSlug, "departments"), {
    method: "GET",
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return handleResponse(response);
}

export async function getPublicServices(tenantSlug: string, deviceToken: string) {
  const response = await fetch(buildUrl(tenantSlug, "services"), {
    method: "GET",
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return handleResponse(response);
}

export async function getPublicVisitorTypes(tenantSlug: string, deviceToken: string) {
  const response = await fetch(buildUrl(tenantSlug, "visitor-types"), {
    method: "GET",
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return handleResponse(response);
}

export async function getPublicHosts(tenantSlug: string, deviceToken: string) {
  const response = await fetch(buildUrl(tenantSlug, "hosts"), {
    method: "GET",
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return handleResponse(response);
}

export async function getPublicOnSiteVisitors(tenantSlug: string, deviceToken: string) {
  const response = await fetch(buildUrl(tenantSlug, "on-site-visitors"), {
    method: "GET",
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return handleResponse(response);
}

export async function getPublicSettings(tenantSlug: string, deviceToken: string) {
  const response = await fetch(buildUrl(tenantSlug, "settings"), {
    method: "GET",
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return handleResponse(response);
}

export async function searchPublicVisitors(tenantSlug: string, deviceToken: string, query: string) {
  const response = await fetch(buildUrl(tenantSlug, "search-visitors", { q: query }), {
    method: "GET",
    headers: { Authorization: `Bearer ${deviceToken}` },
  });
  return handleResponse(response);
}

export async function createPublicVisit(tenantSlug: string, deviceToken: string, data: any) {
  const response = await fetch(`/api/tenants/${tenantSlug}/public/visits`, {
    method: "POST",
    headers: authHeaders(deviceToken),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function checkoutPublicVisit(tenantSlug: string, deviceToken: string, visitId: string) {
  const response = await fetch(`/api/tenants/${tenantSlug}/public/checkouts`, {
    method: "POST",
    headers: authHeaders(deviceToken),
    body: JSON.stringify({ visitId }),
  });
  return handleResponse(response);
}
