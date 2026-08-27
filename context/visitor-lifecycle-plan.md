# Visitor Lifecycle & Host Portal — Master Implementation Plan (APPROVED)

> **Status:** APPROVED — 2026-08-27 · **Phase 1 (Domain Foundation) + Phase 2 (Operator Mobile workflow) implemented** (schema deltas + migration `0022_*` + lifecycle server fns + API routes + kiosk waiting/expected/group operator screens; `tsc`/lint/build green). **Phase 2 complete — now implementing Phase 3 (Host Portal, web).**
> **Canonical source of truth for the Visitor Request → Approval → Check-in → Check-out → Completion workstream.**
> **REVIEW THIS FILE BEFORE ANY IMPLEMENTATION.** This is the agreed plan. Do not deviate without updating it.
> Companion doc (earlier draft/inventory): `docs/plans/2026-08-27-visitor-lifecycle-host-portal.md`
> Scope guardrails: `AGENTS.md`, `context/ai-workflow-rules.md`, `context/ARCHITECTURE.md`.

---

## 1. Core conclusions from the audit

- **This is a pure implementation gap over an existing data model.** The v2 branch schema already
  contains every entity needed: `visits` (approval/postponement/cancellation fields + `groupName`,
  `organization`, `participantCount`, `arrivalAt`, `visitType`, and the full `visit_status` enum
  `IN|OUT|CANCELLED|SCHEDULED|PENDING_APPROVAL|APPROVED|POSTPONED|REJECTED`), `visitParticipants`,
  `visitStatusHistory`, `notifications`, `auditLogs`, `settings.requireHostApproval` +
  `waitingWarningMinutes` + `waitingCriticalMinutes`, and roles incl. `HOST`.
- **Do NOT rebuild the MVP.** Preserve working check-in/check-out, search, visitor cards, dashboard,
  host/department/service management.
- **Multi-tenant isolation is already strong:** each tenant is a **separate Postgres database**
  (per-tenant `db_url`). Tenant context is always resolved **server-side** from the session/slug,
  never from client input. Cross-tenant reads are impossible at the DB level. We only add
  **role-scoping + host-ownership** checks.
- The visit's unique technical ID is the existing `visits.visitNumber` (`VIS-YYYYMMDD-NNNN`).
  The requirement's `SV-…` example is illustrative — expose `visitNumber` as the Visit ID; do NOT
  force a `SV-` format change.

## 2. Domain model mapping (reuse existing schema)

| Concept | Existing model |
|---|---|
| Visitor (person) | `visitors` |
| Visit (event) | `visits` (`visitNumber` = unique technical ID) |
| Participant (attendance in a visit) | `visitParticipants` (`visitId`, `visitorId`, `status`) |
| Visit type | `visits.visitType` (`WALK_IN|PRE_REGISTERED|GROUP`) |
| Purpose/type-of-audience (AUDIENCE/MEETING/…) | `visits.purpose` (free text) — do NOT add taxonomy |
| Group name / organization | `visits.groupName` / `visits.organization` |
| Host | `hosts` + `users.hostId` (HOST role login) |
| Operator | `users` role `SECURITY` / `RECEPTION` |
| Approval status | `visits.status` + explicit `approvedBy/At`, `rejectedBy/At`+reason, `postponedBy/At`+reason+`newProposedDate`, `canceledBy/At`+reason |
| Attendance status | `visitParticipants.status` (add `EXPECTED`) |
| Audit | `visitStatusHistory` (workflow trail) + `auditLogs` (actor log) |
| Notifications | `notifications` |

## 3. State machine

### Approval/workflow status (`visits.status`) — STORED
```
operator create (walk-in/group) ─▶ PENDING_APPROVAL ──(requireHostApproval=0 / host pre-register)─▶ APPROVED
                                            │
              ┌──────────────────────────────┼─────────────────┐
              ▼             ▼                ▼                 ▼
          APPROVED       REJECTED        POSTPONED          CANCELLED
              │           (terminal)      (new date,         (terminal)
              │                           reuse history)
              └─ check-in ─▶ IN ─▶ OUT (completion)
```
Transitions (enforced server-side):
- **OPERATOR** (SECURITY/RECEPTION/ADMIN): create request; check-in only if `APPROVED`
  (unless `requireHostApproval=0` bypass); check-out; cancel.
