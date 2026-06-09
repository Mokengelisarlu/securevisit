# ESLint Error Analysis & Fix Plan

**Analysis Date:** May 19, 2026  
**Total ESLint Errors:** 393 errors across 319 files

---

## Error Breakdown

| Rule | Count | Priority | Status |
|------|-------|----------|--------|
| `@typescript-eslint/no-explicit-any` | 166 | MEDIUM | Requires type analysis |
| `@typescript-eslint/no-unused-vars` | 111 | LOW | Remove unused imports |
| `react/no-unescaped-entities` | 87 | HIGH | Replace with HTML entities |
| `react-hooks/rules-of-hooks` | 35 | CRITICAL | Fix hook call logic |
| `@next/next/no-img-element` | 29 | MEDIUM | Use Next.js Image component |
| `react-hooks/purity` | 29 | HIGH | Remove side effects from render |
| `react-hooks/incompatible-library` | 2 | LOW | Update library hooks |
| `react-hooks/exhaustive-deps` | 2 | LOW | Add missing dependencies |
| Others | 3 | LOW | Miscellaneous |

---

## PRIORITY 1: `react-hooks/rules-of-hooks` (35 errors) - CRITICAL

### Issue
Conditional hook calls in form components violate React's Rules of Hooks. Hooks must be called at the top level, not inside conditions, loops, or nested functions.

### Files with Hook Violations
- `features/tenants/forms/createDepartment.form.tsx` (multiple issues)
- `features/tenants/forms/createVisitor.form.tsx`
- `features/tenants/forms/createHost.form.tsx`
- `features/tenants/forms/createTenant.form.tsx`

### Example Fix: createDepartment.form.tsx

**ISSUE:** Early return with `if (!tenantSlug) return null;` causes hooks to execute conditionally.

```typescript
// ❌ WRONG - Hook might not execute if tenantSlug is missing
export function CreateDepartmentForm() {
  const { slug: tenantSlug } = useTenant();
  
  if (!tenantSlug) return null;  // Hook executed BEFORE this line, but skipped sometimes
  
  const createDept = useCreateDepartment(tenantSlug);  // Line 32
  // ...
}
```

**FIX 1: Move guard to parent component**
```typescript
// Parent component (safe place)
export function DepartmentPage() {
  const { slug: tenantSlug } = useTenant();
  
  if (!tenantSlug) return <div>Loading...</div>;
  
  // Only render form when tenantSlug is available
  return <CreateDepartmentForm />;
}

// Child form - no guard needed
export function CreateDepartmentForm() {
  const { slug: tenantSlug } = useTenant();  // Always available
  const createDept = useCreateDepartment(tenantSlug);
  // ...
}
```

**FIX 2: Alternative - Use optional parameter + undefined check in hook**
```typescript
export function CreateDepartmentForm() {
  const { slug: tenantSlug } = useTenant();
  const createDept = useCreateDepartment(tenantSlug);
  
  if (!tenantSlug) {
    return <div>Loading...</div>;
  }
  
  return (
    // Form JSX here
  );
}
```

### Affected Files - Apply Fix to All:
1. **features/tenants/forms/createDepartment.form.tsx** - Line 30
2. **features/tenants/forms/createVisitor.form.tsx** - Similar pattern
3. **features/tenants/forms/createHost.form.tsx** - Similar pattern  
4. **features/tenants/forms/createTenant.form.tsx** - Similar pattern

---

## PRIORITY 2: `react/no-unescaped-entities` (87 errors) - HIGH

### Issue
Single/double quotes in JSX text are not properly escaped. They need HTML entity encoding.

### HTML Entity Replacements
```
' (apostrophe)  → &apos;  or &#39;  or &lsquo;  or &rsquo;
```

### Files with High Entity Error Counts
- `app/(public)/page.tsx` - Multiple instances
- `app/tenants/[slug]/page.tsx` - Line 40, 115
- `features/landing/Hero.tsx` - Multiple instances
- Various form and component files

