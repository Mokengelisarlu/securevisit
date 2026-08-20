"use client";

import { useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import { ArrowLeft } from "lucide-react";
import { CreateTenantForm } from "@/features/tenants/forms/createTenant.form";
import { getTenantUrl } from "@/lib/subdomain-utils";

export default function CreateTenantPage() {
  const [isCreating, setIsCreating] = useState(false);

  const handleTenantCreated = (slug: string) => {
    setIsCreating(true);

    // Redirect to the tenant's subdomain
    const tenantUrl = getTenantUrl(slug);
    window.location.href = tenantUrl;
  };

  return (
    <main className="min-h-screen relative bg-[#f8fafc] overflow-hidden flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(13,189,181,0.16),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.10),_transparent_20%)]" />
      <div className="relative z-10 w-full max-w-lg">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Retour à l'accueil</span>
        </Link>

        {/* Brand/Logo Section */}
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-white">
            <Image src="/icon-96x96.png" alt="SecureVisit" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-950 mb-2 tracking-tight">Configuration du Portail</h1>
            <p className="text-slate-600 text-lg">Prêt à moderniser votre accueil des visiteurs ?</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl">
          <CreateTenantForm onSuccess={handleTenantCreated} />

          {isCreating && (
            <div className="mt-6 flex flex-col items-center gap-2 animate-pulse">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-center text-sm text-teal-400">Redirection vers votre portail...</p>
            </div>
          )}
        </div>

        {/* Benefits Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            En créant votre portail, vous acceptez nos <span className="underline cursor-pointer">Conditions d'utilisation</span>
          </p>
        </div>
      </div>
    </main>
  );
}
