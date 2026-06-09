# Device ↔ Main App Communication Plan

## Architecture Overview

The kiosk device communicates with the main SecureVisit app through a **hybrid model**:
- **Device → Main App** (REST polling): Visits, status updates, heartbeat
- **Main App → Device** (WebSocket + REST): Real-time commands, config updates, emergency messages
- **Real-Time Dashboard**: WebSocket for instant device status visibility
- **Graceful Degradation**: All features work offline or with polling fallback

```
┌────────────────┐                  ┌──────────────────────┐
│  Kiosk Device  │                  │  SecureVisit Main    │
│  (React Native)│                  │  (Next.js/Backend)   │
├────────────────┤                  ├──────────────────────┤
│                │                  │                      │
│ Device Ping    │──REST Polling──→ │  Track status        │
│ (every 2 min)  │                  │  (online/offline)    │
│                │                  │                      │
│ Create Visit   │──REST (POST)───→ │  Record check-in/out │
│ Upload Photo   │                  │  Store media         │
│                │                  │                      │
│ WebSocket Rx   │←──Config Push──── │  Send commands       │
│ Listen Cmds    │                  │  (reboot, message)   │
│                │                  │                      │
│ Heartbeat Ack  │──WebSocket────→ │  Real-time status    │
│ Event Stream   │                  │  for admin dashboard │
└────────────────┘                  └──────────────────────┘
       ↓                                      ↑
    Cache                            Admin Dashboard
    (TanStack)                        (Real-time Status)
```

---

## 1. Device → Main App Communication

### 1.1 Device Heartbeat (Keep-Alive)
**Purpose**: Track device online/offline status  
**Frequency**: Every 2 minutes  
**Protocol**: REST (HTTP POST)

```
POST /api/kiosk/device/ping
Content-Type: application/json
Authorization: Bearer {deviceToken}

{
  "deviceToken": "dev_xyz123abc",
  "tenantSlug": "acme",
  "timestamp": "2026-06-02T14:30:00Z",
  "deviceInfo": {
    "appVersion": "1.0.0",
    "osVersion": "iOS 17.5",
    "deviceModel": "iPad Pro 12.9",
    "memoryUsed": 145,
    "batteryLevel": 87,
    "isCharging": false,
    "wifiSignal": -45
  }
}

Response 200 OK:
{
  "status": "ok",
  "serverTime": "2026-06-02T14:30:05Z",
  "commandsWaiting": 1,
  "configVersion": "v2.1",
  "configChanged": false
}
```

**Admin Dashboard Updates**:
- Device status: online ✅ (last seen 0s ago)
- Battery: 87%
- Network signal: Strong
- App version: 1.0.0

**No Response / Timeout (10s)**:
- Status: offline ⚠️ (last seen 2 mins ago)
- Show alert on admin dashboard

---

### 1.2 Heartbeat Response & Command Queue
**Response Fields**:
```typescript
interface PingResponse {
  status: 'ok' | 'error';
  serverTime: string;
  commandsWaiting: number;      // Commands queued for device
  configVersion: string;        // Current config version
  configChanged: boolean;       // Force device to refetch config
}
```

**Device Logic on Response**:
```typescript
if (response.commandsWaiting > 0) {
  // Pull commands immediately
  const commands = await getQueuedCommands();
  await processCommands(commands);
}

if (response.configChanged) {
  // Refetch settings (useSettings with invalidation)
  queryClient.invalidateQueries({ queryKey: ['settings'] });
}
```

---

### 1.3 Create Visit (Check-In)
**Purpose**: Record visitor arrival  
**Protocol**: REST (HTTP POST)

