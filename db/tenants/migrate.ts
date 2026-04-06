import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export async function runTenantMigrations(dbUrl: string) {
  console.log("🚀 Starting tenant migrations...");
  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client);

  try {
    await migrate(db, {
      migrationsFolder: "db/tenants/migrations",
    });
    console.log("✅ Tenant migrations completed successfully.");
  } catch (error: any) {
    console.error("❌ Tenant migration failed:", error.message);
    // We don't re-throw here to prevent crashing the entire SSR/request flow
    // if migrations are already up to date but the folder is missing.
  } finally {
    await client.end();
  }
}
