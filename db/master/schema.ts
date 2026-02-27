// filename: schema.ts

import {
    pgTable,
    serial,
    text,
    varchar,
    timestamp,
    numeric,
    integer,
    uuid,
    pgEnum,
    index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ---------------------------------------------------------
   1. ENUM SQL
--------------------------------------------------------- */

// Rôles internes de l'entreprise
export const userRoleEnum = pgEnum("user_role", ["Admin", "Tenant", "SUPER"]);




/* ---------------------------------------------------------
   2. UTILISATEURS (Clerk)
--------------------------------------------------------- */

export const users = pgTable("users", {
    // ID Clerk = clé primaire
    id: text("id").primaryKey(),

    role: userRoleEnum("role").notNull(),

    // Infos sync avec Clerk
    nom: text("nom"),
    email: text("email"),

    createdAt: timestamp("createdAt").defaultNow(),
});


/* ---------------------------------------------------------
   3. TENANTS (Entreprises clientes)
--------------------------------------------------------- */

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(), // Nom de l'entreprise

  // subdomain : acme.vizito.app
  slug: varchar("slug", { length: 100 }).notNull().unique(),

  // URL de la DB dédiée (Neon)
  dbUrl: text("db_url").notNull(),

  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),

  isActive: integer("is_active").default(1),

  createdAt: timestamp("created_at").defaultNow(),
});

/* ---------------------------------------------------------
   4. RELATIONS
--------------------------------------------------------- */
export const usersRelations = relations(users, ({ many }) => ({
    // Un utilisateur peut appartenir à plusieurs tenants (entreprises)
    tenants: many(tenants),
}));

export const tenantsRelations = relations(tenants, ({ one }) => ({
  owner: one(users, {
    fields: [tenants.ownerId],
    references: [users.id],
  }),
}));
