# Visitor Lifecycle & Host Portal — Implementation Plan

> **Status:** PLAN (for review — no feature code written yet)
> **Date:** 2026-08-27
> **Owner:** SecureVisit (VMS SaaS, Next.js root app)

---

## 1. Why this plan exists

The current product (`FEATURE_GUIDE.md`) and the 6-phase tracker (`KIOSK_PROGRESS_TRACKER.md`)
only cover the **kiosk device + admin dashboard**. The following workflow is **not spec'd
anywhere and not implemented**:

> **Visitor Request → Host Approval → Reception Check-in → Visit → Check-out**

It must also support: *individual, group/delegation, pre-registered, and walk-in visits;
host/cabinet approval; postponement; cancellation/rejection; waiting visitors; individual
accountability inside group visits; operator workflow; host portal/PWA; notifications;
audit trail.*

This plan defines how to add that workstream as a tracked phase and implement it **backend-first**,
so every feature has an API contract, is verifiable, and the UI can be layered on.

---

## 2. What already exists (inventory)

| Capability | State |
|---|---|
| Check-in → check-out (walk-in, individual) | ✅ Implemented (public API + kiosk screens) |
| Pre-registered / scheduled visit creation | 🟡 Partial — `createScheduledVisit`, `checkInScheduledVisit`, `getScheduledVisits` exist; **no UI flow** |
| Multi-step check-in (vehicle, photo, signature) | ✅ Implemented (mobile Phase 3) |
| Host / department / service management UI | ✅ Implemented (`app/tenants/[slug]/hote/*`) |
| `visitStatusHistory` audit-trail table | 🔴 Schema only — nothing writes/reads it |
| `auditLogs` table | 🟢 Written only for `SEND_COMMAND`; no UI |
| Approval fields (`approvedBy/At`, `rejectedBy/At`, etc. + `PENDING_APPROVAL/APPROVED/REJECTED` enum) | 🔴 Schema only |
| Postponement fields (`postponedBy/At`, `postponeReason`, `newProposedDate`) | 🔴 Schema only |
| Cancellation fields (`canceledBy/At`, `cancelReason`, `CANCELLED`) | 🔴 Schema only |
| `notifications` table | 🔴 Schema only — no create/list API, nothing emits |
| `visitParticipants` (group accountability) + `groupName`/`organization`/`participantCount` | 🔴 Schema only — **zero references** in app/API |
| Waiting visitors (`waitingWarningMinutes`/`waitingCriticalMinutes`) | 🔴 Settings columns only — no screen/logic |
| Host portal / PWA | ❌ Does not exist |
| Operator workflow (reception oversight) | 🟡 Only reception check-in; no explicit operator console |

**Conclusion:** The schema already anticipates the full workflow (columns + enums exist), but
the **backend logic, API routes, notifications, and UI are missing**. This is a pure
implementation gap over an existing data model.

---

## 3. Target end-to-end flow

```
Visitor submits request      (kiosk walk-in OR portal pre-registration OR group registration)
        │
Host receives notification   (email + in-app via `notifications` table)
        │
Host approves / rejects / postpones   (host portal/PWA, role = HOST)
        │
[approved] → Reception check-in      (operator reads approval status, confirms identity)
        │
Visit (IN)  ── optional group members with individual accountability (visitParticipants)
        │
Check-out (OUT)  ── or cancel / no-show
        │
Everything recorded in visitStatusHistory (audit trail) + auditLogs (admin actor log)
```

Status machine (from `visitStatusEnum`):
`SCHEDULED / PENDING_APPROVAL → APPROVED → IN → OUT`, with `POSTPONED`, `REJECTED`, `CANCELLED` terminals/branches.

---

## 4. Schema changes (delta over current `db/tenants/schema.ts`)

Most columns exist. The needed deltas are minimal:

1. **`visitStatusHistory`** — add FK to `visits` (`visit_id` → `visits.id`, `onDelete: cascade`)
   and an index on `(visit_id, created_at)`. (Currently plain uuid, no FK/index.)
2. **`notifications`** — add FK to `visits` (`visit_id`) and index on `(recipient_id, is_read, created_at)`.
   Add `readAt` timestamp (for "mark as read").
