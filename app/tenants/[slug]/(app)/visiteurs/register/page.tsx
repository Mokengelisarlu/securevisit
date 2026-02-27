import { VisitorForm } from "@/features/tenants/forms/VisitorForm";
import { UserPlus, ShieldCheck } from "lucide-react";

export default function Page() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-2xl border shadow-sm border-blue-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                        <UserPlus className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Enregistrement</h1>
                        <p className="text-gray-500 font-medium flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                            Portail sécurisé d'inscription des visiteurs
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all hover:border-blue-200">
                <div className="bg-gradient-to-r from-blue-50/50 to-transparent p-6 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Informations du Visiteur</h2>
                    <p className="text-sm text-gray-500">Veuillez remplir soigneusement tous les champs obligatoires.</p>
                </div>
                <div className="p-8">
                    <VisitorForm />
                </div>
            </div>
        </div>
    );
}
