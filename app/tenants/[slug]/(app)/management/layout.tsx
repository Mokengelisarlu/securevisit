"use client";

import { use } from "react";
import { TenantAuthGuard } from "@/components/TenantAuthGuard";

export default function ManagementLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);

    return (
        <TenantAuthGuard tenantSlug={slug}>
            {children}
        </TenantAuthGuard>
    );
}
