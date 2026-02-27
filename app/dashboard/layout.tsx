import { UserButton } from "@clerk/nextjs";
import { headers } from "next/headers";
import { getTenantSlugFromHost } from "@/lib/getTenantSlug";
import { TenantProvider } from "@/lib/tenant-provider";
import { TenantAuthGuard } from "@/components/TenantAuthGuard";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get tenant slug from subdomain via headers (Server Component safe)
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const tenantSlug = getTenantSlugFromHost(new Headers([['host', host]]));

  if (!tenantSlug) {
    return <div className="p-6">Error: Could not determine tenant</div>;
  }

  return (
    <TenantAuthGuard tenantSlug={tenantSlug}>
      <TenantProvider slug={tenantSlug} name={null}>
        <div className="flex flex-col h-screen bg-gray-50">
          {/* Simple Top Header */}
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-primary">
                VMS Dashboard
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary">
                  Aperçu
                </Link>
                <Link href="/management" className="text-sm font-medium text-gray-700 hover:text-primary">
                  Gestion
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </TenantProvider>
    </TenantAuthGuard>
  );
}
