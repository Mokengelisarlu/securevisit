# Drizzle ORM Schema - Device Communication Tables

Complete schema for device communication, visits, and admin management using Drizzle ORM with Neon Postgres.

## Installation

```bash
npm install drizzle-orm @neon-tech/serverless drizzle-kit
npm install -D tsx
```

## Environment Setup

Create `.env.local`:
```
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname
```

## Repository Schema (use these instead)

Note: this repository uses a master/tenant schema split. Prefer the on-disk schema files under `db/master/schema.ts` and `db/tenants/schema.ts` when implementing or generating migrations. The `db/tenants/schema.ts` contains the tenant-scoped tables (visits, visitors, devices, settings, etc.). The `db/master/schema.ts` contains the central tenant registry and users tables.

Use the tenant DB loader implemented at `db/tenants/index.ts` (`getTenantDbBySlug`) to obtain a Drizzle client for a specific tenant database URL. That code wires a `drizzle(client, { schema: tenantSchema })` using `db/tenants/schema.ts`.

Examples:

```ts
// get tenant db client
import { getTenantDbBySlug } from '@/db/tenants';

const db = await getTenantDbBySlug('acme');
// `db` is a Drizzle instance where you can `select().from(visits)` using tenant schema
```

When generating migrations for a tenant database, use `db/tenants/schema.ts` as the source of truth for Drizzle migrations. For master migrations (tenant registry), use `db/master/schema.ts`.

## Core Schema

