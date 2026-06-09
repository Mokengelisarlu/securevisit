# SecureVisit - System Map & Architecture Flows

**Created**: May 19, 2026  
**Purpose**: Visual reference for understanding system architecture and data flows

---

## 1. Middleware Flow

```
┌─────────────────────────────────────────┐
│    Browser Request (Any URL)            │
│  http://[subdomain].domain:port/path    │
└────────────┬────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  middleware.ts                           │
│  1. Extract hostname from request        │
│  2. Parse subdomain using regex          │
│  3. Determine app context                │
└────┬─────────────────┬────────────────────┘
     │                 │
     ▼                 ▼
┌────────────────┐  ┌───────────────────┐
│ extractSubdomain() │ classifyContext() │
│ Returns:          │ Returns:          │
│ - null (public)   │ - "public"        │
│ - "admin"         │ - "admin"         │
│ - "[slug]"        │ - "[slug]"        │
└────────┬──────────┴─────────┬──────────┘
         │                    │
         ▼                    ▼
    ┌──────────────────────────────────────┐
    │ Context Determined:                  │
    │ Set x-tenant-slug header             │
    │ Classify route destination           │
    └──────────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │ Route Selection:                     │
    │ admin → /app/admin/*                 │
    │ null → /app/public/*                 │
    │ [slug] → /app/dashboard/*            │
    └──────────────────────────────────────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │ Request Passed to Handler            │
    │ with x-tenant-slug header            │
    └──────────────────────────────────────┘

SUBDOMAIN RESOLUTION TABLE:
┌──────────────────────┬────────────┬──────────────┐
│ Hostname             │ Subdomain  │ Route        │
├──────────────────────┼────────────┼──────────────┤
│ localhost            │ null       │ /public/*    │
│ app.localhost        │ null       │ /public/*    │
│ admin.localhost      │ "admin"    │ /admin/*     │
│ acme.localhost       │ "acme"     │ /dashboard/* │
│ example.com          │ null       │ /public/*    │
│ tenant.example.com   │ "tenant"   │ /dashboard/* │
└──────────────────────┴────────────┴──────────────┘

RESERVED SUBDOMAINS:
admin, api, app, www, mail, ftp, chat, files, blog, docs, support, help, dashboard
```

---

## 2. Authentication Flow

```
┌────────────────────────────────────────────┐
│  User Visits Application                   │
│  (Any subdomain)                           │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ Check: Is user logged in?                  │
│ (Clerk middleware checks for token)        │
└────┬───────────────────────┬────────────────┘
     │ NO                    │ YES
     ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│ Public Routes│      │ User Authenticated│
│ OK           │      │ Session Valid     │
│ Others → SI  │      └────────┬──────────┘
│ (Sign In)    │               │
└──────────────┘               ▼
                   ┌──────────────────────┐
                   │ Load Clerk Session:  │
                   │ - User ID            │
                   │ - Email              │
                   │ - Role               │
                   │ - Permissions        │
                   └────────┬─────────────┘
                            │
                            ▼
                   ┌──────────────────────┐
                   │ Extract x-tenant-slug│
                   │ from request header  │
                   └────────┬─────────────┘
                            │
                            ▼
                   ┌──────────────────────┐
                   │ Is route admin-only? │
                   └────┬────────────┬────┘
                        │ YES        │ NO
                        ▼            ▼
              ┌──────────────────┐  OK
              │ Check user role: │  Continue
              │ Is "Admin"?      │
              └────┬────────┬─────┘
                   │ YES    │ NO
                   ▼        ▼
                  OK       403 Forbidden

PUBLIC APP FLOW:
User → Sign Up/Sign In → Clerk Auth UI → Token Stored → Redirect Dashboard

TENANT DASHBOARD FLOW:
User → Tenant Subdomain → Clerk Auth Check → TenantAuthGuard Verification → Dashboard

ADMIN PANEL FLOW:
User → admin.domain → Clerk Auth → Role Check (Admin) → Admin Dashboard
```

---

## 3. Tenant Resolution Flow

