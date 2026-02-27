import { getPublicTenantBySlug, getBusinessSettings } from "@/features/tenants/queries/tenant-data";
import { VisitorKioskForm } from "@/features/tenants/forms/VisitorKioskForm";
import { Building2 } from "lucide-react";

export default async function KioskPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const tenant = await getPublicTenantBySlug(slug);

    if (!tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 uppercase tracking-widest font-bold text-gray-400">
                Tenant non trouvé
            </div>
        );
    }

    // Fetch business settings to get logo
    const settings = await getBusinessSettings(slug).catch(() => null);

    return (
        <div className="h-screen w-full bg-gradient-to-b from-blue-50 via-white to-blue-50 flex flex-col items-center justify-between px-4 py-8 md:py-12">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center justify-center pt-2">
                {settings?.logoUrl ? (
                    <img 
                        src={settings.logoUrl} 
                        alt={tenant.name}
                        className="h-20 w-20 md:h-28 md:w-28 object-contain"
                    />
                ) : (
                    <div className="h-20 w-20 md:h-28 md:w-28 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Building2 className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    </div>
                )}
            </div>

            {/* Tenant Name */}
            <div className="text-center flex-shrink-0 mt-4 md:mt-6">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                    {tenant.name}
                </h1>
            </div>

            {/* Main Form Content (Buttons Container) */}
            <div className="h-px"></div>
            <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center px-2">
                <VisitorKioskForm tenantSlug={slug} />
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                <p>Système de gestion des visiteurs</p>
            </footer>
        </div>
    );
}
