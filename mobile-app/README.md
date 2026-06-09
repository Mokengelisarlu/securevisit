# Mobile Kiosk App - React Native Expo

A production-ready React Native/Expo mobile kiosk application for visitor check-in/check-out, built to connect with the VMS SaaS backend API.

## Setup

### Prerequisites
- Node.js 18+ and pnpm
- Expo CLI: `npm install -g expo-cli`
- iOS development: Xcode (macOS)
- Android development: Android Studio

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **NativeWind setup (Tailwind for React Native):**
   ```bash
   pnpm add -D nativewind tailwindcss
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Update with your API base URL and tenant slug:
   ```
   EXPO_PUBLIC_API_BASE_URL=https://vms.yourdomain.com
   EXPO_PUBLIC_TENANT_SLUG=acme-corp
   ```

### Development

Start the development server:
```bash
pnpm start
```

Then choose your target:
- **iOS Simulator:** Press `i`
- **Android Emulator:** Press `a`
- **Web:** Press `w`

### Project Structure

```
app/
  (auth)/              # Auth group (pairing flow)
    pairing.tsx        # Device pairing screen
    _layout.tsx        # Auth navigation
  (kiosk)/             # Main kiosk group
    index.tsx          # Main menu (Check-in / Check-out)
    check-in/          # Check-in flow
    check-out/         # Check-out flow
src/
  api/                 # API client
  contexts/            # React contexts (Auth, Kiosk, Api)
  hooks/               # Custom hooks (usePairing, usePublicData, etc.)
  components/          # Shared UI components
  types/               # TypeScript types
  lib/                 # Utilities
globals.css            # Tailwind global styles
tailwind.config.js     # Tailwind configuration
babel.config.js        # Babel configuration
```

## Architecture

### Contexts
- **AuthContext:** Manages device token & secure storage
- **KioskContext:** Manages kiosk session state (mode, step)
- **ApiContext:** Stores API base URL & tenant slug

### Hooks
- **usePairing:** Device pairing flow (generate code → poll approval)
- **useDeviceManagement:** Verify token & heartbeat pings
- **usePublicData:** Fetch visitors, hosts, departments, services
- **useVisits:** Create check-in & checkout visits

### Screens
- **Pairing Screen:** Generate code → admin approves → device token stored
- **Main Menu:** Choose Check-in or Check-out
- **Check-in:** New visitor or existing visitor, photo capture, signature, destination
- **Check-out:** Search on-site visitors, confirm logout

## Key Features

✅ Device pairing with secure token storage (`expo-secure-store`)
✅ Check-in flow (new & existing visitors)
✅ Check-out flow
✅ Photo capture (via `expo-camera`)
✅ Signature capture (via `react-native-signature-pad`)
✅ Offline support (pending visits queued with SQLite)
✅ Upload retry with exponential backoff
✅ Heartbeat keep-alive pings
✅ Full TypeScript support
✅ Tailwind CSS styling (NativeWind)

## API Integration

The app connects to the VMS SaaS public kiosk API:

- **Pairing:** `/api/tenants/{slug}/devices/pairing-code` + `/devices/pairing-status`
- **Auth:** `/api/tenants/{slug}/devices/verify` + `/devices/ping`
- **Data:** `/api/tenants/{slug}/public/{visitors,hosts,departments,services}`
- **Actions:** `/api/tenants/{slug}/public/visits` + `/public/checkouts`
- **Upload:** `/api/tenants/{slug}/upload` (multipart/form-data)

See `DEPLOYMENT.md` in the parent VMS SaaS repo for full API docs.

## Building

### Development Build (Local Testing)

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Production Build

```bash
eas build --platform all --profile production
```

### Distribution

- **iOS:** Upload to TestFlight or App Store
- **Android:** Upload to Google Play Console
- **Kiosk:** Use internal distribution or enterprise deployment

## Configuration

### `app.json` (Expo Config)

Update for your branding:
```json
{
  "expo": {
    "name": "Your Kiosk App",
    "slug": "your-kiosk-app",
    "orientation": "landscape",
    "ios": { "supportsTablet": true },
    "android": { "edgeToEdgeEnabled": true }
  }
}
```

### `eas.json` (Build Config)

Configure build profiles for different environments:
```json
{
  "build": {
    "preview": { "android": { "buildType": "apk" } },
    "production": { "android": { "buildType": "aab" } }
  }
}
```

## Troubleshooting

### NativeWind not working
- Ensure `babel.config.js` includes `nativewind/babel`
- Rebuild: `pnpm start --reset-cache`
- Check `tailwind.config.js` content paths

### Pairing fails
- Check API base URL in `.env`
- Verify tenant slug matches admin portal
- Ensure device token is valid (check `/devices/verify`)

### Camera permission denied
- On iOS: Add to `Info.plist` (handled by `expo-permissions`)
- On Android: Request permission at runtime

### Large photo uploads fail
- Compress images before upload
- Implement resume/chunked upload
- Check network stability

## Environment Variables

Required in `.env`:
```
EXPO_PUBLIC_API_BASE_URL     # VMS SaaS API endpoint
EXPO_PUBLIC_TENANT_SLUG       # Tenant identifier
```

Optional:
```
EAS_BUILD_PROFILE            # Dev or production build
DEBUG_MODE                   # Enable verbose logging
```

## Testing Checklist

- [ ] Pairing: Generate code → admin approves → token stored
- [ ] Check-in (New): Fill form → capture photos → sign → submit
- [ ] Check-in (Existing): Search → select → capture photo → submit
- [ ] Check-out: Search on-site → confirm logout
- [ ] Offline: Create visit offline → auto-sync when online
- [ ] Upload: Photos upload with progress bar
- [ ] Retry: Failed uploads show retry UI
- [ ] Permissions: Camera permission requested and granted
- [ ] Rotation: Landscape orientation works well
- [ ] Touch: All buttons easily tappable on tablets

## Next Steps

1. **Complete Check-in Flow:** Implement new-visitor & existing-visitor screens
2. **Complete Check-out Flow:** Search & confirm screens
3. **Offline Support:** Add SQLite queue for pending visits
4. **Heartbeat:** Implement background pings
5. **Testing:** E2E test pairing → check-in → checkout
6. **Polish:** Error handling, loading states, accessibility
7. **Build:** Configure EAS builds for iOS/Android
8. **Deploy:** Test on real devices, distribute to kiosks

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Guide](https://docs.expo.dev/routing/introduction/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Native Docs](https://reactnative.dev/)
- [VMS SaaS API Docs](../DEPLOYMENT.md#-kiosk-api--standalone-apps)

## Support

For issues, refer to:
- Expo troubleshooting: https://docs.expo.dev/troubleshooting/troubleshooting/
- NativeWind issues: https://github.com/marklawlor/nativewind
- VMS SaaS API docs in parent repo
