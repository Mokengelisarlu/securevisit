import { UsersList } from "@/features/tenants/lists/UsersList";

export default function Page() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-[28px] font-black text-gray-900 tracking-tight">Utilisateurs & Accès</h1>
                <p className="text-sm text-gray-500 font-bold -mt-1">Gérez les collaborateurs et leurs permissions d'accès au tableau de bord.</p>
            </div>

            <UsersList />
        </div>
    );
}
