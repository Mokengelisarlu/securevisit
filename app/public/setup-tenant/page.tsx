"use client";

import { useState } from "react";
import Link from "next/link";
import Image from 'next/image';
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
    <main className="min-h-screen relative bg-[#f8fafc] overflow-hidden flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(13,189,181,0.16),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.10),_transparent_20%)]" />

      {/* Centered Content Stack */}
      <div className="relative z-10 w-full max-w-[520px] flex flex-col items-center">
        {/* Brand Header */}
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Image src="/icon-96x96.png" alt="SecureVisit" width={36} height={36} className="object-contain" />
          </div>
          <span
            className="font-semibold text-2xl text-[#0E1116] tracking-tight"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            SecureVisit
          </span>
        </Link>

        {/* Form Container */}
        <div className="w-full card-white p-8 lg:p-10">
          <div className="mb-8 text-center">
            <h1
              className="text-2xl lg:text-3xl font-semibold text-[#0E1116] mb-2 tracking-tight"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Configuration du Portail
            </h1>
            <p className="text-[#6B7280]">Prêt à moderniser votre accueil des visiteurs ?</p>
          </div>

          <CreateTenantForm onSuccess={handleTenantCreated} />

          {isCreating && (
            <div className="mt-6 flex flex-col items-center gap-3 animate-pulse">
              <div className="w-6 h-6 border-2 border-[#0DBDB5] border-t-transparent rounded-full animate-spin" />
              <p className="text-center text-sm font-medium text-[#0DBDB5]">Redirection vers votre portail...</p>
            </div>
          )}
        </div>

        {/* Benefits Footer */}
        <div className="mt-8 text-center">
          <p className="text-[#6B7280] text-sm">
            En créant votre portail, vous acceptez nos <Link href="#" className="text-[#0DBDB5] hover:underline">Conditions d'utilisation</Link>
          </p>
          <p className="mt-4 text-xs text-[#9CA3AF]">
            &copy; {new Date().getFullYear()} SecureVisit. Tous droits réservés.
          </p>
        </div>
      </div>
    </main>
  );
}
