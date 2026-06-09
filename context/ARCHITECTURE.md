# Architecture Diagram - Subdomain-Based Multi-Tenant System

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER REQUEST                                │
│                                                                 │
│  http://app.localhost:3001                                     │
│  http://acme.localhost:3001                                    │
│  http://admin.localhost:3001                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MIDDLEWARE (middleware.ts)                      │
│                                                                 │
│  1. Extract hostname                                           │
│  2. Detect subdomain (admin, acme, etc.)                       │
│  3. Route to correct app section                               │
│  4. Set x-tenant-slug header                                   │
└────┬────────────────────────────────────┬───────────────┬──────┘
     │                                    │               │
     ▼                                    ▼               ▼
┌──────────────┐            ┌──────────────────┐  ┌─────────────┐
│  PUBLIC APP  │            │ TENANT DASHBOARD │  │ ADMIN PANEL │
│              │            │                  │  │             │
│ /public/*    │            │ /dashboard/*     │  │ /admin/*    │
└──────┬───────┘            └────────┬─────────┘  └──────┬──────┘
       │                             │                  │
       │                             ▼                  │
       │                    ┌──────────────────┐        │
       │                    │  Tenant Context  │        │
       │                    │                  │        │
       │                    │ slug = "acme"    │        │
       │                    └────────┬─────────┘        │
       │                             │                  │
       ▼                             ▼                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                      API LAYER                               │
   │                                                               │
   │  /api/tenants          (Get user's tenants)                 │
   │  /api/sync-user        (Sync user data)                     │
   │  /api/admin/verify     (Check admin access)                 │
   │  /api/admin/stats      (System statistics)                  │
   │  /api/admin/tenants    (List all tenants)                   │
   │  /api/admin/users      (List all users)                     │
   └────┬──────────────────────────────────┬──────────────────────┘
        │                                  │
        ▼                                  ▼
    ┌──────────────────┐        ┌─────────────────────┐
    │  MASTER DATABASE │        │  TENANT DATABASES   │
    │                  │        │                     │
    │ • Users          │        │ Tenant: ACME        │
    │ • Tenants        │        │ • Departments       │
    │ • Ownership      │        │ • Hosts             │
    │ • Admin Config   │        │ • Visitors          │
    │                  │        │ • Visits            │
    │                  │        │                     │
    │                  │        │ Tenant: GLOBEX      │
    │                  │        │ • Departments       │
    │                  │        │ • Hosts             │
    │                  │        │ • Visitors          │
    │                  │        │ • Visits            │
    └──────────────────┘        └─────────────────────┘
```

---

## Request Routing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser Request: http://acme.localhost:3001/dashboard          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │    middleware.ts               │
            │  extractSubdomain(hostname)    │
            │                                │
            │  hostname = "acme.localhost"   │
            │  subdomain = "acme"            │
            └────────┬───────────────────────┘
                     │
           ┌─────────┴──────────┐
           │                    │
           ▼                    ▼
    ┌──────────────┐     ┌─────────────┐
    │ "admin" or   │     │ Any other   │
    │ "" or www    │     │ subdomain   │
    │              │     │             │
    │ /admin/*     │     │ /dashboard/*│
    │ or /public/* │     │             │
    └──────────────┘     └────┬────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ /dashboard/page.tsx  │
                    │                      │
                    │ headers().get('host')│
                    │ getTenantSlugFromHost │
                    │                      │
                    │ slug = "acme"        │
                    └─────────────┬────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │ <TenantProvider>         │
                    │   slug="acme"            │
                    │                          │
                    │   <TenantAuthGuard>      │
                    │     Verify access       │
                    │                          │
                    │     Load dashboard      │
                    └──────────────────────────┘
```

---

## Subdomain Resolution

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBDOMAIN DETECTION                          │
│                                                                 │
│  middleware.ts: extractSubdomain(hostname)                     │
│                                                                 │
│  Input Examples:                                               │
│  ├─ "localhost" → null (main domain)                          │
│  ├─ "localhost:3001" → null (main domain, with port)          │
│  ├─ "app.localhost:3001" → null (main domain, named "app")   │
│  ├─ "admin.localhost:3001" → "admin" (admin subdomain)       │
│  ├─ "acme.localhost:3001" → "acme" (tenant subdomain)        │
│  ├─ "www.example.com" → null (www treated as main)           │
│  ├─ "example.com" → null (no subdomain)                      │
│  └─ "tenant.example.com" → "tenant" (tenant subdomain)       │
│                                                                 │
│  Routing Logic:                                                │
│  ├─ subdomain === "admin" → route to /admin                  │
│  ├─ subdomain === null/www/localhost → route to /public      │
│  └─ other subdomain → route to /dashboard                    │
│                         set x-tenant-slug header              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
PUBLIC APP TREE
app/public/layout.tsx
├── ClerkProvider
├── QueryProvider
├── PublicHeader
└── {children}
    ├── /: Landing page
    ├── /sign-in: Clerk SignIn
    └── /setup-tenant: CreateTenantForm

TENANT DASHBOARD TREE
app/dashboard/layout.tsx
├── TenantAuthGuard (verifies access)
├── TenantProvider (slug="acme")
└── Sidebar + Main
    ├── Navigation (Dashboard, Management)
    ├── {children}
    │   ├── /: Dashboard tabs (Departments, Hosts, Visitors)
    │   ├── /management: Management interface
    │   └── /visitor: Public kiosk (no auth)
    └── UserButton + Logout

ADMIN PANEL TREE
app/admin/layout.tsx
├── useAuth() check
├── verifyAdminAccess()
├── Sidebar + Main
    ├── Navigation (Dashboard, Tenants, Users, Settings)
    ├── {children}
    │   ├── /: Admin dashboard with stats
    │   ├── /tenants: Tenant management
    │   ├── /users: User management
    │   └── /settings: Settings page
    └── Admin controls
```

---

## Data Flow: Creating a Tenant

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER OPENS SETUP PAGE                                        │
│    http://app.localhost:3001/setup-tenant                      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. FORM DISPLAY                                                 │
│    CreateTenantForm with onSuccess callback                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. USER SUBMITS FORM                                            │
│    name="ACME Corp"                                             │
│    slug="acme"                                                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. MUTATION CALLED                                              │
│    createTenant.mutateAsync({name, slug})                      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. SERVER ACTION (features/tenants/queries/create.tenant.ts)   │
│    ├─ Verify user is authenticated (Clerk)                     │
│    ├─ Check slug is unique                                      │
│    ├─ Create tenant database in Neon                            │
│    ├─ Run migrations on new database                            │
│    └─ Insert tenant record in Master DB                         │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. RESPONSE RETURNED                                            │
│    { id, name, slug, dbUrl, ownerId }                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. CALLBACK EXECUTED (onSuccess)                               │
│    onSuccess(slug)  // slug = "acme"                           │
│    getTenantUrl(slug) → "http://acme.localhost:3001"           │
│    window.location.href = tenantUrl                            │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. BROWSER NAVIGATES                                            │
│    Location: http://acme.localhost:3001                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 9. MIDDLEWARE DETECTS                                           │
│    hostname = "acme.localhost:3001"                            │
│    subdomain = "acme"                                           │
│    Route to: /dashboard/page.tsx                                │
│    Set header: x-tenant-slug = "acme"                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ 10. DASHBOARD LOADS                                             │
│     <TenantAuthGuard tenantSlug="acme">                        │
│     <TenantProvider slug="acme">                                │
│       <DashboardLayout>                                         │
│         Main dashboard with departments, hosts, visitors        │
│       </DashboardLayout>                                        │
│     </TenantProvider>                                            │
│     </TenantAuthGuard>                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    MASTER DATABASE                              │
│           (Connection: DATABASE_URL env var)                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Table: users                                                   │
│  ├─ id (PK, Clerk user ID)                                     │
│  ├─ nom (user's name)                                           │
│  ├─ email                                                       │
│  ├─ role (Tenant, Admin, SUPER)                                │
│  └─ createdAt                                                   │
│                                                                  │
│  Table: tenants                                                 │
│  ├─ id (PK, UUID)                                              │
│  ├─ name (company name)                                        │
│  ├─ slug (URL identifier, UNIQUE)                              │
│  ├─ dbUrl (connection string to tenant DB)                     │
│  ├─ ownerId (FK to users.id)                                   │
│  ├─ isActive (1 or 0)                                          │
│  └─ createdAt                                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
        ┌────────────────────┐ ┌────────────────────┐
        │ TENANT: ACME DB    │ │ TENANT: GLOBEX DB  │
        ├────────────────────┤ ├────────────────────┤
        │                    │ │                    │
        │ Table: departments │ │ Table: departments │
        │ Table: hosts       │ │ Table: hosts       │
        │ Table: visitors    │ │ Table: visitors    │
        │ Table: visits      │ │ Table: visits      │
        │ Table: settings    │ │ Table: settings    │
        │                    │ │                    │
        └────────────────────┘ └────────────────────┘
```

**Key Points:**
- Master DB owns tenant metadata
- Each tenant has own isolated database
- Connection pooling per tenant database
- No data sharing between tenants
- Automatic tenant DB creation on signup

---

## Admin Panel Access Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ User visits: http://admin.localhost:3001                        │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ middleware.ts              │
        │ subdomain = "admin"        │
        │ Route to: /admin/*         │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ app/admin/layout.tsx               │
        │                                    │
        │ 1. useAuth() - get userId          │
        │ 2. If not authenticated:           │
        │    → redirect to /                 │
        │ 3. fetch /api/admin/verify         │
        │ 4. If not authorized:              │
        │    → redirect to /                 │
        │ 5. Show admin layout + sidebar     │
        │                                    │
        │ Sidebar Navigation:                │
        │ ├─ Dashboard                       │
        │ ├─ Tenants                         │
        │ ├─ Users                           │
        │ └─ Settings                        │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────┐
        │ Admin Pages Load                    │
        │                                     │
        │ Dashboard (/admin)                  │
        │ ├─ fetch /api/admin/stats           │
        │ ├─ Display stat cards               │
        │ ├─ Show recent activity             │
        │ └─ Quick action buttons             │
        │                                     │
        │ Tenants (/admin/tenants)            │
        │ ├─ fetch /api/admin/tenants         │
        │ ├─ Display tenant table             │
        │ ├─ Search & pagination              │
        │ └─ Manage buttons                   │
        │                                     │
        │ Users (/admin/users)                │
        │ ├─ fetch /api/admin/users           │
        │ ├─ Display user table               │
        │ ├─ Search & filter                  │
        │ └─ Role management                  │
        └─────────────────────────────────────┘
```

---

## Tenant Context Usage

```
┌────────────────────────────────────────┐
│  Tenant Context Injection              │
│                                        │
│  Source 1: Middleware Headers          │
│  ├─ Set: x-tenant-slug = "acme"       │
│  └─ Available in: app/dashboard/*     │
│                                        │
│  Source 2: Client-side Hook            │
│  ├─ useTenant()                        │
│  ├─ Returns: { slug }                 │
│  └─ Used in: Components               │
│                                        │
│  Usage Flow:                           │
│  ├─ Headers injected by middleware     │
│  ├─ Server reads via getTenantSlug()   │
│  ├─ Passed to TenantProvider           │
│  ├─ Components use useTenant()         │
│  └─ Tenant context available           │
│                                        │
└────────────────────────────────────────┘

// In a server component (layout/page)
const slug = getTenantSlug();  // from headers
<TenantProvider slug={slug}>
  <SomeComponent />
</TenantProvider>

// In a client component
const { slug } = useTenant();
// Now you have tenant slug for queries
```

---

## Summary

This architecture provides:
- ✅ **Transparent Subdomain Routing** - Middleware handles all complexity
- ✅ **Multi-Level Isolation** - Master + Tenant databases
- ✅ **Automatic Context Injection** - Tenant available everywhere
- ✅ **Three Interfaces** - Public, Tenant, Admin
- ✅ **Scalable Design** - Unlimited tenants supported
- ✅ **Production Ready** - Full error handling and validation

Architecture Context
Stack
Layer	Technology	Role
Framework	Next.js + TypeScript	Full-stack application framework
UI	Tailwind CSS + shadcn/ui	Design system and UI components
Authentication	Clerk	Authentication and session management
Database ORM	Drizzle ORM	Type-safe database access
Database	Neon PostgreSQL	Master and tenant databases
State Management	React Query	Server-state caching and synchronization
Validation	Zod	Runtime validation and schema parsing
Forms	React Hook Form	Form state management
File Storage	Vercel Blob	Media and document storage
Hosting	Vercel	Deployment and serverless runtime
Icons	Lucide React	Icon system
System Boundaries
app/ — Next.js App Router pages, layouts, and route handlers
components/ — Shared UI and feature components
features/ — Business-domain logic grouped by feature
lib/ — Shared infrastructure, database, auth, cache, utilities
db/ — Database schema, migrations, and connection management
contexts/ — React providers and app-wide state
hooks/ — Shared reusable hooks
types/ — Shared TypeScript types and contracts
config/ — Centralized application configuration
Storage Model
Master Database: Stores platform-level data including users, tenants, tenant metadata, roles, subscription state, and database connection references.
Tenant Databases: Stores tenant-isolated operational data including: visitors, visits, departments, hosts, vehicles, devices, services, settings, and audit logs.
Blob Storage: Stores uploaded files and media including: visitor photos, vehicle photos, signatures, exported reports, and future document uploads.
Auth and Access Model
Every user authenticates through Clerk
Every request is scoped to a tenant context
Tenant context is resolved via subdomain routing
Only authorized tenant users can access tenant resources
Platform admins access the admin panel through reserved subdomains
All mutations require authentication and permission checks
Frontend never accesses databases directly
Tenant ownership is verified server-side on every request
Invariants
No cross-tenant database access is ever allowed
Tenant context must always be validated server-side
API routes must validate input before business logic runs
Authentication and authorization must happen before mutations
Route handlers must remain stateless and serverless-safe
Long-running jobs must not execute inside request handlers
Frontend components must never expose secret configuration
All uploads must be validated before storage
Shared UI components must remain presentation-focused
All external input must be treated as untrusted