- **HOST** (own visit, `users.hostId == visits.hostId`): PENDING_APPROVAL/POSTPONED → APPROVED | REJECTED (reason) | POSTPONED (new date). ADMIN may also act.
- Blocked: no check-in on REJECTED/CANCELLED/NO_SHOW; no check-in on unapproved visit.

### Attendance status (`visitParticipants.status`) — STORED
```
EXPECTED ─(arrived,wanting entry)─▶ WAITING ─(operator check-in)─▶ CHECKED_IN ─(operator check-out)─▶ CHECKED_OUT
   │                                                                  ▲
   └─(never arrived)─▶ NO_SHOW                                        (CANCELED allowed per member)
```
- `EXPECTED` = approved/pre-registered but not yet arrived (NEW enum value to add).
- `WAITING` = arrived, request pending approval OR approved-but-not-checked-in.

### Derived
- **Currently inside = participants with CHECKED_IN.** Individual visit = `visits.status IN`.
  Waiting/pending/approved-not-checked-in are NOT "inside" (requirement sec. 2).
- **Waiting duration** = now − `arrivalAt` (fallback `checkInAt`/`createdAt`).
- **Escalation** = from `settings.waitingWarningMinutes`/`waitingCriticalMinutes` → normal|warning|critical+.

## 4. Database changes (all additive, ONE new migration `0022_*`, generate for review — do not auto-apply)

| Target | Change |
|---|---|
| `participant_status` enum | ADD value `EXPECTED` |
| `visit_status_history` | ADD FK `visit_id → visits(id)` + index `(visit_id, created_at)` |
| `notifications` | ADD FK `visit_id → visits(id)`, index `(recipient_id, is_read, created_at)`, ADD `readAt` timestamp |
| `visit_participants` | ADD index `(visit_id)` + unique `(visit_id, visitor_id)` |
| NEW optional enum | `notification_type` (VISIT_REQUEST_CREATED, VISIT_APPROVED, VISIT_REJECTED, VISIT_POSTPONED, VISIT_CANCELLED, VISITOR_CHECKED_IN, VISITOR_CHECKED_OUT, VISITOR_NO_SHOW) |

No new tables. Apply identically to every tenant DB via `db/tenants/migrations` pipeline.

## 5. Server operations (define in `features/tenants/queries/tenant-data.ts` + new lifecycle module; all in a transaction, tenant-scoped, role+host-authorized, write `visitStatusHistory` + `auditLogs` + `notifications`)

- `createVisitRequest()` / `createGroupVisit()` (SECURITY/RECEPTION/ADMIN/HOST) → PENDING_APPROVAL (or APPROVED if host/bypass), `arrivalAt`, participants, `VISIT_REQUEST_CREATED`
- `addVisitParticipant()`, `setParticipantStatus()` (per-member CHECKED_IN/OUT/NO_SHOW/CANCELED)
- `approveVisit()` / `rejectVisit()` / `postponeVisit()` / `cancelVisit()` (HOST own / ADMIN) → status + audit + notification
- `checkInParticipant()` / `checkOutParticipant()` (SECURITY/RECEPTION/ADMIN) — gate on APPROVED; visit IN when any inside; OUT when none remain; notifications
- Queries: `getPendingVisitRequests`, `getExpectedVisits`, `getWaitingVisits` (escalation), `getCurrentlyInside`, `getVisitDetail` (incl. participants + history)
- Notifications: `createNotificationInternal`, `getMyNotifications`, `markNotificationRead`

### New route handlers
`/api/tenants/[slug]/visits` (POST/GET), `…/[id]` (GET), `…/[id]/approve|reject|postpone|cancel|checkin|checkout`, `…/[id]/participants` (POST), `…/participants/[participantId]` (PATCH), `…/visits/waiting|expected|inside` (GET), `/…/notifications` (GET), `…/notifications/[id]/read` (POST). Extend kiosk `public/visits` resource for operator (device-token auth) to accept `visitType` + `participants`.

### Authorization helper
`assertHostOwnsVisit(tenantSlug, visitId)` — enforces `users.hostId == visits.hostId` for HOST mutations (in `features/tenants/server/authorization.ts`).

