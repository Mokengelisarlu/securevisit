import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
  unique,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* =====================================================
   ENUMS
===================================================== */

export const userRoleEnum = pgEnum("user_role", [
  "ROOT",
  "ADMIN",
  "SECURITY",
  "RECEPTION",
  "HOST",
]);

export const visitStatusEnum = pgEnum("visit_status", [
  "IN",
  "OUT",
  "CANCELLED",
  "SCHEDULED",
  "PENDING_APPROVAL",
  "APPROVED",
  "POSTPONED",
  "REJECTED",
]);

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "CAR",
  "TRUCK",
  "MOTORCYCLE",
  "OTHER",
]);

export const visitTypeEnum = pgEnum("visit_type", [
  "WALK_IN",
  "PRE_REGISTERED",
  "GROUP",
]);

export const participantStatusEnum = pgEnum("participant_status", [
  "EXPECTED",
  "WAITING",
  "CHECKED_IN",
  "CHECKED_OUT",
  "NO_SHOW",
  "CANCELED",
]);

export const commandStatusEnum = pgEnum("command_status", [
  "pending",
  "acked",
  "applied",
  "failed",
]);

export const commandPriorityEnum = pgEnum("command_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const deviceEventTypeEnum = pgEnum("device_event_type", [
  "CHECK_IN",
  "CHECKOUT",
  "ERROR",
  "SCREEN_CHANGE",
  "COMMAND_APPLIED",
  "COMMAND_FAILED",
  "REBOOT",
  "ONLINE",
  "OFFLINE",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "VISIT_REQUEST_CREATED",
  "VISIT_APPROVED",
  "VISIT_REJECTED",
  "VISIT_POSTPONED",
  "VISIT_CANCELLED",
  "VISITOR_CHECKED_IN",
  "VISITOR_CHECKED_OUT",
  "VISITOR_NO_SHOW",
]);

/* =====================================================
   USERS (Security / Reception / Admin)
===================================================== */

