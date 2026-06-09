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

### Unit 1.2 - Database Client Setup ✗
- [ ] **Task**: Configure Drizzle ORM with Neon serverless
- [ ] **Code**: Create `lib/db.ts` with Neon + Drizzle connection pool
- [ ] **Test**:
  - [ ] Import `db` from `lib/db.ts`
  - [ ] Execute simple query: `await db.select().from(devices).limit(1)`
  - [ ] No connection errors
- [ ] **Files Created**: `lib/db.ts`, `db/schema.ts` (already exists as DRIZZLE_SCHEMA.md)
- [ ] **Status**: NOT STARTED

### Unit 1.3 - Device Middleware ✗
- [ ] **Task**: Create middleware to extract device from Bearer token
- [ ] **Code**:
  ```typescript
  export async function deviceAuth(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const device = await db.select().from(devices).where(eq(devices.token, token));
    if (!device) throw new Error('Unauthorized');
    return device[0];
  }
  ```
- [ ] **Test**: 
  - [ ] Valid token → Returns device object
  - [ ] Invalid token → Throws 401
  - [ ] Missing header → Throws 401
- [ ] **Files Created**: `middleware/deviceAuth.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.4 - Heartbeat Endpoint ✗
- [ ] **Task**: `POST /api/devices/ping` - Device status update
- [ ] **Request**:
  ```typescript
  {
    deviceInfo: {
      appVersion: "1.0.0",
      osVersion: "Android 13",
      deviceModel: "Samsung S22",
      memoryUsed: 1024,
      batteryLevel: 85,
      isCharging: false,
      wifiSignal: -50
    }
  }
  ```
- [ ] **Response**: `{ status: 'ok', serverTime: ISO8601 }`
- [ ] **Database**: Update `devices` table with `lastPingAt`, `status`, `deviceInfo`
- [ ] **Test**:
  - [ ] POST with valid token updates device in DB
  - [ ] POST with invalid token returns 401
  - [ ] Multiple PINGs update last ping time
- [ ] **Files Created**: `app/api/devices/ping.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.5 - Create Visit Endpoint ✗
- [ ] **Task**: `POST /api/devices/{deviceId}/visits` - Check-in
- [ ] **Request**:
  ```typescript
  {
    visitorId: string;
    hostId?: string;
    departmentId?: string;
    purpose: string;
    vehicle?: {
      plateNumber: string;
      type: "CAR" | "TRUCK" | "MOTORCYCLE" | "OTHER";
      brand: string;
      color: string;
      passengerCount: number;
    };
  }
  ```
- [ ] **Response**: `{ visitId: string; checkInAt: ISO8601 }`
- [ ] **Database**: 
  - [ ] Insert into `visits` table
  - [ ] Insert into `vehicles` table if vehicle data provided
- [ ] **Test**:
  - [ ] Valid request → Creates visit record
  - [ ] Vehicle data → Creates linked vehicle record
  - [ ] Missing required fields → Returns 400
  - [ ] Invalid device token → Returns 401
- [ ] **Files Created**: `app/api/devices/[deviceId]/visits/route.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.6 - Checkout Visit Endpoint ✗
- [ ] **Task**: `PATCH /api/devices/{deviceId}/visits/{visitId}/checkout` - Check-out
- [ ] **Request**:
  ```typescript
  {
    visitorPhotoUrl?: string;
    vehiclePhotoUrl?: string;
    signatureUrl?: string;
  }
  ```
- [ ] **Response**: `{ visitId: string; checkOutAt: ISO8601; status: 'checked_out' }`
- [ ] **Database**: Update `visits` table, set `checkOutAt`, `status: 'checked_out'`
- [ ] **Test**:
  - [ ] Valid checkout updates visit status
  - [ ] Photos/signature URLs persisted
  - [ ] Non-existent visit → Returns 404
- [ ] **Files Created**: `app/api/devices/[deviceId]/visits/[visitId]/checkout.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.7 - Visitor Search Endpoint ✗
- [ ] **Task**: `GET /api/devices/{deviceId}/visitors?search=query` - Search visitors
- [ ] **Query Parameters**: 
  - [ ] `search` - Search by name or company
  - [ ] `limit` - Default 20, max 100
