import { master_db } from "@/db/master";
import { tenants } from "@/db/master/schema";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as tenantSchema from "./schema";

type TenantClient = {
  client: ReturnType<typeof postgres>;
  // Drizzle's inferred DB type can be complex; use `any` here to avoid
  // union-type errors when accessing table query builders at runtime.
  db: any;
};

const clients = new Map<string, TenantClient>();

import { withRetry } from "@/lib/db-retry";

export async function getTenantBySlug(slug: string) {
  return await withRetry(async () => {
    const tenant = await master_db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });
    return tenant ?? null;
  });
}

export async function getTenantDbBySlug(slug: string) {
  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const id = (tenant as any).id as string;

  // Prefer camelCase property inserted via Drizzle, fallback to snake_case
  const dbUrl = (tenant as any).dbUrl ?? (tenant as any).db_url;

  if (!dbUrl) {
    throw new Error("Tenant database URL not configured");
  }

  const cached = clients.get(id);
  if (cached) return cached.db;

  const client = postgres(dbUrl, { max: 1, idle_timeout: 20, connect_timeout: 10 });
  const db = drizzle(client, { schema: tenantSchema }) as any;

  clients.set(id, { client, db });

  return db;
}

export function getCachedTenantDb(tenantId: string) {
  return clients.get(tenantId)?.db ?? null;
}

/**
 * Clear the cached connection for a tenant so the next query creates a fresh one.
 */
export function clearTenantDbCache(tenantId: string) {
  const cached = clients.get(tenantId);
  if (cached) {
    cached.client.end().catch(() => {});
    clients.delete(tenantId);
  }
}

/**
 * Execute a function with a tenant DB, automatically retrying once on
 * connection failures (stale connection recovery).
 */
export async function withTenantDb<T>(
  slug: string,
  fn: (db: any) => Promise<T>
): Promise<T> {
  try {
    const db = await getTenantDbBySlug(slug);
    return await fn(db);
  } catch (error: any) {
    const msg = error?.message || "";
    const isConnectionError =
      msg.includes("Failed query") ||
      msg.includes("connection") ||
      msg.includes("ECONNRESET") ||
      msg.includes("timeout") ||
      msg.includes("fetch failed") ||
      error?.code === "ECONNRESET" ||
      error?.code === "UND_ERR_CONNECT_TIMEOUT";

    if (isConnectionError) {
      console.warn("[withTenantDb] Connection error, retrying with fresh connection:", msg.slice(0, 200));
      // Clear stale connection
      const tenant = await getTenantBySlug(slug);
      if (tenant) {
        clearTenantDbCache((tenant as any).id as string);
      }
      const db = await getTenantDbBySlug(slug);
      return await fn(db);
    }
    throw error;
  }
}

export async function closeAllTenantDbs() {
  for (const { client } of clients.values()) {
    try {
      await client.end();
    } catch (_) {
      // ignore
    }
  }
  clients.clear();
}
