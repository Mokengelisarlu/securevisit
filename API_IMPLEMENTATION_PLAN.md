# API Implementation Plan

## Overview

This document outlines the complete API implementation for device ↔ main app communication. All endpoints follow REST conventions with WebSocket for real-time features.

**Backend Stack**:
- Next.js 14+ (API Routes or App Router)
- Drizzle ORM
- Neon Postgres (serverless PostgreSQL)
- Socket.IO (WebSocket)
- Zod validation

---

## 1. Device API Endpoints

### 1.1 Authentication

All device endpoints require:
```typescript
// Header
Authorization: Bearer {deviceToken}

// Middleware to extract device context
middleware/auth.ts:
import { db } from '@/db';
import { devices } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function deviceAuth(request: NextApiRequest) {
  const token = request.headers.authorization?.split(' ')[1];
  if (!token) throw new UnauthorizedError('No token');
  
  const device = await db
    .select()
    .from(devices)
    .where(eq(devices.token, token))
    .limit(1)
    .then(rows => rows[0]);
  
  if (!device || device.tokenExpiresAt < new Date()) {
    throw new UnauthorizedError('Token expired');
  }
  
  // Fetch tenant
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, device.tenantId))
    .limit(1)
    .then(rows => rows[0]);
  
  return { device, tenant };
}
```

### 1.2 Device Heartbeat Endpoint

**Route**: `POST /api/kiosk/device/ping`

```typescript
// api/kiosk/device/ping.ts
import { z } from 'zod';

const PingRequestSchema = z.object({
  deviceToken: z.string(),
  tenantSlug: z.string(),
  timestamp: z.string().datetime(),
  deviceInfo: z.object({
    appVersion: z.string(),
    osVersion: z.string(),
    deviceModel: z.string(),
    memoryUsed: z.number().int(),        // MB
    batteryLevel: z.number().int().min(0).max(100),
    isCharging: z.boolean(),
    wifiSignal: z.number().int(),        // dBm
  }).optional(),
});

interface PingResponse {
  status: 'ok' | 'error';
  serverTime: string;
  commandsWaiting: number;
  configVersion: string;
  configChanged: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PingResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { device, tenant } = await deviceAuth(req);
    const body = PingRequestSchema.parse(req.body);

    // Update device status
    await db
      .update(devices)
      .set({
        lastPingAt: new Date(body.timestamp),
        status: 'online',
        deviceInfo: body.deviceInfo,
        updatedAt: new Date(),
      })
      .where(eq(devices.id, device.id));

    // Emit real-time event (WebSocket)
    io.to(`device:${device.id}`).emit('device:online', {
      deviceId: device.id,
      timestamp: new Date().toISOString(),
    });

    // Check for pending commands
    const pendingCommands = await db
      .select()
      .from(commands)
      .where(
        and(
          eq(commands.deviceId, device.id),
          eq(commands.status, 'pending'),
          gt(commands.expiresAt, new Date())
        )
      );

    // Get current config version
    const config = await db
      .select()
      .from(tenantConfigs)
      .where(eq(tenantConfigs.tenantId, tenant.id))
      .limit(1)
      .then(rows => rows[0]);

    return res.status(200).json({
      status: 'ok',
      serverTime: new Date().toISOString(),
      commandsWaiting: pendingCommands.length,
      configVersion: config?.version || '1.0',
      configChanged: config?.lastModifiedAt ? config.lastModifiedAt > new Date(body.timestamp) : false,
    });
  } catch (error) {
    logger.error('Ping error:', error);
    return res.status(500).json({
      status: 'error',
      serverTime: new Date().toISOString(),
      commandsWaiting: 0,
      configVersion: '1.0',
      configChanged: false,
    });
  }
}
```