export const users = pgTable("users", {
  id: text("id").primaryKey(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  email: text("email").notNull(),

  role: userRoleEnum("role").notNull(),

  // V2: Link HOST role users to a hosts record
  hostId: uuid("host_id"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const authorizedUsers = pgTable("authorized_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =====================================================
   DEPARTMENTS
===================================================== */

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =====================================================
   VISITOR TYPES
   ===================================================== */

export const visitorTypes = pgTable("visitor_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =====================================================
   SERVICES
 ===================================================== */

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  departmentId: uuid("department_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =====================================================
   HOSTS (Internal Employees)
===================================================== */

export const hosts = pgTable("hosts", {
  id: uuid("id").defaultRandom().primaryKey(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"), // for "Postnom"
  photoUrl: text("photo_url"),
  email: text("email"),
  phone: text("phone"),

  departmentId: uuid("department_id").notNull(),

  isActive: integer("is_active").default(1),

  createdAt: timestamp("created_at").defaultNow(),
});

/* =====================================================
   VISITORS
===================================================== */

export const visitors = pgTable("visitors", {
  id: uuid("id").defaultRandom().primaryKey(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),

  phone: text("phone"),
  company: text("company"),

  photoUrl: text("photo_url"),

  visitorTypeId: uuid("visitor_type_id"),

  createdAt: timestamp("created_at").defaultNow(),
});

/* =====================================================
   VEHICLES
===================================================== */

export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),

  plateNumber: text("plate_number").notNull(),
  type: vehicleTypeEnum("type").notNull().default("CAR"),
  brand: text("brand"),
  color: text("color"),

  createdAt: timestamp("created_at").defaultNow(),
});

/* =====================================================
   VISITS (Visitor Register)
===================================================== */

export const visits = pgTable("visits", {
  id: uuid("id").defaultRandom().primaryKey(),

  visitNumber: text("visit_number").notNull(),

  visitorId: uuid("visitor_id").notNull(),

  hostId: uuid("host_id"),
  departmentId: uuid("department_id"),
  serviceId: uuid("service_id"),

  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  passengerCount: integer("passenger_count").default(0),
  visitType: visitTypeEnum("visit_type").default("WALK_IN"),

  visitDate: timestamp("visit_date").defaultNow(),

  purpose: text("purpose"),

  lastVisitedWith: text("last_visited_with"),

  checkInAt: timestamp("check_in_at").defaultNow(),
  checkOutAt: timestamp("check_out_at"),

  durationMinutes: integer("duration_minutes"),

  activityDone: text("activity_done"),

  status: visitStatusEnum("status").default("IN"),

  signatureData: text("signature_data"), // Base64 or SVG
  policyAcceptedAt: timestamp("policy_accepted_at"),

  visitorPhotoUrl: text("visitor_photo_url"),
  vehiclePhotoUrl: text("vehicle_photo_url"),

  // --- V2: Approval workflow fields ---
  groupName: text("group_name"),
  organization: text("organization"),
  participantCount: integer("participant_count").default(1),
  arrivalAt: timestamp("arrival_at"),
  notes: text("notes"),

  // Approval fields
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: text("rejected_by"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  postponedBy: text("postponed_by"),
  postponedAt: timestamp("postponed_at"),
  postponeReason: text("postpone_reason"),
  newProposedDate: timestamp("new_proposed_date"),
  canceledBy: text("canceled_by"),
  canceledAt: timestamp("canceled_at"),
  cancelReason: text("cancel_reason"),
});

/* =====================================================
   DEVICES (Kiosks / Tablets)
===================================================== */

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name"),
    description: text("description"),

    location: text("location"),
    deviceType: text("device_type").default("KIOSK"), // e.g., KIOSK, STAFF_TABLET

  pairingCode: text("pairing_code"), // The code generated by the kiosk
  pairingCodeExpiresAt: timestamp("pairing_code_expires_at"),
  deviceToken: text("device_token"), // Secret token stored on device after pairing
  /** Stable per-physical device identifier coming from the mobile app. */
  deviceId: text("device_id"),
  // Ensure the same physical device doesn't create multiple rows per tenant.
  // (Composite unique is added via table config below; keeping column here.)

  isPaired: integer("is_paired").default(0), // 0 for pending, 1 for paired
  pairedAt: timestamp("paired_at"),

  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("devices_device_id_unique").on(table.deviceId),
  ]
);

/* =====================================================
   DEVICE EVENTS (per-kiosk activity feed)
===================================================== */

export const deviceEvents = pgTable(
  "device_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    type: deviceEventTypeEnum("type").notNull(),
    severity: text("severity").default("info"), // info | warning | error
    message: text("message"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("device_events_device_id_idx").on(t.deviceId),
    index("device_events_type_idx").on(t.type),
    index("device_events_created_at_idx").on(t.createdAt),
  ]
);

/* =====================================================
   SETTINGS
===================================================== */

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),

  // NDA / Policy
  ndaPolicyText: text("nda_policy_text"),
  requireSignature: integer("require_signature").default(1), // 0 or 1
  requireVisitorPhoto: integer("require_visitor_photo").default(0), // 0 or 1
  requireVehiclePhoto: integer("require_vehicle_photo").default(0), // 0 or 1
  requireVehicleCheck: integer("require_vehicle_check").default(0), // 0 or 1

  // V2: Approval workflow config
  requireHostApproval: integer("require_host_approval").default(1), // 0=operator bypass, 1=always require
  waitingWarningMinutes: integer("waiting_warning_minutes").default(15),
  waitingCriticalMinutes: integer("waiting_critical_minutes").default(30),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

/* =====================================================
   V2: VISIT PARTICIPANTS (Group visit members)
===================================================== */

export const visitParticipants = pgTable(
  "visit_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitId: uuid("visit_id").notNull(),
    visitorId: uuid("visitor_id").notNull(),
    status: participantStatusEnum("status").default("WAITING"),
    checkedInAt: timestamp("checked_in_at"),
    checkedOutAt: timestamp("checked_out_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("visit_participants_visit_id_idx").on(t.visitId),
    unique("visit_participants_visit_visitor_unique").on(t.visitId, t.visitorId),
  ]
);

/* =====================================================
   V2: VISIT STATUS HISTORY (Audit trail)
===================================================== */

export const visitStatusHistory = pgTable(
  "visit_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitId: uuid("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actorId: text("actor_id"),
    actorRole: text("actor_role"),
    reason: text("reason"),
    metadata: text("metadata"), // JSON string
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("visit_status_history_visit_idx").on(t.visitId, t.createdAt)]
);

/* =====================================================
   V2: NOTIFICATIONS
===================================================== */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: text("recipient_id").notNull(),
    recipientRole: text("recipient_role"),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    visitId: uuid("visit_id").references(() => visits.id, { onDelete: "cascade" }),
    isRead: integer("is_read").default(0),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("notifications_recipient_idx").on(t.recipientId, t.isRead, t.createdAt)]
);