```
POST /api/kiosk/visits
Content-Type: application/json
Authorization: Bearer {deviceToken}

{
  "tenantSlug": "acme",
  "newVisitor": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+33612345678",
    "company": "Acme Corp"
  },
  "visitorTypeId": "vt_123",
  "hostId": "host_456",
  "departmentId": "dept_789",
  "purpose": "Meeting",
  "vehicle": {
    "plateNumber": "AB-123-CD",
    "type": "CAR",
    "brand": "Toyota",
    "color": "Black"
  },
  "passengerCount": 1,
  "visitorPhotoUrl": "https://blob.example.com/visitor-123.jpg",
  "vehiclePhotoUrl": "https://blob.example.com/vehicle-123.jpg",
  "signatureData": "data:image/png;base64,..."
}

Response 201 Created:
{
  "visitId": "visit_12345",
  "checkInAt": "2026-06-02T14:35:00Z",
  "hostNotified": true,
  "message": "Bienvenue!"
}
```

---

### 1.4 Checkout Visit
**Purpose**: Record visitor departure  
**Protocol**: REST (HTTP POST)

```
POST /api/kiosk/visits/{visitId}/checkout
Authorization: Bearer {deviceToken}

Response 200 OK:
{
  "visitId": "visit_12345",
  "checkOutAt": "2026-06-02T15:45:00Z",
  "duration": "1h 10min",
  "recordedSuccessfully": true
}
```

---

## 2. Main App → Device Communication

### 2.1 WebSocket Connection (Real-Time Commands)
**Purpose**: Send real-time commands to device  
**Protocol**: WebSocket (with fallback to polling)

**Device Connects on Launch** (after pairing):
```typescript
// In app/_layout.tsx or DevicePinging component
import { io } from 'socket.io-client';

const socket = io(`${appUrl}/device-socket`, {
  auth: {
    token: deviceToken,
    tenantSlug,
    deviceModel: 'iPad Pro 12.9',
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxHttpBufferSize: 1e6,
});

socket.on('connect', () => {
  console.log('Connected to server');
  // Notify admin dashboard device is online
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('command', (command) => {
  handleCommand(command);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Fall back to polling
});
```

---

### 2.2 Command Types (Admin → Device)

#### 2.2.1 Configuration Update
```typescript
// Admin clicks "Save Settings" in dashboard
POST /api/admin/kiosk-devices/{deviceId}/config
{
  "requireVisitorPhoto": true,
  "requireVehiclePhoto": false,
  "requireSignature": true,
  "visitorPhotoQuality": "high",
  "language": "fr"
}

// Server broadcasts via WebSocket:
socket.emit('command', {
  type: 'CONFIG_UPDATE',
  version: 'v2.2',
  payload: {
    requireVisitorPhoto: true,
    requireVehiclePhoto: false,
    requireSignature: true,
    visitorPhotoQuality: 'high',
    language: 'fr'
  },
  priority: 'high',
  expiresAt: '2026-06-02T15:00:00Z'
});

// Device receives & responds:
socket.emit('command:ack', {
  commandType: 'CONFIG_UPDATE',
  deviceToken,
  status: 'applied',
  timestamp: '2026-06-02T14:35:10Z'
});
```

#### 2.2.2 Emergency Message
```typescript
// Admin sends urgent message (e.g., security alert)
POST /api/admin/kiosk-devices/{deviceId}/message
{
  "type": "SECURITY_ALERT",
  "message": "Suspicious activity detected. Lock the kiosk immediately.",
  "action": "lock",
  "duration": 300  // seconds
}

// WebSocket broadcast:
socket.emit('command', {
  type: 'EMERGENCY_MESSAGE',
  message: 'Suspicious activity detected. Lock the kiosk immediately.',
  action: 'lock',
  duration: 300,
  priority: 'critical'
});

// Device response:
socket.emit('command:ack', {
  commandType: 'EMERGENCY_MESSAGE',
  deviceToken,
  status: 'locked',
  timestamp: '2026-06-02T14:35:15Z'
});

// Device shows full-screen message, disables all inputs for 5 mins
```

#### 2.2.3 Force Reboot
```typescript
// Admin clicks "Restart Device" on dashboard
POST /api/admin/kiosk-devices/{deviceId}/reboot
{
  "delaySeconds": 60,
  "reason": "OS update installation"
}

// WebSocket broadcast:
socket.emit('command', {
  type: 'REBOOT',
  delaySeconds: 60,
  reason: 'OS update installation',
  priority: 'high'
});

// Device response:
socket.emit('command:ack', {
  commandType: 'REBOOT',
  deviceToken,
  status: 'scheduled',
  rebootTime: '2026-06-02T14:36:00Z'
});

// Device shows countdown, then calls Expo.reloadAsync()
```