## 6. Mobile (operator kiosk) — extend, don't redesign
- Check-in: support individual + group paths; lookup by Visit ID / group name / organization / host; don't force re-selecting "group" when already in an expected group visit.
- Dashboard (`(tabs)/index.tsx`): add Waiting-for-approval, Expected, Currently inside (CHECKED_IN only), Completed sections + badges.
- New screens: waiting/approval list, group check-in (partial — check-in all arrived / selected), participant-aware check-out.
- Keep device-token auth + offline queue.
- Files: `mobile-app/src/types/api.ts`, `mobile-app/src/hooks/usePublicData.ts`/`useVisits.ts`, `mobile-app/app/(kiosk)/*`.

## 7. Web — host portal (PWA, role HOST) + admin compatibility
- New `app/tenants/[slug]/(app)/hote/visits/*`: Dashboard, Pending requests (Approve/Postpone/Reject + reason), Upcoming visits, Currently visiting, History, Notifications, Profile, host pre-registration. Sidebar link under Hôte in `AppLayoutContent.tsx`. Role-gated HOST/ADMIN.
- Admin `visiteurs/list` + `[id]`: status filters / approvals view, check-in gated on APPROVED, audit timeline + participants; `visiteurs/registered/[id]`: participant list; waiting banner + notifications bell.

## 8. Implementation phases (backend-first, incremental, verify per phase, await approval between phases)

1. **PHASE 1 — Domain Foundation:** schema deltas + migration `0022_*`; `EXPECTED` enum; lifecycle server fns + state machine + `assertHostOwnsVisit`; lifecycle/query routes; tests (transitions, tenant scoping, host-ownership).
2. **PHASE 2 — Operator Workflow (mobile):** public API extensions; mobile request/group/waiting/expected/inside/partial-group-check-in. Preserve existing flows.
3. **PHASE 3 — Host Portal (web):** HOST role UI (dashboard, pending, approve/reject/postpone, upcoming, visiting, history, pre-registration).
4. **PHASE 4 — Notifications:** emit events from lifecycle mutations; list/read API + bell UI (in-app transport only).
5. **PHASE 5 — Advanced (defer):** QR (references Visit ID), badges, native host app, reporting/analytics, extra channels.

Per phase: tests → `tsc --noEmit` → `next build`/lint → report changes/issues/acceptance → **await approval before next phase.**

## 9. Acceptance criteria (must pass)
1. **Walk-in individual:** request → lobby (not inside) → approve → see approval → check-in → inside → check-out → complete.
2. **Rejected:** cannot check in; stays in history.
3. **Postponed:** new date recorded; original history preserved; check-in blocked unless valid under new schedule.
4. **Pre-registered:** host creates+approves → operator sees Expected → verify → check-in → check-out.
5. **Group:** 5 approved, 3 arrive → check-in 3 (all/selected) → states preserved (CHECKED_IN/EXPECTED/NO_SHOW) → 1 checks out, 2 remain inside; each individual state correct.
6. **Multi-tenant security:** Tenant A cannot read B (separate DBs); Host A cannot approve/short-circuit Host B's visit; operator cannot admin actions.

## 10. Risks / assumptions
- Visit ID = existing `visitNumber`; `SV-…` is illustrative.
- Visit type = `visits.visitType`; purpose taxonomy avoided (don't over-engineer).
- Notifications MVP = in-app table only (no email infra).
- `requireHostApproval` default 1; check-in gate enforced server-side.
- Adding `EXPECTED` + check-in gate changes operator behavior → mitigated by `requireHostApproval=0` bypass and not altering existing walk-in flow until Phase 2 review.
- If implementation touches tenant isolation, auth flows, partitioning, or security boundaries → pause and escalate per AGENTS.md.

## 11. Definition of done (per phase)
- Full lifecycle works end-to-end on a real tenant.
- Every status transition audited (`visitStatusHistory` + `auditLogs`).
- Group visits track per-member accountability.
- Host portal can approve/reject/postpone; operator checks in approved visits only.
- Notifications created per event and readable/readable in-app.
- Waiting visitors surface escalation levels.
- Migration SQL generated and reviewed (not silently applied).
