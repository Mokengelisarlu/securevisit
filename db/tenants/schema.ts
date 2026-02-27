import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
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
]);

export const visitStatusEnum = pgEnum("visit_status", [
  "IN",
  "OUT",
  "CANCELLED",
  "SCHEDULED",
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
});

/* =====================================================
   DEVICES (Kiosks / Tablets)
===================================================== */

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  description: text("description"),
  location: text("location"),
  deviceType: text("device_type").default("KIOSK"), // e.g., KIOSK, STAFF_TABLET
  pairingCode: text("pairing_code"), // The code generated by the kiosk
  pairingCodeExpiresAt: timestamp("pairing_code_expires_at"),
  deviceToken: text("device_token"), // Secret token stored on device after pairing
  isPaired: integer("is_paired").default(0), // 0 for pending, 1 for paired
  pairedAt: timestamp("paired_at"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

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

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

/* =====================================================
   RELATIONS
===================================================== */

export const usersRelations = relations(users, ({ many }) => ({
  // future: actions, logs, etc.
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
}));

export const visitsRelations = relations(visits, ({ one }) => ({
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
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  visits: many(visits),
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