**Database Schema** (Drizzle):
```typescript
// db/schema.ts
import { pgTable, text, varchar, integer, timestamp, json, boolean, index } from 'drizzle-orm/pg-core';

export const devices = pgTable('devices', {
  id: text('id').primaryKey().notNull(),
  tenantId: text('tenant_id').notNull(),
  token: text('token').notNull().unique(),
  tokenCreatedAt: timestamp('token_created_at').defaultNow().notNull(),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  status: varchar('status', { length: 20 }).default('offline').notNull(), // online | offline | error
  lastPingAt: timestamp('last_ping_at'),
  deviceInfo: json('device_info'), // { appVersion, osVersion, batteryLevel, etc. }
  currentScreen: varchar('current_screen', { length: 50 }), // main-menu | check-in | check-out | pairing
  location: varchar('location', { length: 255 }), // "Reception", "Building A", etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('devices_tenant_idx').on(table.tenantId),
  tokenIdx: index('devices_token_idx').on(table.token),
}));

export const commands = pgTable('commands', {
  id: text('id').primaryKey().notNull(),
  deviceId: text('device_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // CONFIG_UPDATE | REBOOT | MESSAGE | etc.
  payload: json('payload').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | acked | applied | failed
  priority: varchar('priority', { length: 20 }).default('medium').notNull(), // low | medium | high | critical
  ackAt: timestamp('ack_at'),
  appliedAt: timestamp('applied_at'),
  error: text('error'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  deviceIdx: index('commands_device_idx').on(table.deviceId),
  statusIdx: index('commands_status_idx').on(table.status),
}));

export const deviceEvents = pgTable('device_events', {
  id: text('id').primaryKey().notNull(),
  deviceId: text('device_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // CHECK_IN | CHECKOUT | ERROR | SCREEN_CHANGE | etc.
  data: json('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  deviceIdx: index('device_events_device_idx').on(table.deviceId),
  createdIdx: index('device_events_created_idx').on(table.createdAt),
}));
```

---

### 1.3 Create Visit Endpoint (Check-In)

**Route**: `POST /api/kiosk/visits`

```typescript
// api/kiosk/visits.ts
import { z } from 'zod';

const CreateVisitSchema = z.object({
  // Visitor (new or existing ID)
  newVisitor: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    visitorTypeId: z.string().min(1),
  }).optional(),
  visitorId: z.string().optional(),

  // Destination
  hostId: z.string().optional(),
  departmentId: z.string().optional(),
  serviceId: z.string().optional(),
  purpose: z.string().optional(),

  // Vehicle (conditional)
  vehicle: z.object({
    plateNumber: z.string().min(1),
    type: z.enum(['CAR', 'TRUCK', 'MOTORCYCLE', 'OTHER']),
    brand: z.string().optional(),
    color: z.string().optional(),
  }).optional(),
  passengerCount: z.number().int().min(0).max(50).optional(),

  // Media
  visitorPhotoUrl: z.string().url().optional(),
  vehiclePhotoUrl: z.string().url().optional(),
  signatureData: z.string().optional(),  // base64
});

interface CreateVisitResponse {
  visitId: string;
  checkInAt: string;
  hostNotified: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateVisitResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { device, tenant } = await deviceAuth(req);
    const body = CreateVisitSchema.parse(req.body);

    // Create or get visitor
    let visitor;
    if (body.visitorId) {
      visitor = await db.visitor.findUnique({
        where: { id: body.visitorId },
      });
    } else if (body.newVisitor) {
      visitor = await db.visitor.create({
        data: {
          ...body.newVisitor,
          tenant: { connect: { id: tenant.id } },
        },
      });
    }

    if (!visitor) {
      return res.status(400).json({
        error: 'Visitor not found or invalid',
      });
    }

    // Create visit record
    const visitId = generateId();
    const now = new Date();
    
    await db.insert(visits).values({
      id: visitId,
      tenantId: tenant.id,
      deviceId: device.id,
      visitorId: visitor.id,
      hostId: body.hostId || null,
      departmentId: body.departmentId || null,
      purpose: body.purpose || null,
      checkInAt: now,
      status: 'checked_in',
      signatureUrl: body.signatureData ? await saveSignature(body.signatureData, tenant.id) : null,
      visitorPhotoUrl: body.visitorPhotoUrl || null,
      vehiclePhotoUrl: body.vehiclePhotoUrl || null,
      createdAt: now,
    });

    // Create vehicle record if provided
    if (body.vehicle) {
      await db.insert(vehicles).values({
        id: generateId(),
        visitId: visitId,
        plateNumber: body.vehicle.plateNumber,
        type: body.vehicle.type,
        brand: body.vehicle.brand || null,
        color: body.vehicle.color || null,
        passengerCount: body.passengerCount || 0,
        createdAt: now,
      });
    }
    
    const visit = await db
      .select()
      .from(visits)
      .where(eq(visits.id, visitId))
      .limit(1)
      .then(rows => rows[0]);

    // Notify host (Email, SMS, or in-app)
    if (visit.hostId) {
      await notifyHost(visit.hostId, {
        visitorName: visitor.firstName + ' ' + visitor.lastName,
        checkInTime: visit.checkInAt,
        department: body.departmentId,
        purpose: body.purpose,
      });
    }

    // Emit real-time event
    io.to(`admin:${tenant.id}`).emit('visit:created', {
      visitId: visit.id,
      visitorName: visitor.firstName + ' ' + visitor.lastName,
      checkInAt: visit.checkInAt,
      device: device.location,
      timestamp: new Date().toISOString(),
    });

    // Log device event
    await db.insert(deviceEvents).values({
      id: generateId(),
      deviceId: device.id,
      type: 'CHECK_IN',
      data: {
        visitId: visit.id,
        visitorName: visitor.firstName + ' ' + visitor.lastName,
        photoUrl: body.visitorPhotoUrl,
      },
      createdAt: new Date(),
    });

    return res.status(201).json({
      visitId: visit.id,
      checkInAt: visit.checkInAt.toISOString(),
      hostNotified: !!visit.hostId,
      message: 'Bienvenue!',
    });
  } catch (error) {
    logger.error('Create visit error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Helper: Save signature to blob storage
async function saveSignature(base64Data: string, tenantId: string): Promise<string> {
  const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
  const filename = `signature-${Date.now()}.png`;
  
  const url = await uploadToBlob(tenantId, `signatures/${filename}`, buffer);
  return url;
}
```

