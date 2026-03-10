
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as masterSchema from "./db/master/schema";
import * as tenantSchema from "./db/tenants/schema";
import * as dotenv from "dotenv";

dotenv.config();
console.log("DEBUG SCRIPT LOADED");

async function debug() {
    console.log("DEBUG FUNCTION CALLED");
    console.log("--- Diagnostic for tenant 'merka' ---");

    const masterSql = neon(process.env.DATABASE_URL!);
    const masterDb = drizzle(masterSql, { schema: masterSchema });

    // 1. Check master DB for tenant 'merka'
    const tenant = await masterDb.query.tenants.findFirst({
        where: eq(masterSchema.tenants.slug, 'merka'),
    });

    if (!tenant) {
        console.error("❌ Tenant 'merka' not found in master database.");
        return;
    }

    console.log("✅ Tenant found in master DB:");
    console.log(`   Slug: ${tenant.slug}`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Owner ID: ${tenant.ownerId}`);
    console.log(`   DB URL: ${tenant.dbUrl ? "HIDDEN" : "MISSING"}`);

    if (!tenant.dbUrl) {
        console.error("❌ Tenant DB URL is missing.");
        return;
    }

    // 2. Check tenant DB
    try {
        const tenantSql = neon(tenant.dbUrl);
        const tenantDb = drizzle(tenantSql, { schema: tenantSchema });

        const members = await tenantDb.select().from(tenantSchema.users);
        console.log(`✅ Tenant DB reachable. Members found: ${members.length}`);
        members.forEach(m => {
            console.log(`   - ID: ${m.id}, Name: ${m.name}, Role: ${m.role}`);
        });

        const isOwnerMember = members.some(m => m.id === tenant.ownerId);
        if (isOwnerMember) {
            console.log("✅ Owner is a member of the tenant database.");
        } else {
            console.warn("⚠️ Owner is NOT a member of the tenant database. Redirection might occur if not synced.");
        }

    } catch (err: any) {
        console.error("❌ Failed to connect to tenant database:", err.message);
    }
}

debug().then(() => {
    console.log("--- Diagnostic Complete ---");
    process.exit(0);
}).catch(err => {
    console.error("DEBUG FAILED:", err);
    process.exit(1);
});
