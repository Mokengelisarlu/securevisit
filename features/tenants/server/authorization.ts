"use server";

import { auth } from "@clerk/nextjs/server";
import { master_db } from "@/db/master";
import { tenants, users as masterUsers } from "@/db/master/schema";
import { eq } from "drizzle-orm";

import { getTenantDbBySlug } from "@/db/tenants";
import { users } from "@/db/tenants/schema";

/**
 * Verify that the current user has access to the tenant with the given slug.
 * Checks both master ownership and tenant user membership.
 */
export async function verifyTenantOwnership(tenantSlug: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // 1. Check if tenant exists
  const [tenant] = await master_db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // 2. If user is owner, they always have access
  if (tenant.ownerId === userId) {
    return tenant;
  }

  // 3. Otherwise, check if they are an authorized user in the tenant DB
  const db = await getTenantDbBySlug(tenantSlug);
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error("Forbidden: You do not have access to this tenant");
  }

  return tenant;
}

/**
 * Helper to check if user has specific roles
 */
export async function requireRole(tenantSlug: string, allowedRoles: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = await getTenantDbBySlug(tenantSlug);
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return user;
}

/**
 * Get all tenants owned by the current user.
 */
export async function getUserTenants() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: User not authenticated");
  }

  return await master_db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, userId));
}

/**
 * Verify that the current user is a platform admin (SUPER or Admin role in master DB).
 * Used to protect /api/admin/* routes.
 */
export async function verifyAdminAccess(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  const [user] = await master_db
    .select({ role: masterUsers.role })
    .from(masterUsers)
    .where(eq(masterUsers.id, userId))
    .limit(1);

  if (!user) {
    return false;
  }

  return user.role === "SUPER" || user.role === "Admin";
}

/**
 * Get the current user's role within a tenant.
 * Returns null if the user is not a member of the tenant.
 */
export async function getCurrentUserRole(tenantSlug: string): Promise<string | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Check if owner
  const [tenant] = await master_db
    .select({ ownerId: tenants.ownerId })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    return null;
  }

  if (tenant.ownerId === userId) {
    return "ROOT";
  }

  // Check tenant DB
  const db = await getTenantDbBySlug(tenantSlug);
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user?.role ?? null;
}
