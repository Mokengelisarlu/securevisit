"use client";

import { useEffect, useRef } from "react";
import { syncTenantUser } from "@/features/users/server/syncTenantUser";
import { useAuth } from "@clerk/nextjs";

interface TenantUserSyncProps {
    tenantSlug: string;
}

export function TenantUserSync({ tenantSlug }: TenantUserSyncProps) {
    const { isLoaded, userId } = useAuth();
    const syncAttempted = useRef(false);

    useEffect(() => {
        if (isLoaded && userId && !syncAttempted.current) {
            syncAttempted.current = true;

            const performSync = async () => {
                try {
                    await syncTenantUser(tenantSlug);
                } catch (error) {
                    console.error("Auto-sync failed:", error);
                }
            };

            performSync();
        }
    }, [isLoaded, userId, tenantSlug]);

    return null; // Invisible component
}
