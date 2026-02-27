"use client";

import { useMemo, useState } from "react";
import {
    Search,
    Edit2,
    Trash2,
    PackageOpen,
    Building2,
    Tag,
    Phone,
    User,
    Calendar,
    Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTenant } from "@/lib/tenant-provider";
import { useGetVisitors } from "../hooks/useGetTenantData";
import { useDeleteVisitor } from "../hooks/useDeleteVisitor.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/custom-modal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { VisitorForm } from "../forms/VisitorForm";
import { Badge } from "@/components/ui/badge";

export function RegisteredVisitorsList() {
    const { slug: tenantSlug } = useTenant();
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    if (!tenantSlug) return null;

    const { data: visitors, isLoading } = useGetVisitors(tenantSlug);
    const deleteMutation = useDeleteVisitor();

    const filteredVisitors = useMemo(() => {
        if (!visitors) return [];
        return visitors.filter((v: any) =>
            `${v.firstName} ${v.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.company && v.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.type?.name && v.type.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [visitors, searchQuery]);

    const totalPages = Math.ceil(filteredVisitors.length / itemsPerPage);
    const paginatedVisitors = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredVisitors.slice(start, start + itemsPerPage);
    }, [filteredVisitors, currentPage]);

    function handleEdit(visitor: any) {
        setSelectedVisitor(visitor);
        setIsModalOpen(true);
    }

    async function onConfirmDelete() {
        if (!confirmDeleteId) return;
        try {
            await deleteMutation.mutateAsync(confirmDeleteId);
            toast.success("Visiteur supprimé avec succès");
        } catch (error: any) {
            toast.error(error?.message || "Échec de la suppression");
        } finally {
            setConfirmDeleteId(null);
            setConfirmDeleteName("");
        }
    }

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
            <p className="text-gray-500 font-medium">Chargement des visiteurs...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border shadow-sm">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher par nom, entreprise..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 h-11 border-gray-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                    />
                </div>
                <div className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full border">
                    {filteredVisitors.length} Visiteur{filteredVisitors.length > 1 ? 's' : ''} trouvé{filteredVisitors.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Visiteur</TableHead>
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Contact & Entreprise</TableHead>
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Type</TableHead>
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Date d'inscription</TableHead>
                            <TableHead className="py-4 px-6 text-right text-xs font-bold uppercase text-gray-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedVisitors.length > 0 ? (
                            paginatedVisitors.map((visitor: any) => (
                                <TableRow key={visitor.id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100 font-bold">
                                                {visitor.firstName[0]}{visitor.lastName[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 leading-tight">
                                                    {visitor.firstName} {visitor.lastName}
                                                </span>
                                                <span className="text-xs text-gray-400">ID: {visitor.id.split('-')[0]}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex flex-col gap-1">
                                            {visitor.phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                    {visitor.phone}
                                                </div>
                                            )}
                                            {visitor.company && (
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                    {visitor.company}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        {visitor.type ? (
                                            <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 flex items-center gap-1.5 w-fit px-2.5 py-0.5 font-semibold">
                                                <Tag className="w-3 h-3" />
                                                {visitor.type.name}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-400 border-gray-100 italic font-medium px-2.5 py-0.5">
                                                Standard
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            {new Date(visitor.createdAt).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-gray-400">
                                            <Link href={`/visiteurs/registered/${visitor.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(visitor)}
                                                className="h-9 w-9 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setConfirmDeleteId(visitor.id);
                                                    setConfirmDeleteName(`${visitor.firstName} ${visitor.lastName}`);
                                                }}
                                                className="h-9 w-9 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <PackageOpen className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun visiteur trouvé</h3>
                                        <p className="text-gray-500 max-w-sm font-medium px-4">
                                            {searchQuery
                                                ? "Désolé, nous n'avons trouvé aucun résultat pour votre recherche."
                                                : "Commencez par enregistrer votre premier visiteur."}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm gap-4">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                        Page <span className="text-blue-600 font-black">{currentPage}</span> sur <span className="text-gray-900">{totalPages}</span>
                        <span className="mx-2 text-gray-200">|</span>
                        <span className="text-gray-500 font-bold normal-case">{filteredVisitors.length} résultats</span>
                    </p>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex-1 md:flex-none h-11 px-8 rounded-xl border-gray-100 shadow-sm font-black uppercase tracking-widest text-[10px] transition-all hover:bg-gray-50 disabled:opacity-30"
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="flex-1 md:flex-none h-11 px-8 rounded-xl border-gray-100 shadow-sm font-black uppercase tracking-widest text-[10px] transition-all hover:bg-gray-50 disabled:opacity-30"
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal for Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Éditer le profil du visiteur"
            >
                <VisitorForm
                    initialData={selectedVisitor}
                    onSuccess={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={onConfirmDelete}
                title="Supprimer le visiteur"
                description={`Êtes-vous sûr de vouloir supprimer ${confirmDeleteName} ? Cette action supprimera également l'historique de ses visites.`}
                confirmText="Supprimer définitivement"
                variant="destructive"
            />
        </div>
    );
}
