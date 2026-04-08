import { UserButton } from "@clerk/nextjs";
import { headers } from "next/headers";
import { getTenantSlugFromHost } from "@/lib/getTenantSlug";
import { TenantProvider } from "@/lib/tenant-provider";
import { TenantAuthGuard } from "@/components/TenantAuthGuard";
import Link from "next/link";
import Image from "next/image";

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
        <div className="relative flex flex-col h-screen bg-[#F4F6F8] node-pattern overflow-hidden">
          {/* Grain overlay */}
          <div className="grain-overlay" />

          {/* Premium Header */}
          <header className="relative z-20 h-20 bg-white/70 backdrop-blur-md border-b border-[#E5E7EB] flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-10">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 relative overflow-hidden rounded-lg">
                  <Image
                    src="/icons/icon-512x512.png"
                    alt="SecureVisit Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <span
                  className="font-semibold text-xl text-[#0E1116] tracking-tight"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  SecureVisit <span className="text-[#6B7280] font-normal ml-1">Dashboard</span>
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <Link
                  href="/"
                  className="text-sm font-medium text-[#0E1116] hover:text-[#1E6EE6] transition-colors"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  Aperçu
                </Link>
                <Link
                  href="/management"
                  className="text-sm font-medium text-[#6B7280] hover:text-[#1E6EE6] transition-colors"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  Gestion
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-1 rounded-full bg-slate-100/50">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="relative z-10 flex-1 overflow-y-auto p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </TenantProvider>
    </TenantAuthGuard>
  );
}
