# Mobile Kiosk App - React Native Expo Conversion Plan

## Overview

Convert the existing web-based `VisitorKioskForm` (Next.js React) into a **production-ready React Native Expo mobile app** for iOS and Android kiosks. The app will maintain feature parity with the web kiosk while optimizing for touch, offline capability, and native integrations.

**Target Platforms:** iOS (iPads), Android (tablets/kiosks)
**Framework:** React Native Expo
**Package Manager:** EAS (Expo Application Services) for builds
**API:** Uses existing VMS SaaS public kiosk API (`/api/tenants/{slug}/public/*`)

---

## Current Web Kiosk Architecture

### Web Implementation (Reference)
- **File:** `features/tenants/forms/VisitorKioskForm.tsx`
- **Features:**
  - Device pairing flow (generate code → poll approval → receive token)
  - Check-in (new visitor + existing visitor modes)
  - Check-out (search on-site visitors)
  - Photo capture (visitor + vehicle)
  - Signature capture
  - Vehicle info (plate, type, brand, color, passenger count)
  - Form validation (Zod schemas)
  - Upload with progress tracking (XHR-based)
  - Retry/backoff on upload failure
  - Offline-capable token storage
  - Real-time heartbeat pings (keep-alive)

### Key Dependencies
- `react-hook-form` — Form state & validation
- `zod` — Schema validation
- `@tanstack/react-query` — Data fetching & caching
- `sonner` — Toast notifications
- `lucide-react` — Icons
- `shadcn/ui` — UI components (buttons, inputs, modals, etc.)

### UI Layers
1. **Pairing Screen** (`KioskPairingScreen.tsx`) — Displays code + polling UI
2. **Main Menu** — Choose "Check-in" or "Check-out"
3. **Check-in Flow** — New or Existing visitor
   - **New Visitor:** Personal info → Photo → Vehicle info → Signature → Destination → Submit
   - **Existing Visitor:** Search → Select → Destination → Photo → Submit
4. **Check-out Flow** — Search on-site → Select → Checkout
5. **Success Screen** — Confirmation message + reset button

### API Integration Points
- `/api/tenants/{slug}/devices/pairing-code` — Generate pairing code
- `/api/tenants/{slug}/devices/pairing-status?code={code}` — Poll approval
- `/api/tenants/{slug}/devices/verify` — Validate device token
- `/api/tenants/{slug}/devices/ping` — Heartbeat (keep-alive)
- `/api/tenants/{slug}/public/*` — Public data (visitors, departments, hosts, services, etc.)
- `/api/tenants/{slug}/public/visits` — Create check-in visit
- `/api/tenants/{slug}/public/checkouts` — Create checkout
- `/api/tenants/{slug}/upload` — Upload photos (multipart/form-data, XHR)

---

## Mobile App Architecture

### Project Structure

