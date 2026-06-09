# Concrete Fix Implementation Guide

## Quick Start: Auto-Fix First
```bash
cd c:\Users\Anaclet\Documents\dev\vms-saas
npx eslint . --fix
npx tsc --noEmit
```

This will automatically fix ~30-40% of errors. Then apply manual fixes below.

---

## CRITICAL FIXES FIRST

### 1. react-hooks/rules-of-hooks (35 errors)

#### File: `features/tenants/forms/createDepartment.form.tsx`

**BEFORE (Lines 28-35):**
```typescript
export function CreateDepartmentForm() {
  const { slug: tenantSlug } = useTenant();
  const router = useRouter();

  if (!tenantSlug) return null;  // ❌ PROBLEM: Guard after hook call

  const createDept = useCreateDepartment(tenantSlug);
```

**AFTER (Option A - Recommended):**
```typescript
export function CreateDepartmentForm() {
  const { slug: tenantSlug } = useTenant();
  const router = useRouter();
  const createDept = useCreateDepartment(tenantSlug);

  if (!tenantSlug) {
    return null;  // ✅ Guard AFTER all hooks
  }

  // Form code continues...
```

OR

**AFTER (Option B - Parent Component Guard):**

In the component that renders `CreateDepartmentForm`:
```typescript
// Parent component
export function DepartmentPage() {
  const { slug: tenantSlug } = useTenant();
  
  if (!tenantSlug) {
    return <Loading />;
  }
  
  return <CreateDepartmentForm />;  // Only render when slug exists
}

// Child form - no guard needed
export function CreateDepartmentForm() {
  const { slug: tenantSlug } = useTenant();  // Guaranteed to exist
  const createDept = useCreateDepartment(tenantSlug);
  
  // Form JSX directly, no guard needed
  return (
    <Form>
      {/* ... */}
    </Form>
  );
}
```

**Apply to these files:**
- [ ] features/tenants/forms/createDepartment.form.tsx
- [ ] features/tenants/forms/createVisitor.form.tsx
- [ ] features/tenants/forms/createHost.form.tsx
- [ ] features/tenants/forms/createTenant.form.tsx

---

### 2. react/no-unescaped-entities (87 errors)

#### Pattern: Replace `'` with `&apos;` in JSX

**FIND/REPLACE COMMANDS (PowerShell):**

```powershell
# Find all files with unescaped entities
Get-ChildItem -Path "c:\Users\Anaclet\Documents\dev\vms-saas" -Recurse -Include "*.tsx" | 
  Where-Object { $_.FullName -notmatch "node_modules|\.next" } |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "[^&]'[^;]") {  # Find unescaped quotes in JSX
      Write-Host "FOUND: $($_.FullName)"
    }
  }
```

**Specific Examples:**

#### File: `app/(public)/page.tsx` - Line 40
**BEFORE:**
```typescript
<span>L'aventure commence ici</span>
```

**AFTER:**
```typescript
<span>L&apos;aventure commence ici</span>
```

#### File: `app/tenants/[slug]/page.tsx` - Line 115
**BEFORE:**
```typescript
<h1>Bienvenue à l'établissement {tenant.name}</h1>
```

**AFTER:**
```typescript
<h1>Bienvenue à l&apos;établissement {tenant.name}</h1>
```

#### Common French Phrases Needing Fixes:
```typescript
// Replace these:
"L'établissement" → "L&apos;établissement"
"C'est" → "C&apos;est"
"S'inscrire" → "S&apos;inscrire"
"L'accès" → "L&apos;accès"
"D'accès" → "D&apos;accès"
"Aujourd'hui" → "Aujourd&apos;hui"
```

**Sed Command (Git Bash):**
```bash
find . -name "*.tsx" -type f ! -path "*/node_modules/*" ! -path "*/.next/*" -exec \
  sed -i "s/\([^&]\)'\([^;]\)/\1\&apos;\2/g" {} \;
```

---

### 3. @typescript-eslint/no-explicit-any (166 errors)

#### File: `app/tenants/[slug]/page.tsx` - Line 50

**BEFORE:**
```typescript
function TenantHeroPage({ tenant, userId }: { tenant: any; userId: string | null }) {
  return (
    // JSX...
  );
}
```

**AFTER (Create type first):**
```typescript
// At top of file, after imports:
type TenantPageProps = {
  tenant: Awaited<ReturnType<typeof getPublicTenantBySlug>>;
  userId: string | null;
};

// Then update function:
function TenantHeroPage({ tenant, userId }: TenantPageProps) {
  return (
    // JSX...
  );
}
```

#### File: `lib/db-retry.ts` - Lines 9, 14

**BEFORE:**
```typescript
export async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    let lastError: any;  // ❌ Line 9

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {  // ❌ Line 14
            lastError = error;
```

**AFTER:**
```typescript
export async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    let lastError: unknown;  // ✅ Changed

    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: unknown) {  // ✅ Changed
            lastError = error;
```

#### File: `features/tenants/queries/tenant-data.ts` - Line 135

**BEFORE:**
```typescript
export async function getVisitorTypes(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visitorTypes.findMany({
    orderBy: (vt: any, { desc }: any) => [desc(vt.createdAt)],  // ❌
  });
}
```

