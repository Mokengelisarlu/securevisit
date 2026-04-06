import { ServicesList } from "@/features/tenants/lists/ServicesList";
import { Settings2 } from "lucide-react";

export default function Page() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <Settings2 className="w-8 h-8 text-[#0055cc]" />
                        Gestion des Services
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        Définissez les services offerts au sein de vos départements.
                    </p>
                </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider text-xs text-gray-400">Contenu des Services</h2>
                    <div className="h-px bg-gray-200 flex-1" />
                </div>
                <ServicesList />
            </div>
        </div>
    );
}