```
mobile-kiosk/
├── app.json                          # Expo config
├── eas.json                          # EAS build config
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── babel.config.js                   # Babel config
├── app/                              # Navigation & routes (Expo Router)
│   ├── _layout.tsx                   # Root layout (providers)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── pairing.tsx               # Pairing screen
│   │   └── index.tsx                 # Onboarding / config
│   └── (kiosk)/
│       ├── _layout.tsx
│       ├── index.tsx                 # Main menu (Check-in / Check-out)
│       ├── check-in/
│       │   ├── _layout.tsx
│       │   ├── index.tsx             # Mode selector (New / Existing)
│       │   ├── new-visitor/
│       │   │   ├── index.tsx         # Personal info
│       │   │   ├── photo.tsx         # Visitor photo
│       │   │   ├── vehicle.tsx       # Vehicle info
│       │   │   ├── signature.tsx     # Signature pad
│       │   │   └── destination.tsx   # Host / department / purpose
│       │   └── existing-visitor/
│       │       ├── index.tsx         # Search & select
│       │       ├── photo.tsx         # Photo capture
│       │       └── destination.tsx   # Host / department / purpose
│       ├── check-out/
│       │   ├── index.tsx             # Search on-site visitors
│       │   └── confirm.tsx           # Confirm checkout
│       └── success.tsx               # Success screen
├── src/
│   ├── api/
│   │   ├── client.ts                 # API base URL + fetch wrapper
│   │   ├── pairing.ts                # Pairing endpoints
│   │   ├── devices.ts                # Device verify, ping
│   │   ├── public.ts                 # Public data fetches
│   │   ├── visits.ts                 # Create/checkout visits
│   │   └── upload.ts                 # Photo upload (with progress)
│   ├── components/
│   │   ├── Camera.tsx                # Camera capture wrapper
│   │   ├── SignaturePad.tsx          # Signature pad (react-native-signature-pad)
│   │   ├── Loading.tsx               # Loading spinner
│   │   ├── ErrorBoundary.tsx         # Error boundary
│   │   ├── Toast.tsx                 # Toast notifications (native-toast)
│   │   └── SafeAreaWrapper.tsx       # Safe area wrapper
│   ├── contexts/
│   │   ├── AuthContext.tsx           # Device token + pairing state
│   │   ├── KioskContext.tsx          # Kiosk session state (tenant, mode)
│   │   └── ApiContext.tsx            # API configuration (base URL, tenant slug)
│   ├── hooks/
│   │   ├── useAuth.ts                # Get/set device token
│   │   ├── useKiosk.ts               # Get kiosk state
│   │   ├── useApi.ts                 # Get API base URL
│   │   ├── useFetch.ts               # Generic fetch wrapper with retry
│   │   ├── usePublicData.ts          # Fetch visitors, departments, hosts, etc.
│   │   ├── useUpload.ts              # Upload photos with progress
│   │   ├── usePairing.ts             # Pairing flow logic
│   │   └── useHeartbeat.ts           # Heartbeat ping logic
│   ├── lib/
│   │   ├── storage.ts                # AsyncStorage wrapper (secure token storage)
│   │   ├── schemas.ts                # Zod schemas (copy from web)
│   │   ├── utils.ts                  # Utility functions
│   │   ├── platform.ts               # Platform detection helpers
│   │   └── camera.ts                 # Camera permission helpers
│   ├── types/
│   │   ├── api.ts                    # API response types
│   │   ├── kiosk.ts                  # Kiosk domain types (Visitor, Host, etc.)
│   │   └── forms.ts                  # Form state types
│   └── theme/
│       ├── colors.ts                 # Design tokens (match web design system)
│       ├── spacing.ts
│       └── typography.ts
├── .env.example                      # Environment template
└── README.md                         # Setup & deployment guide
```

---

## Key Differences from Web Kiosk

### 1. Navigation Model
**Web:** React Router (implicit page transitions in form state)
**Mobile:** Expo Router (file-based routing, explicit navigation stack)

- Use `expo-router` for screen navigation (similar to Next.js App Router)
- Implement a tab-based or stack-based navigation pattern
- Handle navigation history for "back" functionality

### 2. Components & UI

| Web Component | Mobile Alternative | Notes |
|---------------|-------------------|-------|
| `shadcn/ui` Button | `Pressable` or `react-native-paper/Button` | NativeBase, React Native Paper, or custom Pressable |
| `shadcn/ui` Input | `TextInput` or `react-native-paper/TextInput` | Handle keyboard better on mobile |
| `shadcn/ui` Select | `PickerSelect` or custom modal | No native HTML select on mobile |
| `shadcn/ui` Modal | `Modal` or `react-native-paper/Modal` | Use native modal API |
| Tailwind CSS | NativeWind or StyleSheet | NativeWind supports Tailwind in RN; or use inline styles |
| `lucide-react` Icons | `react-native-vector-icons` or `expo-icons` | Use Expo Icons for consistency |
| `sonner` Toasts | `react-native-toast-message` | Native toast library for RN |