**Database Schema Addition**:
```prisma
model Visit {
  id              String    @id @default(cuid())
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  tenantId        String
  device          Device    @relation(fields: [deviceId], references: [id])
  deviceId        String
  visitor         Visitor   @relation(fields: [visitorId], references: [id])
  visitorId       String
  host            Host?     @relation(fields: [hostId], references: [id])
  hostId          String?
  department      Department? @relation(fields: [departmentId], references: [id])
  departmentId    String?
  purpose         String?
  checkInAt       DateTime
  checkOutAt      DateTime?
  status          String    @default("checked_in")  // checked_in | checked_out | cancelled
  visitorPhotoUrl String?
  vehiclePhotoUrl String?
  signatureUrl    String?
  vehicle         Vehicle?
  createdAt       DateTime  @default(now())

  @@index([tenantId])
  @@index([visitorId])
  @@index([deviceId])
  @@index([checkInAt])
}

model Vehicle {
  id              String    @id @default(cuid())
  visit           Visit     @relation(fields: [visitId], references: [id], onDelete: Cascade)
  visitId         String    @unique
  plateNumber     String
  type            String    // CAR | TRUCK | MOTORCYCLE | OTHER
  brand           String?
  color           String?
  passengerCount  Int       @default(0)
  createdAt       DateTime  @default(now())

  @@index([plateNumber])
}
```

---

### 1.4 Checkout Visit Endpoint

**Route**: `POST /api/kiosk/visits/:visitId/checkout`

