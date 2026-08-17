# Add Missing Public API Endpoints for Mobile App

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 missing REST API endpoints so the mobile kiosk app can fetch visitor list, visitor details, visit details, and visit history.

**Architecture:** Add new `[PUBLIC/SECURE]` query functions in `tenant-data.ts` that use device token auth (same pattern as existing public functions), then wire them into the existing dynamic resource router. Add mobile app types and hooks.

**Tech Stack:** Next.js App Router, Drizzle ORM, React Native (Expo)

---

### Task 1: Add server-side query functions for visitors

**Files:**
- Modify: `features/tenants/queries/tenant-data.ts` (after `searchPublicVisitors` ~line 1235)

**Step 1: Add `getPublicVisitors` function**

```typescript
/**
 * [PUBLIC/SECURE] Get all visitors for Kiosk (paginated)
 */
export async function getPublicVisitors(tenantSlug: string, deviceToken: string) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visitors.findMany({
    with: {
      type: true,
    },
    orderBy: [desc(visitors.createdAt)],
  });
}
```

**Step 2: Add `getPublicVisitorById` function**

```typescript
/**
 * [PUBLIC/SECURE] Get single visitor details by ID
 */
export async function getPublicVisitorById(
  tenantSlug: string,
  deviceToken: string,
  visitorId: string
) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const visitor = await db.query.visitors.findFirst({
    where: eq(visitors.id, visitorId),
    with: {
      type: true,
    },
  });

  if (!visitor) {
    throw new Error("Visitor not found");
  }

  // Check if visitor is currently on-site
  const activeVisit = await db.query.visits.findFirst({
    where: and(
      eq(visits.visitorId, visitorId),
      eq(visits.status, "IN")
    ),
  });

  return {
    ...visitor,
    isOnSite: !!activeVisit,
  };
}
```

**Step 3: Add `getPublicVisitById` function**

```typescript
/**
 * [PUBLIC/SECURE] Get single visit details by ID
 */
export async function getPublicVisitById(
  tenantSlug: string,
  deviceToken: string,
  visitId: string
) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  const visit = await db.query.visits.findFirst({
    where: eq(visits.id, visitId),
    with: {
      visitor: {
        with: { type: true },
      },
      host: true,
      department: true,
      service: true,
      vehicle: true,
    },
  });

  if (!visit) {
    throw new Error("Visit not found");
  }

  return visit;
}
```

**Step 4: Add `getPublicVisitHistory` function**

```typescript
/**
 * [PUBLIC/SECURE] Get visit history for a specific visitor
 */
export async function getPublicVisitHistory(
  tenantSlug: string,
  deviceToken: string,
  visitorId: string
) {
  await verifyDeviceToken(tenantSlug, deviceToken);
  const db = await getTenantDbBySlug(tenantSlug);

  return await db.query.visits.findMany({
    where: eq(visits.visitorId, visitorId),
    with: {
      host: true,
      department: true,
      service: true,
      vehicle: true,
    },
    orderBy: [desc(visits.visitDate)],
  });
}
```

**Step 5: Commit**

```bash
git add features/tenants/queries/tenant-data.ts
git commit -m "feat(api): add public query functions for visitor/visit details and history"
```

---

### Task 2: Wire new functions into the resource router

**Files:**
- Modify: `app/api/tenants/[slug]/public/[resource]/route.ts`

**Step 1: Add imports**

Add to the import block:
```typescript
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
  createPublicVisit,
  checkoutPublicVisit,
  getPublicVisitors,       // NEW
  getPublicVisitorById,    // NEW
  getPublicVisitById,      // NEW
  getPublicVisitHistory,   // NEW
} from "@/features/tenants/queries/tenant-data";
```

**Step 2: Add GET cases to the switch**

Add before the `default` case in the GET handler:
```typescript
case "visitors":
  return jsonResponse(await getPublicVisitors(slug, deviceToken));
case "visitor-history": {
  const visitorId = url.searchParams.get("visitorId");
  if (!visitorId) {
    return jsonResponse({ error: "Missing visitorId query parameter" }, 400);
  }
  return jsonResponse(await getPublicVisitHistory(slug, deviceToken, visitorId));
}
```

**Step 3: Add a new dynamic route for single entities**

Since the existing router is a flat `[resource]` route, we need to handle `visitors/{id}` and `visits/{id}` differently. We'll use query params (`?id=xxx`) instead of nested routes to stay consistent with the existing pattern.

Add to the GET switch:
```typescript
case "visitor-detail": {
  const visitorId = url.searchParams.get("id");
  if (!visitorId) {
    return jsonResponse({ error: "Missing id query parameter" }, 400);
  }
  return jsonResponse(await getPublicVisitorById(slug, deviceToken, visitorId));
}
case "visit-detail": {
  const visitId = url.searchParams.get("id");
  if (!visitId) {
    return jsonResponse({ error: "Missing id query parameter" }, 400);
  }
  return jsonResponse(await getPublicVisitById(slug, deviceToken, visitId));
}
```

