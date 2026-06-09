# React Native Expo Kiosk App — Project Overview

## Executive Summary

This project replicates the **SecureVisit Kiosk** web interface as a standalone React Native + Expo mobile/tablet application. The app enables visitor check-in/check-out workflows on tablets deployed in physical locations, with all data synced to the main SecureVisit SaaS platform via REST APIs.

**Platform**: iOS, Android (tablet-optimized)  
**Framework**: React Native with Expo  
**Target Devices**: iPad, Android tablets (10"+), with fallback to large phones  
**Backend Integration**: Stateless API consumption (no persistent backend)  
**Deployment**: Expo EAS builds → iOS App Store / Google Play Store or self-hosted  
**Key Difference**: No onboarding—QR code pairing extracts appUrl + token in one scan

---

## Product Goals

1. **Parity with Web Kiosk**: Replicate the exact workflow and UX from the web kiosk
2. **Tablet-First Design**: Optimize for 10"+ screens with large touch targets
3. **Zero-Touch Setup**: QR code delivers all config (appUrl, token, tenantSlug)
4. **Fast Load**: Sub-2-second startup and navigation between screens
5. **Security**: Device pairing via QR token; no persistent user authentication
6. **TanStack Query-Native**: All API calls via queries/mutations for caching, retry, sync
7. **Hybrid Fallback**: Settings screen allows manual appUrl override if needed

---

## Core Features (MVP)

### 1. Device Pairing & Authorization (First Launch - QR Only)

**Initial State**:
- App checks: Is device paired? (token in SecureStore)
- NO → Show **QR Scanner Screen**
- YES → Proceed to Main Menu

**QR Code Payload**:
Admin generates QR encoding JSON:
```json
{
  "token": "dev_xyz123abc",
  "appUrl": "https://acme.securevisit.com",
  "tenantSlug": "acme"
}
```

**Pairing Flow**:
1. User scans QR → app parses JSON payload
2. Extract & store:
   - `token` → SecureStore (encrypted)
   - `appUrl` → AsyncStorage
   - `tenantSlug` → AppConfig Context
3. Initialize API Client with `appUrl` as baseURL
4. **TanStack Query Mutation**: `useVerifyToken()` → POST `/api/kiosk/device/verify-token`
   - Validates token
   - Returns settings (photo/signature requirements)
   - Returns updated appUrl (auto-sync feature)
5. Success → Redirect to Main Menu
6. Failure → Show error, allow re-scan

**Hybrid Approach**:
- Primary: appUrl extracted from QR
- Fallback: Settings screen (Phase 2) to manually override appUrl if needed
- Auto-Sync: Token verification mutation returns updated appUrl from server

### 2. Main Menu (Check-In vs Check-Out)
- **Two Primary Buttons**:
  - **Arrivée (Check-In)**: Start visitor arrival workflow
  - **Départ (Check-Out)**: Start visitor departure workflow
- **Theme**: Teal (arrival) / Orange (departure)
- **Visual Feedback**: Large icons, smooth transitions, tap animations

### 3. Check-In Workflow (Arrivée)

#### Step 1: Visitor Selection
- **Prompt**: "Nouveau visiteur" vs "Visiteur enregistré"
- **New Visitor Path**: Full form capture
- **Existing Visitor Path**: Search by name or phone, then destination form

#### Step 1a: Existing Visitor Search
- **Input**: Search field (name or phone, min 2 characters)
- **Query Hook**: `useVisitorSearch(query)` with 400ms debounce
- **Results**: List of masked visitor records
- **Behavior**:
  - Show active on-site visitors in amber (can't re-check-in)
  - Tap to select → proceed to destination form

#### Step 1b: New Visitor Form
- **Fields** (step-based progression):
  - First name (required)
  - Last name (required)
  - Phone (optional)
  - Company (optional)
  - Visitor type (dropdown via `useVisitorTypes()`)
- **Validation**: Zod schema

#### Step 2: Destination Information
- **Fields** (for both new & existing):
  - Host (dropdown via `useHosts()`)
  - Department (dropdown via `useDepartments()`)
  - Service (dropdown via `useServices()`)
  - Purpose (text field, optional)

#### Step 2a: Vehicle Information (Conditional)
- **Question**: "Êtes-vous venu avec un véhicule ?"
- **If Yes**:
  - Plate number (required)
  - Vehicle type (dropdown: Car, Truck, Motorcycle, Other)
  - Brand (optional)
  - Color (optional)
  - Passenger count (number input)

#### Step 3: Photo Capture (Conditional)
- **Visitor Photo**: If `requireVisitorPhoto = 1`
  - Camera capture via `useUploadPhoto()` mutation
- **Vehicle Photo**: If `requireVehiclePhoto = 1`
  - Camera capture via `useUploadPhoto()` mutation

#### Step 4: Signature Pad (Conditional)
- **Signature**: If `requireSignature != 0`
  - Touch-based signature capture
  - Stored as base64

#### Step 5: Review & Submit
- **Summary Screen**: Visitor info, destination, vehicle, photos, signature
- **Mutation**: `useCreateVisit()` → POST `/api/kiosk/visits`
- **Success**: Show "Bienvenue !" screen with 3-second auto-reset
- **Cache**: Invalidates `on-site-visitors` query on success

### 4. Check-Out Workflow (Départ)

#### Step 1: Existing Visitor Search
- **Query Hook**: `useOnSiteVisitors()` (auto-refreshes every 60s)
- **Results**: List of currently checked-in visitors
- **Search**: Local filtering by name or phone

#### Step 2: Confirm & Check-Out
- **Tap** on visitor → Mutation: `useCheckoutVisit()` → POST `/api/kiosk/visits/{visitId}/checkout`
- **Success**: Show "Merci de votre visite !" screen with 3-second auto-reset
- **Cache**: Invalidates `on-site-visitors` query on success

### 5. Success Screen
- **Check-In**: Green badge, "Bienvenue !"
- **Check-Out**: Green badge, "Merci de votre visite !"
- **Timeout**: 3 seconds → auto-reset to main menu
- **Manual Reset**: "Retour à l'accueil" button

### 6. Device Management
- **Heartbeat**: `useDevicePing()` hook pings every 2 minutes (keep-alive)
- **Device Reset**: Settings screen to forget token and re-pair
- **Offline**: Queries/mutations retry with exponential backoff via TanStack Query

---

## Technical Architecture

### Technology Stack

**Mobile Framework**:
- React Native (cross-platform)
- Expo (managed build & deployment)
- Expo Router (file-based routing)
- Expo Camera (photo capture)

**State Management**:
- **TanStack Query v5** (React Query) — primary state management for all API calls
- React Context — AppConfig (appUrl, token, tenantSlug), FormState (multi-step form)
- React Hooks — local component state

**Forms & Validation**:
- React Hook Form (lightweight)
- Zod (runtime validation)

**Networking**:
- Axios (HTTP client with interceptors)
- Expo FileSystem (for photo handling)
- TanStack Query mutations for optimistic updates

**Local Storage**:
- Expo SecureStore (token encryption)
- AsyncStorage (appUrl, settings cache)

**UI & Styling**:
- **NativeWind CSS** (Tailwind CSS for React Native)
- Lucide React Native (icons)

**Gestures & Animations**:
- React Native Animated API
- Gesture Handler (touch handling)

**Debugging**:
- TanStack Query DevTools (development)
- React Native Debugger (optional)

---

### Folder Structure

```
expo-kiosk/
├── app/                        # Expo Router screens
│   ├── _layout.tsx            # Root layout
│   ├── index.tsx              # Routes to pairing OR main menu
│   ├── (pairing)/
│   │   ├── _layout.tsx
│   │   └── qr-scanner.tsx     # QR code scanner
│   ├── (main)/
│   │   ├── _layout.tsx
│   │   ├── menu.tsx           # IN/OUT buttons
│   │   ├── (check-in)/
│   │   ├── (check-out)/
│   │   └── settings.tsx       # Device reset, URL override
│   └── +html.tsx              # Expo router web support (optional)
├── components/
│   ├── primitives/            # NativeWind-styled components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── FormField.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Spinner.tsx
│   ├── forms/
│   │   ├── VisitorForm.tsx
│   │   ├── DestinationForm.tsx
│   │   ├── VehicleForm.tsx
│   │   └── SignaturePad.tsx
│   ├── CameraCapture.tsx
│   ├── SuccessAnimation.tsx
│   └── DevicePinging.tsx       # Background heartbeat component
├── hooks/
│   ├── useAppConfig.ts        # Access AppConfig context
│   ├── useVerifyToken.ts      # Mutation: verify token after QR scan
│   ├── useSettings.ts         # Query: fetch kiosk settings
│   ├── useVisitorTypes.ts     # Query: dropdown options
│   ├── useDepartments.ts
│   ├── useHosts.ts
│   ├── useServices.ts
│   ├── useVisitorSearch.ts    # Query: search visitors (debounced)
│   ├── useOnSiteVisitors.ts   # Query: active visitors (auto-refresh)
│   ├── useCreateVisit.ts      # Mutation: check-in
│   ├── useCheckoutVisit.ts    # Mutation: check-out
│   ├── useUploadPhoto.ts      # Mutation: photo upload
│   ├── useDevicePing.ts       # Effect: 2-min heartbeat
│   └── ...
├── api/
│   ├── client.ts              # Axios instance initialization
│   ├── endpoints.ts           # API path constants
│   └── types.ts               # Request/response TS interfaces
├── context/
│   ├── AppConfigProvider.tsx  # appUrl, token, tenantSlug
│   ├── FormContextProvider.tsx # Multi-step form state
│   └── ...
├── services/
│   ├── storage.ts             # AsyncStorage wrapper
│   ├── secureStorage.ts       # SecureStore wrapper
│   ├── qrParser.ts            # Parse QR JSON payload
│   ├── validation.ts          # Zod schemas
│   └── ...
├── theme/
│   ├── colors.ts              # Design tokens
│   ├── typography.ts
│   └── spacing.ts
├── utils/
│   ├── formatting.ts
│   └── ...
├── types/
│   └── index.ts               # Shared TS interfaces
├── app.json                   # Expo config
├── eas.json                   # Expo EAS (builds)
├── package.json
├── tsconfig.json
├── tailwind.config.js         # NativeWind config
└── nativewind.config.js
```

---

### API Endpoints (All Require Device Token in Authorization Header)

**Pairing** (TanStack Query mutations):
- `POST /api/kiosk/device/verify-token` → Validate token & get config
  - Hook: `useVerifyToken()`
  - Called after QR scan
  - Returns: `{ settings, appUrl, tenantSlug }`
  - On success: stores in context, redirects to main menu
  - On 401: reset device, redirect to pairing

**Data Fetch** (TanStack Query queries):
- `GET /api/kiosk/settings` → Fetch config (photo/signature requirements)
  - Hook: `useSettings()`
  - staleTime: 5 min
  - enabled: !!appUrl (don't fetch until paired)

- `GET /api/kiosk/visitor-types` → Hook: `useVisitorTypes()`, staleTime: 10 min
- `GET /api/kiosk/departments` → Hook: `useDepartments()`, staleTime: 10 min
- `GET /api/kiosk/hosts` → Hook: `useHosts()`, staleTime: 10 min
- `GET /api/kiosk/services` → Hook: `useServices()`, staleTime: 10 min

- `GET /api/kiosk/on-site-visitors` → Active visitors for checkout
  - Hook: `useOnSiteVisitors()`
  - refetchInterval: 60s (auto-refresh)
  - staleTime: 30s

**Search** (TanStack Query queries with debouncing):
- `GET /api/kiosk/visitors/search?q={query}` → Masked visitor search
  - Hook: `useVisitorSearch(query, debounceMs: 400)`
  - enabled: !!appUrl && query.length >= 2
  - staleTime: 30s

**Operations** (TanStack Query mutations):
- `POST /api/kiosk/visits` → Create visit (check-in)
  - Hook: `useCreateVisit()`
  - onSuccess: `queryClient.invalidateQueries({ queryKey: ['on-site-visitors'] })`

- `POST /api/kiosk/visits/{visitId}/checkout` → Checkout
  - Hook: `useCheckoutVisit()`
  - onSuccess: `queryClient.invalidateQueries({ queryKey: ['on-site-visitors'] })`

- `POST /api/kiosk/device/ping` → Heartbeat (keep-alive)
  - Hook: `useDevicePing()` (runs every 2 minutes)
  - No error handling (optional operation)

**Upload** (TanStack Query mutation):
- `POST /api/kiosk/upload` → Upload photo (multipart/form-data)
  - Hook: `useUploadPhoto()`
  - Returns: `{ photoUrl, timestamp }`

---

## Global State & Context

### AppConfig Context

```typescript
// context/AppConfigProvider.tsx
interface AppConfig {
  appUrl: string | null;        // Base URL from QR
  tenantSlug: string | null;    // Tenant from QR
  deviceToken: string | null;   // Device token from QR
  isPaired: boolean;
  isLoading: boolean;           // During verification
}

interface AppConfigContextType extends AppConfig {
  setPairing: (appUrl: string, tenantSlug: string, deviceToken: string) => void;
  resetDevice: () => void;
  updateAppUrl: (url: string) => void; // Manual override (settings)
}

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  // Loads from SecureStore & AsyncStorage on mount
  // Provides context for all hooks
}

export function useAppConfig() {
  return useContext(AppConfigContext);
}
```

### Form State Context

```typescript
// context/FormContextProvider.tsx
interface FormState {
  step: number;
  visitorData: VisitorInput;
  destinationData: DestinationInput;
  vehicleData: VehicleInput | null;
  photos: { visitor?: string; vehicle?: string };
  signature: string | null;
}

interface FormContextType extends FormState {
  updateVisitorData: (data: Partial<VisitorInput>) => void;
  updateDestinationData: (data: Partial<DestinationInput>) => void;
  // ...
  resetForm: () => void;
}
```

---

## TanStack Query Setup

### Query Client Configuration

```typescript
// In app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min default
      gcTime: 1000 * 60 * 10,        // 10 min garbage collection (formerly cacheTime)
      retry: 2,                       // Retry failed queries twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'online',          // Don't retry offline
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <AppConfigProvider>
        <Stack />
      </AppConfigProvider>
    </PersistQueryClientProvider>
  );
}
```

### API Client Initialization

```typescript
// api/client.ts
import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

let apiClient: AxiosInstance;

export async function initializeApiClient(appUrl: string, deviceToken: string) {
  apiClient = axios.create({
    baseURL: appUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deviceToken}`,
      'X-Device-Type': 'expo-kiosk',
      'X-App-Version': require('../../package.json').version,
    },
  });

  // Error interceptor: handle 401 (token expired)
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token invalid → reset device
        SecureStore.deleteItemAsync('kiosk_token').catch(console.error);
        // Redirect to pairing screen (handled by app router)
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
}

