import { use } from "react";
import { TenantProvider } from "@/lib/tenant-provider";
import { TenantUserSync } from "@/components/TenantUserSync";
import { getPublicTenantBySlug } from "@/features/tenants/queries/tenant-data";

export default function TenantRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug: tenantSlug } = use(params);
  const tenant = use(getPublicTenantBySlug(tenantSlug));

  return (
    <TenantProvider slug={tenantSlug} name={tenant?.name || null}>
      <TenantUserSync tenantSlug={tenantSlug} />
      {children}
    </TenantProvider>
  );
}