```
┌─────────────────────────────────────────────┐
│ User Accesses: acme.localhost:3000          │
│ Middleware extracts slug: "acme"            │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ TenantAuthGuard (Client Component)          │
│ Runs in Dashboard layout                    │
└────────────┬────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 1. Verify User Authenticated                │
│    Check: useAuth() from Clerk              │
│    Has valid session? → Continue             │
│    No → Redirect to Sign In                  │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 2. Query Master DB for Tenant               │
│    SELECT * FROM tenants WHERE slug = "acme"│
│    Include: name, dbUrl, ownerId            │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 3. Verify User Access                       │
│    Check: Is currentUser.id = tenant.ownerId│
│    Or: Is user in tenant's users table?     │
│    Yes → Continue                            │
│    No → Show 403 Unauthorized                │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 4. Load Tenant Database Connection          │
│    connectionString = tenant.dbUrl           │
│    Create new db client                      │
│    Cache connection in memory (LRU)          │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 5. TenantProvider Injects Context           │
│    useTenant() hook provides:                │
│    - slug: "acme"                            │
│    - name: "ACME Corporation"                │
│    - logoUrl: "https://blob.../logo.png"     │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ 6. Dashboard Components Render               │
│    All queries use tenant database           │
│    x-tenant-slug header sent with requests   │
└──────────────────────────────────────────────┘

ERROR SCENARIOS:
┌────────────────────────────────────┐
│ Tenant Not Found                   │
│ → 404 Not Found                    │
│                                    │
│ User Not Authorized                │
│ → 403 Forbidden                    │
│                                    │
│ Database Connection Failed         │
│ → Retry with exponential backoff   │
│ → 500 Server Error if persistent   │
│                                    │
│ User Session Expired               │
│ → Redirect to Sign In              │
└────────────────────────────────────┘
```

---

## 4. Database Layer

```
┌─────────────────────────────────────────────┐
│           NEON POSTGRESQL                   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  MASTER DATABASE (Platform)          │   │
│  │  Connection: DATABASE_URL            │   │
│  │  Owner: Platform Admin               │   │
│  │                                      │   │
│  │  Tables:                             │   │
│  │  ├── users (Clerk sync)              │   │
│  │  │   ├── id (Clerk ID)               │   │
│  │  │   ├── email                       │   │
│  │  │   ├── role (Admin/Tenant/SUPER)   │   │
│  │  │   └── createdAt                   │   │
│  │  │                                   │   │
│  │  └── tenants                         │   │
│  │      ├── id (UUID)                   │   │
│  │      ├── name                        │   │
│  │      ├── slug (unique subdomain)     │   │
│  │      ├── dbUrl (connection string)   │   │
│  │      ├── ownerId (FK: users.id)      │   │
│  │      ├── isActive                    │   │
│  │      └── createdAt                   │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                    │                        │
│                    │ One-to-Many            │
│                    ▼                        │
│  ┌──────────────────────────────────────┐   │
│  │  TENANT DATABASE (Per-Customer)      │   │
│  │  Connection: tenants.dbUrl           │   │
│  │  Auto-provisioned via Neon API       │   │
│  │  Owner: Tenant Organization          │   │
│  │                                      │   │
│  │  Tables:                             │   │
│  │  ├── users (Tenant staff)            │   │
│  │  ├── departments                     │   │
│  │  ├── hosts (employees)               │   │
│  │  ├── visitor_types                   │   │
│  │  ├── visitors                        │   │
│  │  ├── services                        │   │
│  │  ├── vehicles                        │   │
│  │  ├── visits (core records)           │   │
│  │  ├── devices (kiosks)                │   │
│  │  └── settings (policies)             │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                    ▲                        │
│                    │ Multiple Instances     │
│                    │ (One Per Tenant)       │
│  ┌──────────────────────────────────────┐   │
│  │  TENANT-2 DATABASE                   │   │
│  │  (Completely Isolated)               │   │
│  └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘

CONNECTION POOLING:
┌────────────────────────────────────────────┐
│  Master DB Pool (Single)                   │
│  ├── Cached for 5 minutes                  │
│  └── Auto-reconnect on failure             │
│                                            │
│  Tenant DB Pools (Per-Tenant, LRU)         │
│  ├── Max 100 concurrent tenants            │
│  ├── Cached in-memory                      │
│  ├── Each has max 20 connections           │
│  └── Auto-cleanup for unused               │
│                                            │
│  Retry Logic (db-retry.ts)                 │
│  ├── Max 3 attempts                        │
│  ├── Exponential backoff (2^n seconds)     │
│  └── Max wait: 30 seconds                  │
└────────────────────────────────────────────┘

DATA ISOLATION GUARANTEES:
✅ No cross-tenant queries ever
✅ Each request explicitly scoped to tenant DB
✅ x-tenant-slug header verified server-side
✅ Connection string stored securely
✅ Zero direct database access from frontend
```