#### 2.2.4 Clear Local Cache
```typescript
// Admin clicks "Reset Cache" to force fresh data sync
socket.emit('command', {
  type: 'CLEAR_CACHE',
  targets: ['on-site-visitors', 'settings', 'all'],
  priority: 'medium'
});

// Device response:
socket.emit('command:ack', {
  commandType: 'CLEAR_CACHE',
  deviceToken,
  status: 'cleared',
  timestamp: '2026-06-02T14:35:12Z'
});

// Device invalidates TanStack Query cache
queryClient.clear();
```

#### 2.2.5 Force Settings Refresh
```typescript
// Admin clicks "Sync Settings" to pull latest config
socket.emit('command', {
  type: 'REFRESH_SETTINGS',
  priority: 'medium'
});

// Device response:
socket.emit('command:ack', {
  commandType: 'REFRESH_SETTINGS',
  deviceToken,
  status: 'fetched',
  timestamp: '2026-06-02T14:35:08Z'
});

// Device immediately calls: useSettings().refetch()
```

#### 2.2.6 Visitor Notification
```typescript
// Admin sends message to specific visitor at kiosk
socket.emit('command', {
  type: 'NOTIFY_VISITOR',
  visitorId: 'vis_123',
  message: 'Your meeting has been moved to Room 5',
  priority: 'medium'
});

// Device shows toast notification, device doesn't need to process
```

---

### 2.3 Command Acknowledgment Protocol
**Every command requires acknowledgment** within 10 seconds:

```typescript
socket.emit('command:ack', {
  commandId: command.id,                    // UUID from command
  deviceToken: deviceToken,
  commandType: command.type,
  status: 'success' | 'pending' | 'error', // success, pending (queued), or error
  errorMessage?: 'Optional error details',
  timestamp: new Date().toISOString(),
  deviceState: {
    memoryUsed: 145,                        // MB
    batteryLevel: 87,
    isOnline: true,
    currentScreen: 'main-menu'
  }
});
```

**If no ACK within 10s**:
- Log warning on admin dashboard: "Device did not acknowledge CONFIG_UPDATE"
- Retry via polling on next heartbeat
- Show yellow badge on device card

---

## 3. Real-Time Admin Dashboard

### 3.1 Device Status Grid
**Displays for each kiosk**:

```
┌─────────────────────────────────────────────┐
│ Device: Kiosk #1 (ACME - Reception)         │
├─────────────────────────────────────────────┤
│ Status: 🟢 ONLINE (last ping 15s ago)      │
│ Battery: 87% | WiFi: -45dBm (Strong)       │
│ App Version: 1.0.0 | OS: iOS 17.5          │
│ Current Screen: Main Menu                   │
│ Commands Pending: 0                         │
├─────────────────────────────────────────────┤
│ Actions:                                     │
│ [📨 Send Message] [⚙️ Configure]           │
│ [🔄 Refresh Config] [🔌 Reboot]            │
│ [📋 View Logs]                              │
└─────────────────────────────────────────────┘
```

### 3.2 WebSocket Connection for Admin
**Admin dashboard connects to real-time stream**:

```typescript
// On admin dashboard mount
const socket = io(`${apiUrl}/admin-socket`, {
  auth: {
    token: adminAuthToken,
    tenantSlug,
    role: 'admin'
  }
});

socket.on('device:status-update', (data) => {
  // Real-time status
  updateDeviceCard(data.deviceId, {
    status: data.status,
    battery: data.batteryLevel,
    screen: data.currentScreen,
    lastPing: data.timestamp
  });
});

socket.on('device:command-ack', (data) => {
  // Command acknowledged
  updateCommandStatus(data.commandId, 'completed');
  showToast(`Device acknowledged ${data.commandType}`);
});

socket.on('device:error', (data) => {
  // Device error notification
  showAlert(`Device Error: ${data.deviceId} - ${data.error}`);
});
```

