import { getBusinessSettings } from "@/features/tenants/queries/tenant-data";
import { BusinessSettingsForm } from "@/features/tenants/forms/BusinessSettingsForm";
import { Building2 } from "lucide-react";
import { headers } from "next/headers";
import { master_db } from "@/db/master";
import { tenants } from "@/db/master/schema";
import { eq } from "drizzle-orm";


export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    // We can also get slug from x-tenant-slug header as fallback
    const headersList = await headers();
    const tenantSlug = slug || headersList.get("x-tenant-slug") || "";


    const settings = tenantSlug ? await getBusinessSettings(tenantSlug).catch(() => null) : null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-[28px] font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-teal-200">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    Mon Entreprise
                </h1>
                <p className="text-sm text-gray-500 font-bold mt-0.5 ml-12">
                    Configurez l'identité, le contact et la localisation de votre entreprise.
                </p>
            </div>

            <BusinessSettingsForm
                defaultValues={settings ? {
                    name: settings.name ?? "",
                    phone: settings.phone ?? "",
                    email: settings.email ?? "",
                    website: settings.website ?? "",
                    address: settings.address ?? "",
                    city: settings.city ?? "",
                    country: settings.country ?? "",
                    industry: settings.industry ?? "",
                    taxId: settings.taxId ?? "",
                    logoUrl: settings.logoUrl,
                } : undefined}
            />
        </div>
    );
}