**Recommendation:** Use **NativeWind** (Tailwind for React Native) to keep styling familiar and consistent with web.

### 3. Native APIs & Permissions

| Feature | Native API | Permissions |
|---------|-----------|-------------|
| Camera (photos) | `expo-camera` | `CAMERA` + `CAMERA_ROLL` |
| Signature pad | `react-native-signature-pad` or custom Canvas | None |
| File upload | `expo-file-system` + `axios` or RN `fetch` | `CAMERA_ROLL` |
| Secure storage (token) | `expo-secure-store` or `react-native-keychain` | None (system-managed) |
| Offline queue | `SQLite` via `expo-sqlite` | None |
| Keep-alive (background) | `react-native-background-timer` | `WAKE_LOCK` (Android) |
| Network status | `@react-native-community/netinfo` | `INTERNET` + `ACCESS_NETWORK_STATE` |

### 4. Storage & Offline Support

**Web:**
- Token stored in `localStorage`
- Pending uploads stored in component state (lost on refresh)

**Mobile:**
- Token → `expo-secure-store` (encrypted)
- Pending visits/uploads → `expo-sqlite` (local DB with sync queue)
- Network status → `@react-native-community/netinfo` (detect online/offline)

### 5. Form Handling

**Web:** `react-hook-form` + `Zod`
**Mobile:** Same (`react-hook-form` works in RN) + keep `Zod` schemas

### 6. Data Fetching & Caching

**Web:** `@tanstack/react-query`
**Mobile:** Options:
- Keep `@tanstack/react-query` (works in RN)
- Or use simpler `axios` + custom cache layer

**Recommendation:** Keep React Query for consistency and powerful features.

### 7. Camera Capture

**Web:** HTML `<input type="file">` or third-party component
**Mobile:** `expo-camera` (native camera)

```typescript
// Example: Capture photo
const photo = await CameraRef.current?.takePictureAsync({
  quality: 0.8,
  base64: true,
});
// Convert to Blob, then upload
```

### 8. Signature Capture

**Web:** Custom canvas-based SignaturePad
**Mobile:** `react-native-signature-pad` library

### 9. Heartbeat / Keep-Alive

**Web:** `setInterval` + fetch
**Mobile:** Same approach, but use `react-native-background-timer` for background operation (on iOS, requires special handling)

### 10. Upload with Progress

**Web:** XHR-based upload with `onprogress` callback
**Mobile:** Use `axios` or `fetch` with `onUploadProgress` (for axios)

```typescript
// Axios example
axios.post(url, formData, {
  headers: { Authorization: `Bearer ${token}` },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setProgress(percentCompleted);
  },
});
```

---

## Implementation Phases

### Phase 1: Project Setup & Foundation (Week 1)
- [ ] Initialize Expo project with TypeScript
- [ ] Set up folder structure
- [ ] Configure Expo Router for navigation
- [ ] Set up environment variables (.env)
- [ ] Create API client wrapper (base URL, auth headers)
- [ ] Implement authentication context (token storage)
- [ ] Set up styling system (NativeWind or StyleSheet)
- [ ] Create basic loading + error screens

**Deliverable:** Barebone app with navigation skeleton

### Phase 2: Pairing & Authentication (Week 1-2)
- [ ] Create pairing flow (`pairing.tsx`)
  - [ ] Display pairing code from API
  - [ ] Implement polling logic (check approval status)
  - [ ] Store device token securely (`expo-secure-store`)
- [ ] Create auth context to manage token lifecycle
- [ ] Implement token verification on app startup
- [ ] Add device reset/logout button

**Deliverable:** Kiosk can pair and obtain device token