---

## 4. Fallback: Polling-Based Communication

**If WebSocket fails or device goes offline**, use REST polling:

### 4.1 Device Polls for Commands
```typescript
// If WebSocket disconnected, device polls every 30 seconds
useEffect(() => {
  if (!isWebSocketConnected && appUrl) {
    const pollInterval = setInterval(async () => {
      try {
        const commands = await getApiClient().get('/api/kiosk/commands/queue');
        if (commands.data.length > 0) {
          processCommands(commands.data);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }
}, [isWebSocketConnected, appUrl]);
```

### 4.2 Commands Queue Endpoint
```
GET /api/kiosk/commands/queue
Authorization: Bearer {deviceToken}

Response 200 OK:
{
  "commands": [
    {
      "id": "cmd_123",
      "type": "CONFIG_UPDATE",
      "payload": { ... },
      "createdAt": "2026-06-02T14:35:00Z"
    }
  ],
  "nextPollAt": "2026-06-02T14:36:00Z"
}
```

**Device processes & acknowledges**:
```
POST /api/kiosk/commands/{commandId}/ack
{
  "status": "success",
  "deviceState": { ... }
}
```

---

## 5. Device Events → Main App (Real-Time Dashboard)

### 5.1 Event Stream
**Device sends real-time events to main app via WebSocket**:

```typescript
// Device sends event
socket.emit('device:event', {
  deviceToken,
  eventType: 'CHECK_IN',
  data: {
    visitId: 'visit_123',
    visitorName: 'Jean Dupont',
    timestamp: '2026-06-02T14:35:00Z',
    photoUrl: 'https://blob.example.com/vis-123.jpg'
  }
});

socket.emit('device:event', {
  deviceToken,
  eventType: 'ERROR',
  data: {
    errorCode: 'CAMERA_FAILED',
    message: 'Camera not accessible',
    timestamp: '2026-06-02T14:35:15Z'
  }
});
```

**Main app receives & updates real-time dashboard**:
```typescript
socket.on('device:event', (event) => {
  if (event.eventType === 'CHECK_IN') {
    // Add visitor to real-time table
    addVisitToLiveTable(event.data);
    updateDeviceActivity(event.deviceToken, 'Check-in recorded');
  } else if (event.eventType === 'ERROR') {
    // Show error badge on device card
    showDeviceWarning(event.deviceToken, event.data.message);
  }
});
```

---

## 6. API Endpoints Summary

### Device API (React Native App)
```
POST   /api/kiosk/device/ping                    # Heartbeat
POST   /api/kiosk/visits                         # Create visit (check-in)
POST   /api/kiosk/visits/{id}/checkout           # Check-out
GET    /api/kiosk/commands/queue                 # Poll for commands (fallback)
POST   /api/kiosk/commands/{id}/ack              # Acknowledge command
```

### Admin API (Main App Dashboard)
```
GET    /api/admin/kiosk-devices                  # List all devices
GET    /api/admin/kiosk-devices/{id}             # Device details & status
POST   /api/admin/kiosk-devices/{id}/config      # Update config
POST   /api/admin/kiosk-devices/{id}/message     # Send message
POST   /api/admin/kiosk-devices/{id}/reboot      # Reboot device
POST   /api/admin/kiosk-devices/{id}/cache/clear # Clear cache
POST   /api/admin/kiosk-devices/{id}/test-connection # Test connectivity
GET    /api/admin/kiosk-devices/{id}/logs        # Device logs
```

### WebSocket Rooms
```
/device-socket          # Device connects (authenticated with token)
/admin-socket           # Admin dashboard connects (authenticated with admin token)
  - room: `admin:${tenantSlug}`    # Admin sees only their tenant's devices
  - room: `device:${deviceId}`     # Specific device events
```

---

## 7. Error Handling & Recovery

### 7.1 Network Failure
**Scenario**: Device loses WiFi mid-visit submission