```typescript
// api/kiosk/visits/[id]/checkout.ts
interface CheckoutResponse {
  visitId: string;
  checkOutAt: string;
  duration: string;
  recordedSuccessfully: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CheckoutResponse>
) {
  const { id: visitId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { device, tenant } = await deviceAuth(req);

    const visit = await db
      .select()
      .from(visits)
      .leftJoin(visitors, eq(visits.visitorId, visitors.id))
      .where(eq(visits.id, visitId as string))
      .limit(1)
      .then(rows => rows[0]);

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.visits.status === 'checked_out') {
      return res.status(400).json({ error: 'Already checked out' });
    }

    const checkOutAt = new Date();

    // Update visit
    await db
      .update(visits)
      .set({
        checkOutAt,
        status: 'checked_out',
      })
      .where(eq(visits.id, visitId as string));

    const duration = calculateDuration(visit.checkInAt, checkOutAt);

    // Emit real-time event
    io.to(`admin:${tenant.id}`).emit('visit:checkout', {
      visitId: visit.id,
      visitorName: visit.visitor.firstName + ' ' + visit.visitor.lastName,
      duration,
      device: device.location,
      timestamp: new Date().toISOString(),
    });

    // Log device event
    await db.insert(deviceEvents).values({
      id: generateId(),
      deviceId: device.id,
      type: 'CHECKOUT',
      data: {
        visitId: visit.visits.id,
        visitorName: visit.visitors.firstName + ' ' + visit.visitors.lastName,
        duration,
      },
      createdAt: new Date(),
    });

    return res.status(200).json({
      visitId: visit.id,
      checkOutAt: checkOutAt.toISOString(),
      duration,
      recordedSuccessfully: true,
    });
  } catch (error) {
    logger.error('Checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function calculateDuration(checkIn: Date, checkOut: Date): string {
  const minutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
}
```

---

### 1.5 Commands Queue Endpoint (Polling Fallback)

**Route**: `GET /api/kiosk/commands/queue`

```typescript
// api/kiosk/commands/queue.ts
interface CommandsQueueResponse {
  commands: Array<{
    id: string;
    type: string;
    payload: Record<string, any>;
    priority: string;
    createdAt: string;
  }>;
  nextPollAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CommandsQueueResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { device } = await deviceAuth(req);

    const commandList = await db
      .select()
      .from(commands)
      .where(
        and(
          eq(commands.deviceId, device.id),
          eq(commands.status, 'pending'),
          gt(commands.expiresAt, new Date())
        )
      )
      .orderBy(desc(commands.priority));

    // Calculate next poll time (suggest 30s if no urgent commands)
    const hasUrgent = commands.some(c => c.priority === 'critical' || c.priority === 'high');
    const nextPollSeconds = hasUrgent ? 10 : 30;
    const nextPollAt = new Date(Date.now() + nextPollSeconds * 1000);

    return res.status(200).json({
      commands: commandList.map(cmd => ({
        id: cmd.id,
        type: cmd.type,
        payload: cmd.payload,
        priority: cmd.priority,
        createdAt: cmd.createdAt.toISOString(),
      })),
      nextPollAt: nextPollAt.toISOString(),
    });
  } catch (error) {
    logger.error('Queue fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

### 1.6 Command Acknowledgment Endpoint

**Route**: `POST /api/kiosk/commands/:id/ack`

```typescript
// api/kiosk/commands/[id]/ack.ts
const AckSchema = z.object({
  status: z.enum(['success', 'pending', 'error']),
  errorMessage: z.string().optional(),
  deviceState: z.object({
    memoryUsed: z.number().optional(),
    batteryLevel: z.number().optional(),
    isOnline: z.boolean().optional(),
    currentScreen: z.string().optional(),
  }).optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: commandId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { device } = await deviceAuth(req);
    const body = AckSchema.parse(req.body);

    await db
      .update(commands)
      .set({
        status: body.status,
        ackAt: new Date(),
        error: body.errorMessage || null,
      })
      .where(eq(commands.id, commandId as string));
    
    const command = await db
      .select()
      .from(commands)
      .where(eq(commands.id, commandId as string))
      .limit(1)
      .then(rows => rows[0]);

    // Emit ACK event to admin dashboard
    io.to(`admin:${device.tenantId}`).emit('command:ack', {
      commandId: command.id,
      commandType: command.type,
      deviceId: device.id,
      status: body.status,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      commandId: command.id,
      status: 'acknowledged',
    });
  } catch (error) {
    logger.error('ACK error:', error);
    return res.status(400).json({ error: error.message });
  }
}
```

---

### 1.7 Photo Upload Endpoint

**Route**: `POST /api/kiosk/upload`

```typescript
// api/kiosk/upload.ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

