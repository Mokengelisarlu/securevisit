import { HostsList } from "@/features/tenants/lists/HostsList";

export default function Page() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gérer les hôtes</h1>
                    <p className="text-gray-500 text-sm">Gérez le personnel et les hôtes de votre entreprise.</p>
                </div>
            </div>

            <HostsList />
        </div>
    );
}
