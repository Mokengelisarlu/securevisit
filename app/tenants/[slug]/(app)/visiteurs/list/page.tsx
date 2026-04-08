import { TabbedVisitsList } from "@/features/tenants/lists/TabbedVisitsList";
import { ClipboardList, ShieldCheck } from "lucide-react";

export default function Page() {
    return (
        <div className="space-y-10 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/50 backdrop-blur-sm border border-[#E5E7EB] rounded-2xl flex items-center justify-center text-[#0DBDB5] shadow-sm">
                        <ClipboardList className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 
                            className="text-3xl font-semibold text-[#0E1116] tracking-tight"
                            style={{ fontFamily: 'Sora, sans-serif' }}
                        >
                            Journal des Visites
                        </h1>
                        <p className="text-[#6B7280] text-lg font-medium mt-1 italic">Consultez et gérez l'historique des entrées et sorties en temps réel.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 rounded-full border border-green-200 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    Registre Sécurisé
                </div>
            </div>

            <div className="card-white p-2">
                <TabbedVisitsList />
            </div>
        </div>
    );
}