interface UploadResponse {
  photoUrl: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { device, tenant } = await deviceAuth(req);

    // req.files.photo is the uploaded file (using multer or formidable)
    const file = (req as any).files?.photo?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large' });
    }

    // Upload to blob storage
    const filename = `${Date.now()}-${file.originalname}`;
    const photoUrl = await uploadToBlob(tenant.id, `photos/${filename}`, file.buffer);

    return res.status(200).json({
      photoUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

## 2. Admin API Endpoints

### 2.1 List Devices

**Route**: `GET /api/admin/kiosk-devices`

```typescript
// api/admin/kiosk-devices.ts
interface ListDevicesResponse {
  devices: Array<{
    id: string;
    location: string;
    status: 'online' | 'offline' | 'error';
    lastPing: string;
    battery: number;
    appVersion: string;
    currentScreen: string;
    commandsPending: number;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListDevicesResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenant } = await adminAuth(req);

    const deviceList = await db
      .select({
        id: devices.id,
        location: devices.location,
        status: devices.status,
        lastPingAt: devices.lastPingAt,
        deviceInfo: devices.deviceInfo,
        currentScreen: devices.currentScreen,
      })
      .from(devices)
      .where(eq(devices.tenantId, tenant.id));
    
    // Get pending commands count for each device
    const devicesWithCounts = await Promise.all(
      deviceList.map(async (device) => {
        const pendingCount = await db
          .select({ count: countDistinct(commands.id) })
          .from(commands)
          .where(
            and(
              eq(commands.deviceId, device.id),
              eq(commands.status, 'pending')
            )
          )
          .then(rows => rows[0]?.count || 0);
        
        return { ...device, commandsPending: pendingCount };
      })
    );

    return res.status(200).json({
      devices: devicesWithCounts.map(d => ({
        id: d.id,
        location: d.location || 'Unknown',
        status: d.status,
        lastPing: d.lastPingAt?.toISOString() || null,
        battery: (d.deviceInfo as any)?.batteryLevel || 0,
        appVersion: (d.deviceInfo as any)?.appVersion || 'Unknown',
        currentScreen: d.currentScreen || 'Unknown',
        commandsPending: d.commandsPending,
      })),
    });
  } catch (error) {
    logger.error('List devices error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

### 2.2 Send Command to Device

**Route**: `POST /api/admin/kiosk-devices/:id/command`

```typescript
// api/admin/kiosk-devices/[id]/command.ts
const SendCommandSchema = z.object({
  type: z.enum(['CONFIG_UPDATE', 'EMERGENCY_MESSAGE', 'REBOOT', 'CLEAR_CACHE', 'REFRESH_SETTINGS']),
  payload: z.record(z.any()),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  expiresInMinutes: z.number().default(30),
});

interface SendCommandResponse {
  commandId: string;
  status: 'queued';
  device: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendCommandResponse>
) {
  const { id: deviceId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenant } = await adminAuth(req);
    const body = SendCommandSchema.parse(req.body);

    const device = await db.device.findUnique({
      where: { id: deviceId as string },
    });

    if (!device || device.tenantId !== tenant.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Create command
    const commandId = generateId();
    const expiresAt = new Date(Date.now() + body.expiresInMinutes * 60 * 1000);
    
    await db.insert(commands).values({
      id: commandId,
      deviceId: device.id,
      type: body.type,
      payload: body.payload,
      priority: body.priority,
      expiresAt,
      createdAt: new Date(),
    });
    
    const command = await db
      .select()
      .from(commands)
      .where(eq(commands.id, commandId))
      .limit(1)
      .then(rows => rows[0]);

    // Send via WebSocket if device is connected
    io.to(`device:${device.id}`).emit('command', {
      id: command.id,
      type: command.type,
      payload: command.payload,
      priority: command.priority,
    });

    // Log action
    await logAdminAction(tenant.id, {
      action: 'SEND_COMMAND',
      deviceId: device.id,
      commandType: body.type,
      userId: req.user.id,
    });

    return res.status(201).json({
      commandId: command.id,
      status: 'queued',
      device: device.location || device.id,
    });
  } catch (error) {
    logger.error('Send command error:', error);
    return res.status(400).json({ error: error.message });
  }
}
```

---

### 2.3 Update Device Config

**Route**: `POST /api/admin/kiosk-devices/:id/config`

```typescript
// api/admin/kiosk-devices/[id]/config.ts
const UpdateConfigSchema = z.object({
  requireVisitorPhoto: z.boolean().optional(),
  requireVehiclePhoto: z.boolean().optional(),
  requireSignature: z.boolean().optional(),
  visitorPhotoQuality: z.enum(['low', 'medium', 'high']).optional(),
  language: z.string().optional(),
  autoResetTimeout: z.number().optional(),  // seconds
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: deviceId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenant } = await adminAuth(req);
    const body = UpdateConfigSchema.parse(req.body);

    const device = await db.device.findUnique({
      where: { id: deviceId as string },
    });

    if (!device || device.tenantId !== tenant.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Update tenant config (applies to all devices)
    const newVersion = generateVersion();
    const now = new Date();
    
    await db
      .update(tenantConfigs)
      .set({
        ...body,
        lastModifiedAt: now,
        version: newVersion,
      })
      .where(eq(tenantConfigs.tenantId, tenant.id));
    
    const config = await db
      .select()
      .from(tenantConfigs)
      .where(eq(tenantConfigs.tenantId, tenant.id))
      .limit(1)
      .then(rows => rows[0]);

    // Queue CONFIG_UPDATE command
    await db.insert(commands).values({
      id: generateId(),
      deviceId: device.id,
      type: 'CONFIG_UPDATE',
      payload: {
        requireVisitorPhoto: config?.requireVisitorPhoto,
        requireVehiclePhoto: config?.requireVehiclePhoto,
        requireSignature: config?.requireSignature,
        visitorPhotoQuality: config?.visitorPhotoQuality,
        language: config?.language,
        autoResetTimeout: config?.autoResetTimeout,
      },
      priority: 'high',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: now,
    });

    // Broadcast config change to all devices
    io.to(`tenant:${tenant.id}`).emit('config:updated', {
      version: config.version,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      status: 'updated',
      version: config.version,
    });
  } catch (error) {
    logger.error('Update config error:', error);
    return res.status(400).json({ error: error.message });
  }
}
```

---

### 2.4 Get Device Logs

**Route**: `GET /api/admin/kiosk-devices/:id/logs`

```typescript
// api/admin/kiosk-devices/[id]/logs.ts
interface GetLogsResponse {
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    context?: Record<string, any>;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetLogsResponse>
) {
  const { id: deviceId } = req.query;
  const { limit = 100, level } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tenant } = await adminAuth(req);

    const device = await db.device.findUnique({
      where: { id: deviceId as string },
    });

    if (!device || device.tenantId !== tenant.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const eventList = await db
      .select()
      .from(deviceEvents)
      .where(
        and(
          eq(deviceEvents.deviceId, device.id),
          level ? eq(deviceEvents.type, 'ERROR') : undefined
        )
      )
      .orderBy(desc(deviceEvents.createdAt))
      .limit(parseInt(limit as string) || 100);

    return res.status(200).json({
      logs: eventList.map(e => ({
        timestamp: e.createdAt.toISOString(),
        level: e.type === 'ERROR' ? 'error' : 'info',
        message: e.type,
        context: e.data,
      })),
    });
  } catch (error) {
    logger.error('Get logs error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

## 3. WebSocket Implementation

### 3.1 Socket.IO Server Setup

```typescript
// lib/socket.ts
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { deviceAuth } from '@/middleware/auth';

export let io: SocketIOServer;

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
    maxHttpBufferSize: 1e6,
    pingInterval: 25000,
    pingTimeout: 10000,
  });

  // Device namespace
  io.of('/device-socket').on('connection', handleDeviceConnection);

  // Admin namespace
  io.of('/admin-socket').on('connection', handleAdminConnection);

  return io;
}

async function handleDeviceConnection(socket: Socket) {
  try {
    // Extract device from auth token
    const device = await deviceAuth({ headers: socket.handshake.auth });

    socket.data.device = device;
    socket.data.tenantId = device.tenantId;

    // Join device-specific room
    socket.join(`device:${device.id}`);
    socket.join(`tenant:${device.tenantId}`);

    console.log(`Device connected: ${device.id}`);

    // Emit welcome message
    socket.emit('connected', {
      deviceId: device.id,
      timestamp: new Date().toISOString(),
    });

    // Listen for command acknowledgments
    socket.on('command:ack', (data) => {
      handleCommandAck(data, device);
    });

    // Listen for device events
    socket.on('device:event', (event) => {
      handleDeviceEvent(event, device);
    });

    socket.on('disconnect', () => {
      console.log(`Device disconnected: ${device.id}`);
      updateDeviceStatus(device.id, 'offline');
    });
  } catch (error) {
    console.error('Device connection error:', error);
    socket.emit('error', { message: 'Authentication failed' });
    socket.disconnect();
  }
}

async function handleAdminConnection(socket: Socket) {
  try {
    // Extract admin from auth token
    const admin = await adminAuth({ headers: socket.handshake.auth });

    socket.data.admin = admin;
    socket.data.tenantId = admin.tenantId;

    // Join admin room
    socket.join(`admin:${admin.tenantId}`);

    console.log(`Admin connected: ${admin.id}`);

    // Listen for admin commands
    socket.on('send-command', (data) => {
      handleAdminCommand(data, admin);
    });

    socket.on('disconnect', () => {
      console.log(`Admin disconnected: ${admin.id}`);
    });
  } catch (error) {
    console.error('Admin connection error:', error);
    socket.emit('error', { message: 'Authentication failed' });
    socket.disconnect();
  }
}

async function handleCommandAck(data: any, device: any) {
  await db.command.update({
    where: { id: data.commandId },
    data: {
      status: data.status,
      ackAt: new Date(),
      error: data.errorMessage,
    },
  });

  // Notify admin dashboard
  io.to(`admin:${device.tenantId}`).emit('command:ack', data);
}

async function handleDeviceEvent(event: any, device: any) {
  // Log event
  await db.deviceEvent.create({
    data: {
      device: { connect: { id: device.id } },
      type: event.type,
      data: event.data,
    },
  });

  // Notify admin dashboard
  io.to(`admin:${device.tenantId}`).emit('device:event', {
    ...event,
    deviceId: device.id,
    timestamp: new Date().toISOString(),
  });
}
```

### 3.2 Express/Next.js Integration

```typescript
// pages/api/socket.ts or api/socket/route.ts
import { initializeSocket } from '@/lib/socket';

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO');
    res.socket.server.io = initializeSocket(res.socket.server);
  }

  res.end();
}
```

---

## 4. Error Handling & Validation

### 4.1 Common Error Responses

```typescript
// lib/errors.ts
export class KioskError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export const errors = {
  UNAUTHORIZED: new KioskError('UNAUTHORIZED', 401, 'Unauthorized'),
  TOKEN_EXPIRED: new KioskError('TOKEN_EXPIRED', 401, 'Token expired'),
  DEVICE_NOT_FOUND: new KioskError('DEVICE_NOT_FOUND', 404, 'Device not found'),
  INVALID_PAYLOAD: new KioskError('INVALID_PAYLOAD', 400, 'Invalid payload'),
  SERVER_ERROR: new KioskError('SERVER_ERROR', 500, 'Server error'),
};

// Middleware for error handling
export function errorHandler(error: Error, res: NextApiResponse) {
  if (error instanceof KioskError) {
    return res.status(error.statusCode).json({
      error: error.code,
      message: error.message,
    });
  }

  logger.error('Unhandled error:', error);
  return res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Internal server error',
  });
}
```

---

## 5. Implementation Phases

### Phase 1: Core REST APIs (Week 1)
- [ ] Device heartbeat endpoint
- [ ] Create visit endpoint
- [ ] Checkout visit endpoint
- [ ] Database schema setup
- [ ] Authentication middleware

### Phase 2: Device Management (Week 2)
- [ ] List devices endpoint
- [ ] Send command endpoint
- [ ] Commands queue endpoint
- [ ] Command ACK endpoint
- [ ] Device config update endpoint

### Phase 3: WebSocket (Week 2-3)
- [ ] Socket.IO server setup
- [ ] Device socket connection
- [ ] Admin socket connection
- [ ] Real-time command delivery
- [ ] Device event streaming

### Phase 4: Admin Dashboard APIs (Week 3)
- [ ] Device logs endpoint
- [ ] Device status monitoring
- [ ] Command status tracking
- [ ] Batch operations (optional)

### Phase 5: Testing & Polish (Week 4)
- [ ] Integration tests
- [ ] Load testing
- [ ] Error scenarios
- [ ] Documentation

---

## 6. Database Tables Summary (Drizzle)

```typescript
// Core tables:
- devices (device, token, status, lastPing, battery, etc.)
- commands (type, payload, status, priority, expiresAt)
- deviceEvents (type, data, timestamp)
- visits (visitor, host, department, checkIn/Out, photos, signature)
- vehicles (plate, type, brand, color, passengerCount)
- tenantConfigs (photo/signature requirements, language, etc.)

// Relationships:
- Device -> Tenant (via tenantId)
- Device -> Command (one-to-many)
- Device -> Visit (one-to-many)
- Device -> DeviceEvent (one-to-many)
- Command -> Device (many-to-one)
- Visit -> Device (many-to-one)
- Visit -> Visitor (many-to-one)
- Visit -> Host (many-to-one)
- Visit -> Department (many-to-one)
- Vehicle -> Visit (one-to-one)
```

---

## 7. Security Checklist

- [ ] All endpoints require authentication (device token or admin token)
- [ ] Tokens have expiration dates (90 days for devices)
- [ ] Commands are signed with server key
- [ ] Timestamps prevent replay attacks
- [ ] Photos encrypted in transit (HTTPS)
- [ ] Sensitive data (signatures) stored securely
- [ ] Rate limiting on polling endpoints
- [ ] WebSocket messages validated server-side
- [ ] Tenant isolation enforced (no cross-tenant access)

---

## 8. Monitoring & Observability

```typescript
// Logging
logger.info('Device ping', { deviceId, battery, signal });
logger.error('Command failed', { commandId, error });

// Metrics
metrics.recordPing(deviceId);
metrics.recordVisitCreated(deviceId);
metrics.recordCommandSent(type);

// Alerts
alert('Device offline for 30+ minutes', { deviceId });
alert('High error rate on device', { deviceId });
```

---

## 9. Database Setup (Drizzle + Neon)

```bash
# Install dependencies
npm install drizzle-orm @neon-tech/serverless dotenv
npm install -D drizzle-kit

# Create .env.local
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname

# Generate migrations
npx drizzle-kit generate:pg

# Run migrations
npx drizzle-kit migrate
```

**Database client setup**:

```typescript
// lib/db.ts
import { neon } from '@neon-tech/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

---

## 10. API Testing

Create comprehensive tests:

```typescript
// __tests__/api/ping.test.ts
import { db } from '@/lib/db';
import { devices } from '@/db/schema';

describe('Device Ping', () => {
  it('should update device status to online', async () => {
    const response = await POST('/api/kiosk/device/ping', {
      deviceToken: 'test_token',
      timestamp: new Date().toISOString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    
    // Verify DB update
    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.token, 'test_token'))
      .limit(1)
      .then(rows => rows[0]);
    
    expect(device.status).toBe('online');
  });

  it('should return pending commands', async () => {
    // ... test command queue
  });
});
```

---

## 11. Rate Limiting

```typescript
// middleware/rateLimit.ts
export const devicePingRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 1,                   // 1 request per minute (heartbeat every 2 mins)
  keyGenerator: (req) => req.headers.authorization,
});

export const uploadRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,  // 10 uploads per minute per device
});
```

---

This completes the API implementation plan. Ready to proceed with backend development?
