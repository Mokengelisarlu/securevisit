import { VisitorTypesList } from "@/features/tenants/lists/VisitorTypesList";

export default function Page() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Types des visiteurs</h1>
                    <p className="text-gray-500 text-sm">Gérez les différentes catégories de visiteurs pour votre organisation.</p>
                </div>
            </div>

            <VisitorTypesList />
        </div>
    );
}