export function getApiClient() {
  if (!apiClient) {
    throw new Error('API Client not initialized. Call initializeApiClient first.');
  }
  return apiClient;
}
```

### Hook Examples

```typescript
// hooks/useSettings.ts
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/api/client';
import { useAppConfig } from '@/context/AppConfigProvider';

export function useSettings() {
  const { appUrl } = useAppConfig();

  return useQuery({
    queryKey: ['settings', appUrl],
    queryFn: () => getApiClient().get('/api/kiosk/settings'),
    staleTime: 5 * 60 * 1000,
    enabled: !!appUrl,
  });
}

// hooks/useVisitorSearch.ts
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getApiClient } from '@/api/client';
import { useAppConfig } from '@/context/AppConfigProvider';

export function useVisitorSearch(query: string, debounceMs = 400) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const { appUrl } = useAppConfig();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ['visitors-search', debouncedQuery, appUrl],
    queryFn: () => getApiClient().get(`/api/kiosk/visitors/search?q=${debouncedQuery}`),
    enabled: !!appUrl && debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  });
}

// hooks/useCreateVisit.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/client';
import type { CreateVisitPayload } from '@/api/types';

export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visitData: CreateVisitPayload) =>
      getApiClient().post('/api/kiosk/visits', visitData),
    onSuccess: () => {
      // Invalidate on-site-visitors cache after successful check-in
      queryClient.invalidateQueries({ queryKey: ['on-site-visitors'] });
    },
  });
}