### Example Fixes

#### **Example 1: app/(public)/page.tsx - Line 40**
```typescript
// ❌ WRONG
<h2>L'aventure commence ici</h2>

// ✅ CORRECT - Option 1: Use &apos;
<h2>L&apos;aventure commence ici</h2>

// ✅ CORRECT - Option 2: Use &#39;
<h2>L&#39;aventure commence ici</h2>

// ✅ CORRECT - Option 3: Use curly braces with JavaScript string
<h2>L{'\''}aventure commence ici</h2>
```

#### **Example 2: Common Phrases**
```typescript
// ❌ Don't leave apostrophes bare
<p>C'est facile</p>
<button>S'inscrire</button>
<span>L'établissement</span>

// ✅ Replace with entities
<p>C&apos;est facile</p>
<button>S&apos;inscrire</button>
<span>L&apos;établissement</span>
```

### Systematic Fix Command
For each file with unescaped entities:
1. Find all single quotes in JSX strings: `'` → `&apos;`
2. Find all double quotes inside single-quoted attributes
3. Apply entity replacement

### Search Pattern for All Files
```
/[^=<>]*'[^=<>]*/ (in JSX context)
```

Replace `'` with `&apos;` in JSX text content.

---

## PRIORITY 3: `@typescript-eslint/no-explicit-any` (166 errors) - MEDIUM

### Issue
Using `any` type defeats TypeScript's purpose. Replace with proper types or `unknown`.

### Files with Most `any` Usage
1. **features/tenants/queries/tenant-data.ts** - 19 instances
   - Lines: 135, 137, 141, 408, 408, 408, 679, 679, 687, 768, 768, 839, 1025, 1088, 1141, 1189, 1218, 1237, 1237, 1241, 1241, 1247, 1247

2. **app/tenants/[slug]/page.tsx** - Line 50
   - `{ tenant: any; userId: string | null }`

3. **features/users/server/syncTenantUser.ts** - Line 91

4. **lib/db-retry.ts** - Lines 9, 14

5. **scripts/migrate-tenants.ts** - Lines 25, 32

### Example Fixes

#### **Fix 1: app/tenants/[slug]/page.tsx:50**
```typescript
// ❌ WRONG
function TenantHeroPage({ tenant, userId }: { tenant: any; userId: string | null })

// ✅ CORRECT - Define proper type
import { PublicTenant } from "@/features/tenants/types"; // or appropriate type

function TenantHeroPage({ tenant, userId }: { tenant: PublicTenant; userId: string | null })

// If PublicTenant doesn't exist, infer from getPublicTenantBySlug return type
type TenantType = Awaited<ReturnType<typeof getPublicTenantBySlug>>;
```

#### **Fix 2: lib/db-retry.ts:9 & 14**
```typescript
// ❌ WRONG
let lastError: any;

// ✅ CORRECT
let lastError: unknown;
```

#### **Fix 3: features/tenants/queries/tenant-data.ts:135**
```typescript
// ❌ WRONG - orderBy callback uses any
return await db.query.visitorTypes.findMany({
  orderBy: (vt: any, { desc }: any) => [desc(vt.createdAt)],
});

// ✅ CORRECT - Type the callback properly
import { SQL } from "drizzle-orm";

return await db.query.visitorTypes.findMany({
  orderBy: (vt) => [desc(vt.createdAt)],  // Let TypeScript infer
});

// OR if using table callback:
return await db.query.visitorTypes.findMany({
  orderBy: [desc(visitorTypes.createdAt)],  // Use column directly
});
```

