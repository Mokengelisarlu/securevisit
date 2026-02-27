"use client";

import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/lib/tenant-provider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    ShieldAlert,
    User,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Mail,
    Clock,
    Trash2
} from "lucide-react";
import { useState, useMemo } from "react";
import { getTenantUsers, authorizeUser, removeAuthorization, updateUserRole, deleteUser } from "../queries/tenant-data";
import { useGetCurrentUser } from "../hooks/useGetTenantData";
import { Modal } from "@/components/ui/custom-modal";
import { UserInviteForm } from "../forms/UserInviteForm";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 8;

export function UsersList() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();
    const { data: currentUser } = useGetCurrentUser(slug!);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const isRoot = currentUser?.role === "ROOT";

    const { data: usersData, isLoading } = useQuery({
        queryKey: ["tenant-users", slug],
        queryFn: () => getTenantUsers(slug!),
        enabled: !!slug,
    });

    const [currentPage, setCurrentPage] = useState(1);

    const allUsers = useMemo(() => {
        if (!usersData) return [];
        const getFullName = (u: any) =>
            [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ") || u.name || "—";

        const active = (usersData.active || []).map((u: any) => ({
            ...u,
            status: "ACTIVE",
            displayName: getFullName(u),
        }));
        const pending = (usersData.pending || []).map((p: any) => ({
            ...p,
            status: "PENDING",
            displayName: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ") || p.email,
        }));
        return [...active, ...pending].sort((a, b) => {
            if (a.role === 'ROOT' && b.role !== 'ROOT') return -1;
            if (a.role !== 'ROOT' && b.role === 'ROOT') return 1;
            return 0;
        });
    }, [usersData]);

    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return allUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [allUsers, currentPage]);

    const totalPages = Math.ceil(allUsers.length / ITEMS_PER_PAGE);

    const handleRemoveAuth = async (email: string) => {
        if (!slug) return;
        if (!confirm(`Voulez-vous vraiment retirer l'autorisation pour ${email} ?`)) return;

        try {
            await removeAuthorization(slug, email);
            toast.success("Autorisation retirée");
            queryClient.invalidateQueries({ queryKey: ["tenant-users", slug] });
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du retrait");
        }
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!slug) return;
        if (!confirm(`Voulez-vous vraiment supprimer l'utilisateur ${name} ? Cette action est irréversible.`)) return;

        try {
            await deleteUser(slug, userId);
            toast.success("Utilisateur supprimé");
            queryClient.invalidateQueries({ queryKey: ["tenant-users", slug] });
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression");
        }
    };

    const handleRoleUpdate = async (user: any, newRole: any) => {
        if (!slug || user.role === newRole) return;

        setIsUpdatingRole(true);
        try {
            if (user.status === 'PENDING') {
                await authorizeUser(slug, user.email, newRole);
            } else {
                await updateUserRole(slug, user.id, newRole);
            }
            toast.success(`Rôle de ${user.name === "En attente" ? user.email : user.name} mis à jour`);
            queryClient.invalidateQueries({ queryKey: ["tenant-users", slug] });
        } catch (error: any) {
            toast.error("Impossible de mettre à jour le rôle");
        } finally {
            setIsUpdatingRole(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-8 text-gray-500 italic">Chargement des accès...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Gestion des Accès</h2>
                    <p className="text-xs text-gray-500 font-bold mt-1">Gérez les collaborateurs autorisés à accéder à cet espace.</p>
                </div>
                {isRoot && (
                    <Button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        Inviter un collaborateur
                    </Button>
                )}
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b border-gray-100">
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-5 pl-6">Collaborateur</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Email / Identifiant</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Accès & Rôle</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Statut</TableHead>
                            <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 pr-6 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                                            <User className="w-8 h-8 text-gray-200" />
                                        </div>
                                        <p className="text-gray-400 font-bold text-sm tracking-tight">Aucun collaborateur enregistré</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedUsers.map((user: any, index: number) => (
                                <TableRow key={user.id || user.email} className={`hover:bg-gray-50/50 transition-colors border-b border-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                                    <TableCell className="py-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 ${user.role === 'ROOT' ? 'bg-indigo-50 text-indigo-600 shadow-sm' :
                                                user.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {user.status === 'PENDING' ? <Mail className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 tracking-tight text-sm leading-none">{user.displayName}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">
                                                    {user.status === 'ACTIVE' ? "Compte Synchronisé" : "Invitation Envoyée"}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 font-bold text-sm tracking-tight">{user.email}</TableCell>
                                    <TableCell>
                                        <RoleBadge role={user.role} />
                                    </TableCell>
                                    <TableCell>
                                        {user.status === 'ACTIVE' ? (
                                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-100">
                                                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Actif</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 w-fit px-2.5 py-1 rounded-full border border-amber-100">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">En attente</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        {isRoot && user.role !== 'ROOT' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Select
                                                    onValueChange={(value: any) => handleRoleUpdate(user, value)}
                                                    defaultValue={user.role}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8 text-[10px] font-black uppercase tracking-widest rounded-lg border-gray-100 bg-gray-50/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                        <SelectItem value="ADMIN" className="font-bold text-blue-700">ADMIN</SelectItem>
                                                        <SelectItem value="SECURITY" className="font-bold text-emerald-700">SÉCURITÉ</SelectItem>
                                                        <SelectItem value="RECEPTION" className="font-bold text-amber-700">RÉCEPTION</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => user.status === 'PENDING' ? handleRemoveAuth(user.email) : handleDeleteUser(user.id, user.name)}
                                                    className="w-8 h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-50/30 border-t border-gray-100 gap-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Page <span className="text-blue-600 font-black">{currentPage}</span> sur <span className="text-gray-900">{totalPages}</span>
                            <span className="mx-2 text-gray-200">|</span>
                            <span className="text-gray-500 font-bold normal-case">{allUsers.length} accès enregistrés</span>
                        </p>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="flex-1 md:flex-none h-9 px-4 rounded-xl border-gray-100 shadow-sm font-black uppercase tracking-widest text-[9px] transition-all hover:bg-white disabled:opacity-30"
                            >
                                <ChevronLeft className="w-3 h-3 mr-1" /> Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="flex-1 md:flex-none h-9 px-4 rounded-xl border-gray-100 shadow-sm font-black uppercase tracking-widest text-[9px] transition-all hover:bg-white disabled:opacity-30"
                            >
                                Suivant <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                title="Autoriser un nouveau collaborateur"
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            >
                <UserInviteForm onSuccess={() => setIsInviteModalOpen(false)} />
            </Modal>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    switch (role) {
        case "ROOT":
            return (
                <Badge className="bg-indigo-100 text-indigo-700 border-none px-3 py-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    ROOT
                </Badge>
            );
        case "ADMIN":
            return (
                <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    ADMIN
                </Badge>
            );
        case "SECURITY":
            return (
                <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    SECURITY
                </Badge>
            );
        case "RECEPTION":
            return (
                <Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    RECEPTION
                </Badge>
            );
        default:
            return <Badge variant="outline">{role}</Badge>;
    }
}
