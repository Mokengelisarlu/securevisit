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

    // Keep legacy tenant databases compatible with the current devices schema.
    await client.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'devices' AND column_name = 'device_id'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'devices' AND column_name = 'divice_id'
          ) THEN
            ALTER TABLE "devices" RENAME COLUMN "divice_id" TO "device_id";
          ELSE
            ALTER TABLE "devices" ADD COLUMN "device_id" text;
          END IF;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE indexname = 'devices_device_id_unique'
        ) THEN
          IF EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE indexname = 'devices_divice_id_unique'
          ) THEN
            ALTER INDEX devices_divice_id_unique RENAME TO devices_device_id_unique;
          ELSE
            CREATE UNIQUE INDEX devices_device_id_unique
            ON "devices" ("device_id")
            WHERE "device_id" IS NOT NULL;
          END IF;
        END IF;
      END $$;
    `);
    console.log("✅ Tenant migrations completed successfully.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Tenant migration failed:", message);
    throw error;
  } finally {
    await client.end();
  }
}
