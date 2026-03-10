import { getPublicTenantBySlug } from "@/features/tenants/queries/tenant-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LayoutDashboard, ShieldCheck, LogIn, Monitor } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTenantDbBySlug } from "@/db/tenants";
import { users } from "@/db/tenants/schema";
import { eq } from "drizzle-orm";
import { master_db } from "@/db/master";
import { tenants } from "@/db/master/schema";
import { runTenantMigrations } from "@/db/tenants/migrate";

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicTenantBySlug(slug);
  const { userId } = await auth();

  // Redirect if authorized
  if (tenant && userId) {
    const isOwner = tenant.ownerId === userId;

    // Ensure tenant DB schema is up to date before querying
    const tenantRecord = await master_db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });
    if (tenantRecord?.dbUrl) {
      await runTenantMigrations(tenantRecord.dbUrl);
    }

    // Check if user is a member of this tenant's workspace
    const db = await getTenantDbBySlug(slug);
    const member = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (isOwner || member) {
      redirect(`/dashboard`);
    }
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest font-bold text-gray-400">
        Tenant non trouvé
      </div>
    );
  }

  return <TenantHeroPage tenant={tenant} userId={userId} />;
}

function TenantHeroPage({ tenant, userId }: { tenant: any; userId: string | null }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#F4F6F8] node-pattern px-6 overflow-hidden">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Centered Content Stack */}
      <div className="relative z-10 w-full max-w-[600px] flex flex-col items-center text-center">
        {/* Brand Header / Logo */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-24 h-24 bg-gradient-to-br from-[#1E6EE6] to-[#1a5fcc] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#1E6EE6]/30">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Company Title */}
        <div className="mb-10 animate-in fade-in slide-in-from-top-2 duration-700 delay-100">
          <h1
            className="text-4xl lg:text-6xl font-bold text-[#0E1116] tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            {tenant.name}
          </h1>
          <p className="text-[#6B7280] text-xl font-medium max-w-md mx-auto">
            Bienvenue sur votre portail professionnel de gestion des visiteurs.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-[380px] space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          {userId ? (
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white font-semibold py-5 rounded-2xl shadow-xl shadow-[#1E6EE6]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Accéder au Tableau de Bord</span>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="w-full flex items-center justify-center gap-3 bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white font-semibold py-5 rounded-2xl shadow-xl shadow-[#1E6EE6]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5" />
              <span>Se connecter</span>
            </Link>
          )}

          <Link
            href="/kiosk"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-white/50 backdrop-blur-md border border-[#E5E7EB] hover:border-[#1E6EE6] text-[#0E1116] font-semibold py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Monitor className="w-5 h-5" />
            <span>Émulateur de tablette</span>
          </Link>
        </div>
      </div>

      {/* Branding Footer */}
      <footer className="absolute bottom-10 left-0 right-0 flex flex-col items-center z-20">
        <div className="flex items-center gap-2 mb-2">
          <Image
            src="/images/logo.png"
            alt="MOKENGELI Logo"
            width={24}
            height={24}
            className="object-contain"
          />
          <span className="text-[#1E6EE6] text-xs font-bold tracking-widest uppercase" style={{ fontFamily: 'Sora, sans-serif' }}>
            Powered by MOKENGELI Sarlu
          </span>
        </div>
        <p className="text-[10px] text-[#1E6EE6]/60 font-medium tracking-tight">
          &copy; {new Date().getFullYear()} SecureVisit. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