```typescript
// db/schema.ts
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  json,
  boolean,
  index,
  primaryKey,
  decimal,
  enum as pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ═══════════════════════════════════════════
// ENUM TYPES
// ═══════════════════════════════════════════

export const deviceStatusEnum = pgEnum('device_status', ['online', 'offline', 'error']);
export const commandStatusEnum = pgEnum('command_status', ['pending', 'acked', 'applied', 'failed']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical']);
export const visitStatusEnum = pgEnum('visit_status', ['checked_in', 'checked_out', 'cancelled']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['CAR', 'TRUCK', 'MOTORCYCLE', 'OTHER']);

// ═══════════════════════════════════════════
// CORE TABLES
// ═══════════════════════════════════════════

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const devices = pgTable(
  'devices',
  {
    id: text('id').primaryKey().notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    tokenCreatedAt: timestamp('token_created_at').defaultNow().notNull(),
    tokenExpiresAt: timestamp('token_expires_at').notNull(),
    status: deviceStatusEnum('status').default('offline').notNull(),
    lastPingAt: timestamp('last_ping_at'),
    deviceInfo: json('device_info').$type<{
      appVersion?: string;
      osVersion?: string;
      deviceModel?: string;
      memoryUsed?: number;
      batteryLevel?: number;
      isCharging?: boolean;
      wifiSignal?: number;
    }>(),
    currentScreen: varchar('current_screen', { length: 50 }), // main-menu, check-in, check-out, pairing
    location: varchar('location', { length: 255 }), // "Reception", "Building A", etc.
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('devices_tenant_idx').on(table.tenantId),
    tokenIdx: index('devices_token_idx').on(table.token),
    statusIdx: index('devices_status_idx').on(table.status),
  })
);

export const commands = pgTable(
  'commands',
  {
    id: text('id').primaryKey().notNull(),
    deviceId: text('device_id')
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // CONFIG_UPDATE, REBOOT, EMERGENCY_MESSAGE, CLEAR_CACHE, REFRESH_SETTINGS
    payload: json('payload').$type<Record<string, any>>().notNull(),
    status: commandStatusEnum('status').default('pending').notNull(),
    priority: priorityEnum('priority').default('medium').notNull(),
    ackAt: timestamp('ack_at'),
    appliedAt: timestamp('applied_at'),
    error: text('error'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    deviceIdx: index('commands_device_idx').on(table.deviceId),
    statusIdx: index('commands_status_idx').on(table.status),
    expiresIdx: index('commands_expires_idx').on(table.expiresAt),
  })
);

export const deviceEvents = pgTable(
  'device_events',
  {
    id: text('id').primaryKey().notNull(),
    deviceId: text('device_id')
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // CHECK_IN, CHECKOUT, ERROR, SCREEN_CHANGE, COMMAND_FAILED
    data: json('data').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    deviceIdx: index('device_events_device_idx').on(table.deviceId),
    typeIdx: index('device_events_type_idx').on(table.type),
    createdIdx: index('device_events_created_idx').on(table.createdAt),
  })
);

// ═══════════════════════════════════════════
// VISITS & VISITORS
// ═══════════════════════════════════════════

export const visitors = pgTable(
  'visitors',
  {
    id: text('id').primaryKey().notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    company: varchar('company', { length: 255 }),
    visitorTypeId: text('visitor_type_id'),
    photoUrl: text('photo_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('visitors_tenant_idx').on(table.tenantId),
    nameIdx: index('visitors_name_idx').on(table.firstName, table.lastName),
  })
);

export const hosts = pgTable(
  'hosts',
  {
    id: text('id').primaryKey().notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('hosts_tenant_idx').on(table.tenantId),
  })
);

export const departments = pgTable(
  'departments',
  {
    id: text('id').primaryKey().notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('departments_tenant_idx').on(table.tenantId),
  })
);

export const visits = pgTable(
  'visits',
  {
    id: text('id').primaryKey().notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    deviceId: text('device_id')
      .notNull()
      .references(() => devices.id, { onDelete: 'set null' }),
    visitorId: text('visitor_id')
      .notNull()
      .references(() => visitors.id, { onDelete: 'restrict' }),
    hostId: text('host_id').references(() => hosts.id, { onDelete: 'set null' }),
    departmentId: text('department_id').references(() => departments.id, { onDelete: 'set null' }),
    purpose: text('purpose'),
    checkInAt: timestamp('check_in_at').notNull(),
    checkOutAt: timestamp('check_out_at'),
    status: visitStatusEnum('status').default('checked_in').notNull(),
    visitorPhotoUrl: text('visitor_photo_url'),
    vehiclePhotoUrl: text('vehicle_photo_url'),
    signatureUrl: text('signature_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('visits_tenant_idx').on(table.tenantId),
    visitorIdx: index('visits_visitor_idx').on(table.visitorId),
    deviceIdx: index('visits_device_idx').on(table.deviceId),
    checkInIdx: index('visits_check_in_idx').on(table.checkInAt),
    statusIdx: index('visits_status_idx').on(table.status),
  })
);

export const vehicles = pgTable(
  'vehicles',
  {
    id: text('id').primaryKey().notNull(),
    visitId: text('visit_id')
      .notNull()
      .unique()
      .references(() => visits.id, { onDelete: 'cascade' }),
    plateNumber: varchar('plate_number', { length: 50 }).notNull(),
    type: vehicleTypeEnum('type').notNull(),
    brand: varchar('brand', { length: 100 }),
    color: varchar('color', { length: 50 }),
    passengerCount: integer('passenger_count').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    plateIdx: index('vehicles_plate_idx').on(table.plateNumber),
  })
);

// ═══════════════════════════════════════════
// TENANT CONFIGURATION
// ═══════════════════════════════════════════

export const tenantConfigs = pgTable(
  'tenant_configs',
  {
    id: text('id').primaryKey().notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .unique()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    requireVisitorPhoto: boolean('require_visitor_photo').default(false).notNull(),
    requireVehiclePhoto: boolean('require_vehicle_photo').default(false).notNull(),
    requireSignature: boolean('require_signature').default(true).notNull(),
    visitorPhotoQuality: varchar('visitor_photo_quality', { length: 20 }).default('medium').notNull(), // low, medium, high
    language: varchar('language', { length: 10 }).default('fr').notNull(),
    autoResetTimeout: integer('auto_reset_timeout').default(180).notNull(), // seconds
    version: varchar('version', { length: 50 }).notNull(),
    lastModifiedAt: timestamp('last_modified_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index('tenant_configs_tenant_idx').on(table.tenantId),
  })
);

// ═══════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════

export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  devices: many(devices),
  commands: many(commands),
  visits: many(visits),
  visitors: many(visitors),
  hosts: many(hosts),
  departments: many(departments),
  config: one(tenantConfigs),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [devices.tenantId],
    references: [tenants.id],
  }),
  commands: many(commands),
  visits: many(visits),
  events: many(deviceEvents),
}));

export const commandsRelations = relations(commands, ({ one }) => ({
  device: one(devices, {
    fields: [commands.deviceId],
    references: [devices.id],
  }),
}));

export const deviceEventsRelations = relations(deviceEvents, ({ one }) => ({
  device: one(devices, {
    fields: [deviceEvents.deviceId],
    references: [devices.id],
  }),
}));

export const visitorsRelations = relations(visitors, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [visitors.tenantId],
    references: [tenants.id],
  }),
  visits: many(visits),
}));

export const hostsRelations = relations(hosts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [hosts.tenantId],
    references: [tenants.id],
  }),
  visits: many(visits),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [departments.tenantId],
    references: [tenants.id],
  }),
  visits: many(visits),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  tenant: one(tenants, {
    fields: [visits.tenantId],
    references: [tenants.id],
  }),
  device: one(devices, {
    fields: [visits.deviceId],
    references: [devices.id],
  }),
  visitor: one(visitors, {
    fields: [visits.visitorId],
    references: [visitors.id],
  }),
  host: one(hosts, {
    fields: [visits.hostId],
    references: [hosts.id],
  }),
  department: one(departments, {
    fields: [visits.departmentId],
    references: [departments.id],
  }),
  vehicle: one(vehicles, {
    fields: [visits.id],
    references: [vehicles.visitId],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  visit: one(visits, {
    fields: [vehicles.visitId],
    references: [visits.id],
  }),
}));

export const tenantConfigsRelations = relations(tenantConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantConfigs.tenantId],
    references: [tenants.id],
  }),
}));
```

