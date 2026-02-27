import { getPublicTenantBySlug } from "@/features/tenants/queries/tenant-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-1000">

        {/* Logo and Company Name */}
        <div className="flex flex-col items-center space-y-6">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight text-center">
            {tenant.name}
          </h1>
        </div>

        {/* CTA Section */}
        <div className="w-full max-w-xs space-y-4">
          {userId ? (
            <Button asChild size="lg" className="w-full h-14 text-lg font-bold rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Link href="/dashboard" className="flex items-center justify-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Tableau de Bord
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="w-full h-14 text-lg font-bold rounded-2xl bg-gray-900 hover:bg-black shadow-xl shadow-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Link href="/sign-in" className="flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                Se connecter
              </Link>
            </Button>
          )}

          <Button asChild variant="outline" size="lg" className="w-full h-14 text-blue-600 border-blue-200 font-bold hover:bg-blue-50 rounded-2xl shadow-sm">
            <Link href="/kiosk" className="flex items-center justify-center gap-2">
              <Monitor className="w-5 h-5" />
              Émulateur de tablette
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-8 border-t bg-gray-50/50">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Mokengeli Sarlu</span>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Powered by Mokengeli Sarlu &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
