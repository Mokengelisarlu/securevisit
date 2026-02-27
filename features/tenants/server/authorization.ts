"use server";

import { auth } from "@clerk/nextjs/server";
import { master_db } from "@/db/master";
import { tenants } from "@/db/master/schema";
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
