# Incident Record — Neon HTTP `fetch failed` on tenant lookup

**Date**: 2026-08-24
**Area**: Master DB (`db/master`), Drizzle neon-http driver, Next.js App Router
**Severity**: Intermittent render failures on `/tenants/[slug]` routes
**Status**: Resolved

---

## Symptom

Next.js dev overlay showed a **Console Error** (not a crash) when rendering
`TenantRootLayout` (`app/tenants/[slug]/layout.tsx`):

```
Error Type: Console Error
Failed query: select "name", "slug", "owner_id" from "tenants" where "tenants"."slug" = $1 limit $2
params: mininfra,1

    at NeonHttpPreparedQuery.queryWithCache (.../drizzle-orm/src/pg-core/session.ts:73:11)
    at <anonymous> (features/tenants/queries/tenant-data.ts:1683)
    at withRetry (lib/db-retry.ts:13)
    at getPublicTenantBySlug (features/tenants/queries/tenant-data.ts:1682)
```

The query text itself was valid; the table and row existed.

## Root Cause (two stacked problems)

### 1. Broken IPv6 route to Neon (network level)

- Neon endpoints publish **both A (IPv4) and AAAA (IPv6)** records.
- This machine has **no working IPv6 route** — raw TCP test to an AAAA address
  returned `ENETUNREACH`, while IPv4 connected fine (~230ms).
- When Node's `fetch` resolved/picked an AAAA address, the request died with
  `TypeError: fetch failed`, wrapped by Neon as:
  `Error connecting to database: TypeError: fetch failed`.
- Failures were intermittent because DNS ordering / Happy-Eyeballs fallback
  sometimes landed on IPv4 successfully.

### 2. `withRetry` never matched Drizzle-wrapped errors (app level)

Drizzle wraps driver errors in `DrizzleQueryError`. The original cause lives on:

```
error.cause.sourceError        // e.g. TypeError: fetch failed
error.cause.sourceError.cause.code  // e.g. ENETUNREACH
```

The old check only inspected the top-level message
(`error.message.includes("fetch failed")`), which contains only
`"Failed query: select ..."`. Result: transient network errors were **never retried**
despite the retry wrapper being present.

## Diagnosis Steps (for reproduction)

```bash
# 1. Raw driver works? → rules out bad credentials/table
node -e "require('dotenv').config(); const {neon}=require('@neondatabase/serverless');
neon(process.env.DATABASE_URL)\`select 1\`.then(()=>console.log('ok'),e=>console.log(e.message))"

# 2. Same query via drizzle neon-http → reproduces 'Failed query ... fetch failed'

# 3. Unwrap the real cause from DrizzleQueryError:
#    e.cause.message -> 'Error connecting to database: TypeError: fetch failed'
#    e.cause.sourceError.cause.code -> 'ENETUNREACH'

# 4. Check DNS families returned by the resolver:
getent ahostsv4 ep-xxxx-pooler.c-2.eu-west-2.aws.neon.tech   # A records exist
getent ahostsv6 ep-xxxx-pooler.c-2.eu-west-2.aws.neon.tech   # AAAA records exist

# 5. Test reachability per family (IPv6 fails here):
node -e "const net=require('net'); const s=net.connect({host:'<aaaa-addr>',port:443,family:6});
s.on('connect',()=>{console.log('v6 ok');s.destroy()}); s.on('error',e=>console.log('v6 err:',e.code))"
```

## Fixes Applied

| File | Change |
|---|---|
| `instrumentation.ts` *(new)* | On server boot (nodejs runtime), set `dns.setDefaultResultOrder("ipv4first")` so Node prefers the reachable IPv4 path when both record types resolve. |
| `lib/db-retry.ts` | Walks the full `cause` / `sourceError` chain collecting messages + codes; retries on transient patterns (`fetch failed`, timeout, `ECONNRESET`, `ENETUNREACH`, `EAI_AGAIN`, …). Non-transient SQL errors fail fast (1 attempt). Exponential backoff preserved. |
| `db/master/index.ts` | Installs a small retrying `neonConfig.fetchFunction` (3 attempts, exponential backoff) as defense-in-depth for every master-DB HTTP call, including paths not wrapped in `withRetry`. |

## Verification Performed

- Simulated a Drizzle-wrapped `ENETUNREACH`/`fetch failed`: retried 3x then threw;
  recovered when failure stopped after 2 attempts.
- Simulated non-transient error (`relation does not exist`): failed fast, no retry.
- 8/8 app-path queries through `master_db` succeeded post-fix.
- `tsc --noEmit` and ESLint clean.

## Lessons / Conventions Going Forward

1. **Always unwrap before classifying**: any retry/error-classification helper must
   traverse `error.cause` chains — Drizzle, Neon, and undici all nest causes.
2. **"Failed query" console errors are usually not SQL problems.** Reproduce outside
   Next.js first (plain node script) to separate DB issues from app/framework issues.
3. If this recurs from other networks (CI, kiosk servers), suspect IPv6 reachability
   first; the `instrumentation.ts` guard covers local dev, but hosts with broken
   IPv6 need the same ipv4first treatment at the OS/container level.

## Related Files

- `features/tenants/queries/tenant-data.ts` — `getPublicTenantBySlug` (catches and logs, returns null)
- `app/tenants/[slug]/layout.tsx` — render call site
- `db/tenants/index.ts` — tenant DB resolution (also benefits from fixed retry)