---

## 5. API Layer

```
┌────────────────────────────────────────────┐
│  Next.js API Routes (/app/api/*)           │
│  All routes in App Router                  │
└────────────┬───────────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │ Route Categories:                  │
    │                                    │
    │ ├── Admin Routes                   │
    │ ├── Tenant Routes                  │
    │ ├── Sync Routes                    │
    │ ├── Upload Routes                  │
    │ └── Utility Routes                 │
    └────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ADMIN ROUTES (admin subdomain only)     │
├─────────────────────────────────────────┤
│ GET  /api/admin/verify                  │
│      → Check admin authorization        │
│                                         │
│ GET  /api/admin/stats                   │
│      → System statistics                │
│      Query params: period=week/month     │
│                                         │
│ GET  /api/admin/tenants                 │
│      → List all tenants                 │
│      Query params: status, limit, search│
│                                         │
│ GET  /api/admin/users                   │
│      → List all platform users          │
│      Query params: role, limit, offset  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ TENANT ROUTES (master DB operations)    │
├─────────────────────────────────────────┤
│ GET  /api/tenants                       │
│      → Get user's owned tenants         │
│      Returns: id, name, slug, logoUrl   │
│                                         │
│ POST /api/tenants                       │
│      → Create new tenant                │
│      Body: { name, slug }               │
│      Response: new tenant with dbUrl    │
│                                         │
│ Validation:                             │
│ ├── Slug: 2-20 chars, alphanumeric      │
│ ├── Slug: Not reserved                  │
│ ├── Slug: Unique in master DB           │
│ └── Trigger: Neon API provisioning      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ SYNC ROUTES (keep data consistent)      │
├─────────────────────────────────────────┤
│ POST /api/sync-user                     │
│      → Sync Clerk user to Master DB     │
│      → Update all tenant DBs            │
│      Trigger: On user creation/update   │
│      from Clerk webhooks                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ UPLOAD ROUTES (file storage)            │
├─────────────────────────────────────────┤
│ POST /api/upload                        │
│      → Upload file to Vercel Blob       │
│      Body: multipart form data          │
│      Returns: { url, size, type }       │
│                                         │
│ POST /api/blob                          │
│      → Direct Blob API endpoint         │
│      For photo capture, signatures      │
│                                         │
│ Auth: Verify request from tenant        │
│ Limits: Images 10MB, Videos 50MB        │
└─────────────────────────────────────────┘

REQUEST FLOW (All API Calls):
┌──────────────────────────────┐
│ Client Component/Route        │
│ POST /api/endpoint            │
└────────────┬──────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Next.js Route Handler        │
│ auth/security checks         │
│ parse request body           │
└────────────┬──────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Verify Authorization         │
│ Get x-tenant-slug header     │
│ Check Clerk session          │
└────────────┬──────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Validate Input (Zod)         │
│ Type-safe data processing    │
└────────────┬──────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Execute Business Logic       │
│ Query database               │
│ Process data                 │
└────────────┬──────────────────┘
             │
             ▼
┌──────────────────────────────┐
│ Return Response (JSON)       │
│ Status 200/400/500 etc       │
└──────────────────────────────┘

ERROR HANDLING:
├── 400 Bad Request (invalid input)
├── 401 Unauthorized (no auth)
├── 403 Forbidden (no access)
├── 404 Not Found
├── 409 Conflict (slug exists)
└── 500 Server Error (with logging)
```

---

## 6. Frontend State Flow

