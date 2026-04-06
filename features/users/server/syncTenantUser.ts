"use server";

import { currentUser } from "@clerk/nextjs/server";
import { master_db } from "@/db/master";
import { tenants } from "@/db/master/schema";
import { getTenantDbBySlug } from "@/db/tenants";
import { users, authorizedUsers } from "@/db/tenants/schema";
import { eq } from "drizzle-orm";


import { withRetry } from "@/lib/db-retry";

export async function syncTenantUser(tenantSlug: string) {
    const user = await currentUser();

    if (!user) {
        return { ok: false, error: "Not authenticated" };
    }

    try {
        return await withRetry(async () => {
            const db = await getTenantDbBySlug(tenantSlug);


            // Check if user already exists in THIS tenant DB by Clerk ID
            const existing = await db.query.users.findFirst({
                where: eq(users.id, user.id)
            });

            if (!existing) {
                // ONLY owner can be automatically synced as the FIRST ROOT
                if (tenant?.ownerId === user.id) {
                    const rootExists = await db.query.users.findFirst({
                        where: eq(users.role, "ROOT")
                    });

                    if (!rootExists) {
                        await db.insert(users).values({
                            id: user.id,
                            firstName: user.firstName || "",
                            lastName: user.lastName || "",
                            middleName: null,
                            email: user.emailAddresses[0].emailAddress.toLowerCase(),
                            role: "ROOT",
                        });
                        console.log(`Synced owner ${user.id} to tenant ${tenantSlug} as initial ROOT`);
                    } else {
                        return { ok: false, error: "A ROOT user already exists in this workspace." };
                    }
                } else {
                    // Check if email is authorized
                    const userEmail = user.emailAddresses[0].emailAddress.toLowerCase();
                    const invitation = await db.query.authorizedUsers.findFirst({
                        where: eq(authorizedUsers.email, userEmail)
                    });

                    if (invitation) {
                        await db.insert(users).values({
                            id: user.id,
                            firstName: invitation.firstName || user.firstName || "",
                            lastName: invitation.lastName || user.lastName || "",
                            middleName: invitation.middleName ?? null,
                            email: userEmail,
                            role: invitation.role,
                        });
                        console.log(`Synced authorized user ${user.id} to tenant ${tenantSlug} with role ${invitation.role}`);
                    } else {
                        return { ok: false, error: "Access denied. You must be invited to this workspace." };
                    }
                }
            } else {
                // Update existing user info from Clerk
                await db.update(users).set({
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.emailAddresses[0].emailAddress.toLowerCase(),
                }).where(eq(users.id, user.id));
            }

            return { ok: true };
        });
    } catch (error: any) {
        console.error("Sync tenant user error:", error);
        return { ok: false, error: error.message };
    }
}