### Phase 3: Check-In Flow (Week 2-3)
- [ ] **Main Menu Screen** — Choose Check-in or Check-out
- [ ] **Mode Selector** — New Visitor or Existing
- [ ] **New Visitor Mode:**
  - [ ] Personal info form (firstName, lastName, phone, company, visitorType)
  - [ ] Camera capture for visitor photo
  - [ ] Vehicle info form (plate, type, brand, color, passenger count)
  - [ ] Signature capture
  - [ ] Destination selector (host, department, service, purpose)
  - [ ] Submission with photo upload
- [ ] **Existing Visitor Mode:**
  - [ ] Search by name/phone (with debounce)
  - [ ] Select visitor from results
  - [ ] Capture photo (optional)
  - [ ] Destination selector
  - [ ] Submission

**Deliverable:** Full check-in flow working with API

### Phase 4: Check-Out Flow (Week 3)
- [ ] Search on-site visitors
- [ ] Display list with visitor photos
- [ ] Confirm checkout
- [ ] Success screen

**Deliverable:** Check-out functionality complete

### Phase 5: Offline & Resilience (Week 4)
- [ ] Implement offline queue (SQLite)
- [ ] Network status detection
- [ ] Automatic sync when online
- [ ] Retry logic with exponential backoff
- [ ] Show sync status in UI
- [ ] Handle long uploads + network interruptions

**Deliverable:** App works offline, queues visits, syncs when available

### Phase 6: Polish & Testing (Week 4-5)
- [ ] Heartbeat keep-alive logic
- [ ] Error boundaries + error handling
- [ ] Loading states + skeleton screens
- [ ] Accessibility (labels, colors, touch targets)
- [ ] Manual E2E testing (pairing → check-in → check-out)
- [ ] Test on iOS and Android simulators

**Deliverable:** Production-ready app

### Phase 7: Build & Deployment (Week 5)
- [ ] Configure `eas.json` for builds
- [ ] Build iOS app (requires Apple Developer account)
- [ ] Build Android app
- [ ] Test on real devices
- [ ] Document deployment process

**Deliverable:** App published to Expo EAS

---

## Technical Stack & Dependencies

### Core
```json
{
  "expo": "^51.0.0",
  "expo-router": "^3.0.0",
  "react-native": "0.74.0",
  "typescript": "^5.0.0"
}
```

### Forms & Validation
```json
{
  "react-hook-form": "^7.50.0",
  "zod": "^3.22.0"
}
```

### Data & API
```json
{
  "@tanstack/react-query": "^5.0.0",
  "axios": "^1.6.0"
}
```

### UI & Components
```json
{
  "nativewind": "^2.0.0",
  "react-native-paper": "^5.0.0",
  "react-native-vector-icons": "^10.0.0",
  "react-native-toast-message": "^2.1.0"
}
```

### Native APIs
```json
{
  "expo-camera": "^14.0.0",
  "expo-image-picker": "^15.0.0",
  "expo-secure-store": "^13.0.0",
  "expo-sqlite": "^14.0.0",
  "expo-file-system": "^17.0.0",
  "@react-native-community/netinfo": "^11.0.0",
  "react-native-background-timer": "^2.4.0"
}
```

### Utilities
```json
{
  "date-fns": "^2.30.0",
  "lodash-es": "^4.17.21"
}
```

---

## Critical Implementation Details

### 1. Token Management (Secure Storage)
```typescript
// src/lib/storage.ts
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'kiosk_device_token';

export async function saveToken(token: string) {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, token);
  } catch (err) {
    console.error('Failed to save token:', err);
  }
}

export async function getToken() {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to retrieve token:', err);
    return null;
  }
}

export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear token:', err);
  }
}
```

### 2. Photo Upload with Progress
```typescript
// src/api/upload.ts
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

export async function uploadPhoto(
  apiBaseUrl: string,
  tenantSlug: string,
  deviceToken: string,
  photoUri: string,
  filename: string,
  onProgress?: (progress: number) => void
) {
  const formData = new FormData();
  
  // Read file as binary
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  formData.append('file', {
    uri: photoUri,
    type: 'image/jpeg',
    name: filename,
  } as any);

  try {
    const response = await axios.post(
      `${apiBaseUrl}/api/tenants/${tenantSlug}/upload?filename=${filename}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${deviceToken}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress?.(percentCompleted);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Upload failed: ${error}`);
  }
}
```

