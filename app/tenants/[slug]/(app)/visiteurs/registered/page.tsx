import { RegisteredVisitorsList } from "@/features/tenants/lists/RegisteredVisitorsList";
import { ShieldCheck } from "lucide-react";

export default function Page() {
    return (
        <div className="space-y-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 shadow-sm">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Visiteurs Inscrits</h1>
                        <p className="text-gray-500 font-medium italic">Gérez les profils et l'historique des visiteurs réguliers de votre organisation.</p>
                    </div>
                </div>
            </div>

            <RegisteredVisitorsList />
        </div>
    );
}
