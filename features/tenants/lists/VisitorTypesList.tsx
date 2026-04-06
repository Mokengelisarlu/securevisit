"use client";

import { useMemo, useState } from "react";
import {
    Search,
    Edit2,
    Trash2,
    PackageOpen,
    Plus,
    Tag,
    FileText
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/lib/tenant-provider";
import { useGetVisitorTypes } from "../hooks/useGetTenantData";
import { useDeleteVisitorType } from "../hooks/useDeleteVisitorType.hook";
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
import { VisitorTypeForm } from "../forms/VisitorTypeForm";

export function VisitorTypesList() {
    const { slug: tenantSlug } = useTenant();
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<any>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

    if (!tenantSlug) return null;

    const { data: visitorTypes, isLoading } = useGetVisitorTypes(tenantSlug);
    const deleteMutation = useDeleteVisitorType();

    const filteredTypes = useMemo(() => {
        if (!visitorTypes) return [];
        return visitorTypes.filter((t: any) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [visitorTypes, searchQuery]);

    function handleEdit(type: any) {
        setSelectedType(type);
        setIsModalOpen(true);
    }

    function handleCreate() {
        setSelectedType(null);
        setIsModalOpen(true);
    }

    async function onConfirmDelete() {
        if (!confirmDeleteId) return;
        try {
            await deleteMutation.mutateAsync(confirmDeleteId);
            toast.success("Type de visiteur supprimé");
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
            <p className="text-gray-500 font-medium">Chargement des types...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher un type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                    />
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-[#0055cc] hover:bg-[#0044aa] text-white px-6 h-11 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-5 h-5" />
                    Nouveau Type
                </Button>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50 border-b border-gray-200">
                        <TableRow>
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500 w-[30%]">Nom du Type</TableHead>
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Description</TableHead>
                            <TableHead className="py-4 px-6 text-right text-xs font-bold uppercase text-gray-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTypes.length > 0 ? (
                            filteredTypes.map((type: any) => (
                                <TableRow key={type.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-200">
                                    <TableCell className="py-4 px-6 font-bold text-gray-900">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                            {type.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        {type.description ? (
                                            <div className="flex items-start gap-2 text-sm text-gray-500">
                                                <FileText className="w-4 h-4 mt-0.5 text-gray-300 shrink-0" />
                                                <span className="line-clamp-2">{type.description}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Aucune description</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-gray-400">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(type)}
                                                className="h-9 w-9 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setConfirmDeleteId(type.id);
                                                    setConfirmDeleteName(type.name);
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
                                <TableCell colSpan={3} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <PackageOpen className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun type trouvé</h3>
                                        <p className="text-gray-500 max-w-sm font-medium px-4">
                                            {searchQuery
                                                ? "Désolé, nous n'avons trouvé aucun résultat pour votre recherche."
                                                : "Commencez par ajouter votre premier type de visiteur."}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal for Create/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedType ? "Éditer le Type" : "Ajouter un Type"}
            >
                <VisitorTypeForm
                    initialData={selectedType}
                    onSuccess={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={onConfirmDelete}
                title="Supprimer le type"
                description={`Êtes-vous sûr de vouloir supprimer le type "${confirmDeleteName}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="destructive"
            />
        </div>
    );
}
