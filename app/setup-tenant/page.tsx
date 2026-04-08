"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Laptop } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-800 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
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
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
            <Laptop className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Configuration du Portail</h1>
            <p className="text-slate-400 text-lg">Prêt à moderniser votre accueil des visiteurs ?</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
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
    </div>
  );
}
