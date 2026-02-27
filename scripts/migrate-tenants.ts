import 'dotenv/config';
import { master_db } from "../db/master";
import { tenants } from "../db/master/schema";
import { runTenantMigrations } from "../db/tenants/migrate";

async function migrateAllTenants() {
    console.log("🚀 Starting tenant migrations...");

    try {
        const allTenants = await master_db.select().from(tenants);
        console.log(`Found ${allTenants.length} tenants.`);

        for (const tenant of allTenants) {
            console.log(`\n--- Migrating tenant: ${tenant.name} (${tenant.slug}) ---`);

            const dbUrl = tenant.dbUrl;
            if (!dbUrl) {
                console.warn(`⚠️ No DB URL found for tenant ${tenant.slug}. Skipping.`);
                continue;
            }

            try {
                await runTenantMigrations(dbUrl);
                console.log(`✅ Migration successful for ${tenant.slug}`);
            } catch (err: any) {
                console.error(`❌ Migration failed for ${tenant.slug}:`, err.message || err);
            }
        }

        console.log("\n✨ All tenant migrations completed.");
        process.exit(0);
    } catch (err: any) {
        console.error("Critical error during tenant migration process:", err.message || err);
        process.exit(1);
    }
}

migrateAllTenants();
