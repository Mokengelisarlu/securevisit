"use server";

import { master_db } from "@/db/master";
import { tenants } from "@/db/master/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { createTenantDatabase } from "../createtenantDb";
import { syncUser } from "@/features/users/server/syncUser";

/* ---------------------------------------
   Utils
--------------------------------------- */
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30); // ✅ limit slug length
}

/* ---------------------------------------
   Server Action
--------------------------------------- */
export async function createTenant(name: string, rawSlug: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 0️⃣ Sync user to database
  await syncUser();

  // 🔑 Normalize slug from param
  const slug = generateSlug(rawSlug);

  if (!slug) {
    throw new Error("Invalid acronyme");
  }

  // 1️⃣ Ensure slug is unique BEFORE creating DB
  const exists = await master_db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (exists.length > 0) {
    throw new Error("A tenant with this acronyme already exists");
  }

  // 2️⃣ Create tenant database
  const dbUrl = await createTenantDatabase(
    slug,
    `tenant_owner_${slug}`
  );

  // 3️⃣ Save tenant in MASTER DB
  const [tenant] = await master_db
    .insert(tenants)
    .values({
      name,
      slug,
      ownerId: userId,
      dbUrl,
    })
    .returning();

  return tenant;
}
