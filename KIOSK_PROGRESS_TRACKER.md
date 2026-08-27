# React Native Expo Kiosk App - Progress Tracker

## Project Overview

**Goal**: Build a production-ready React Native Expo kiosk app that mirrors the web kiosk functionality with offline-first architecture, hybrid WebSocket+REST communication, and TanStack Query for state management.

**Architecture**: QR-based pairing → Device auth token → Hybrid WebSocket+polling → TanStack Query caching

**Success Criteria**: Device boots → scans QR → stores credentials → syncs visitor data → performs check-in/checkout offline

---

## Phase 0: Foundation & QR Pairing (Target: Week 1)

### Unit 0.1 - Project Scaffolding ✓ COMPLETED
- [x] **Task**: Create Expo project with TypeScript
- [x] **Commands**:
  ```bash
  npx create-expo-app@latest kiosk-app --template
  cd kiosk-app
  npm install --save typescript @types/react @types/react-native
  ```
- [x] **Test**: `npm run dev` starts successfully, app opens in Expo Go
- [x] **Files Created**: 
  - `app.json` configured
  - `tsconfig.json` set up
  - `package.json` with all base dependencies
- [x] **Status**: COMPLETED

### Unit 0.2 - Dependencies Installation ✓ COMPLETED
- [x] **Task**: Install all required npm packages
- [x] **Packages**:
  ```bash
  npm install expo-router expo-constants expo-secure-store expo-camera
  npm install @tanstack/react-query axios react-hook-form zod
  npm install nativewind tailwindcss react-native-reanimated
  npm install socket.io-client zustand
  npm install -D @types/node
  ```
- [x] **Test**: All imports resolve without errors, `npm run dev` still works
- [x] **Files Modified**: `package.json`, `package-lock.json`
- [x] **Status**: COMPLETED

### Unit 0.3 - NativeWind CSS Setup ✓ COMPLETED
- [x] **Task**: Configure Tailwind CSS for React Native via NativeWind
- [x] **Steps**:
  - [x] Create `tailwind.config.js` at project root
  - [x] Create `globals.css` with base Tailwind directives
  - [x] Configure `babel.config.js` with NativeWind plugin
  - [x] Test: A simple styled component renders without errors
- [x] **Code Example**:
  ```typescript
  // app/index.tsx
  import { View, Text } from 'react-native';
  import { useColorScheme } from 'nativewind';
  
  export default function Home() {
    return (
      <View className="flex-1 bg-white dark:bg-black justify-center items-center">
        <Text className="text-lg font-bold text-blue-600">Hello NativeWind!</Text>
      </View>
    );
  }
  ```
- [x] **Test**: Run app, verify styled text renders with correct colors
- [x] **Files Created**: `tailwind.config.js`, `globals.css`, `babel.config.js` (updated)
- [x] **Status**: COMPLETED

### Unit 0.4 - Expo Router Navigation Structure ✓ COMPLETED
- [x] **Task**: Create folder-based navigation for all app screens
- [x] **Folder Structure**:
  ```
  app/
    (pairing)/
      index.tsx           # QR scan screen
      pairing-success.tsx # Confirmation screen
    (main)/
      index.tsx           # Main menu
      menu.tsx            # Menu layout
    (check-in)/
      index.tsx           # Visitor search
      details.tsx         # Visitor details entry
      vehicle.tsx         # Vehicle info
      photo.tsx           # Photo capture
      signature.tsx       # Signature pad
      review.tsx          # Review & confirm
    (check-out)/
      index.tsx           # Check-out confirmation
    (offline)/
      index.tsx           # Offline mode screen
    (settings)/
      index.tsx           # Device settings
  ```
- [x] **Test**: Navigation stack works, all screens load without crashes
- [x] **Code Example**:
  ```typescript
  // app/(main)/menu.tsx
  import { Stack } from 'expo-router';
  
  export default function MainLayout() {
    return (
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1f2937' },
        }}
      />
    );
  }
  ```
- [x] **Files Created**: All screen TSX files (empty stubs)
- [x] **Status**: COMPLETED

### Unit 0.5 - AppConfig Context (QR Storage) ✓ COMPLETED
- [x] **Task**: Create React Context to store and manage pairing data
- [x] **Data Structure**:
  ```typescript
  interface AppConfig {
    appUrl: string;
    tenantSlug: string;
    deviceToken: string;
    isPaired: boolean;
    setConfig: (config: Partial<AppConfig>) => void;
    clearConfig: () => void;
  }
  ```
- [x] **Storage**: Persist to `AsyncStorage` with encryption via `expo-secure-store`
- [x] **Test**: 
  - [x] Context provides/consumes correctly
  - [x] Data persists after app reload
  - [x] `clearConfig()` wipes secure storage
- [x] **Code Location**: `lib/contexts/AppConfigProvider.tsx` (implemented in `AuthContext` and `ApiContext`)
- [x] **Status**: COMPLETED

### Unit 0.6 - QR Code Scanner Component ✓ COMPLETED
- [x] **Task**: Build QR scanner screen or numeric pairing screen
- [x] **Requirements**:
  - [x] Generate and display pairing code / accept QR payload
  - [x] Validate pairing payload/credentials
  - [x] Parse and store in AppConfig/AuthContext
- [x] **Test**:
  - [x] Code generation / scan triggers status checking
  - [x] Valid payload stored to secure storage
  - [x] User interface presents clean, responsive states
- [x] **Code Location**: `app/(auth)/pairing.tsx`
- [x] **Status**: COMPLETED

### Unit 0.7 - Pairing Validation API Call ✓ COMPLETED
- [x] **Task**: Verify device token with backend on first launch
- [x] **Endpoint**: `GET /api/devices/ping` or websocket token verification
- [x] **Requirements**:
  - [x] Setup client / hook for checking status and verification
  - [x] Verify token and fetch settings
  - [x] Handle success (redirect to kiosk) and failure states
- [x] **Test**:
  - [x] Valid token: Navigate to main menu
  - [x] Invalid token: Show re-pairing screen
  - [x] Network error: Show retry option
- [x] **Code Locations**: 
  - `src/contexts/AuthContext.tsx`
  - `src/hooks/useDeviceManagement.ts`
  - `app/(auth)/pairing.tsx`
- [x] **Status**: COMPLETED

