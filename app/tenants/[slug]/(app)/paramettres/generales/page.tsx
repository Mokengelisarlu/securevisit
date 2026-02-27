import { getSettings } from "@/features/tenants/queries/tenant-data";
import { TenantSettingsForm } from "@/features/tenants/forms/TenantSettingsForm";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
    const { slug } = await params;
    const settings = await getSettings(slug);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Paramètres Généraux</h1>
                <p className="text-lg text-gray-500 font-medium">Configurez les règles et la conformité de votre établissement.</p>
            </div>

            <div className="max-w-4xl">
                <TenantSettingsForm
                    tenantSlug={slug}
                    initialData={{
                        ndaPolicyText: settings.ndaPolicyText,
                        requireSignature: settings.requireSignature,
                        requireVisitorPhoto: settings.requireVisitorPhoto,
                        requireVehiclePhoto: settings.requireVehiclePhoto
                    }}
                />
            </div>
        </div>
    );
}
