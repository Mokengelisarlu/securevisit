import 'dotenv/config';
import postgres from "postgres";
import { runTenantMigrations } from "../db/tenants/migrate";

function formatDatabaseError(error: unknown): string {
    if (!(error instanceof Error)) {
        return String(error);
    }

    const databaseError = error as Error & {
        code?: string;
        detail?: string;
        hint?: string;
        severity?: string;
        cause?: unknown;
    };
    const fields = [
        databaseError.message,
        databaseError.code && `code=${databaseError.code}`,
        databaseError.severity && `severity=${databaseError.severity}`,
        databaseError.detail && `detail=${databaseError.detail}`,
        databaseError.hint && `hint=${databaseError.hint}`,
    ].filter(Boolean);

    if (fields.length > 0) {
        return fields.join("; ");
    }

    if (databaseError.cause) {
        return `cause=${formatDatabaseError(databaseError.cause)}`;
    }

    return `${databaseError.name}: ${JSON.stringify(databaseError)}`;
}

async function migrateAllTenants() {
    console.log("🚀 Starting tenant migrations...");
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error("Critical error during tenant migration process: DATABASE_URL is not configured");
        process.exit(1);
    }

    const masterClient = postgres(databaseUrl, { max: 1 });

    try {
        const allTenants = await masterClient<{
            id: string;
            name: string;
            slug: string;
            db_url: string;
        }[]>`SELECT id, name, slug, db_url FROM tenants`;
        console.log(`Found ${allTenants.length} tenants.`);
        let failedMigrations = 0;

        for (const tenant of allTenants) {
            console.log(`\n--- Migrating tenant: ${tenant.name} (${tenant.slug}) ---`);

            const dbUrl = tenant.db_url;
            if (!dbUrl) {
                console.warn(`⚠️ No DB URL found for tenant ${tenant.slug}. Skipping.`);
                continue;
            }

            try {
                await runTenantMigrations(dbUrl);
                console.log(`✅ Migration successful for ${tenant.slug}`);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`❌ Migration failed for ${tenant.slug}:`, message);
                failedMigrations += 1;
            }
        }

        if (failedMigrations > 0) {
            console.error(`\n❌ ${failedMigrations} tenant migration(s) failed.`);
            process.exit(1);
        }

        console.log("\n✨ All tenant migrations completed.");
        process.exit(0);
    } catch (err: unknown) {
        const message = formatDatabaseError(err);
        console.error("Critical error during tenant migration process:", message);
        process.exit(1);
    } finally {
        await masterClient.end();
    }
}

migrateAllTenants();
