import { HostsList } from "@/features/tenants/lists/HostsList";

export default function Page() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gérer les hôtes</h1>
                    <p className="text-gray-500 font-medium mt-1">Gérez le personnel et les hôtes de votre entreprise.</p>
                </div>
            </div>

            <HostsList />
        </div>
    );
}
