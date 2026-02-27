import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export async function runTenantMigrations(dbUrl: string) {
  const client = postgres(dbUrl, { max: 1 });
  const db = drizzle(client);

  await migrate(db, {
    migrationsFolder: "db/tenants/migrations",
  });

  await client.end();
}