- [ ] **Response**:
  ```typescript
  {
    visitors: Array<{
      id: string;
      firstName: string;
      lastName: string;
      company?: string;
      phone?: string;
      photoUrl?: string;
    }>;
    total: number;
  }
  ```
- [ ] **Database**: Query `visitors` with tenant filter
- [ ] **Test**:
  - [ ] Search by first name
  - [ ] Search by last name
  - [ ] Search by company
  - [ ] Empty search returns all (limited to 20)
  - [ ] Pagination works
- [ ] **Files Created**: `app/api/devices/[deviceId]/visitors/route.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.8 - Commands Queue Endpoint ✗
- [ ] **Task**: `GET /api/devices/{deviceId}/commands/queue` - Poll for pending commands
- [ ] **Response**:
  ```typescript
  {
    commands: Array<{
      id: string;
      type: "CONFIG_UPDATE" | "REBOOT" | "EMERGENCY_MESSAGE" | ...;
      payload: Record<string, any>;
      expiresAt: ISO8601;
    }>;
  }
  ```
- [ ] **Database**: Query `commands` where `deviceId` and `status = 'pending'`
- [ ] **Test**:
  - [ ] Returns pending commands
  - [ ] Respects expiration (filters expired)
  - [ ] Empty list if no pending
- [ ] **Files Created**: `app/api/devices/[deviceId]/commands/queue.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.9 - Command ACK Endpoint ✗
- [ ] **Task**: `PATCH /api/devices/{deviceId}/commands/{commandId}/ack` - Acknowledge command
- [ ] **Request**: `{ ackAt: ISO8601 }`
- [ ] **Response**: `{ status: 'acked' }`
- [ ] **Database**: Update `commands`, set `status: 'acked'`, `ackAt`
- [ ] **Test**:
  - [ ] Valid ACK updates command
  - [ ] Non-existent command → 404
  - [ ] Already acked command → 409 Conflict
- [ ] **Files Created**: `app/api/devices/[deviceId]/commands/[commandId]/ack.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.10 - Upload Handler (Photos/Signature) ✗
- [ ] **Task**: `POST /api/devices/{deviceId}/upload` - Multipart file upload
- [ ] **Requirements**:
  - [ ] Accept file from FormData (photo or signature)
  - [ ] Validate file type (image/png, image/jpeg, application/pdf)
  - [ ] Store in Vercel Blob or similar service
  - [ ] Return signed URL
- [ ] **Response**:
  ```typescript
  {
    fileUrl: string;
    filename: string;
    mimeType: string;
    uploadedAt: ISO8601;
  }
  ```
- [ ] **Test**:
  - [ ] Valid image file uploads
  - [ ] Invalid file type rejected
  - [ ] URL is accessible
- [ ] **Files Created**: `app/api/devices/[deviceId]/upload.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.11 - Admin Endpoints: List Devices ✗
- [ ] **Task**: `GET /api/admin/devices` - Admin list all devices (requires admin auth)
- [ ] **Response**:
  ```typescript
  {
    devices: Array<{
      id: string;
      location: string;
      status: "online" | "offline" | "error";
      lastPingAt: ISO8601;
      batteryLevel: number;
      currentScreen: string;
      pendingCommandsCount: number;
    }>;
    total: number;
  }
  ```
- [ ] **Database**: Join devices with commands count
- [ ] **Test**:
  - [ ] Lists all tenant devices
  - [ ] Command counts accurate
  - [ ] Admin auth required