// hooks/useOnSiteVisitors.ts
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@/api/client';
import { useAppConfig } from '@/context/AppConfigProvider';

export function useOnSiteVisitors() {
  const { appUrl } = useAppConfig();

  return useQuery({
    queryKey: ['on-site-visitors', appUrl],
    queryFn: () => getApiClient().get('/api/kiosk/on-site-visitors'),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Auto-refresh every 60s
    enabled: !!appUrl,
  });
}

// hooks/useDevicePing.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/api/client';
import { useAppConfig } from '@/context/AppConfigProvider';

export function useDevicePing() {
  const { appUrl } = useAppConfig();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!appUrl) return;

    // Ping immediately
    getApiClient().post('/api/kiosk/device/ping').catch(console.error);

    // Then every 2 minutes
    const interval = setInterval(() => {
      getApiClient().post('/api/kiosk/device/ping').catch(console.error);
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [appUrl]);
}

// hooks/useVerifyToken.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppConfig } from '@/context/AppConfigProvider';
import { initializeApiClient } from '@/api/client';

export function useVerifyToken() {
  const { setPairing } = useAppConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appUrl,
      token,
      tenantSlug,
    }: {
      appUrl: string;
      token: string;
      tenantSlug: string;
    }) => {
      // Initialize API client with extracted credentials
      await initializeApiClient(appUrl, token);

      // Verify token
      const response = await getApiClient().post('/api/kiosk/device/verify-token', {
        token,
      });

      return response.data;
    },
    onSuccess: (data, { appUrl, token, tenantSlug }) => {
      // Store pairing in context
      setPairing(data.appUrl || appUrl, tenantSlug, token);

      // Prefetch settings and other data
      queryClient.prefetchQuery({
        queryKey: ['settings', appUrl],
        queryFn: () => getApiClient().get('/api/kiosk/settings'),
      });
    },
  });
}
```

---

## Implementation Phases

### Phase 0: QR Pairing Setup (3-4 days)
- [ ] Expo project scaffold with Expo Router
- [ ] NativeWind CSS setup & Tailwind config
- [ ] Expo Camera + QR scanner setup
- [ ] Parse QR JSON payload (appUrl, token, tenantSlug)
- [ ] AppConfig Context setup
- [ ] TanStack Query provider + QueryClient config
- [ ] API client initialization with dynamic baseURL
- [ ] `useVerifyToken()` mutation for pairing
- [ ] Pairing flow screen with error handling

### Phase 1: Foundation (Week 1-2)
- [ ] Root layout routing logic (paired vs unpaired)
- [ ] Main menu UI (IN/OUT buttons) using NativeWind
- [ ] All data fetch hooks (useSettings, useVisitorTypes, useDepartments, useHosts, useServices)
- [ ] Device ping hook (`useDevicePing()`)
- [ ] Error handling & 401 interceptor
- [ ] Loading states & skeleton UI

### Phase 2: Check-In Flow (Week 2-3)
- [ ] Visitor selection screen (new vs existing)
- [ ] Existing visitor search with `useVisitorSearch()` hook
- [ ] New visitor form (multi-step, Zod validation)
- [ ] Destination form with dropdown queries
- [ ] Vehicle form (conditional)
- [ ] `useCreateVisit()` mutation
- [ ] Automatic cache invalidation on success

### Phase 3: Media & Finalization (Week 3-4)
- [ ] Camera capture using Expo Camera
- [ ] `useUploadPhoto()` mutation for blob storage
- [ ] Signature pad component
- [ ] Review screen & final submission
- [ ] Success animation & auto-reset

### Phase 4: Check-Out Flow (Week 4)
- [ ] Check-out search with `useOnSiteVisitors()` hook
- [ ] Visitor selection & `useCheckoutVisit()` mutation
- [ ] Auto-refresh on-site list (refetchInterval: 60s)
- [ ] Success screen

### Phase 5: Polish & Testing (Week 5)
- [ ] Animations & transitions (NativeWind + React Native Animated)
- [ ] Error handling & toast notifications
- [ ] TanStack Query DevTools integration (development)
- [ ] Device reset / re-pairing (settings screen)
- [ ] Manual appUrl override in settings (hybrid fallback)
- [ ] Testing on real devices (QR code generation)
- [ ] Cache invalidation testing (mutations + queries)
- [ ] EAS build configuration

### Phase 6: Deployment (Week 6+)
- [ ] iOS App Store submission
- [ ] Google Play Store submission
- [ ] Admin dashboard: Generate pairing QR codes
- [ ] Admin dashboard: QR codes encode (token + appUrl + tenantSlug)
- [ ] Release notes & documentation

---

## Design & UX

### Color Palette

| Role             | Color            | Usage                    |
| ---------------- | ---------------- | ------------------------ |
| **Primary**      | Teal (#14B8A6)   | Check-in, accents        |
| **Secondary**    | Orange (#EA580C) | Check-out, warnings      |
| **Success**      | Green (#10B981)  | Success confirmation     |
| **Background**   | #F0FDFA          | Screen background        |
| **Surface**      | White / Teal-50  | Cards, inputs            |
| **Text Primary** | #0F766E          | Main text                |
| **Text Muted**   | #6B7280          | Secondary text, helpers  |

### Typography

- **Headings**: Bold, large (NativeWind `text-2xl font-black`)
- **Body**: Regular, readable (NativeWind `text-base`)
- **Labels**: Small, uppercase (NativeWind `text-xs uppercase tracking-wide`)

### Layout Principles

- **Safe Area**: Account for notches, status bars
- **Touch Targets**: Min 48x48 (better: 64x64 for tablets)
- **Spacing**: Generous padding (NativeWind `p-6` or higher)
- **Full-Screen Forms**: ScrollView with sticky button at bottom
- **Animations**: Smooth fade/slide transitions (300ms)

### Responsive Design

- **iPad (12.9")**: Landscape: two-column, Portrait: full-width
- **10" Tablet (Android)**: Portrait: optimized single-column
- **Large Phone (7")**: Single column, vertically scrollable

---

## Performance Targets

- **App Startup**: < 2 seconds (cold start)
- **Screen Navigation**: < 300ms transitions
- **Form Submission**: < 5 seconds (including photo upload)
- **Search Results**: < 1 second (with debouncing)
- **Memory**: < 150MB peak usage
- **Bundle Size**: < 50MB (iOS), < 40MB (Android)
- **Query Response**: < 500ms (cached)

---

## Testing Strategy

### Unit Tests
- Zod validation schemas
- QR payload parsing
- API request/response transformations

### Integration Tests
- Device pairing flow (QR → verification)
- Multi-step form submission
- TanStack Query mutations & invalidation
- API mock tests (MSW)

### E2E Tests (Detox)
- Full check-in workflow
- Full check-out workflow
- Photo capture & upload
- Device reset & re-pairing
- Offline query retry

### Device Testing
- iPad 12.9" (landscape & portrait)
- iPad 10.9" (landscape & portrait)
- Samsung Galaxy Tab 10" (Android)
- Large Android phone (7")

---

## Known Limitations & Future Enhancements

### MVP Limitations
- No persistent user accounts (device-only)
- No offline queue (Phase 2 enhancement)
- No admin console (admin features on web dashboard)
- No biometric authentication (Phase 2 enhancement)

### Future Enhancements
- Barcode/QR code scanning for quick check-out
- Multi-language support (currently French)
- Dark mode toggle
- Accessibility improvements (voice guidance)
- Offline submission queue with sync indicator
- Analytics & device usage reporting via TanStack Query persister
- Batch requests optimization

---

## Deployment & Maintenance

### EAS Configuration

```json
{
  "build": {
    "preview": {
      "ios": { "resourceClass": "m1-medium" },
      "android": { "resourceClass": "large" }
    },
    "production": {
      "ios": { "resourceClass": "m1-large" },
      "android": { "resourceClass": "large" }
    }
  },
  "submit": {
    "production": {
      "ios": { "ascAppId": "123456789" },
      "android": { "serviceAccount": "path/to/sa.json" }
    }
  }
}
```

### Update Strategy

- **Minor Updates**: OTA updates via Expo (no app store re-submission)
- **Major Updates**: Full app store release (quarterly)
- **Bug Fixes**: Hotfix builds within 24 hours

### Monitoring

- Error tracking (Sentry integration)
- Crash reporting (Expo built-in)
- Device health checks (heartbeat API via `useDevicePing()`)
- Usage analytics (custom analytics endpoint)

---

## Success Criteria

✅ **Launch Ready When**:
- [ ] QR pairing working end-to-end (no manual URL entry)
- [ ] TanStack Query queries & mutations integrated throughout
- [ ] All Phase 0-5 tasks complete
- [ ] Device testing passes on target hardware
- [ ] >95% of API endpoints tested via TanStack Query hooks
- [ ] Cache invalidation working correctly (mutations refresh queries)
- [ ] Error handling & 401 interceptor tested
- [ ] Performance targets met (<2s startup, <300ms navigation)
- [ ] Offline query retry working with exponential backoff
- [ ] Admin dashboard generates QR codes with payload
- [ ] Settings screen allows manual appUrl override (hybrid fallback)
- [ ] DevPing heartbeat running reliably
- [ ] Deployment to app stores successful
- [ ] Documentation complete for admin & support teams

---

## Contact & Questions

For implementation details, refer to:
- Web kiosk source: [features/tenants/forms/VisitorKioskForm.tsx](features/tenants/forms/VisitorKioskForm.tsx)
- API specs: Main app backend documentation
- Design system: [context/ui-context.md](context/ui-context.md)
- Code standards: [context/code-standards.md](context/code-standards.md)