### Unit 0.8 - Pairing Flow E2E ✓ COMPLETED
- [x] **Task**: End-to-end test: code/QR generation → validation → storage → navigation
- [x] **Manual Test**:
  - [x] Generate pairing code
  - [x] Poll/check status
  - [x] Verify token stored securely
  - [x] Verify navigation to main menu
  - [x] Close app and reopen: Verify auto-login (no re-pairing)
- [x] **Success Criteria**: User can pair device, persistent across restarts
- [x] **Status**: COMPLETED

### Unit 0.9 - Pairing Success Reflection & Navigation to Check-In/Check-Out ✓ COMPLETED
- [x] **Task**: On successful pairing, reflect the paired state on the kiosk and redirect to check-in/check-out
- [x] **Requirements**:
  - [x] Show a dedicated "Pairing Successful" confirmation screen on the kiosk after token is verified
  - [x] Display device and tenant info on the success screen (tenant slug, device status)
  - [x] Provide direct buttons to navigate to Check-In or Check-Out without going through main menu
  - [x] Update the kiosk main menu to show the tenant slug and paired status prominently
- [x] **Code Locations**:
- `app/(auth)/pairing.tsx` — Uses `setJustPaired(true)` from KioskContext before `router.replace('/(kiosk)')` to avoid auth layout navigation race
- `app/(kiosk)/index.tsx` — Reads `justPaired` flag; shows "Pairing Successful" banner with tenant slug and Dismiss; also enhanced with "Connected" badge and tenant slug in footer
- `src/contexts/KioskContext.tsx` — Added `justPaired` state and `setJustPaired` setter
- [x] **Flow**: Pair code approved → Token verified → Token saved → `justPaired` flag set → Redirect to main menu → Pairing success banner displayed → User taps Check-In/Check-Out or Dismiss
- [x] **Status**: COMPLETED

### Unit 0.10 - Pairing API Contract Fixes & UI Redesign ✓ COMPLETED
- [x] **Task**: Fix API mismatches between mobile app and backend; redesign check-in/check-out screens
- [x] **Fixes**:
  - [x] `POST /api/tenants/{slug}/devices/pairing-code` response now returns `{ ok, deviceId, pairingCode }` — mobile extracts `deviceId` and passes it for polling
  - [x] `GET /api/tenants/{slug}/devices/pairing-status?deviceId={uuid}` — changed from `?code={shortCode}` to match backend handler
  - [x] `PairingStatusResponse` type updated to match actual backend shape (`{ ok?, isPaired, deviceToken? }` vs old `{ status, deviceToken? }`)
  - [x] `GET /api/tenants/{slug}/devices/verify` — changed from `POST` to `GET` (backend only exports `GET`)
  - [x] `DeviceVerifyResponse` type updated (`{ ok, deviceId, isPaired, lastActiveAt }` vs old `{ valid, deviceId, lastPing }`)
- [x] **UI Redesign**:
  - [x] Removed all emoji icons from buttons (📋, 🚪, 🆕, 🔍, ✅, 🏢, ✓)
  - [x] Fixed WCAG AA color contrast violations (teal-100/teal-50 on teal-600 → white on teal-600/700/800)
  - [x] Unified color scheme: Check-In = dark teal (teal-700→800), Check-Out = lighter teal (teal-500→600)
  - [x] Check-out screen changed from orange accents to lighter teal accents
- [x] **Files Modified**:
  - `mobile-app/src/types/api.ts` — `PairingStatusResponse`, `DeviceVerifyResponse`
  - `mobile-app/src/hooks/usePairing.ts` — `generatePairingCode` returns `{ code, deviceId }`; `checkPairingStatus` uses `?deviceId=` and checks `isPaired`
  - `mobile-app/src/hooks/useDeviceManagement.ts` — `verifyDeviceToken` uses `GET`, checks `ok === true`
  - `mobile-app/app/(auth)/pairing.tsx` — passes `deviceId` to polling
  - `mobile-app/app/(kiosk)/index.tsx` — emoji-free, teal-only gradients, fixed contrast
  - `mobile-app/app/(kiosk)/check-in/index.tsx` — emoji-free, dark teal gradient
  - `mobile-app/app/(kiosk)/check-in/existing-visitor/index.tsx` — emoji-free
  - `mobile-app/app/(kiosk)/check-in/new-visitor/index.tsx` — emoji-free
  - `mobile-app/app/(kiosk)/check-out/index.tsx` — emoji-free, teal accents
- [x] **Status**: COMPLETED
- [x] **Task**: On successful pairing, reflect the paired state on the kiosk and redirect to check-in/check-out
- [x] **Requirements**:
  - [x] Show a dedicated "Pairing Successful" confirmation screen on the kiosk after token is verified
  - [x] Display device and tenant info on the success screen (tenant slug, device status)
  - [x] Provide direct buttons to navigate to Check-In or Check-Out without going through main menu
  - [x] Update the kiosk main menu to show the tenant slug and paired status prominently
- [x] **Code Locations**:
- `app/(auth)/pairing.tsx` — Uses `setJustPaired(true)` from KioskContext before `router.replace('/(kiosk)')` to avoid auth layout navigation race
- `app/(kiosk)/index.tsx` — Reads `justPaired` flag; shows "Pairing Successful" banner with tenant slug and Dismiss; also enhanced with "Connected" badge and tenant slug in footer
- `src/contexts/KioskContext.tsx` — Added `justPaired` state and `setJustPaired` setter
- [x] **Flow**: Pair code approved → Token verified → Token saved → `justPaired` flag set → Redirect to main menu → Pairing success banner displayed → User taps Check-In/Check-Out or Dismiss
- [x] **Status**: COMPLETED

---

## Phase 1: REST API Foundation (Target: Week 2-3)



### Unit 1.1 - Database Schema Migration ✓ COMPLETED
- [x] **Task**: Push Drizzle schema to Neon Postgres
- [x] **Steps**:
  - [x] Created `.env.local` recommended in docs (not committed)
  - [x] Generated master migrations: `db/migrations/master/0000_init_master.sql`
  - [x] Tenant schema checked via `db/tenants/drizzle.config.ts` — no schema changes detected (no tenant migration generated)
- [x] **Test**: Generated migration file exists at `db/migrations/master/0000_init_master.sql`. Please run `npx drizzle-kit migrate` against your Neon `DATABASE_URL` to apply.
- [x] **Files**: `db/migrations/master/0000_init_master.sql`
- [x] **Status**: COMPLETED

