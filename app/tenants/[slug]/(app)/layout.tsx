import { use } from "react";
import { TenantAuthGuard } from "@/components/TenantAuthGuard";
import { AppLayoutContent } from "./AppLayoutContent";

export default function AppLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug: tenantSlug } = use(params);

    return (
        <TenantAuthGuard tenantSlug={tenantSlug}>
            <AppLayoutContent>{children}</AppLayoutContent>
        </TenantAuthGuard>
    );
}