```
┌────────────────────────────────────────────┐
│  FRONTEND STATE MANAGEMENT                 │
│  Multi-Layer Architecture                  │
└────────────┬───────────────────────────────┘
             │
    ┌────────┴────────┬───────────┬──────────┐
    │                 │           │          │
    ▼                 ▼           ▼          ▼
┌────────────┐  ┌──────────┐ ┌─────────┐ ┌──────┐
│ React Query│  │ Contexts │ │Component│ │Clerk │
│ (Server)   │  │ (App-    │ │ State   │ │Auth  │
│            │  │ wide)    │ │ (Local) │ │      │
└────────────┘  └──────────┘ └─────────┘ └──────┘

LAYER 1: REACT QUERY (Server State)
┌────────────────────────────────────────────┐
│ ReactQueryProvider wraps app                │
│                                            │
│ Configuration:                             │
│ ├── staleTime: 5 minutes (default)         │
│ ├── gcTime: 10 minutes (garbage collect)   │
│ ├── retry: 3 attempts on failure           │
│ └── refetchInterval: varies by data        │
│                                            │
│ Query Cache Keys:                          │
│ ├── ["visits", "today", tenantSlug]        │
│ ├── ["departments", tenantSlug]            │
│ ├── ["hosts", tenantSlug]                  │
│ ├── ["visitors", tenantSlug]               │
│ ├── ["services", tenantSlug]               │
│ └── ["tenants"]  (user's tenants)          │
│                                            │
│ Smart Refetch:                             │
│ ├── Static data: 30 minutes                │
│ ├── Visitors/Departments: 10 min           │
│ ├── Dashboard metrics: 30 seconds          │
│ └── Manual refetch on mutation             │
│                                            │
│ Mutations Auto-Invalidate:                 │
│ ├── Create visit → invalidate "visits"     │
│ ├── Update department → invalidate "deps"  │
│ └── Upload photo → no invalidate (direct)  │
└────────────────────────────────────────────┘

LAYER 2: CONTEXTS (App-Wide State)
┌────────────────────────────────────────────┐
│ TenantProvider (lib/tenant-provider.tsx)    │
│                                            │
│ Provides:                                  │
│ ├── slug: "acme" | null                    │
│ ├── name: "ACME Corp" | null               │
│ ├── logoUrl: "https://..." | null          │
│ └── isLoading: boolean                     │
│                                            │
│ Hook: useTenant()                          │
│ Usage:                                     │
│  const { slug, name } = useTenant()        │
│                                            │
│ Set by:                                    │
│ └── middleware.ts → layout.tsx             │
│                                            │
│ Cleared on:                                │
│ └── Subdomain change or logout             │
└────────────────────────────────────────────┘

LAYER 3: COMPONENT STATE (Local)
┌────────────────────────────────────────────┐
│ useState() - Component-level state          │
│                                            │
│ Examples:                                  │
│ ├── Form inputs (useForm from React Hook  │
│ │   Form)                                  │
│ ├── Modal open/close                       │
│ ├── Filter selections                      │
│ ├── Loading states (from useQuery)         │
│ └── Error messages                         │
│                                            │
│ Managed by:                                │
│ └── React Hook Form + Zod                  │
└────────────────────────────────────────────┘

LAYER 4: CLERK AUTHENTICATION
┌────────────────────────────────────────────┐
│ useAuth() hook - Current user session       │
│ Returns: { userId, sessionId, user }       │
│                                            │
│ useUser() hook - User profile details       │
│ Returns: { firstName, lastName, email }    │
│                                            │
│ Auto-managed:                              │
│ ├── Token refresh                          │
│ ├── Session validation                     │
│ └── CSRF protection                        │
└────────────────────────────────────────────┘

STATE FLOW EXAMPLE (Dashboard Load):
┌────────────────────────────────────────────┐
│ 1. User navigates to acme.localhost/       │
│    dashboard                               │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 2. TenantProvider loads context from       │
│    middleware header (slug="acme")         │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 3. useQuery(["visits", "today"]) fires     │
│    GET /api/visits?date=today              │
│    React Query caches response             │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 4. Component renders with isLoading state  │
│    Skeleton/spinner shown while fetching   │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 5. Data arrives, React re-renders          │
│    StatCards show metrics                  │
│    ActivityFeed shows visits               │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 6. Every 30 seconds, React Query           │
│    refetches "visits" query                │
│    Stale data replaced with fresh          │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 7. User submits form (create visit)        │
│    useMutation fires POST request          │
└────────────┬───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ 8. Mutation succeeds                       │
│    queryClient.invalidateQueries()         │
│    React Query automatically refetches     │
│    All dependent queries updated           │
└────────────────────────────────────────────┘
```