#### **Fix 4: Database Transaction Types**
```typescript
// ❌ WRONG
async function createVisitInternal(
  tenantSlug: string,
  data: { ... }
) {
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.transaction(async (tx: any) => {  // Line 1237
    // ...
  });
}

// ✅ CORRECT - Create proper transaction type
import { PgTransaction } from "drizzle-orm/pg-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";

type TenantTransaction = Parameters<Awaited<ReturnType<typeof getTenantDbBySlug>>['transaction']>[0];

async function createVisitInternal(
  tenantSlug: string,
  data: { ... }
) {
  const db = await getTenantDbBySlug(tenantSlug);
  return await db.transaction(async (tx: typeof db) => {
    // ...
  });
}
```

#### **Fix 5: Error Handling**
```typescript
// ❌ WRONG
catch (error: any) {
  console.error("Error:", error);
}

// ✅ CORRECT
catch (error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error("Error:", err.message);
}
```

### Type Definition File
Create `types/tenant-data.ts`:
```typescript
export type PublicTenant = {
  name: string;
  slug: string;
  ownerId: string;
} | null;

export type Visit = Awaited<ReturnType<typeof getVisitById>>;
export type Visitor = Awaited<ReturnType<typeof getVisitorById>>;
// etc.
```

---

## PRIORITY 4: `@typescript-eslint/no-unused-vars` (111 errors) - LOW

### Issue
Imports are declared but never used. Simple fix: remove them.

### Files with Most Unused Vars
- `features/tenants/queries/tenant-data.ts` - Line 5: `between` is imported but unused
- `app/(public)/page.tsx` - Lines 6-15: Multiple icon imports unused
  - `ShieldCheck`, `Users`, `BarChart3`, `TabletSmartphone`, `LayoutDashboard`, `ClipboardList`, `UserCheck`, `Monitor`, `CheckCircle2`, `ArrowRight`
- Form files have unused imports

### Example Fixes

#### **Fix 1: Remove unused imports**
```typescript
// ❌ WRONG - in features/tenants/queries/tenant-data.ts:5
import { and, gte, lte, eq, between, desc, or, ilike, asc, isNotNull } from "drizzle-orm";

// ✅ CORRECT - Remove 'between' if unused
import { and, gte, lte, eq, desc, or, ilike, asc, isNotNull } from "drizzle-orm";
```

#### **Fix 2: Remove unused icon imports**
```typescript
// ❌ WRONG - app/(public)/page.tsx
import { 
  ShieldCheck,    // ← unused
  Users,          // ← unused
  BarChart3,      // ← unused
  // ... etc
} from "lucide-react";

// ✅ CORRECT - Keep only used icons
import { ArrowRight } from "lucide-react";
```

### Quick Cleanup Script
```bash
# Find all no-unused-vars errors
npx eslint . --rule '@typescript-eslint/no-unused-vars: error' --format=json | \
  ConvertFrom-Json | \
  Where-Object { $_.messages.Count -gt 0 } | \
  ForEach-Object { $_.messages | Where-Object ruleId -eq '@typescript-eslint/no-unused-vars' } | \
  ForEach-Object { "$($_.line): $($_.message)" }
```

---

## PRIORITY 5: `react-hooks/purity` (29 errors) - HIGH

### Issue
Impure code in components (side effects, direct DOM manipulation) during render.

### Common Causes
- `console.log()`, `console.error()` during render
- State mutations during render
- API calls not in useEffect
- Direct DOM access outside useEffect

### Affected Areas
- Dashboard stats calculations
- Form submission handlers with side logic
- Component initialization code

### Example Fix
```typescript
// ❌ WRONG - Side effect during render
export function Dashboard() {
  const stats = getDashboardStats();  // Side effect - called every render
  console.log("Stats loaded:", stats);  // Side effect - logged every render
  
  return <div>{stats.total}</div>;
}

// ✅ CORRECT - Use useEffect for side effects
import { useEffect, useState } from 'react';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    getDashboardStats().then(setStats);
    console.log("Stats loaded");
  }, []);
  
  return <div>{stats?.total}</div>;
}
```

---

## PRIORITY 6: `@next/next/no-img-element` (29 errors) - MEDIUM

### Issue
Using HTML `<img>` element instead of Next.js `<Image>` component.