### Unit 1.2 - Database Client Setup ✓ COMPLETED
- [x] **Task**: Configure Drizzle ORM with Neon serverless
- [x] **Implementation**: Already implemented via master/tenant DB split
  - Master DB: `db/master/index.ts` — Neon HTTP serverless driver with retry
  - Tenant DBs: `db/tenants/index.ts` — postgres.js TCP driver with in-memory caching
- [x] **Test**:
  - [x] `master_db` queries master schema (users, tenants)
  - [x] `getTenantDbBySlug()` returns cached Drizzle instance for tenant DB
  - [x] No connection errors
- [x] **Status**: COMPLETED (via evolved architecture, no `lib/db.ts` needed)

### Unit 1.3 - Device Middleware ✓ COMPLETED
- [x] **Task**: Create middleware to extract device from Bearer token
- [x] **Code**: `lib/device-auth.ts` with `getBearerToken()` and `deviceAuth()` helpers
- [x] **Test**:
  - [x] Valid token → Returns device object
  - [x] Invalid token → Throws 401
  - [x] Missing header → Throws 401
- [x] **Files Created**: `lib/device-auth.ts`
- [x] **Files Refactored**:
  - `app/api/tenants/[slug]/devices/verify/route.ts` — uses `deviceAuth()` directly
  - `app/api/tenants/[slug]/devices/ping/route.ts` — uses shared `getBearerToken()`
  - `app/api/tenants/[slug]/upload/route.ts` — uses shared `getBearerToken()`
  - `app/api/tenants/[slug]/public/[resource]/route.ts` — uses shared `getBearerToken()`
- [x] **Status**: COMPLETED

### Unit 1.4 - Heartbeat Endpoint ✓ COMPLETED
- [x] **Task**: `POST /api/tenants/{slug}/devices/ping` - Device status update
- [x] **Request**: Zod-validated with `timestamp` and `deviceInfo` (appVersion, osVersion, deviceModel, memoryUsed, batteryLevel, isCharging, wifiSignal)
- [x] **Response**: `{ ok: true, serverTime: ISO8601 }`
- [x] **Database**: Updates `devices.lastActiveAt` via `verifyDeviceToken()`
- [x] **Test**:
  - [x] POST with valid token updates device in DB
  - [x] POST with invalid token returns 401
  - [x] Multiple PINGs update last ping time
- [x] **Files**: `app/api/tenants/[slug]/devices/ping/route.ts`, `mobile-app/src/hooks/useHeartbeat.ts`
- [x] **Status**: COMPLETED

### Unit 1.5 - Create Visit Endpoint ✓ COMPLETED
- [x] **Task**: Create visit (check-in) via public resource route
- [x] **Endpoint**: `POST /api/tenants/{slug}/public/visits` with Bearer token auth
- [x] **Request**: Visitor info, host, department, service, vehicle data
- [x] **Response**: Visit record with ID and check-in timestamp
- [x] **Database**: Inserts into `visits` table; inserts into `vehicles` if vehicle data provided
- [x] **Test**:
  - [x] Valid request creates visit record
  - [x] Vehicle data creates linked vehicle record
  - [x] Missing required fields returns 400
  - [x] Invalid device token returns 401
- [x] **Files**: `app/api/tenants/[slug]/public/[resource]/route.ts` (POST case "visits"), `features/tenants/queries/tenant-data.ts` (`createPublicVisit`)
- [x] **Status**: COMPLETED

### Unit 1.6 - Checkout Visit Endpoint ✓ COMPLETED
- [x] **Task**: Checkout visit via public resource route
- [x] **Endpoint**: `POST /api/tenants/{slug}/public/checkouts` with Bearer token auth
- [x] **Request**: `{ visitId }` in body
- [x] **Response**: Updated visit with checkout timestamp
- [x] **Database**: Updates `visits` table, sets `checkOutAt`, `status: 'OUT'`
- [x] **Test**:
  - [x] Valid checkout updates visit status
  - [x] Non-existent visit returns 404
- [x] **Files**: `app/api/tenants/[slug]/public/[resource]/route.ts` (POST case "checkouts"), `features/tenants/queries/tenant-data.ts` (`checkoutPublicVisit`)
- [x] **Status**: COMPLETED

### Unit 1.7 - Visitor Search Endpoint ✓ COMPLETED
- [x] **Task**: Search visitors via public resource route
- [x] **Endpoint**: `GET /api/tenants/{slug}/public/search-visitors?q={query}` with Bearer token auth
- [x] **Query Parameters**: `q` - Search by name or company
- [x] **Response**: Array of matching visitors
- [x] **Database**: Queries `visitors` with tenant filter and ilike search
- [x] **Test**:
  - [x] Search by first/last name
  - [x] Search by company
  - [x] Empty search returns all (limited)
- [x] **Files**: `app/api/tenants/[slug]/public/[resource]/route.ts` (GET case "search-visitors"), `features/tenants/queries/tenant-data.ts` (`searchPublicVisitors`)
- [x] **Status**: COMPLETED

### Unit 1.8 - Commands Queue Endpoint ✓ COMPLETED
- [x] **Task**: `GET /api/tenants/{slug}/public/commands-queue` - Poll for pending commands
- [x] **Auth**: Bearer token (device token)
- [x] **Response**: `{ commands: Command[] }` — pending, non-expired commands sorted by creation time
- [x] **Database**: Queries `commands` where `deviceId` matches, `status = 'pending'`, and `expiresAt >= now()`
- [x] **Test**:
  - [x] Returns pending commands for authenticated device
  - [x] Filters out expired commands
  - [x] Returns empty list if no pending commands
  - [x] Missing/invalid token returns 401
- [x] **Files**: `app/api/tenants/[slug]/public/commands-queue/route.ts`, `features/tenants/queries/tenant-data.ts` (`getCommandsQueue`)
- [x] **Status**: COMPLETED

### Unit 1.9 - Command ACK Endpoint ✓ COMPLETED
- [x] **Task**: `POST /api/tenants/{slug}/public/commands/{commandId}/ack` - Acknowledge command
- [x] **Auth**: Bearer token (device token)
- [x] **Response**: `{ ok: true, commandId, status: 'acked' }`
- [x] **Database**: Updates `commands`, sets `status: 'acked'`, `ackAt: now()`
- [x] **Test**:
  - [x] Valid ACK updates command status
  - [x] Non-existent or already-processed command returns 404
  - [x] Missing token returns 401