**Step 4: Commit**

```bash
git add app/api/tenants/\[slug\]/public/\[resource\]/route.ts
git commit -m "feat(api): wire visitor/visit detail and history endpoints into resource router"
```

---

### Task 3: Add mobile app TypeScript types

**Files:**
- Modify: `mobile-app/src/types/api.ts`

**Step 1: Add new interfaces**

```typescript
export interface VisitorDetail extends Visitor {
  isOnSite: boolean;
}

export interface VisitDetail {
  id: string;
  visitNumber: string | null;
  visitorId: string;
  hostId: string | null;
  departmentId: string | null;
  serviceId: string | null;
  vehicleId: string | null;
  passengerCount: number | null;
  visitType: string;
  visitDate: string;
  purpose: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  durationMinutes: number | null;
  status: 'IN' | 'OUT' | 'CANCELLED' | 'SCHEDULED';
  visitorPhotoUrl: string | null;
  vehiclePhotoUrl: string | null;
  visitor: Visitor;
  host: Host | null;
  department: Department | null;
  service: Service | null;
  vehicle: {
    id: string;
    plateNumber: string;
    type: string;
    brand: string | null;
    color: string | null;
  } | null;
}

export interface VisitHistoryEntry {
  id: string;
  visitNumber: string | null;
  visitDate: string;
  purpose: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  durationMinutes: number | null;
  status: 'IN' | 'OUT' | 'CANCELLED' | 'SCHEDULED';
  host: Host | null;
  department: Department | null;
  service: Service | null;
  vehicle: {
    id: string;
    plateNumber: string;
    type: string;
  } | null;
}
```

**Step 2: Commit**

```bash
git add mobile-app/src/types/api.ts
git commit -m "feat(types): add VisitorDetail, VisitDetail, VisitHistoryEntry types"
```

---

### Task 4: Add mobile app hooks

**Files:**
- Modify: `mobile-app/src/hooks/usePublicData.ts`

**Step 1: Add imports for new types**

Update the import to include:
```typescript
import {
  Visitor,
  Host,
  Department,
  Service,
  VisitorType,
  BusinessSettings,
  KioskSettings,
  OnSiteVisitor,
  VisitorDetail,    // NEW
  VisitDetail,      // NEW
  VisitHistoryEntry, // NEW
} from '@/src/types/api';
```

**Step 2: Add `useGetPublicVisitorDetail` hook**

```typescript
export function useGetPublicVisitorDetail(deviceToken: string | null) {
  const [data, setData] = useState<VisitorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchVisitor = useCallback(
    async (visitorId: string) => {
      if (!deviceToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visitor-detail?id=${visitorId}`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { data, isLoading, error, fetchVisitor };
}
```

**Step 3: Add `useGetPublicVisitDetail` hook**

```typescript
export function useGetPublicVisitDetail(deviceToken: string | null) {
  const [data, setData] = useState<VisitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchVisit = useCallback(
    async (visitId: string) => {
      if (!deviceToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visit-detail?id=${visitId}`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { data, isLoading, error, fetchVisit };
}
```

**Step 4: Add `useGetPublicVisitHistory` hook**

```typescript
export function useGetPublicVisitHistory(deviceToken: string | null) {
  const [data, setData] = useState<VisitHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchHistory = useCallback(
    async (visitorId: string) => {
      if (!deviceToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visit-history?visitorId=${visitorId}`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { data, isLoading, error, fetchHistory };
}
```

**Step 5: Update `useGetPublicVisitors` to work with the new endpoint**

The existing hook calls `/public/visitors` which didn't exist before. Now it will work with the `visitors` resource we added.

**Step 6: Commit**

```bash
git add mobile-app/src/hooks/usePublicData.ts
git commit -m "feat(hooks): add visitor detail, visit detail, and visit history hooks"
```

---

### Task 5: Verify

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

**Step 2: Test the endpoints manually**

```bash
# Test visitor list
curl -H "Authorization: Bearer <device-token>" https://securevisitapp.com/api/tenants/<slug>/public/visitors

# Test visitor detail
curl -H "Authorization: Bearer <device-token>" "https://securevisitapp.com/api/tenants/<slug>/public/visitor-detail?id=<visitor-id>"

# Test visit detail
curl -H "Authorization: Bearer <device-token>" "https://securevisitapp.com/api/tenants/<slug>/public/visit-detail?id=<visit-id>"

# Test visit history
curl -H "Authorization: Bearer <device-token>" "https://securevisitapp.com/api/tenants/<slug>/public/visit-history?visitorId=<visitor-id>"
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(api): complete missing public endpoints for mobile app"
```
