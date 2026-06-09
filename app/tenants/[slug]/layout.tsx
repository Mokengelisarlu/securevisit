import { use } from "react";
import { TenantProvider } from "@/lib/tenant-provider";
import { TenantUserSync } from "@/components/TenantUserSync";
import { getPublicTenantBySlug, getPublicBusinessSettings } from "@/features/tenants/queries/tenant-data";

export default function TenantRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug: tenantSlug } = use(params);
  const tenant = use(getPublicTenantBySlug(tenantSlug));
  const businessSettings = use(getPublicBusinessSettings(tenantSlug));

  return (
    <TenantProvider 
        slug={tenantSlug} 
        name={businessSettings?.name || tenant?.name || null}
        logoUrl={businessSettings?.logoUrl || null}
    >
      <TenantUserSync tenantSlug={tenantSlug} />
      {children}
    </TenantProvider>
  );
}