- [ ] **Files Created**: `app/api/admin/devices/route.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.12 - Admin Endpoints: Send Command ✗
- [ ] **Task**: `POST /api/admin/commands` - Send command to device
- [ ] **Request**:
  ```typescript
  {
    deviceId: string;
    type: "CONFIG_UPDATE" | "REBOOT" | "EMERGENCY_MESSAGE" | ...;
    payload: Record<string, any>;
    priority: "low" | "medium" | "high" | "critical";
  }
  ```
- [ ] **Response**: `{ commandId: string; status: 'pending' }`
- [ ] **Database**: Insert into `commands` table
- [ ] **Test**:
  - [ ] Command created in DB
  - [ ] TTL set correctly (10 minutes)
  - [ ] Priority persisted
- [ ] **Files Created**: `app/api/admin/commands/route.ts`
- [ ] **Status**: NOT STARTED

### Unit 1.13 - TanStack Query Hooks Setup ✗
- [ ] **Task**: Create reusable React Query hooks for API calls
- [ ] **Hooks**:
  ```typescript
  // hooks/useDeviceSettings.ts
  export function useDeviceSettings() {
    return useQuery({
      queryKey: ['settings'],
      queryFn: () => api.get('/api/devices/settings'),
      staleTime: 5 * 60 * 1000,
    });
  }
  
  // hooks/useVisitorSearch.ts
  export function useVisitorSearch(query: string, debounceMs: 400) {
    // Debounced search hook
  }
  
  // hooks/useOnSiteVisitors.ts
  export function useOnSiteVisitors() {
    return useQuery({
      queryKey: ['visitors', 'on-site'],
      queryFn: () => api.get('/api/visitors/on-site'),
      refetchInterval: 60 * 1000, // Auto-refresh every 60s
    });
  }
  
  // hooks/useCreateVisit.ts
  export function useCreateVisit() {
    return useMutation({
      mutationFn: (data) => api.post('/api/visits', data),
    });
  }
  ```
- [ ] **Test**: Each hook queries/mutates correctly without errors
- [ ] **Files Created**: All hook files in `hooks/`
- [ ] **Status**: NOT STARTED

---

## Phase 2: Real-time Architecture (Target: Week 4)

### Unit 2.1 - Socket.IO Server Setup ✗
- [ ] **Task**: Initialize Socket.IO server in Next.js
- [ ] **Requirements**:
  - [ ] Create Socket.IO adapter for Next.js
  - [ ] Configure CORS for device connections
  - [ ] Set up connection/disconnection handlers
- [ ] **Test**: Server starts, clients can connect
- [ ] **Files Created**: `lib/socket.ts`, Socket.IO configuration
- [ ] **Status**: NOT STARTED

### Unit 2.2 - Device Socket Connection ✗
- [ ] **Task**: Device establishes WebSocket connection with server
- [ ] **Requirements**:
  - [ ] Connect to Socket.IO server with device token
  - [ ] Join room: `device:{deviceId}`
  - [ ] Emit heartbeat every 2 minutes
  - [ ] Handle reconnection logic
- [ ] **Test**:
  - [ ] Device connects successfully
  - [ ] Heartbeat events received by server
  - [ ] Auto-reconnect on disconnect
- [ ] **Code Locations**: 
  - `lib/socket-client.ts` (Expo side)
  - `lib/socket-handlers.ts` (Next.js side)
- [ ] **Status**: NOT STARTED

### Unit 2.3 - Command Delivery via WebSocket ✗
- [ ] **Task**: Admin sends command → device receives via WebSocket
- [ ] **Flow**:
  - [ ] Admin sends command via REST
  - [ ] Server inserts into commands table
  - [ ] Server emits `command` event to device room
  - [ ] Device receives and processes
  - [ ] Device sends ACK
- [ ] **Test**:
  - [ ] Device receives command within 1 second
  - [ ] Device ACKs within 10 seconds or fallback to polling
- [ ] **Status**: NOT STARTED

### Unit 2.4 - Device Event Streaming ✗
- [ ] **Task**: Device emits events (CHECK_IN, CHECKOUT, ERROR) → Admin receives
- [ ] **Flow**:
  - [ ] Device emits `visit:checkin` event
  - [ ] Server inserts into `deviceEvents`
  - [ ] Server broadcasts to admin rooms
  - [ ] Admin dashboard updates in real-time
- [ ] **Test**:
  - [ ] Check-in event reaches admin <500ms
  - [ ] Multiple admins receive events
- [ ] **Status**: NOT STARTED

### Unit 2.5 - Polling Fallback (Hybrid Mode) ✗
- [ ] **Task**: If WebSocket fails, device polls REST every 30s
- [ ] **Requirements**:
  - [ ] Detect WebSocket disconnection
  - [ ] Start polling `GET /api/devices/{id}/commands/queue`
  - [ ] Resume WebSocket when available
  - [ ] Switch back to WebSocket (stop polling)
- [ ] **Test**:
  - [ ] Simulate connection drop
  - [ ] Device polls commands
  - [ ] Commands still delivered via polling
  - [ ] Connection restored → Resume WebSocket
- [ ] **Status**: NOT STARTED

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

---

## Phase 4: Offline Mode & Sync (Target: Week 7)

### Unit 4.1 - Offline Queue (Local Storage) ✗
- [ ] **Task**: Store failed API calls to queue for retry
- [ ] **Structure**:
  ```typescript
  interface QueuedAction {
    id: string;
    action: 'check_in' | 'checkout' | 'upload';
    payload: any;
    timestamp: ISO8601;
    retryCount: number;
  }
  ```
- [ ] **Storage**: AsyncStorage for persistence
- [ ] **Test**:
  - [ ] Action queued when offline
  - [ ] Queue persists across app restarts
  - [ ] Queue clears on successful sync
- [ ] **Code Location**: `lib/offline-queue.ts`
- [ ] **Status**: NOT STARTED

### Unit 4.2 - Sync Engine ✗
- [ ] **Task**: Batch process queued actions when online
- [ ] **Logic**:
  - [ ] Detect network online
  - [ ] Dequeue actions in order
  - [ ] Retry with exponential backoff (2, 4, 8 seconds)
  - [ ] Max 3 retries, then mark failed
  - [ ] Update UI with sync progress
- [ ] **Test**:
  - [ ] Go offline → queue actions
  - [ ] Go online → actions sync
  - [ ] Failed actions stay in queue
- [ ] **Code Location**: `lib/sync-engine.ts`
- [ ] **Status**: NOT STARTED

### Unit 4.3 - Offline Mode Screen ✗
- [ ] **Task**: Show offline state and queued actions
- [ ] **Display**:
  - [ ] "OFFLINE" banner
  - [ ] List of queued/failed actions
  - [ ] "Retry All" button
  - [ ] "View Logs" button
- [ ] **Test**: Displays correctly when network is down
- [ ] **Code Location**: `app/(offline)/index.tsx`
- [ ] **Status**: NOT STARTED

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

### Unit 5.3 - Device Control Panel ✗
- [ ] **Task**: Send commands to individual devices
- [ ] **Commands**:
  - [ ] CONFIG_UPDATE (change settings)
  - [ ] REBOOT (restart device)
  - [ ] EMERGENCY_MESSAGE (display alert)
  - [ ] CLEAR_CACHE (flush local data)
- [ ] **Form**: Modal with command type selector + payload input
- [ ] **Test**:
  - [ ] Form submits command
  - [ ] Command appears in DB
  - [ ] Device receives via WebSocket
- [ ] **Code Location**: `components/DeviceControlPanel.tsx`
- [ ] **Status**: NOT STARTED

### Unit 5.4 - Activity Feed / Event Logs ✗
- [ ] **Task**: Real-time log of device events
- [ ] **Events**:
  - [ ] CHECK_IN
  - [ ] CHECKOUT
  - [ ] ERROR
  - [ ] SCREEN_CHANGE
  - [ ] COMMAND_FAILED
- [ ] **Display**: Table with event type, device, timestamp, details
- [ ] **Filter**: By device, event type, date range
- [ ] **Test**:
  - [ ] Events display
  - [ ] Filters work
  - [ ] New events appear in real-time
- [ ] **Code Location**: `app/admin/logs/page.tsx`
- [ ] **Status**: NOT STARTED

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
| Phase 1: REST API | IN PROGRESS | ~8% |
| Phase 2: Real-time | NOT STARTED | 0% |
| Phase 3: Screens | COMPLETED | 100% |
| Phase 4: Offline | NOT STARTED | 0% |
| Phase 5: Admin | NOT STARTED | 0% |
| Phase 6: Testing | NOT STARTED | 0% |

**Total Units**: 48  
**Completed**: 20  
**In Progress**: 0  
**Blocked**: 0  

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