## Database Client Setup

```typescript
// lib/db.ts
import { neon, neonConfig } from '@neon-tech/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

// Configure neon
neonConfig.fetchConnectionCache = true;

// Create SQL client
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle instance
export const db = drizzle(sql, { schema });

// Export types for use in API handlers
export type DB = typeof db;
```

## Drizzle Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

## Migration Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Apply migrations to database
npx drizzle-kit migrate

# Drop all tables (dev only!)
npx drizzle-kit drop

# Studio: Visual database manager
npx drizzle-kit studio
```

## Common Query Patterns

### Select All
```typescript
import { db } from '@/lib/db';
import { devices } from '@/db/schema';

const allDevices = await db.select().from(devices);
```

### Select with Where
```typescript
import { eq } from 'drizzle-orm';

const device = await db
  .select()
  .from(devices)
  .where(eq(devices.token, token))
  .limit(1)
  .then(rows => rows[0]);
```

### Select with Join
```typescript
import { leftJoin } from 'drizzle-orm';

const visitsWithVehicles = await db
  .select()
  .from(visits)
  .leftJoin(vehicles, eq(visits.id, vehicles.visitId));
```

### Insert
```typescript
import { generateId } from '@/lib/utils';

await db.insert(devices).values({
  id: generateId(),
  tenantId,
  token,
  tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
});
```

### Update
```typescript
import { eq } from 'drizzle-orm';

await db
  .update(devices)
  .set({
    status: 'online',
    lastPingAt: new Date(),
  })
  .where(eq(devices.id, deviceId));
```

### Delete
```typescript
import { eq } from 'drizzle-orm';

await db
  .delete(commands)
  .where(eq(commands.id, commandId));
```

### Count
```typescript
import { count } from 'drizzle-orm';

const total = await db
  .select({ count: count() })
  .from(visits)
  .where(eq(visits.status, 'checked_in'))
  .then(rows => rows[0]?.count || 0);
```

### Aggregate
```typescript
import { sum, avg } from 'drizzle-orm';

const stats = await db
  .select({
    totalVisits: count(),
    avgBattery: avg(devices.deviceInfo),
  })
  .from(visits)
  .leftJoin(devices, eq(visits.deviceId, devices.id));
```

### Order & Limit
```typescript
import { desc } from 'drizzle-orm';

const recentVisits = await db
  .select()
  .from(visits)
  .where(eq(visits.status, 'checked_in'))
  .orderBy(desc(visits.checkInAt))
  .limit(10);
```

## Package.json Scripts

```json
{
  "scripts": {
    "db:push": "drizzle-kit push:pg",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop",
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## Type Inference

```typescript
// Get inferred types from tables
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { devices, visits } from '@/db/schema';

type Device = InferSelectModel<typeof devices>;
type NewDevice = InferInsertModel<typeof devices>;

type Visit = InferSelectModel<typeof visits>;
type NewVisit = InferInsertModel<typeof visits>;

// Use in API handlers
async function createDevice(data: NewDevice): Promise<Device> {
  return await db
    .insert(devices)
    .values(data)
    .returning()
    .then(rows => rows[0]);
}
```

## Environment Variables

```bash
# .env.local
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname

# Optional: Neon connection string options
# Add ?sslmode=require for SSL connections (default for Neon)
# Add ?connect_timeout=10 for custom timeout
```

## Neon-Specific Setup

```bash
# 1. Create Neon account at https://console.neon.tech
# 2. Create new project
# 3. Copy connection string to .env.local
# 4. Run migrations:
npx drizzle-kit migrate

# 5. Test connection:
npm run db:studio
```

## Best Practices

1. **Always use parameterized queries** (Drizzle does this automatically)
2. **Index frequently queried columns** (tenantId, status, timestamps)
3. **Use relations** for type safety and automatic joins
4. **Set appropriate expiration dates** for commands and tokens
5. **Implement soft deletes** if needed (add `deletedAt` timestamp)
6. **Use transactions** for multi-table operations:

```typescript
import { db } from '@/lib/db';

const result = await db.transaction(async (tx) => {
  const visit = await tx.insert(visits).values(...).returning();
  await tx.insert(deviceEvents).values(...);
  return visit;
});
```

## Troubleshooting

**Connection timeouts**:
- Add `?connect_timeout=10` to DATABASE_URL
- Check Neon project status and compute time

**"Relations not found" error**:
- Ensure all tables are included in schema exports
- Verify relation definitions match table structures

**Migration conflicts**:
- Use `drizzle-kit drop` (dev only) to reset
- Or manually delete migration files and regenerate

**Type errors**:
- Run `drizzle-kit generate` to sync types
- Check that schema matches your database

---

Ready to start building APIs with this schema!