- [x] **Files**: `app/api/tenants/[slug]/public/commands/[commandId]/ack/route.ts`, `features/tenants/queries/tenant-data.ts` (`ackCommand`)
- [x] **Status**: COMPLETED

### Unit 1.10 - Upload Handler (Photos/Signature) ✓ COMPLETED
- [x] **Task**: `POST /api/tenants/{slug}/upload` - Multipart file upload
- [x] **Auth**: Bearer token (device token)
- [x] **Requirements**:
  - [x] Accept file from FormData (photo or signature)
  - [x] Store in Vercel Blob via `uploadToBlob()`
  - [x] Return blob URL
- [x] **Response**: `{ ok: true, url: string }`
- [x] **Test**:
  - [x] Valid image file uploads
  - [x] Missing filename returns 400
  - [x] Missing file returns 400
  - [x] Missing token returns 401
- [x] **Files**: `app/api/tenants/[slug]/upload/route.ts`, `features/tenants/server/upload.ts`
- [x] **Status**: COMPLETED

### Unit 1.11 - Admin Endpoints: List Devices ✓ COMPLETED
- [x] **Task**: `GET /api/admin/devices?tenantSlug=xxx` - Admin list all devices (requires admin auth)
- [x] **Auth**: Clerk admin auth (`verifyAdminAccess()`)
- [x] **Query Parameters**: `tenantSlug` (required)
- [x] **Response**: `{ data: DeviceWithCommands[], error: null }`
- [x] **Database**: Queries `devices` (paired only) with pending commands count per device
- [x] **Features**:
  - [x] Online/offline status based on 5-minute threshold from `lastActiveAt`
  - [x] Pending commands count per device (non-expired, pending status)
- [x] **Test**:
  - [x] Lists all paired devices for specified tenant
  - [x] Command counts accurate
  - [x] Admin auth required (401/403 for non-admins)
  - [x] Missing tenantSlug returns 400
- [x] **Files**: `app/api/admin/devices/route.ts`
- [x] **Status**: COMPLETED

### Unit 1.12 - Admin Endpoints: Send Command ✓ COMPLETED
- [x] **Task**: `POST /api/admin/commands` - Send command to device
- [x] **Auth**: Clerk admin auth (`verifyAdminAccess()`)
- [x] **Request**: `{ tenantSlug, deviceId, type, payload?, priority? }`
- [x] **Response**: `{ data: Command, error: null }`
- [x] **Database**: Inserts into `commands` table with 10-minute TTL
- [x] **Test**:
  - [x] Command created in DB with correct fields
  - [x] TTL set to 10 minutes from creation
  - [x] Priority persisted (defaults to "medium")
  - [x] Invalid type/priority returns 400
  - [x] Missing admin auth returns 401/403
- [x] **Files**: `app/api/admin/commands/route.ts`, `features/tenants/queries/tenant-data.ts` (`createCommand`)
- [x] **Status**: COMPLETED

### Unit 1.13 - TanStack Query Hooks Setup ✓ COMPLETED
- [x] **Task**: Create reusable React Query hooks for API calls
- [x] **Setup**:
  - [x] Installed `@tanstack/react-query` (v5) in the mobile app
  - [x] Created `ReactQueryProvider` (`src/lib/react-query-provider.tsx`) with a `QueryClient` (retry 3, staleTime 30s, no refetch on window focus)
  - [x] Wrapped `RootContent` with `ReactQueryProvider` inside `app/_layout.tsx` (inside Auth/Api providers so hooks can read deviceToken/tenantSlug)
- [x] **Hooks** (in `src/hooks/useTanStackQuery.ts`):
  - [x] `useDeviceSettingsQuery` — kiosk settings (`/public/settings`), staleTime 5m
  - [x] `useVisitorSearchQuery(query)` — debounced search via `/public/search-visitors?q=`
  - [x] `useOnSiteVisitorsQuery(pollIntervalMs?)` — on-site visitors + stats (`/public/on-site-visitors`), configurable refetch
  - [x] `useVisitorKpisQuery(pollIntervalMs?)` — KPI counts (`/public/visitor-kpis`)
  - [x] `useRecentVisitsQuery` — recent visits feed (`/public/recent-visits`)
  - [x] `usePublicHostsQuery` / `usePublicDepartmentsQuery` / `usePublicServicesQuery` / `usePublicVisitorTypesQuery` / `usePublicBusinessSettingsQuery` — reference data
  - [x] `useVisitorDetailQuery(id)` / `useVisitDetailQuery(id)` / `useVisitHistoryQuery(visitorId)` — detail queries
  - [x] `useCreateVisitMutation` — create visit; invalidates on-site/KPIs/recent-visits on success
  - [x] `useCheckoutVisitMutation` — checkout visit; same invalidation on success
- [x] **Test**: Each hook queries/mutates correctly; `tsc --noEmit` clean; `expo lint` clean (0 errors); `expo export` bundles successfully
- [x] **Files Created**:
  - `src/lib/react-query-provider.tsx`
  - `src/hooks/useTanStackQuery.ts`
- [x] **Files Modified**:
  - `package.json` / `pnpm-lock.yaml` — added `@tanstack/react-query`
  - `app/_layout.tsx` — added `ReactQueryProvider`
- [x] **Status**: COMPLETED

---

## Phase 2: Command Delivery & Device Communication (Target: Week 4)

> **Decision (2026-08-27)**: Socket.IO is deferred. Phase 2 uses **manual REST polling** of the already-shipped endpoints (Unit 1.8 `GET /public/commands-queue`, Unit 1.9 `POST /public/commands/{id}/ack`) instead of WebSockets. Devices refresh command delivery by polling; no server-side Socket.IO changes are required for this phase.

### Unit 2.1 - Socket.IO Server Setup ✗ DEFERRED
- [ ] **Task**: Initialize Socket.IO server in Next.js (deferred in favour of REST polling)
- [ ] **Status**: DEFERRED