### Files Affected
- Multiple component files using `<img>` tag
- Visit detail views with visitor/vehicle photos
- Settings/avatar images

### Example Fix
```typescript
// ❌ WRONG
<img 
  src={visit.signatureData} 
  alt="Signature du visiteur"
  className="w-full h-auto max-h-[150px] object-contain"
/>

// ✅ CORRECT
import Image from "next/image";

<Image
  src={visit.signatureData}
  alt="Signature du visiteur"
  width={400}
  height={150}
  className="w-full h-auto max-h-[150px] object-contain"
/>

// For dynamic URLs, you may need to configure next.config.ts:
// images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] }
```

---

## Implementation Strategy

### Phase 1: Critical (1-2 hours)
1. **Fix react-hooks/rules-of-hooks** (35 errors)
   - Move guards to parent components
   - Validate all form files
   - Update parent layout/page files

2. **Fix react/no-unescaped-entities** (87 errors)
   - Systematic find/replace in all TSX files
   - Search for patterns: `'` in JSX strings
   - Replace with `&apos;`

### Phase 2: Medium (2-3 hours)
3. **Fix @typescript-eslint/no-explicit-any** (166 errors)
   - Create type definitions file
   - Update function signatures
   - Focus on: tenant-data.ts, page.tsx files, db-retry.ts

4. **Fix @next/next/no-img-element** (29 errors)
   - Replace `<img>` with `<Image>`
   - Update imports
   - Configure next.config.ts if needed

### Phase 3: Low Priority (1-2 hours)
5. **Fix @typescript-eslint/no-unused-vars** (111 errors)
   - Remove unused imports systematically
   - ESLint --fix can handle many of these

6. **Fix react-hooks/purity** (29 errors)
   - Move console.log to useEffect
   - Extract calculations to separate functions
   - Add useEffect where needed

---

## Automated Fixes Available

### ESLint Auto-Fix (handles ~30-40% of errors)
```bash
npx eslint . --fix
```

This will automatically fix:
- Most `@typescript-eslint/no-unused-vars` (import removals)
- Some formatting issues
- Some entity escaping

### Manual Fixes Required

For errors that need semantic understanding:
- Hook location validation
- Type annotations
- React Hook dependencies
- Component structure changes

---

## Testing After Fixes

```bash
# Full TypeScript check
npx tsc --noEmit

# ESLint check
npx eslint . --ext .ts,.tsx

# Next.js build
npm run build

# Dev server
npm run dev
```

---

## Files to Update (Detailed List)

### Hook Violations (createDepartment.form.tsx pattern)
- [ ] features/tenants/forms/createDepartment.form.tsx (Line 30)
- [ ] features/tenants/forms/createVisitor.form.tsx
- [ ] features/tenants/forms/createHost.form.tsx
- [ ] features/tenants/forms/createTenant.form.tsx

### Unescaped Entities (87 instances)
- [ ] app/(public)/page.tsx (Line 40)
- [ ] app/tenants/[slug]/page.tsx (Line 115)
- [ ] All feature component files
- [ ] All modal/dialog files

### Type Fixes
- [ ] features/tenants/queries/tenant-data.ts (19 instances)
- [ ] app/tenants/[slug]/page.tsx (Line 50)
- [ ] lib/db-retry.ts (Lines 9, 14)
- [ ] scripts/migrate-tenants.ts (Lines 25, 32)

### Unused Imports
- [ ] features/tenants/queries/tenant-data.ts (Line 5)
- [ ] app/(public)/page.tsx (Lines 6-15)
- [ ] All form files

### Image Component
- [ ] All files using `<img>` tags
- [ ] Visit detail pages
- [ ] Settings pages

---

## Notes
- ESLint fix will help but won't solve everything
- Manual review needed for hook violations (logic change required)
- Type definitions should be centralized in `types/` folder
- Test thoroughly after changes to ensure no runtime errors
