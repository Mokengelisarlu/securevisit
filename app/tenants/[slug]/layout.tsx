import { use } from "react";
import { notFound } from "next/navigation";
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
  if (!tenant) notFound();
  const businessSettings = use(getPublicBusinessSettings(tenantSlug).catch(() => null));

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
