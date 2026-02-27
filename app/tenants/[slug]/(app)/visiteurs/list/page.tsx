import { TabbedVisitsList } from "@/features/tenants/lists/TabbedVisitsList";
import { ClipboardList } from "lucide-react";

export default function Page() {
    return (
        <div className="space-y-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 shadow-sm">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Journal des Visites</h1>
                        <p className="text-gray-500 font-medium italic">Consultez et gérez l'historique des entrées et sorties en temps réel.</p>
                    </div>
                </div>
            </div>

            <TabbedVisitsList />
        </div>
    );
}