### 3. Offline Queue with SQLite
```typescript
// src/lib/offline-queue.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('kiosk.db');

export async function initQueue() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_visits (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      photos TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending'
    );
  `);
}

export async function addPendingVisit(id: string, payload: any, photos?: any) {
  await db.runAsync(
    'INSERT INTO pending_visits (id, payload, photos) VALUES (?, ?, ?)',
    [id, JSON.stringify(payload), JSON.stringify(photos)]
  );
}

export async function getPendingVisits() {
  const result = await db.getAllAsync('SELECT * FROM pending_visits WHERE status = ?', ['pending']);
  return result;
}

export async function markVisitSynced(id: string) {
  await db.runAsync('UPDATE pending_visits SET status = ? WHERE id = ?', ['synced', id]);
}
```

### 4. Automatic Sync When Online
```typescript
// src/hooks/useOfflineSync.ts
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getPendingVisits, markVisitSynced } from '../lib/offline-queue';

export function useOfflineSync(tenantSlug: string, deviceToken: string) {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncPendingVisits();
      }
    });

    return unsubscribe;
  }, [tenantSlug, deviceToken]);

  async function syncPendingVisits() {
    const visits = await getPendingVisits();
    for (const visit of visits) {
      try {
        const payload = JSON.parse(visit.payload);
        await fetch(`/api/tenants/${tenantSlug}/public/visits`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${deviceToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        await markVisitSynced(visit.id);
      } catch (err) {
        console.error('Sync failed:', err);
      }
    }
  }
}
```

### 5. Camera Permission Handling
```typescript
// src/lib/camera.ts
import { Camera } from 'expo-camera';

export async function requestCameraPermission() {
  const { status } = await Camera.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission denied');
  }
  return status === 'granted';
}

export async function requestPhotoLibraryPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library permission denied');
  }
  return status === 'granted';
}
```

---

## Design & UX Considerations

### 1. Touch Targets
- Minimum 48x48dp (44x44pt on iOS)
- Large buttons for kiosk use (full-width CTAs)
- Avoid small tap areas

### 2. Typography & Readability
- Large text (18+pt) for kiosk visibility
- High contrast (dark on light, light on dark)
- Sans-serif font (Geist if possible, otherwise system default)

### 3. Screen Orientations
- Lock to landscape (common for kiosk tablets)
- Or support both with responsive layout
- Handle safe areas (notches, status bars)

### 4. Color Scheme
- Use design tokens from `context/ui-context.md`
- Teal primary color (#14B8A6)
- Light backgrounds for high visibility
- Accessible color contrast (WCAG AA+)

### 5. Navigation
- Clear back button on each screen
- Breadcrumb or progress indicator (steps 1-5 for new visitor)
- Avoid nested navigation depth

### 6. Loading States
- Show activity indicators during API calls
- Skeleton screens for data lists
- Disable buttons during submission

### 7. Error Handling
- Clear error messages
- Retry buttons for failed uploads
- Offline indicators when network is down

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Pairing: Generate code → scan in admin → approve → token received
- [ ] Check-in (New):
  - [ ] Fill personal info
  - [ ] Capture visitor photo
  - [ ] Fill vehicle info (optional)
  - [ ] Draw signature
  - [ ] Select destination
  - [ ] Upload completes
  - [ ] Success screen
- [ ] Check-in (Existing):
  - [ ] Search visitor
  - [ ] Select from results
  - [ ] Capture photo (optional)
  - [ ] Select destination
  - [ ] Upload completes
  - [ ] Success screen
- [ ] Check-out:
  - [ ] Search on-site visitor
  - [ ] Confirm checkout
  - [ ] Success screen
- [ ] Offline:
  - [ ] Disable network
  - [ ] Create visit (queued)
  - [ ] Re-enable network
  - [ ] Visit syncs automatically
- [ ] Permissions:
  - [ ] Camera permission requested
  - [ ] Graceful handling if denied
- [ ] Edge Cases:
  - [ ] Long upload (test with large file)
  - [ ] Network interruption during upload
  - [ ] Multiple retries
  - [ ] Token expiry / re-pairing

### Automated Testing (Future)
- Unit tests for hooks (usePairing, useUpload)
- Integration tests for API client
- E2E tests with Detox or Appium

---

## Environment Configuration

### .env.example
```
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://vms.yourdomain.com
EXPO_PUBLIC_TENANT_SLUG=acme-corp

