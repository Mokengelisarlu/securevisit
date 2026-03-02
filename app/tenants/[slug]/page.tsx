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
    <div className="min-h-screen w-full overflow-hidden">
      {/* Hero Section with Background */}
      <div
        className="relative min-h-screen w-full flex items-center justify-center"
        style={{
          backgroundImage: 'url(/images/tenant-hero-bg.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-blue-900/50 to-slate-900/70"
          style={{
            animation: 'gradientShift 8s ease infinite',
          }}
        />

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-500"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                opacity: Math.random() * 0.4 + 0.1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 8}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6 space-y-8 text-center animate-in fade-in duration-1000">
          {/* Logo */}
          <div className="animate-in slide-in-from-top duration-700 delay-100">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/50 group hover:shadow-blue-500/70 transition-shadow duration-300">
              <ShieldCheck className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Company Name */}
          <div className="animate-in slide-in-from-top duration-700 delay-200 space-y-2">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter">
              {tenant.name}
            </h1>
            <p className="text-blue-200 text-lg font-medium">
              Visitor Management System
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="animate-in slide-in-from-bottom duration-700 delay-300 w-full max-w-sm space-y-4 pt-8">
            {userId ? (
              <button
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                <LayoutDashboard className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                <Link href="/dashboard">Tableau de Bord</Link>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                <LogIn className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                <Link href="/sign-in">Se connecter</Link>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <button
              className="w-full py-4 px-6 border-2 border-blue-400/50 hover:border-blue-300 text-blue-300 hover:text-blue-100 font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:bg-blue-500/10 flex items-center justify-center gap-3 group backdrop-blur-sm"
            >
              <Monitor className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <Link href="/kiosk">Émulateur de tablette</Link>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 py-6">
        <div className="flex items-center justify-center gap-2 opacity-60 hover:opacity-90 transition-opacity duration-300">
          <Image
            src="/images/logoBlanc.png"
            alt="MOKENGELI Logo"
            width={20}
            height={20}
            className="object-contain"
          />
          <span className="text-blue-200/80 text-xs font-medium tracking-wide">
            Powered by <span className="text-white/90 font-semibold">MOKENGELI Sarlu</span>
          </span>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-20px) translateX(15px);
            opacity: 0.3;
          }
        }

        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-from-bottom {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: fade-in 0.5s ease-out;
        }

        .fade-in {
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }

        .slide-in-from-top {
          @keyframes slide-in-from-top {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }

        .slide-in-from-bottom {
          @keyframes slide-in-from-bottom {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </div>
  );
}