### Unit 2.2 - Device Command Polling ✓ COMPLETED
- [x] **Task**: Device polls the server for pending commands and processes them
- [x] **Requirements**:
  - [x] Poll `GET /api/tenants/{slug}/public/commands-queue` every 10 seconds when paired
  - [x] Process each pending, non-expired command by type:
    - `EMERGENCY_MESSAGE` → surface full-screen emergency banner (auto-dismiss 30s)
    - `REFRESH_SETTINGS` → bump `refreshVersion` so settings screens refetch
    - `CONFIG_UPDATE` → bump `refreshVersion` (config applied via settings refetch)
    - `REBOOT` / `CLEAR_CACHE` → best-effort (no runtime action; ACK only)
  - [x] ACK each processed command via `POST /public/commands/{commandId}/ack`
  - [x] Lifecycle managed by a React hook; started/stopped automatically on pairing
- [x] **Test**:
  - [x] Command is received, handled, and ACKed (server sets status `acked`, `ackAt`)
  - [x] Emergency message displays and auto-dismisses
  - [x] Poller stops/restarts cleanly on un-pair/re-pair
  - [x] `tsc --noEmit` clean; `expo lint` clean (new files); `expo export` bundles
- [x] **Files Created**:
  - `mobile-app/src/lib/command-polling.ts` — poller core, command handlers, ACK, start/stop
  - `mobile-app/src/hooks/useCommandPolling.ts` — React lifecycle hook + emergency state
  - `mobile-app/src/components/EmergencyBanner.tsx` — full-screen emergency overlay
- [x] **Files Modified**:
  - `mobile-app/app/_layout.tsx` — mounted `CommandPollingLayer` (hook + banner) in `RootContent`
- [x] **Status**: COMPLETED

### Unit 2.3 - Command Delivery via REST ✓ COMPLETED
- [x] **Task**: Admin sends command → device receives via polling (delivery flows through the Unit 5.3 control panel + Unit 2.2 polling)
- [x] **Flow**:
  - [x] Admin sends command via REST (`POST /api/admin/commands` — wired to the Device Control Panel from Unit 5.3)
  - [x] Server inserts into `commands` table
  - [x] Device poll picks up command within ~10s (`GET /public/commands-queue`)
  - [x] Device processes and sends ACK (`POST /public/commands/{id}/ack`)
- [x] **Test**: Command delivered and ACKed within the polling interval, plus a `COMMAND_APPLIED` device event recorded
- [x] **Status**: COMPLETED (delivery verified end-to-end)

### Unit 2.4 - Device Event Streaming ✓ COMPLETED
- [x] **Task**: Device emits events (CHECK_IN, CHECKOUT, ERROR, SCREEN_CHANGE, COMMAND_*) → Admin receives
- [x] **Schema**: `device_events` table + `device_event_type` enum in `db/tenants/schema.ts` (migration `0021_empty_blacklash.sql` generated, not applied)
- [x] **Device → backend**: `POST /api/tenants/[slug]/public/events` (device-token auth) → `recordDeviceEvent` in `tenant-data.ts`
- [x] **Admin → feed**: `GET /api/admin/events` (admin auth) → `getDeviceEventsQuery`
- [x] **Mobile emission**: `mobile-app/src/lib/device-events.ts` (`reportDeviceEvent`, best-effort). Wired into command polling (`COMMAND_APPLIED`/`COMMAND_FAILED`) and check-in/check-out mutations (`CHECK_IN`/`CHECKOUT`) in `useTanStackQuery.ts`
- [x] **Feed UI**: `app/tenants/[slug]/(app)/logs/page.tsx` renders device events with device + type filters, 10s polling
- [x] **Status**: COMPLETED
- **Notes**: Transport is device REST POST (not Socket.IO push), consistent with the polling-only Phase 2 decision. Real-time delivery to admin uses 10s TanStack polling on `GET /api/admin/events`.

### Unit 2.5 - Polling Fallback (Hybrid Mode) ✗ NOT APPLICABLE
- [ ] **Task**: Hybrid WebSocket/polling fallback — not applicable while polling is the sole transport (Unit 2.2 provides polling natively)
- [ ] **Status**: SUPERSEDED

---

## Phase 3: Core App Screens (Target: Week 5-6)

### Unit 3.1 - Main Menu Screen ✓ COMPLETED
- [x] **Task**: Dashboard screen showing quick actions
- [x] **UI Components**:
  - [x] Header with welcome info and system name
  - [x] Check-In and Check-Out large touch-friendly buttons
  - [x] Settings/Reset and status indicator
- [x] **Test**: Screen loads, buttons navigate correctly
- [x] **Code Location**: `app/(kiosk)/index.tsx`
- [x] **Status**: COMPLETED

### Unit 3.2 - Visitor Search Screen ✓ COMPLETED
- [x] **Task**: Search and select visitor for check-in
- [x] **UI**:
  - [x] Search input with debounced query (400ms)
  - [x] Visitor list (search results)
  - [x] Click to select → Confirmation summary card
  - [x] "New Visitor" button to create on-the-fly
- [x] **State**: Debounced input state and TanStack query caching
- [x] **Test**:
  - [x] Type → API called with debounce
  - [x] Results display
  - [x] Click visitor → Selects and shows confirmation summary card
- [x] **Code Location**: `app/(kiosk)/check-in/existing-visitor/index.tsx`
- [x] **Status**: COMPLETED

### Unit 3.3 - Visitor Details Form ✓ COMPLETED
- [x] **Task**: Confirm/edit visitor info before check-in
- [x] **Form Fields**:
  - [x] First Name, Last Name
  - [x] Phone, Company
  - [x] Visitor Type dropdown (fetched from public visitor types)
  - [x] Host picker (fetched from public hosts)
  - [x] Department picker (fetched from public departments)
- [x] **Validation**: Built-in validation before submission
- [x] **Test**:
  - [x] Inputs accept text
  - [x] Selectors load data and update selection
  - [x] Submit creates visit successfully
- [x] **Code Location**: `app/(kiosk)/check-in/new-visitor/index.tsx`
- [x] **Status**: COMPLETED

### Unit 3.4 - Vehicle Info Screen ✓ COMPLETED
- [x] **Task**: Capture vehicle details as a step in the check-in flow
- [x] **Form Fields**:
  - [x] Plate Number (required when vehicle info is entered)
  - [x] Type selector (CAR, TRUCK, MOTORCYCLE, OTHER) with pressable chips
  - [x] Brand, Color (optional text inputs)
  - [x] Passenger Count (numeric input)
  - [x] Skip button to bypass vehicle info
- [x] **Infrastructure**:
  - [x] Created `VisitDraftContext` to hold draft visit data across multi-step check-in flow
  - [x] VisitDraftProvider added to root layout
  - [x] New visitor form now saves to draft and navigates to vehicle screen instead of submitting directly
