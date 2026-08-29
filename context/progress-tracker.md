Progress Tracker

Update this file after every meaningful implementation change.

## Active Projects

### 1. React Native Expo Kiosk App
**Status**: Phase 3 (Core Screens) Complete — All app screens built  
**Tracker**: [KIOSK_PROGRESS_TRACKER.md](../KIOSK_PROGRESS_TRACKER.md)  
**Summary**: Building React Native app for visitor check-in kiosks with QR-based pairing, offline-first architecture, hybrid WebSocket+REST communication, and TanStack Query caching.  
**Total Units**: 49 (organized into 6 phases)  
**Current Phase**: Phase 2 (Real-time Architecture) — COMPLETED (polling-only; Socket.IO intentionally deferred). Phases 0, 1, 3, 4 complete. Phase 5 (Admin) in progress.  
 **Recent Change**: 
- Unblocked Phase 2.4 + enriched Phase 5.4 — `deviceEvents` backend & activity feed. **Schema**: added `device_events` table + `device_event_type` enum (CHECK_IN/CHECKOUT/ERROR/SCREEN_CHANGE/COMMAND_APPLIED/COMMAND_FAILED/REBOOT/ONLINE/OFFLINE) + relations + indexes in `db/tenants/schema.ts`; Drizzle migration `db/tenants/migrations/0021_empty_blacklash.sql` generated (NOT applied). **Backend**: `POST /api/tenants/[slug]/public/events` (device-token auth) → `recordDeviceEvent`; `GET /api/admin/events` (admin auth) → `getDeviceEventsQuery`. **Mobile**: new `mobile-app/src/lib/device-events.ts` (`reportDeviceEvent`, best-effort) wired into command polling (`COMMAND_APPLIED` after ack, `COMMAND_FAILED` on per-command error, added `onReboot` handler) and the check-in/check-out mutations in `useTanStackQuery.ts` (`CHECK_IN`/`CHECKOUT`). **Feed UI**: `app/tenants/[slug]/(app)/logs/page.tsx` now renders device events (event type, severity, device, message, timestamp) with device + type filters, 10s polling; `useGetDeviceEvents` hook + `getDeviceEvents` client fn + `EVENT_TYPES`. Migration must be applied (`npx drizzle-kit migrate` per tenant) before the feed/client work. `tsc --noEmit` clean (web + mobile), eslint clean on new files, `next build` exit 0 (routes `/api/admin/events`, `/api/tenants/[slug]/public/events`, `/tenants/[slug]/logs`).
- Web SaaS — Phase 5 (Admin Dashboard): Completed Unit 5.4 — Activity Feed / Command Logs. Added `app/api/admin/logs/route.ts` (`GET`, admin-auth) returning recent device **command lifecycle** (join `commands`→`devices`, filters: `deviceId`, `status` [pending/acked/applied/failed], `limit`), and had `POST /api/admin/commands` now also write an `audit_logs` row (`SEND_COMMAND`). Added `getCommandLogs` client fn (`features/tenants/queries/tenant-data.ts`) + `useGetCommandLogs` hook (10s polling) in `useDeviceManagement.hook.ts`, a filterable table page at `app/tenants/[slug]/(app)/logs/page.tsx` (French labels, device + status filters, auto-refresh), and a "Journal d'activité" sidebar link under Dispositif in `AppLayoutContent.tsx`. Note: this is a command/audit activity feed; real-time per-screen device events (CHECK_IN/SCREEN_CHANGE) still require a `deviceEvents` backend (Phase 2.4 blocker). `tsc --noEmit` clean, eslint clean on new files, `next build` exit 0 (routes `/api/admin/logs` + `/tenants/[slug]/logs` compile).
- Web SaaS — Phase 5 (Admin Dashboard): Completed Unit 5.3 — Device Control Panel. Added `components/DeviceControlPanel.tsx` (send-command modal: command type selector for CONFIG_UPDATE / REBOOT / EMERGENCY_MESSAGE / CLEAR_CACHE / REFRESH_SETTINGS, priority picker, per-type payload input — message for EMERGENCY_MESSAGE, JSON for CONFIG_UPDATE). Added `useSendCommand` hook + `COMMAND_TYPES`/`COMMAND_PRIORITIES` in `features/tenants/hooks/useDeviceManagement.hook.ts`, and `sendDeviceCommand` client fn (`POST /api/admin/commands`) in `features/tenants/queries/tenant-data.ts`. Wired a Send (paper-plane) button into each device card in `app/tenants/[slug]/(app)/dispositif/page.tsx`. Commands are delivered to devices via the Phase 2 REST polling path (`GET /public/commands-queue`), NOT WebSocket. `tsc --noEmit` clean, eslint clean on new files, `next build` exit 0. Units 5.1 (admin login) and 5.2 (device status grid) already exist as infra (Clerk `app/admin` pages + the `dispositif` card grid); 5.4 (activity feed) remains blocked on the missing `deviceEvents` backend.
- Phase 2 (polling-only, no Socket.IO): Completed Unit 2.2 — Device Command Polling. Added `mobile-app/src/lib/command-polling.ts` (10s poller hitting `GET /public/commands-queue`, executes commands by type, ACKs each via `POST /public/commands/{id}/ack`), `mobile-app/src/hooks/useCommandPolling.ts` (lifecycle + emergency state), and `mobile-app/src/components/EmergencyBanner.tsx` (full-screen overlay for EMERGENCY_MESSAGE, auto-dismiss 30s). Mounted `CommandPollingLayer` in `app/_layout.tsx`. Handles EMERGENCY_MESSAGE / REFRESH_SETTINGS / CONFIG_UPDATE / REBOOT / CLEAR_CACHE. Units 2.1 (Socket.IO server) deferred and 2.5 (hybrid fallback) superseded; 2.4 (device events) blocked on missing `deviceEvents` backend.
- Completed Unit 1.13 — TanStack Query Hooks. Installed `@tanstack/react-query` (v5) in the mobile app and added a `ReactQueryProvider` (`src/lib/react-query-provider.tsx`) wrapping `RootContent` in `app/_layout.tsx`. Created `src/hooks/useTanStackQuery.ts` with query hooks (device settings, visitor search, on-site visitors, KPI, recent visits, hosts/departments/services/visitor-types/business-settings, visitor/visit detail, visit history) and mutations (create visit, checkout visit) that invalidate on-site/KPIs/recent-visits on success. `tsc --noEmit` clean, `expo lint` 0 errors, `expo export` bundles. Phase 1 (REST API) is now 100% complete.
- Fixed intermittent `DrizzleQueryError: Failed query ... fetch failed` on `getPublicTenantBySlug` (tenants master-DB lookup). Root cause: broken IPv6 route to Neon (ENETUNREACH on AAAA records) plus `withRetry` never matching Drizzle-wrapped causes. Fixes: ipv4first DNS order via new `instrumentation.ts`, cause-chain-aware retry classification in `lib/db-retry.ts`, and a retrying `neonConfig.fetchFunction` in `db/master/index.ts`. Full record: [docs/troubleshooting/2026-08-24-neon-http-fetch-failed-on-tenant-lookup.md](../docs/troubleshooting/2026-08-24-neon-http-fetch-failed-on-tenant-lookup.md).
- Added a generated padded `icon-safe.png` for the installed app icon, Android adaptive foreground, and native splash. The asset generator now preserves the full logo with `contain` instead of crop-prone `cover` resizing.
- Added a branded full-screen light-green splash to the kiosk dashboard. It hides the tab and status bars, remains visible until the KPI cards and Currently In data finish their initial load, then dismisses automatically; request errors reveal the existing retry states.
- Hardened tenant migration repair for kiosk pairing: migrations now ensure legacy tenant databases have `devices.device_id` and its unique index, propagate migration failures, and return safe pairing-route errors with server-side diagnostics.
- Replaced the Settings cards with link-style navigation rows to separate About, Admin, and Reports screens. Moved the SecureVisit logo, app name, and Mokengeli SARL credit to the bottom of Settings; preserved Admin actions and added the Reports under-construction screen.
- Reorganized the mobile kiosk Settings screen into About, Admin, and Reports groups. About includes app/device/connection information, Admin contains language, server URL, re-pair, and clear-data controls, Reports is marked under construction, and the SecureVisit/Mokengeli SARL branding was moved to the bottom.
- Mobile kiosk UI now defaults to French and routes visible dashboard, search, settings, pairing, check-in, checkout, vehicle, and visit-detail copy through paired English/French translation keys; localized date/status text and form validation messages are included.
- Improved the kiosk visitor KPI flow: the `visitor-kpis` endpoint now returns KPI counts only, counts today's visits by check-in, uses the shared mobile response type, removes the stale KPI endpoint hook, and exposes KPI loading/error retry states on the dashboard.
- Completed Unit 3.10 — Kiosk Dashboard Tab. Kiosk main menu now sits in a 3-tab layout (`Home / Dashboard / Settings`). New Dashboard tab shows live KPI cards (on-site, checked-in, checked-out, today's visits), a "Currently On Site" list, and "Recent Visits" feed with CHECK_IN/CHECK_OUT badges — auto-refreshes every 20s and on focus. Backed by new `useGetDashboard` (polling) and `useKioskHeartbeat` (2-min ping) hooks, `DashboardData`/`RecentActivity` types, EN/FR i18n keys, and the `GET /public/dashboard` API (shared `computeDashboardStats` with admin). Also shipped `device_id` column rename + unique-index migrations for pairing idempotency, and `@clerk/types` devDependency for pnpm strict resolution.
- Completed Unit 0.9 — Pairing Success Reflection. On successful pairing, the `justPaired` flag is set in KioskContext before navigating to `/(kiosk)`, avoiding the auth-layout redirect race. The main menu reads the flag and shows a "Pairing Successful" banner with tenant slug and Dismiss button. Main menu also enhanced with "Connected" badge and tenant slug in header/footer.
- Added 10-second cross-device polling to the kiosk home screen. KPIs and on-site visitor list now auto-refresh every 10s via silent background refetch (no loading spinner flicker), enabling cross-device visibility within ~10s. `useGetPublicOnSiteVisitors` and `useGetPublicVisitorKpis` hooks gained optional `pollIntervalMs` parameter. Cleaned up orphaned `useDashboard` hook.
- Completed Unit 0.10 — Pairing API Contract Fixes & UI Redesign. Fixed API mismatches (deviceId query param, response shapes, HTTP methods). Removed emoji icons from all buttons. Fixed WCAG AA color contrast. Unified to teal-only color scheme (dark teal for check-in, lighter teal for check-out).
- Completed Unit 3.4 — Vehicle Info Screen. Created VisitDraftContext for multi-step check-in flow. New visitor form now saves to draft and navigates to vehicle screen.
- Completed Unit 3.5 — Photo Capture Screen. Installed expo-camera, built full-screen camera modal with visitor/vehicle photo capture, preview, and retake.
- Completed Unit 3.7 — Check-in Review Screen. Summary of all collected data with final submit button.
- Completed Unit 3.9 — Settings Screen. Full device configuration panel with connection info, device info, server URL override, re-pair, and clear data. Added deviceId persistence to ApiContext.
- Completed Unit 3.6 — Signature Capture Screen. SVG-based signature pad with PanResponder touch tracking, capture to PNG via react-native-view-shot, skip option. Stored as signatureData in VisitDraft.
- **Phase 3 (Core App Screens) is now COMPLETED (100%).** All check-in flow screens: New/Existing Visitor → Vehicle → Photo → Signature → Review → Submit.  
- Completed Phase 4 (Offline Mode & Sync). Added offline queue with AsyncStorage persistence (`src/lib/offline-queue.ts`), sync engine with exponential backoff (`src/lib/sync-engine.ts`), NetworkContext for online detection via `@react-native-community/netinfo`, OfflineBanner component, and offline queue management screen (`app/(kiosk)/offline/index.tsx`). Check-in review and checkout screens now queue actions when offline or on network failure. Auto-sync triggers on reconnect. Dashboard shows pending actions badge linking to the offline screen.

### 2. SecureVisit Web SaaS
**Status**: Architecture Planning  

### 3. Visitor Lifecycle & Host Portal (v2 workstream)
**Status**: Phases 1–4 (Domain Foundation + Operator Mobile + Host Portal web + Notifications) — COMPLETE. Phase 5 (Advanced) deferred.
**Plan**: [context/visitor-lifecycle-plan.md](./visitor-lifecycle-plan.md) (mandatory read before implementation)
**Summary**: Controlled evolution of the MVP → request → approval → check-in → check-out workflow with
individual, group, pre-registered, walk-in visits; host portal/PWA; per-member accountability;
notifications; audit. Pure implementation gap over the existing v2 schema (`visits`, `visitParticipants`,
`visitStatusHistory`, `auditLogs`, `notifications` already exist). Five phases, backend-first, verify per
phase, await approval between phases.

**Recent Change — Phase 3 (Host Portal, web) complete**: Added `getHostPortalData`
(role-gated HOST/ADMIN/ROOT; HOST scoped to own `hostId`, admins see all; pending/upcoming/inside/history/
counts/notifications snapshot with 15s polling) and `createHostPreRegistration` (HOST auto-assigns itself,
ROOT/ADMIN pick `hostId`; resolves to APPROVED via `createVisitRequest`) in `visits-lifecycle.ts`. Widened
`tenant-data.ts`: `getVisits` status filter supports lifecycle statuses incl. arrays (`inArray`),
`getVisitById` now returns `participants{visitor}` + `statusHistory`, `authorizeUser`/`updateUserRole`
accept `"HOST"`. Auto-link `users.hostId` by email in `syncTenantUser.ts` (HOST role). New client hooks
`useHostPortal.hook.ts` (data + approve/reject/postpone/cancel/mark-read/pre-registration mutations;
operator reads `useGetWaitingVisits`/`useGetPendingApprovals`/`useGetCurrentlyInside`). UI: shared status
contract `HostStatusBadge` (all 8 visit + 6 participant statuses), `VisitDecisionModal` (reject/postpone/
cancel with reason), `HostVisitActions` (approve/reject/postpone/cancel), `NotificationsBell` (unread badge).
New pages under `(app)/hote/visits/*` with role-gated layout + subnav: dashboard (stat cards + previews),
`en-attente` (full decisions), `a-venir` (approved + participant badges), `sur-place` (participants +
walk-ins), `historique`, `pre-inscription` (host auto-link form), `notifications` (mark-read), `profil`.
Sidebar "Mes visites" link + header bell in `AppLayoutContent.tsx`. Admin `visiteurs`: `UserInviteForm`
gains HOST role; `TabbedVisitsList` gains "En attente" tab, waiting banner, full status badges; `VisitDetailsModal`
+ `visiteurs/list/[id]/page.tsx` show participants + audit status timeline + inline approve/reject/postpone.
Verified: `tsc --noEmit` clean, `npm run build` exit 0 (all 8 new hote/visits routes compile). Async issue
fixed (bell reads tolerate 403): portal HOST without linked `hosts` record sees a link banner on Profil.

**Recent Change — Phase 4 (Notifications) complete**: Closed the remaining notification gaps in
`features/tenants/queries/visits-lifecycle.ts` so every lifecycle mutation emits a notification:
(1) added a shared `notifyOperators(tx, …)` helper (SECURITY/RECEPTION/ADMIN/ROOT batch write) replacing the
repeated inline operator loops; (2) `addVisitParticipant` now notifies operators on new participant
(`VISIT_REQUEST_CREATED`); (3) `setParticipantStatus` now emits `VISITOR_NO_SHOW` (previously a dead enum
value) — single-participant check-in/check-out refactored onto the helper; (4) bulk group
`checkInVisitParticipants`/`checkOutVisitParticipants` now notify operators (`VISITOR_CHECKED_IN`/
`VISITOR_CHECKED_OUT`). Fixed the host-portal unread-count undercount: `counts.unreadNotifications` in
`getHostPortalData` now uses a SQL `COUNT(*)` (was filter over a `limit: 100` list fetch, which undercounted
past 100 notifications). List/read API (`GET /notifications`, `POST /notifications/[id]/read`), bell unread
badge, dashboard unread stat and notifications list page were already wired and remain intact. Verified:
`tsc --noEmit` clean, eslint clean on modified file, `next build` exit 0 (3 notification routes compile).

---

## Archive: SecureVisit SaaS Progress

Current Phase
Architecture & Foundation Planning
Current Goal
Define the production-ready architecture, development standards, and implementation workflow for SecureVisit VMS SaaS.
Completed
Defined multi-tenant SaaS architecture
Designed middleware and tenant resolution flow
Designed authentication and authorization flow
Defined upload and blob storage architecture
Defined frontend state management approach
Defined API route structure
Defined database-per-tenant strategy
Created foundational context/spec templates
In Progress
Adapting project documentation templates for SecureVisit
Preparing implementation-ready architecture documentation
Defining feature boundaries and conventions
Next Up
Setup initial Next.js application structure
Configure Clerk authentication
Implement middleware subdomain routing
Setup Neon master database
Setup Drizzle ORM and migrations
Build tenant provisioning flow
Open Questions
Should realtime updates use polling or WebSockets initially?
Will tenant databases use Neon branches or separate projects?
What RBAC granularity is required for MVP?
Should uploads use signed URLs from the beginning?
What audit retention policy is required?
Architecture Decisions
Database-per-tenant architecture selected for isolation and security
Subdomain-based tenant routing selected for SaaS UX
Clerk selected for authentication and session handling
React Query selected for server-state management
Vercel Blob selected for media uploads
Drizzle ORM selected for type-safe SQL access
Middleware owns tenant resolution responsibilities
Serverless-first architecture adopted for scalability
Session Notes
SecureVisit is designed as a production-grade visitor management SaaS
Tenant isolation is the highest-priority architectural concern
All requests must remain tenant-scoped
Context-driven development workflow established
Documentation-first implementation strategy adopted
## Phase 2 Mobile UI (operator workflow) — completed (online-only actions)
- Added `operator` i18n namespace (en/fr): waiting/expected/inside/completed sections, escalation badges, group check-in, participant checkout, awaiting-approval strings.
- New operator screens under `mobile-app/app/(kiosk)/operator/`:
  - `waiting.tsx` — waiting-for-approval list with escalation badges (normal/warning/critical), polling 10s.
  - `expected.tsx` — approved pre-registered/groups list, polling 10s.
  - `group/[id].tsx` — participant management: group check-in all/partial (multi-select), per-member check-out, pending gate.
- Dashboard (`(tabs)/index.tsx`): added Waiting + Expected compact panels with count badges, "view list" deep links, focus-refresh of operator data.
- Check-in review (`check-in/review/index.tsx`): approval-gate success state — when `createVisit` returns `requiresApproval`, show "Request submitted / waiting" screen instead of "checked in".
- Check-out (`check-out/index.tsx`): group visits route to the participant-aware group screen; individual checkout unchanged.
- Verification: `pnpm lint:ts` exit 0; `eslint` 0 errors on all changed mobile files (1 pre-existing warning in dashboard useMemo).
- Decision (user): offline queue/sync-engine NOT extended — operator actions are online-only; legacy individual check-in replay already routes through the approval gate server-side.

## Phase 2 bug fix (check-in approval gate)
- Fixed duplicate `createVisit` call in `mobile-app/app/(kiosk)/check-in/review/index.tsx` (a single call now). Root cause: an earlier edit left two calls — the first created the PENDING visit, the second tripped the dedup guard ("visiteur a déjà une demande"), breaking the flow and leaving the UI showing checked-in/error instead of the pending "Request submitted / waiting" screen.
- Verified: `lint:ts` exit 0, eslint 0 errors on review screen; exactly one `createVisit` call remains.
- walk-in -> lobby (PENDING) is a Phase 2 (kiosk) behavior and DOES NOT require Phase 3; only host approve/reject (PENDING->APPROVED/inside) requires Phase 3.

## Group visit form (mobile kiosk) + single/group chooser
- The "New Visitor" button on the search screen (`home/search.tsx`) now opens a new chooser screen `check-in/type.tsx` with two options: **Single Visitor** (routes to the existing `/(kiosk)/check-in` start flow unchanged) and **Group Visit** (routes to the new `/(kiosk)/check-in/group` form).
- New **group visit form** `check-in/group/index.tsx`: collects `groupName` (required), `organization`, optional host (via existing `select-host` picker, auto-fills department), department, purpose, plus a member list. Submit posts to the existing `createPublicVisitRequest` GROUP path: `POST /public/visits` with `visitType:'GROUP'`, `groupName`, `organization`, `participantCount`, `participants:[{visitorId}]` (first member as root `visitorId` + all members in `participants`; backend dedupes the primary). Success/approval semantics preserved (PENDING_APPROVAL when host-approval gate is on).
- New **add-member** flow `check-in/group/add-members.tsx`: toggle between **Existing Visitor** (search via `useSearchPublicVisitors`, tap to add) and **New Visitor** (inline first/last name, phone, company, visitor type → creates a visitor record, then adds it). Added a public device-token endpoint `createPublicVisitor` (`features/tenants/queries/tenant-data.ts`) + `POST .../public/visitors` case in the catch-all public route so brand-new members are registered as visitor records before being added to the group `participants` (this matches the backend requirement that every participant is an existing `visitorId`).
- New shared `GroupDraftContext` (`mobile-app/src/contexts/GroupDraftContext.tsx`, provider wired in `app/_layout.tsx`) holds `groupName`, `organization`, `hostId`/`departmentId`/`purpose` + `members: Visitor[]` and exposes `addMember`/`removeMember`/`updateDraft`/`resetDraft`, shared between the group form and the add-member screen.
- New `useCreatePublicVisitor` hook in `mobile-app/src/hooks/useVisits.ts` (POSTs to `.../public/visitors`). Added `checkInType` + `group` i18n namespaces (en/fr).
- Verified: mobile `tsc --noEmit` exit 0, eslint 0 errors on all new/edited files, `expo export` exit 0 (routes `/check-in/type`, `/check-in/group`, `/check-in/group/add-members` bundle), backend `tsc --noEmit` exit 0. (Pre-existing `no-explicit-any` errors in `tenant-data.ts`/public route and `generate-icons.js __dirname` remain baseline, unrelated to this change.)

## Polling optimization (mobile dashboard + host portal)
- Mobile dashboard: `useGetPublicOnSiteVisitors`, `useGetPublicVisitorKpis` (usePublicData.ts) and `useGetWaitingVisits`, `useGetExpectedVisits` (useVisits.ts) now skip state updates when the payload is deep-equal (`mobile-app/src/utils/deepEqual.ts`), so 10s polling no longer re-renders/replaces data every tick; silent polls no longer flip loading/error. `useGetPublicSettings` no longer toggles loading on every poll.
- Dashboard polling is now paused while the tab is not focused (`useIsFocused` from @react-navigation/native) — background tabs no longer fire 4 poll requests every 10s; focus still triggers a one-shot refetch via existing `useFocusEffect`.
- Host portal (web, react-query): `useHostPortalData` (15s) + `useGetWaitingVisits`/`useGetPendingApprovals`/`useGetCurrentlyInside` (30s) now use `refetchInterval` function form (`refetchIntervalWhenStale`) + `staleTime: 10000` — `refetchInterval` ignores `staleTime`, so without this it re-ran the queryFn every tick even right after a mutation invalidation. Mutations still invalidate portal queries immediately.
- Verified: root `tsc --noEmit` clean; mobile `pnpm exec tsc --noEmit` clean; eslint 0 errors on all changed files.

## Host tab screen (kiosk) — host list + host details
- The Host tab (`app/(kiosk)/(tabs)/host/`) is now a real screen instead of an empty placeholder. It was converted from a single `host.tsx` into a folder with a nested Stack layout (`_layout.tsx`), an `index.tsx` list, and a `[id].tsx` details screen (mirroring the `home/` tab structure).
- New backend public endpoint `getPublicHostSummary` (`features/tenants/queries/tenant-data.ts`) + `GET .../public/host-summary` case in the catch-all public route. It verifies the device token, returns each active host (with department) plus per-host aggregates for today: `totalToday` (all visits whose `visitDate` is today), `expected` (today's APPROVED), `waiting` (PENDING_APPROVAL). Counts are computed in one today-scoped visit query grouped in JS.
- New `HostSummary` type (`mobile-app/src/types/api.ts`, extends `Host` with the three counts) and `useGetPublicHostSummary` hook (`mobile-app/src/hooks/usePublicData.ts`) with a 60s in-memory cache and an exposed `refetch`.
- Host list (`index.tsx`): responsive grid — 2 columns on tablets (`useWindowDimensions` width >= 768), 1 column on phones. Each card shows host avatar/initials, name, department, and three count stats (today/expected/waiting); tapping navigates to the host details screen with `router.push`.
- Host details (`[id].tsx`): header with back link, host info card (avatar, name, department, email, phone, stats), plus the host's "waiting for approval" and "expected for today" visit lists — filtered by `hostId` from the existing `useGetWaitingVisits`/`useGetExpectedVisits` hooks.
- Added a `host` i18n namespace (en/fr) for titles, count labels, empty/error states, and section headings.
- Verified: mobile `tsc --noEmit` exit 0, eslint 0 errors on all new/edited files, `expo export` exit 0 (routes `/host`, `/host/[id]` bundle), backend `tsc --noEmit` exit 0.