3. **`visitParticipants`** — add FK + index on `(visit_id)`; add `createdByRole` / `checkedInAt` are present.
4. **New enum for notifications** (optional): `notification_type` (`HOST_APPROVAL_REQUEST`, `HOST_APPROVED`,
   `HOST_REJECTED`, `VISIT_POSTPONED`, `VISIT_CANCELLED`, `WAITING_WARNING`, `REMINDER`).
5. No new tables required unless we add a `waiting_visitors` queue; prefer deriving the waiting
   list from `visits` where `status IN (PENDING_APPROVAL, APPROVED)` + `checkInAt` arrival time.

**Migration:** generate a new Drizzle migration (e.g. `0022_*`) — do NOT auto-apply; review first.

---

## 5. Backend API contracts (new)

All tenant-scoped endpoints use the existing `requireRole(tenantSlug, allowedRoles)` / admin
pattern. No device token. Auth = Clerk session + tenant `users` row role.

### 5.1 Visit lifecycle (operator/admin + host portal)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| `POST` | `/api/tenants/[slug]/visits` | ADMIN, SECURITY, RECEPTION, HOST | Create visit: individual / pre-registered / group (with participants). Sets status `SCHEDULED` or `PENDING_APPROVAL` |
| `POST` | `/api/tenants/[slug]/visits/[id]/approve` | HOST (own), ADMIN | Approve; sets `approvedBy/At`, status `APPROVED`; creates notification |
| `POST` | `/api/tenants/[slug]/visits/[id]/reject` | HOST (own), ADMIN | Reject with `rejectionReason`; status `REJECTED`; notification |
| `POST` | `/api/tenants/[slug]/visits/[id]/postpone` | HOST, ADMIN | Postpone; sets `newProposedDate`, `postponeReason`, status `POSTPONED`; notification |
| `POST` | `/api/tenants/[slug]/visits/[id]/cancel` | ADMIN, SECURITY, RECEPTION, HOST | Cancel; `cancelReason`; status `CANCELLED`; notification |
| `POST` | `/api/tenants/[slug]/visits/[id]/checkin` | SECURITY, RECEPTION, ADMIN | Operator check-in of an approved visit; status `IN`; records participant check-ins |
| `POST` | `/api/tenants/[slug]/visits/[id]/checkout` | SECURITY, RECEPTION, ADMIN | Check-out; status `OUT`; duration |

Every transition inserts a `visitStatusHistory` row **and** an `auditLogs` row (actor, action, from/to).

### 5.2 Group visits (individual accountability)

- `POST /api/tenants/[slug]/visits` with `groupName`, `organization`, `participantCount`,
  and `participants: [{ visitorId, notes }]` → inserts `visitParticipants`.
- `POST /api/tenants/[slug]/visits/[id]/participants` — add members to an existing group visit.
- `PATCH /api/tenants/[slug]/visits/[id]/participants/[participantId]` — mark individual
  `CHECKED_IN`/`CHECKED_OUT`/`NO_SHOW`/`CANCELED` → per-member accountability.
- `GET /api/tenants/[slug]/visits/[id]` — returns parent visit + participants with per-member status.

### 5.3 Waiting visitors

- `GET /api/tenants/[slug]/visits/waiting` — guests whose host hasn't accepted or who are past
  `waitingWarningMinutes`/`waitingCriticalMinutes` since arrival/request. Returns escalation level
  (`normal | warning | critical`).

### 5.4 Notifications

- `GET /api/tenants/[slug]/notifications` — current user's notifications (role-scoped).
- `POST /api/tenants/[slug]/notifications/[id]/read` — mark read.
- Notification **creation** is internal (not a public route): emitted by the lifecycle mutations above.

### 5.5 Public (kiosk) additions

- Extend `POST /api/tenants/[slug]/public/visits` to accept `visitType = PRE_REGISTERED`/`GROUP`
  and optional `participants`, routing through the same `createVisitInternal`.

---

## 6. UI / portal

### 6.1 Host portal (PWA)
- New `app/tenants/[slug]/hote/visits` section (extends existing `hote/*`):
  - **Approval inbox** — pending visits assigned to me: Approve / Reject (reason) / Postpone (date).
  - **My visits** — scheduled/approved/history with status badges.
  - Add it to the tenant sidebar (`AppLayoutContent.tsx`) under the **Hôte** category.