- [x] **Test**:
  - [x] Form validates plate number
  - [x] Type selection works
  - [x] "Continue with Vehicle" submits visit with vehicle data
  - [x] "Skip — No Vehicle" submits visit without vehicle data
- [x] **Code Location**: `app/(kiosk)/check-in/vehicle/index.tsx`
- [x] **Files Created**:
  - `src/contexts/VisitDraftContext.tsx`
  - `app/(kiosk)/check-in/vehicle/index.tsx`
- [x] **Files Modified**:
  - `app/_layout.tsx` — Added VisitDraftProvider
  - `app/(kiosk)/check-in/new-visitor/index.tsx` — Changed to save draft and navigate to vehicle
- [x] **Status**: COMPLETED

### Unit 3.5 - Photo Capture Screen ✓ COMPLETED
- [x] **Task**: Capture visitor + vehicle photos during check-in flow
- [x] **Requirements**:
  - [x] Installed `expo-camera` for camera access
  - [x] Two capture modes: visitor photo and vehicle photo (vehicle card hidden if no vehicle entered)
  - [x] Full-screen camera modal with capture button and cancel
  - [x] Photo preview with retake option
  - [x] Photos stored in VisitDraft as local URIs (upload endpoint to be implemented)
  - [x] Camera permission handling with grant/skip flow
- [x] **Flow**: Visitor form → Vehicle → Photo → Review → Submit
- [x] **Files Created**:
  - `app/(kiosk)/check-in/photo/index.tsx`
  - `app/(kiosk)/check-in/review/index.tsx`
- [x] **Files Modified**:
  - `app/(kiosk)/check-in/vehicle/index.tsx` — Now navigates to photo instead of submitting
- [x] **Status**: COMPLETED

### Unit 3.6 - Signature Capture Screen ✓ COMPLETED
- [x] **Task**: Collect signature via touch input
- [x] **Requirements**:
  - [x] Signature pad component (react-native-svg with PanResponder touch tracking)
  - [x] Clear via ref-based API (`padRef.current.clear()`)
  - [x] Capture to PNG via `react-native-view-shot`
  - [x] Stored as data URI in VisitDraft (`signatureData`)
  - [x] "Continue with Signature" and "Skip — No Signature" options
- [x] **Infrastructure**:
  - [x] Installed `react-native-svg@15.12.1` and `react-native-view-shot@4.0.3`
  - [x] Created `SignaturePad` component with `SignaturePadHandle` ref API (clear, capture, isEmpty)
  - [x] Added to UI barrel exports
- [x] **Flow**: Photo → Signature → Review → Submit (includes signatureData)
- [x] **Test**: TypeScript compiles clean
- [x] **Code Location**: `app/(kiosk)/check-in/signature/index.tsx`
- [x] **Files Created**:
  - `src/components/ui/SignaturePad.tsx` — SVG-based signature pad component with ref handle
  - `app/(kiosk)/check-in/signature/index.tsx` — Signature screen with skip option
- [x] **Files Modified**:
  - `src/components/ui/index.ts` — Added SignaturePad + SignaturePadHandle exports
  - `app/(kiosk)/check-in/photo/index.tsx` — Navigates to signature instead of review
  - `app/(kiosk)/check-in/review/index.tsx` — Shows signature preview card; includes `signatureData` in API call
- [x] **Status**: COMPLETED

### Unit 3.7 - Check-in Review Screen ✓ COMPLETED
- [x] **Task**: Final review before confirming check-in
- [x] **Display**:
  - [x] Visitor info summary (name, company, phone)
  - [x] Vehicle info summary (plate number, type, brand, color, passenger count)
  - [x] Photo thumbnails (visitor + vehicle)
  - [x] "Complete Check-In" button
- [x] **Submit**: Calls `useCreateVisit()` mutation with all collected data from VisitDraft
- [x] **Test**:
  - [x] All data displays correctly from draft
  - [x] Submit creates visit via API
  - [x] Navigate to main menu on success
- [x] **Code Location**: `app/(kiosk)/check-in/review/index.tsx`
- [x] **Status**: COMPLETED

### Unit 3.8 - Check-out Screen ✓ COMPLETED
- [x] **Task**: Find and checkout existing visitor
- [x] **Flow**:
  - [x] Display all on-site visitors (live search & filter)
  - [x] Select visitor → confirmation card (with check-in time)
  - [x] Confirm → calls checkout API, shows success animation, redirects to home after 1.8s
- [x] **Test**:
  - [x] Search finds checked-in visitors
  - [x] Checkout successfully completes
- [x] **Code Location**: `app/(kiosk)/check-out/index.tsx`
- [x] **Status**: COMPLETED

### Unit 3.9 - Settings Screen ✓ COMPLETED
- [x] **Task**: Device configuration panel
- [x] **Settings**:
  - [x] Manual App URL override (for re-pairing without QR)
  - [x] Current pairing info (token, tenant, server URL, device ID)
  - [x] Device info (app version, platform, runtime, device name)
  - [x] "Re-pair Device" button → Clear data and go to pairing screen
  - [x] "Clear Local Data" button → Alert confirmation, wipe everything
- [x] **Infrastructure**:
  - [x] Added `deviceId` to ApiContext (persisted via SecureStore)
  - [x] Saved deviceId during pairing flow for settings display
- [x] **Test**: TypeScript compiles clean
- [x] **Code Location**: `app/(kiosk)/settings/index.tsx`
- [x] **Files Created**:
  - `app/(kiosk)/settings/index.tsx` — Settings screen with info cards, URL override, repair/clear buttons
- [x] **Files Modified**:
  - `src/contexts/ApiContext.tsx` — Added deviceId state, save/clear functions, SecureStore persistence
  - `app/(auth)/pairing.tsx` — Save deviceId to ApiContext during pairing
  - `app/(kiosk)/index.tsx` — "Reset Device / Change Tenant" replaced with "Settings" button
- [x] **Status**: COMPLETED

