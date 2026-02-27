import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTenantDbBySlug } from "@/db/tenants";
import { users } from "@/db/tenants/schema";
import { eq } from "drizzle-orm";
import { syncTenantUser } from "@/features/users/server/syncTenantUser";
import { master_db } from "@/db/master";
import { tenants as masterTenants } from "@/db/master/schema";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ authorized: false, error: "Not authenticated" }, { status: 401 });
        }

        const db = await getTenantDbBySlug(slug);

        // 1. Check if user exists in the tenant's private database
        let user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        // 2. If not found, attempt to sync them now (ONLY if they are the owner)
        if (!user) {
            const tenantRecord = await master_db.query.tenants.findFirst({
                where: eq(masterTenants.slug, slug)
            });

            if (tenantRecord?.ownerId === userId) {
                console.log(`Owner ${userId} not found in tenant ${slug}, attempting auto-sync...`);
                const syncResult = await syncTenantUser(slug);

                if (syncResult.ok) {
                    user = await db.query.users.findFirst({
                        where: eq(users.id, userId),
                    });
                } else {
                    return NextResponse.json({ authorized: false, error: syncResult.error || "Failed to initialize workspace access" });
                }
            } else {
                return NextResponse.json({ authorized: false, error: "Access denied. You are not a member of this workspace." });
            }
        }

        if (!user) {
            return NextResponse.json({ authorized: false, error: "User not found in tenant database" });
        }

        // Success
        return NextResponse.json({
            authorized: true,
            role: user.role,
            name: user.name
        });

    } catch (error: any) {
        console.error("Access verification error:", error);
        return NextResponse.json({ authorized: false, error: error.message }, { status: 500 });
    }
}