/* =====================================================
   V2: AUDIT LOGS
===================================================== */

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: text("actor_id"),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  previousValue: text("previous_value"), // JSON string
  newValue: text("new_value"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =====================================================
   RELATIONS
===================================================== */

export const usersRelations = relations(users, ({ many }) => ({
  // future: actions, logs, etc.
}));

export const devicesRelations = relations(devices, ({ many }) => ({
  events: many(deviceEvents),
}));

export const deviceEventsRelations = relations(deviceEvents, ({ one }) => ({
  device: one(devices, {
    fields: [deviceEvents.deviceId],
    references: [devices.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  hosts: many(hosts),
  visits: many(visits),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  department: one(departments, {
    fields: [services.departmentId],
    references: [departments.id],
  }),
  visits: many(visits),
}));

export const hostsRelations = relations(hosts, ({ one, many }) => ({
  department: one(departments, {
    fields: [hosts.departmentId],
    references: [departments.id],
  }),
  visits: many(visits),
}));

export const visitorsRelations = relations(visitors, ({ one, many }) => ({
  type: one(visitorTypes, {
    fields: [visitors.visitorTypeId],
    references: [visitorTypes.id],
  }),
  visits: many(visits),
  participants: many(visitParticipants),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
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

  service: one(services, {
    fields: [visits.serviceId],
    references: [services.id],
  }),

  vehicle: one(vehicles, {
    fields: [visits.vehicleId],
    references: [vehicles.id],
  }),

  participants: many(visitParticipants),
  statusHistory: many(visitStatusHistory),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  visits: many(visits),
}));

export const visitParticipantsRelations = relations(visitParticipants, ({ one }) => ({
  visit: one(visits, {
    fields: [visitParticipants.visitId],
    references: [visits.id],
  }),
  visitor: one(visitors, {
    fields: [visitParticipants.visitorId],
    references: [visitors.id],
  }),
}));

export const visitStatusHistoryRelations = relations(visitStatusHistory, ({ one }) => ({
  visit: one(visits, {
    fields: [visitStatusHistory.visitId],
    references: [visits.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  visit: one(visits, {
    fields: [notifications.visitId],
    references: [visits.id],
  }),
}));

/* =====================================================
   BUSINESS SETTINGS
===================================================== */

export const businessSettings = pgTable("business_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Identity
  name: text("name"),             // Display / commercial name
  logoUrl: text("logo_url"),
  // Contact
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  // Location
  address: text("address"),
  city: text("city"),
  country: text("country"),
  // Business
  industry: text("industry"),
  taxId: text("tax_id"),          // RCCM / NIF / etc.
  // Meta
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =====================================================
   COMMANDS (Admin → Device remote control)
===================================================== */

export const commands = pgTable(
  "commands",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // CONFIG_UPDATE | REBOOT | EMERGENCY_MESSAGE | CLEAR_CACHE | REFRESH_SETTINGS
    payload: jsonb("payload"),
    status: commandStatusEnum("status").notNull().default("pending"),
    priority: commandPriorityEnum("priority").notNull().default("medium"),
    ackAt: timestamp("ack_at"),
    appliedAt: timestamp("applied_at"),
    error: text("error"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("commands_device_id_idx").on(t.deviceId),
    index("commands_status_idx").on(t.status),
    index("commands_expires_at_idx").on(t.expiresAt),
  ]
);