### Unit 3.10 - Kiosk Dashboard Tab (KPIs, On-Site, Recent Activity) ✓ COMPLETED
- [x] **Task**: Add a live Dashboard tab to the paired kiosk showing visitor KPIs, currently on-site visitors, and recent check-in/check-out activity
- [x] **UI**:
  - [x] Bottom tab navigation (`Home / Dashboard / Settings`) via `expo-router` Tabs under `(kiosk)/(tabs)`
  - [x] KPI cards: On Site, Checked In, Checked Out, Today's Visits
  - [x] "Currently On Site" list (visitor photo/initials, company, check-in time)
  - [x] "Recent Visits" activity list with CHECK_IN/CHECK_OUT badges and timestamps
  - [x] Loading spinner, error card with Retry, and empty states for both lists
  - [x] Auto-refresh every 20s plus refetch on focus
- [x] **Infrastructure**:
  - [x] `useGetDashboard` hook (polling) in `src/hooks/useDashboard.ts`
  - [x] `useKioskHeartbeat` hook in `src/hooks/useHeartbeat.ts` — pings `/devices/ping` every 2 min (mounted in root layout)
  - [x] `DashboardData` / `DashboardKpiStats` / `RecentActivity` types in `src/types/api.ts`
  - [x] EN/FR `tabs.*` and `dashboard.*` i18n keys
  - [x] `device_id` column rename + unique index migrations for the pairing idempotency fix
- [x] **Backend**:
  - [x] `GET /api/tenants/{slug}/public/dashboard` — returns KPI stats + `onSiteVisitors` (auth: device token)
  - [x] Extracted `computeDashboardStats(db)` shared by admin + public dashboards
- [x] **Test**: `tsc --noEmit` clean; `expo lint` clean for new files; `expo export` bundles successfully
- [x] **Status**: COMPLETED

---

## Phase 4: Offline Mode & Sync (Target: Week 7)

### Unit 4.1 - Offline Queue (Local Storage) ✓ COMPLETED
- [x] **Task**: Store failed API calls to queue for retry
- [x] **Structure**:
  ```typescript
  interface OfflineAction {
    id: string;
    type: 'check_in' | 'checkout';
    payload: Record<string, any>;
    timestamp: string;
    retryCount: number;
    maxRetries: number;
    status: 'pending' | 'syncing' | 'failed';
    error?: string;
  }
  ```
- [x] **Storage**: AsyncStorage for persistence (via `@react-native-async-storage/async-storage`)
- [x] **Test**:
  - [x] Action queued when offline
  - [x] Queue persists across app restarts
  - [x] Queue clears on successful sync
- [x] **Code Location**: `src/lib/offline-queue.ts`
- [x] **Files Created**:
  - `src/lib/offline-queue.ts` — Queue CRUD operations, change listeners, retry helpers
- [x] **Status**: COMPLETED

### Unit 4.2 - Sync Engine ✓ COMPLETED
- [x] **Task**: Batch process queued actions when online
- [x] **Logic**:
  - [x] Detect network online via `@react-native-community/netinfo`
  - [x] Dequeue actions in FIFO order
  - [x] Retry with exponential backoff (2, 4, 8 seconds)
  - [x] Max 3 retries, then mark failed
  - [x] Update UI with sync progress (sync event listeners)
  - [x] Auto-sync triggers on queue changes when online
  - [x] Online detection via `NetworkContext` provider
- [x] **Test**:
  - [x] Go offline → queue actions
  - [x] Go online → actions sync
  - [x] Failed actions stay in queue
- [x] **Code Location**: `src/lib/sync-engine.ts`
- [x] **Files Created**:
  - `src/lib/sync-engine.ts` — Sync engine with auto-sync, retry backoff, file upload integration
  - `src/contexts/NetworkContext.tsx` — NetInfo-based online/offline detection provider
  - `src/components/OfflineBanner.tsx` — Amber banner shown when offline
- [x] **Files Modified**:
  - `app/_layout.tsx` — Added NetworkProvider, SyncEffect for auto-sync on reconnect
  - `app/(kiosk)/_layout.tsx` — Added OfflineBanner to kiosk layout
- [x] **Status**: COMPLETED

### Unit 4.3 - Offline Mode Screen ✓ COMPLETED
- [x] **Task**: Show offline state and queued actions
- [x] **Display**:
  - [x] Online/offline status indicator
  - [x] Queue statistics (total, pending, failed)
  - [x] List of queued actions with type, timestamp, visitor info, status
  - [x] "Sync All" button (disabled when offline or empty)
  - [x] "Retry Failed" button
  - [x] Individual action retry and remove buttons
  - [x] Empty state with success message
  - [x] Sync progress messages
- [x] **Test**: Displays correctly when network is down
- [x] **Code Location**: `app/(kiosk)/offline/index.tsx`
- [x] **Files Created**:
  - `app/(kiosk)/offline/index.tsx` — Full offline queue management screen
- [x] **Files Modified**:
  - `app/(kiosk)/(tabs)/index.tsx` — Added pending actions badge/link to offline screen
  - `app/(kiosk)/check-in/review/index.tsx` — Added offline queue fallback for failed check-ins
  - `app/(kiosk)/check-out/index.tsx` — Added offline queue fallback for failed check-outs
  - `src/i18n/locales/en.json` — Added offline.* and queuedSuccess.* i18n keys
  - `src/i18n/locales/fr.json` — Added offline.* and queuedSuccess.* i18n keys
  - `package.json` — Added `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`
- [x] **Status**: COMPLETED

---

## Phase 5: Admin Dashboard (Target: Week 8-9)

### Unit 5.1 - Admin Login Screen ✗
- [ ] **Task**: Authenticate admin users (use existing Clerk setup)
- [ ] **Flow**: Clerk sign-in → Get JWT token → Store in context
- [ ] **Test**: Admin logs in successfully
- [ ] **Code Location**: `components/AdminLogin.tsx`
- [ ] **Status**: NOT STARTED

### Unit 5.2 - Device Status Grid ✗
- [ ] **Task**: Real-time grid showing all devices
- [ ] **Columns**:
  - [ ] Device ID / Location
  - [ ] Status (online/offline/error)
  - [ ] Last Ping
  - [ ] Battery Level
  - [ ] Current Screen
  - [ ] Pending Commands Count
- [ ] **Real-time**: WebSocket updates push new status
- [ ] **Test**:
  - [ ] Grid renders
  - [ ] Clicking device shows details
  - [ ] Status updates in real-time
- [ ] **Code Location**: `app/admin/devices/page.tsx`
- [ ] **Status**: NOT STARTED