---

## 7. Upload System

```
┌─────────────────────────────────────────────┐
│  VERCEL BLOB STORAGE                        │
│  Provider: Vercel (integrated SaaS)         │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Authentication: BLOB_READ_WRITE_TOKEN      │
│  ├── Stored in environment variable         │
│  ├── Server-side only (never exposed)       │
│  └── Scoped to account full access          │
└────────────┬────────────────────────────────┘
             │
    ┌────────┴────────┬────────────┬──────────┐
    │                 │            │          │
    ▼                 ▼            ▼          ▼
 Photo         Signature        Document    Vehicle
 Upload        Capture          Upload      Photo

UPLOAD FLOW (Photo Example):
┌─────────────────────────────────────────────┐
│ User on Kiosk Interface                     │
│ Step 5: Photo Capture                       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ Browser Camera API Accesses Device          │
│ User sees live preview                      │
│ User clicks "Capture"                       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ Image converted to Blob                     │
│ Create FormData with image file             │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ POST /api/upload (or /api/blob)             │
│ Client sends image to Next.js API           │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ API Route Handler (/api/upload)             │
│ 1. Verify request from tenant               │
│ 2. Validate file (type, size)               │
│    Max size: 10MB for photos                │
│ 3. Check authorization                      │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ Call put() from @vercel/blob                │
│ Streams file directly to Blob storage       │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ Vercel Blob Processing                      │
│ 1. Store file (immutable)                   │
│ 2. Generate stable URL                      │
│ 3. Set cache headers (1 year)               │
│ 4. Distribute to CDN (global edge)          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ Response: { url, size, type }               │
│ url = "https://blob.vercelusercontent.com/  │
│       abc123/visitor-photo.jpg"             │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ Store URL in Database                       │
│ INSERT visits (...)                         │
│   SET visitorPhotoUrl = 'https://blob...'   │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ Return to Kiosk UI                          │
│ Show confirmation with preview              │
│ Continue to next step (signature)           │
└─────────────────────────────────────────────┘

STORAGE FOLDER STRUCTURE:
┌─────────────────────────────────────────────┐
│ /photos/visitors/[tenantId]/[visitorId]/    │
│   → visitor-check-in-1234567890.jpg         │
│   → visitor-check-in-1234567891.jpg         │
│                                             │
│ /photos/vehicles/[tenantId]/[vehicleId]/    │
│   → vehicle-photo-1234567890.jpg            │
│                                             │
│ /signatures/[tenantId]/[visitId]/           │
│   → signature-1234567890.svg                │
│   → signature-1234567890.png                │
│                                             │
│ /documents/[tenantId]/[documentId]/         │
│   → policy-acceptance-1234567890.pdf        │
└─────────────────────────────────────────────┘

FILE TYPE & SIZE LIMITS:
┌─────────────────────────────────────────────┐
│ Images (JPEG, PNG, WebP)                    │
│ ├── Max: 10 MB                              │
│ ├── Use case: Visitor photo, vehicle photo │
│ └── Auto-compress via Blob                  │
│                                             │
│ Signatures (SVG, Canvas → PNG)              │
│ ├── Max: 2 MB                               │
│ └── Captured from canvas element            │
│                                             │
│ Documents (PDF - Future)                    │
│ ├── Max: 50 MB                              │
│ └── For policy docs, agreements             │
│                                             │
│ Videos (MP4 - Future)                       │
│ ├── Max: 100 MB                             │
│ └── For security footage integration        │
└─────────────────────────────────────────────┘

ACCESS CONTROL:
┌─────────────────────────────────────────────┐
│ Vercel Blob Storage is PRIVATE              │
│ ├── Not directly accessible                 │
│ ├── Public access disabled                  │
│ └── URLs generated on demand                │
│                                             │
│ Access Via:                                 │
│ ├── Direct URL in page (embedded)           │
│ ├── Server proxy endpoint (optional)        │
│ └── API with token verification             │
│                                             │
│ Security:                                   │
│ ├── Verify tenant ownership                 │
│ ├── Check user authorization                │
│ ├── Log all access                          │
│ └── Implement signed URLs if needed         │
└─────────────────────────────────────────────┘
```

