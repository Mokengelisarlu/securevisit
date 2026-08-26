Progress Tracker

Update this file after every meaningful implementation change.

## Active Projects

### 1. React Native Expo Kiosk App
**Status**: Phase 3 (Core Screens) Complete — All app screens built  
**Tracker**: [KIOSK_PROGRESS_TRACKER.md](../KIOSK_PROGRESS_TRACKER.md)  
**Summary**: Building React Native app for visitor check-in kiosks with QR-based pairing, offline-first architecture, hybrid WebSocket+REST communication, and TanStack Query caching.  
**Total Units**: 49 (organized into 6 phases)  
**Current Phase**: Phase 1 (REST API Foundation) & Phase 4-6 (Offline/Admin/Testing)  
**Recent Change**: 
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

### 2. SecureVisit Web SaaS
**Status**: Architecture Planning  

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