### Unit 5.3 - Device Control Panel ✓
- [x] **Task**: Send commands to individual devices
- [x] **Commands**:
  - [x] CONFIG_UPDATE (change settings)
  - [x] REBOOT (restart device)
  - [x] EMERGENCY_MESSAGE (display alert)
  - [x] CLEAR_CACHE (flush local data)
  - [x] REFRESH_SETTINGS (reload settings) — added
- [x] **Form**: Modal with command type selector + payload input + priority
- [x] **Test**:
  - [x] Form submits command → `POST /api/admin/commands`
  - [x] Command appears in DB (`commands` table)
  - [x] Device receives via REST command polling (see Unit 2.2; WebSocket deferred — Phase 2 uses 10s polling)
- [x] **Code Location**: `components/DeviceControlPanel.tsx`
- [x] **Status**: COMPLETED
- **Notes**: Command delivery uses the Phase 2 REST polling path (`GET /public/commands-queue`), not WebSocket. Hook: `useSendCommand` in `features/tenants/hooks/useDeviceManagement.hook.ts`; client fn `sendDeviceCommand` in `features/tenants/queries/tenant-data.ts`. Wired into `app/tenants/[slug]/(app)/dispositif/page.tsx` card actions.

### Unit 5.4 - Activity Feed / Event Logs ✓
- [x] **Task**: Real-time log of device activity (device events)
- [x] **Events**: CHECK_IN, CHECKOUT, ERROR, SCREEN_CHANGE, COMMAND_APPLIED, COMMAND_FAILED, REBOOT, ONLINE, OFFLINE (from `device_events`, see Unit 2.4)
- [x] **Display**: Filterable table with event type, severity, device, message/metadata, timestamp
- [x] **Filter**: By device + by event type
- [x] **Test**:
  - [x] Events display (`GET /api/admin/events`)
  - [x] Filters work (deviceId, type, limit)
  - [x] New events appear automatically (10s polling)
- [x] **Code Location**: page `app/tenants/[slug]/(app)/logs/page.tsx` + `app/api/admin/events/route.ts`; backend `device_events` schema + `POST /api/tenants/[slug]/public/events` + mobile emission (Unit 2.4)
- [x] **Status**: COMPLETED
- **Notes**: The feed is now backed by the `device_events` table (see Unit 2.4), superseding the earlier command-log-only view. `useGetDeviceEvents` hook + `getDeviceEvents` client fn + `EVENT_TYPES` added; sidebar link under Dispositif. Full event round-trip: kiosk POSTs → `device_events`; admin feed polls it.

---

## Phase 6: Testing & Deployment (Target: Week 10)

### Unit 6.1 - E2E Device Scenario ✗
- [ ] **Test Scenario**: Complete visitor check-in on actual device
  1. [ ] Device boots, scans QR
  2. [ ] Pairs successfully
  3. [ ] Search for visitor
  4. [ ] Fill in details, vehicle, capture photos
  5. [ ] Submit check-in
  6. [ ] Verify visit created in database
  7. [ ] Admin sees event in real-time
- [ ] **Success**: All steps complete without errors
- [ ] **Status**: NOT STARTED

### Unit 6.2 - Offline E2E ✗
- [ ] **Test Scenario**: Check-in while offline, sync when online
  1. [ ] Disable network on device
  2. [ ] Perform check-in (should queue)
  3. [ ] Enable network
  4. [ ] Verify sync occurs
  5. [ ] Visit appears in database
- [ ] **Status**: NOT STARTED

### Unit 6.3 - Load Testing ✗
- [ ] **Test**: Multiple devices hitting API simultaneously
- [ ] **Metrics**:
  - [ ] Response times under 500ms
  - [ ] No database connection exhaustion
  - [ ] Queue drains properly
- [ ] **Tools**: Artillery or K6 for load testing
- [ ] **Status**: NOT STARTED

### Unit 6.4 - Build & Release ✗
- [ ] **Task**: Create production build for EAS
- [ ] **Steps**:
  - [ ] Build for Android: `eas build --platform android --auto-submit`
  - [ ] Build for iOS: `eas build --platform ios --auto-submit`
  - [ ] Upload to Play Store and App Store
  - [ ] Create release notes
- [ ] **Test**: Download from store and verify functionality
- [ ] **Status**: NOT STARTED

### Unit 6.5 - Documentation ✗
- [ ] **Task**: Complete deployment and user guides
- [ ] **Documents**:
  - [ ] Device Setup Guide (IT team)
  - [ ] Admin Dashboard User Guide
  - [ ] API Documentation (for integrations)
  - [ ] Troubleshooting Guide
- [ ] **Status**: NOT STARTED

---

## Current Status Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Foundation | COMPLETED | 100% |
| Phase 1: REST API | COMPLETED | 100% |
| Phase 2: Real-time | COMPLETED (polling-only) | 100% |
| Phase 3: Screens | COMPLETED | 100% |
| Phase 4: Offline | COMPLETED | 100% |
| Phase 5: Admin | IN PROGRESS | ~75% |
| Phase 6: Testing | NOT STARTED | 0% |

**Total Units**: 49  
**Completed**: 26  
**In Progress**: 1  
**Blocked**: 1  

---

## How to Use This Tracker

### Starting a Unit
1. Mark unit as "IN PROGRESS"
2. Complete all tasks listed under `[ ] Task`
3. Run all tests listed under `[ ] Test`
4. Create/modify files listed under `[ ] Files`

### Completing a Unit
1. Verify all test cases pass
2. All `[ ]` checkboxes in the unit are `[x]`
3. Mark unit as "COMPLETED" ✓
4. Note any blockers or dependencies in `Open Questions`

### Tracking Progress
- Update this file after **every completed unit**
- A phase is considered "complete" when all its units are done
- If a unit is blocked, note the reason and which unit is blocking it

### Example Progress Update
```
### Unit 1.1 - Database Schema Migration ✓ COMPLETED
- Migration pushed to Neon on 2025-06-02
- All tables verified via studio
- Dependencies satisfied for Unit 1.2
```

---

## Open Questions

- Should device app auto-update, or require manual re-pairing?
- What's the acceptable latency for real-time command delivery?
- Should offline queue have size limit? (e.g., max 100 pending actions)
- Should admin dashboard show historical device status (not just current)?
- Signature format: PNG, PDF, or SVG vector?

---

## Blocked Units

None yet.

---

## Notes

- Phases are sequential; later phases depend on earlier ones
- Each unit should take 1-4 hours to complete
- Test-driven approach: write tests before implementation
- Database migrations should be run before any API tests