- Mobile-friendly (responsive) to function as a PWA; `manifest.webmanifest` already exists.

### 6.2 Operator / reception console
- In `app/tenants/[slug]/visiteurs/list`, add status filtering and an **Approvals** quick view
  (PENDING_APPROVAL / APPROVED / REJECTED / POSTPONED) with check-in action gated on `APPROVED`.
- Waiting-visitor banner using escalation level from `GET .../visits/waiting`.

### 6.3 Audit trail & notifications UI
- `visitStatusHistory` per-visit timeline panel on the visit-detail screen.
- Notifications bell in the app header; list + mark-read.

---

## 7. Implementation order (backend-first, incremental)

**Phase 7A — Lifecycle core (backend)**
1. Schema deltas + migration (FKs, indexes, `readAt`, notification enum).
2. `createVisitInternal` extended for pre-registered + group + participants; status routing.
3. New lifecycle query fns in `tenant-data.ts`: `approveVisit`, `rejectVisit`, `postponeVisit`,
   `cancelVisit`, `operatorCheckInVisit` — each writes `visitStatusHistory` + `auditLogs` + `notifications`.
4. Wait-list query (`getWaitingVisits`) with escalation levels.
5. New route handlers (5.1–5.4 contracts). Auth via `requireRole`.

**Phase 7B — Notifications**
6. Notification create/list/read service + emit calls wired into lifecycle mutations.
7. `GET/POST .../notifications` routes.

**Phase 7C — Group accountability**
8. Participant add/update/status route handlers.
9. Per-member check-in/out/no-show logic in check-in/check-out flow.

**Phase 7D — Host portal UI**
10. `hote/visits` approval inbox + my-visits; Approve/Reject/Postpone UI.
11. Sidebar link + role-gating.

**Phase 7E — Operator & waiting UI + audit**
12. Visit-list status filters + approvals view + check-in gating.
13. Waiting banner; visit-detail audit timeline; notifications bell.

**Phase 7F — Verification**
14. `tsc --noEmit`, lint, `next build`; migration generated for review; manual E2E of the full
    flow on a tenant (request → approve → check-in → group → check-out → audit trail).

---

## 8. Risks / decisions to confirm

- **Role semantics:** The `HOST` role exists in the tenant `users` table but there is currently
  **no host-facing UI or approval gate**. Approving "own" visits is keyed on `hostId == user host id`.
- **Enforcement:** Should a `RECEPTION`/`SECURITY` user **be blocked** from checking in a visit
  that isn't `APPROVED`? Recommended: yes for hosts, configurable for operators via setting.
- **Waiting calculation:** define escalation thresholds from `waitingWarningMinutes`/`waitingCriticalMinutes`.
- **Notifications transport:** MVP = in-app `notifications` table; email/SMS is a later addition
  (no email infra currently confirmed).
- **Pre-registration entry point:** kiosk, host portal, or both. Recommend both initially.

---

## 9. Files touched (indicative)

- `db/tenants/schema.ts`, new migration under `db/tenants/migrations/`
- `features/tenants/queries/tenant-data.ts` (+ lifecycle + waiting + notification fns)
- `features/tenants/server/authorization.ts` (host-owns-visit check helper)
- New route handlers under `app/api/tenants/[slug]/visits/...` and `.../notifications`
- `app/tenants/[slug]/(app)/hote/visits/*` (new), `app/tenants/[slug]/(app)/visiteurs/list`
  and `.../[id]`, `AppLayoutContent.tsx` (nav + bell)
- `FEATURE_GUIDE.md`, `KIOSK_PROGRESS_TRACKER.md` (new Phase 7), `context/progress-tracker.md`

---

## 10. Definition of done

- Full lifecycle works end-to-end on a real tenant
- Every status transition is audited (`visitStatusHistory` + `auditLogs`)
- Group visits track per-member accountability
- Host portal can approve/reject/postpone; operator can check in approved visits only
- Notifications created on each lifecycle event and readable/readable in-app
- Waiting visitors surface escalation levels
- Migration SQL generated and reviewed (not silently applied)