**AFTER:**
```typescript
export async function getVisitorTypes(tenantSlug: string) {
  await verifyTenantOwnership(tenantSlug);
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.query.visitorTypes.findMany({
    orderBy: [desc(visitorTypes.createdAt)],  // ✅ Use column directly
  });
}
```

#### File: `features/tenants/queries/tenant-data.ts` - Transaction Line

**BEFORE:**
```typescript
async function createVisitInternal(tenantSlug: string, data: {...}) {
  const db = await getTenantDbBySlug(tenantSlug);

  try {
    return await db.transaction(async (tx: any) => {  // ❌
      let finalVisitorId = data.visitorId || null;
      // ...
    });
  }
}
```

**AFTER:**
```typescript
async function createVisitInternal(tenantSlug: string, data: {...}) {
  const db = await getTenantDbBySlug(tenantSlug);

  try {
    return await db.transaction(async (tx) => {  // ✅ Remove 'any', let TypeScript infer
      let finalVisitorId = data.visitorId || null;
      // ...
    });
  }
}
```

---

### 4. @typescript-eslint/no-unused-vars (111 errors)

#### File: `features/tenants/queries/tenant-data.ts` - Line 5

**BEFORE:**
```typescript
import { and, gte, lte, eq, between, desc, or, ilike, asc, isNotNull } from "drizzle-orm";
```

**AFTER:**
```typescript
import { and, gte, lte, eq, desc, or, ilike, asc, isNotNull } from "drizzle-orm";
```
(Remove `between`)

#### File: `app/(public)/page.tsx` - Lines 6-15

**BEFORE:**
```typescript
import { 
  ShieldCheck,  // ❌ unused
  Users,        // ❌ unused
  BarChart3,    // ❌ unused
  TabletSmartphone,  // ❌ unused
  LayoutDashboard,   // ❌ unused
  ClipboardList,     // ❌ unused
  UserCheck,    // ❌ unused
  Monitor,      // ❌ unused
  CheckCircle2, // ❌ unused
  ArrowRight 
} from "lucide-react";
```

**AFTER:**
```typescript
import { ArrowRight } from "lucide-react";
```
(Remove the unused icon imports)

#### File: `public/sw.js` - Line 1

**BEFORE:**
```javascript
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
```

**AFTER:**
```javascript
self.addEventListener('install', () => {
  self.skipWaiting();
});
```
(Remove unused `event` parameter)

---

### 5. @next/next/no-img-element (29 errors)

#### General Pattern: Replace `<img>` with `<Image>`

**BEFORE:**
```typescript
<img 
  src={url}
  alt="Description"
  className="w-full"
/>
```

**AFTER:**
```typescript
import Image from "next/image";

<Image
  src={url}
  alt="Description"
  width={800}
  height={600}
  className="w-full"
/>
```

#### File: Features visit detail view

**BEFORE:**
```typescript
<img
  src={visit.signatureData}
  alt="Signature du visiteur"
  className="w-full h-auto max-h-[150px] object-contain mix-blend-multiply"
/>
```

**AFTER:**
```typescript
<Image
  src={visit.signatureData}
  alt="Signature du visiteur"
  width={400}
  height={150}
  className="w-full h-auto max-h-[150px] object-contain mix-blend-multiply"
/>
```

---

### 6. react-hooks/purity (29 errors)

#### Pattern: Move console.log and side effects to useEffect

**BEFORE:**
```typescript
export function Dashboard() {
  const stats = getDashboardStats();
  console.log("Dashboard loaded with stats:", stats);  // ❌ Side effect during render
  
  return <div>{stats.total}</div>;
}
```

**AFTER:**
```typescript
import { useEffect, useState } from 'react';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    getDashboardStats().then(setStats);
    console.log("Dashboard loaded with stats:", stats);  // ✅ In useEffect
  }, []);
  
  return <div>{stats?.total}</div>;
}
```

---

## Implementation Sequence

### Step 1: Automatic Fixes (5 min)
```bash
npx eslint . --fix
npx tsc --noEmit
```

### Step 2: Manual Fixes (30-45 min)
1. Fix hook violations (2-3 form files)
2. Replace unescaped entities (use sed/find-replace)
3. Fix explicit any types (6-10 files)
4. Remove unused imports (verified by eslint)

### Step 3: Verify (5 min)
```bash
npx eslint . --format=compact
npx tsc --noEmit
npm run build
```

### Step 4: Test (10 min)
```bash
npm run dev
# Test key flows in browser
```

---

## Batch Processing Script

Save as `fix-eslint.ps1`:
```powershell
# Fix unused vars (auto)
Write-Host "Running ESLint auto-fix..."
npx eslint . --fix

# Check results
Write-Host "Verifying TypeScript..."
npx tsc --noEmit

Write-Host "Final ESLint check..."
npx eslint . --ext .ts,.tsx

Write-Host "Done! Review changes and test."
```

Run: `.\fix-eslint.ps1`

---

## Validation Checklist

- [ ] No `@typescript-eslint/no-explicit-any` errors
- [ ] No `react-hooks/rules-of-hooks` errors
- [ ] No `react/no-unescaped-entities` errors
- [ ] All unused imports removed
- [ ] All tests pass
- [ ] Dev server starts without errors
- [ ] Build succeeds