# Build Configuration
EAS_BUILD_PROFILE=development
```

### Development vs. Production
- Dev: Point to staging API
- Prod: Point to production API (update via EAS secrets)

---

## Deployment

### Build Configuration (eas.json)
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" },
      "ios": { "buildType": "simulator" }
    },
    "production": {
      "android": { "buildType": "aab" },
      "ios": { "buildType": "archive" }
    }
  }
}
```

### Steps
1. Configure EAS account
2. Link Expo project
3. Set up iOS signing (provisioning profiles)
4. Set up Android keystore
5. Build with `eas build --platform all --profile production`
6. Distribute via:
   - Expo Go (development)
   - TestFlight (iOS testing)
   - Google Play Console (Android testing)
   - Private distribution (kiosk deployment)

---

## Known Challenges & Mitigations

| Challenge | Mitigation |
|-----------|-----------|
| Large form state across multiple screens | Use React Context + persist to AsyncStorage |
| Photo upload reliability on poor networks | Offline queue + exponential backoff + resume support |
| Camera permissions vary by platform | Platform-specific permission handlers |
| Signature pad accuracy | Test UX; provide clear instructions; allow redraw |
| Background heartbeat (iOS) | Use react-native-background-timer; graceful fallback if fails |
| Token expiry during long session | Implement token refresh; re-pair if needed |
| Network detection reliability | Use dual detection (ping + NetInfo); fallback to timer |
| Large photos (high resolution) | Compress before upload; limit dimensions |

---

## Success Criteria

✅ **App successfully:**
- Pairs with VMS backend
- Creates new visitor check-in with photo + signature
- Checks in existing visitor
- Checks out visitor
- Uploads photos with visible progress
- Works offline (queues visits, syncs when online)
- Retries failed uploads
- Handles network interruptions gracefully
- Maintains token across app restarts
- Displays all tenant-specific data (hosts, departments, services)
- Provides clear UX for touch kiosks

---

## Next Steps

1. **Create Expo project:** `npx create-expo-app mobile-kiosk --template`
2. **Set up navigation:** Install expo-router, configure folder structure
3. **Implement auth context:** Token storage + pairing flow
4. **Wire API client:** Map existing API routes to hook functions
5. **Build UI screens:** Start with pairing, then main menu
6. **Implement check-in:** New + existing visitor flows
7. **Test end-to-end:** Pairing → check-in → check-out
8. **Polish & optimize:** Offline support, error handling, UX refinement
9. **Deploy:** Build and test on real devices

---

## References

- **Expo Documentation:** https://docs.expo.dev/
- **Expo Router:** https://docs.expo.dev/routing/introduction/
- **React Native Docs:** https://reactnative.dev/
- **NativeWind:** https://www.nativewind.dev/
- **EAS Build:** https://docs.expo.dev/eas-build/introduction/
- **Current Web Kiosk:** `features/tenants/forms/VisitorKioskForm.tsx`
- **VMS SaaS API Docs:** `DEPLOYMENT.md` (Kiosk API section)
- **Design System:** `context/ui-context.md`