---

## 8. Dashboard Data Flow

```
┌──────────────────────────────────────────────┐
│  USER NAVIGATES TO DASHBOARD                 │
│  Route: [slug].localhost/dashboard           │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ MIDDLEWARE FLOW (Already Covered)            │
│ Extract slug → Load tenant context           │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ LAYOUT LOAD (Dashboard Layout)               │
│ app/dashboard/layout.tsx                     │
│ ├── TenantAuthGuard checks access            │
│ ├── TenantProvider available in context      │
│ └── Renders children (Dashboard Page)        │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ DASHBOARD PAGE RENDERS                       │
│ app/dashboard/page.tsx                       │
│                                              │
│ Parallel Query Execution (React Query):      │
│                                              │
│ ├─ useQuery(["visits", "today"])             │
│ │  GET /api/visits?date=today                │
│ │  Server-side filter by check-in date       │
│ │  staleTime: 30 seconds                     │
│ │  refetchInterval: 30 seconds               │
│ │                                            │
│ ├─ useQuery(["visits", "current"])           │
│ │  GET /api/visits?status=IN                 │
│ │  Server-side filter by status              │
│ │  Counts: visits with status="IN"           │
│ │  staleTime: 30 seconds                     │
│ │  refetchInterval: 30 seconds               │
│ │                                            │
│ └─ useQuery(["statistics", "month"])         │
│    GET /api/statistics?period=month          │
│    Aggregation: COUNT(*) for month           │
│    staleTime: 1 minute                       │
│    refetchInterval: 60 seconds               │
│                                              │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ QUERIES RESOLVED                             │
│                                              │
│ Backend Processing (/api/visits):            │
│ 1. Receive x-tenant-slug header              │
│ 2. Get tenant database URL from cache        │
│ 3. Connect to tenant database                │
│ 4. Execute filtered SQL:                     │
│    SELECT * FROM visits                      │
│    WHERE date(checkInAt) = today()           │
│    AND status = 'IN'                         │
│    ORDER BY checkInAt DESC                   │
│    LIMIT 50                                  │
│ 5. Return JSON to client                     │
│ 6. React Query caches response               │
│                                              │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ COMPONENTS RENDER WITH DATA                  │
│                                              │
│ ┌─────────────────────────────────────────┐  │
│ │ StatCards Component                     │  │
│ │                                         │  │
│ │ ┌──────────┬──────────┬──────────┐      │  │
│ │ │ Arrivals │ On-Site  │ Departed │      │  │
│ │ │ Today    │ (Live)   │ Today    │      │  │
│ │ │          │          │          │      │  │
│ │ │ = visits │ = visits │ = visits │      │  │
│ │ │ .filter( │ .filter( │ .filter( │      │  │
│ │ │   isToday│ status   │ isOut &  │      │  │
│ │ │)         │=="IN")   │ isToday) │      │  │
│ │ │ .length  │ .length  │ .length  │      │  │
│ │ │          │          │          │      │  │
│ │ └──────────┴──────────┴──────────┘      │  │
│ │                                         │  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ ┌─────────────────────────────────────────┐  │
│ │ ActivityFeed Component                  │  │
│ │                                         │  │
│ │ Last 10 visits (sorted by date DESC)    │  │
│ │                                         │  │
│ │ Map over data:                          │  │
│ │ {visits.slice(0, 10).map(v => (         │  │
│ │   <ActivityItem                         │  │
│ │     key={v.id}                          │  │
│ │     visitor={v.visitor}                 │  │
│ │     status={v.status}                   │  │
│ │     checkIn={v.checkInAt}               │  │
│ │   />                                    │  │
│ │ ))}                                     │  │
│ │                                         │  │
│ └─────────────────────────────────────────┘  │
│                                              │
│ ┌─────────────────────────────────────────┐  │
│ │ DigitalClock Component                  │  │
│ │                                         │  │
│ │ Real-time clock display                 │  │
│ │ Updates every 1 second via setState     │  │
│ │                                         │  │
│ └─────────────────────────────────────────┘  │
│                                              │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ AUTO-REFETCH EVERY 30 SECONDS                │
│                                              │
│ Timer trigger (React Query):                 │
│ ├─ Marked all "visits" queries as stale     │
│ ├─ Automatically re-execute queries         │
│ ├─ New data fetched in background           │
│ ├─ Users don't see loading state             │
│ └─ React updates UI with fresh data         │
│                                              │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ USER INTERACTION: CREATE NEW VISIT           │
│ Clicks "New Visit" button → Modal opens      │
│                                              │
│ Form Submission Flow:                        │
│ 1. User fills form fields                    │
│    - Visitor (search/select)                 │
│    - Host (autocomplete)                     │
│    - Department (dropdown)                   │
│    - Service (dropdown)                      │
│    - Purpose (text input)                    │
│                                              │
│ 2. Form validation (React Hook Form + Zod)  │
│    ├─ Client-side validation                │
│    ├─ All fields required check              │
│    └─ Show errors inline                     │
│                                              │
│ 3. Submit button triggers mutation:          │
│    useMutation({                             │
│      mutationFn: (data) =>                   │
│        POST /api/visits { ...data }          │
│      onSuccess: () =>                        │
│        queryClient.invalidateQueries()       │
│    })                                        │
│                                              │
│ 4. API Receives Request:                     │
│    POST /api/visits                          │
│    ├─ Verify x-tenant-slug                  │
│    ├─ Validate input (Zod)                  │
│    ├─ Check authorization                    │
│    ├─ Insert visitor (upsert)                │
│    ├─ Insert visit record                    │
│    │  status = "IN"                          │
│    │  checkInAt = now()                      │
│    └─ Return created visit                   │
│                                              │
│ 5. Mutation Success Callback:                │
│    invalidateQueries(["visits"])             │
│    ├─ Mark all visit queries as stale      │
│    ├─ React Query refetches automatically   │
│    ├─ Dashboard updates in real-time        │
│    └─ StatCards & Feed refresh              │
│                                              │
│ 6. Modal closes, user sees updated feed     │
│                                              │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│ UPDATED DASHBOARD DISPLAYED                  │
│                                              │
│ ✅ "Arrivals Today" incremented              │
│ ✅ "Currently On-Site" incremented           │
│ ✅ New visit appears in Activity Feed        │
│ ✅ All in < 1 second (optimistic update)    │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Key Architecture Principles

```
1. SEPARATION OF CONCERNS
   ├─ Middleware → Routing & Context
   ├─ API Routes → Business Logic & DB
   ├─ Components → UI & Local State
   └─ Context → App-wide State

2. MULTI-TENANT ISOLATION
   ├─ Separate database per tenant
   ├─ Every request scoped to tenant
   ├─ No cross-tenant queries
   └─ Verification at every layer

3. REAL-TIME RESPONSIVENESS
   ├─ Automatic refetch every 30 seconds
   ├─ Mutation-triggered updates
   ├─ Optimistic updates (future)
   └─ WebSocket integration (future)

4. TYPE SAFETY
   ├─ TypeScript strict mode
   ├─ Zod schemas (runtime validation)
   ├─ Type-safe database (Drizzle)
   └─ Type-safe forms (React Hook Form)

5. CACHING STRATEGY
   ├─ React Query: Smart client-side cache
   ├─ Database: Connection pooling
   ├─ CDN: Blob storage with 1-year cache
   └─ Browser: Standard HTTP caching

6. SCALABILITY
   ├─ Serverless functions (Next.js)
   ├─ Per-tenant database pooling
   ├─ LRU cache for connections
   ├─ Automatic exponential backoff retries
   └─ Stateless design
```

---

**Document Version**: 1.0  
**Last Updated**: May 19, 2026
