import { CreateDepartmentForm } from "@/features/tenants/forms/createDepartment.form";
import { DepartmentsList } from "@/features/tenants/lists/DepartmentsList";
import { Building2 } from "lucide-react";

export default function Page() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-[#0055cc]" />
                        Gestion des Départements
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        Organisez et gérez les départements internes de votre entreprise.
                    </p>
                </div>
            </div>

            {/* Creation Form Section */}
            <CreateDepartmentForm />

            {/* List Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <h2 className="text-lg font-bold text-gray-900">Liste des Départements</h2>
                    <div className="h-px bg-gray-200 flex-1" />
                </div>
                <DepartmentsList />
            </div>
        </div>
    );
}