```typescript
// Device is creating visit when network drops
try {
  const response = await createVisit.mutateAsync(visitData);
} catch (error) {
  if (!isOnline) {
    // Queue for retry
    offlineQueue.addMutation('createVisit', visitData);
    showToast('Offline: Visit queued for sync');
  }
}

// When reconnected
socket.on('reconnect', async () => {
  const queue = await offlineQueue.getAll();
  for (const item of queue) {
    await retryMutation(item.type, item.data);
  }
});
```

### 7.2 Command Timeout
**Scenario**: Device doesn't acknowledge command within 10s

```typescript
// Admin Dashboard
async function sendCommand(deviceId, command) {
  const commandId = uuid();
  
  socket.emit('command', {
    id: commandId,
    deviceToken: deviceId,
    ...command
  });

  // Wait for ACK with timeout
  const ack = await Promise.race([
    waitForCommandAck(commandId),
    timeout(10000)
  ]);

  if (!ack) {
    // Show warning
    updateDeviceStatus(deviceId, 'warning', 'Command not acknowledged');
    
    // Schedule retry via polling
    schedulePollingRetry(deviceId, command);
  }
}
```

### 7.3 Token Expiration
**Scenario**: Device token revoked in admin panel

```typescript
// Device receives 401 Unauthorized
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired
      SecureStore.deleteItemAsync('kiosk_token');
      
      // Redirect to pairing screen
      router.replace('/(pairing)/qr-scanner');
      
      showAlert('Device pairing expired. Please re-scan QR code.');
    }
    return Promise.reject(error);
  }
);
```

---

## 8. Implementation Phases

### Phase 1: REST Polling Only (MVP)
- [ ] Device heartbeat endpoint (2-min ping)
- [ ] Create/Checkout visit endpoints
- [ ] Commands queue endpoint (fallback polling)
- [ ] Admin device status list (REST polling)
- [ ] Basic error handling

### Phase 2: WebSocket Real-Time
- [ ] WebSocket server setup (Socket.IO)
- [ ] Device WebSocket connection
- [ ] Admin dashboard WebSocket connection
- [ ] Real-time command delivery
- [ ] Device event streaming
- [ ] Live activity dashboard

### Phase 3: Advanced Features
- [ ] Offline queue with retry logic
- [ ] Device logs streaming
- [ ] Advanced analytics
- [ ] Device grouping & bulk commands
- [ ] Scheduled maintenance messages

---

## 9. Security Considerations

### 9.1 Token Authentication
- Device token (SecureStore) sent in `Authorization: Bearer {token}` header
- Token scoped to one tenant & one device (not transferable)
- Revocable from admin panel
- Expires after 90 days (or on explicit revocation)

### 9.2 Command Validation
- All commands signed with server private key
- Device verifies signature before executing
- Commands contain timestamp to prevent replay attacks
- Admin role verified server-side before command delivery

### 9.3 Data Encryption
- All WebSocket messages encrypted (TLS + optional message encryption)
- Photos uploaded to secure blob storage (signed URLs)
- Visitor data never logged locally on device (except in AsyncStorage cache)

---

## 10. Monitoring & Debugging

### 10.1 Device Logs
**Admin can view device logs on dashboard**:
```
GET /api/admin/kiosk-devices/{id}/logs?limit=100&level=error

Response:
[
  {
    timestamp: "2026-06-02T14:35:00Z",
    level: "error",
    message: "Photo upload failed",
    context: { ... }
  },
  ...
]
```

### 10.2 TanStack Query DevTools
**Dev mode**: Device can enable TanStack DevTools overlay
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In app layout (dev mode only)
{__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
```

---

## Summary

| Direction | Protocol | Frequency | Purpose |
|-----------|----------|-----------|---------|
| Device → App | REST | 2 mins | Heartbeat |
| Device → App | REST | On event | Create visit, checkout |
| App → Device | WebSocket | Real-time | Commands, config, messages |
| App → Device | REST | 30 secs (fallback) | Poll for commands |
| Device → Admin | WebSocket | Real-time | Events, status updates |
| Admin → Device | WebSocket | Real-time | Commands (with polling fallback) |

**Key Advantage**: Hybrid approach ensures reliability (polling fallback) while providing real-time experience (WebSocket primary).
