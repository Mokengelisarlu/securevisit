"use client";

import { useMemo, useState } from "react";
import {
    Search,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Settings2,
    PackageOpen,
    Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTenant } from "@/lib/tenant-provider";
import { useGetServices } from "../hooks/useGetServices.hook";
import { useDeleteService } from "../hooks/useDeleteService.hook";
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
import { ServiceForm } from "../forms/ServiceForm";

const ITEMS_PER_PAGE = 8;

export function ServicesList() {
    const { slug: tenantSlug } = useTenant();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

    if (!tenantSlug) return null;

    const { data: services, isLoading, error } = useGetServices(tenantSlug);
    const deleteService = useDeleteService();

    const filteredServices = useMemo(() => {
        if (!services) return [];
        return services.filter((s: any) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.department?.name && s.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [services, searchQuery]);

    const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
    const paginatedServices = filteredServices.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    function handleEdit(service: any) {
        setSelectedService(service);
        setIsModalOpen(true);
    }

    function handleCreate() {
        setSelectedService(null);
        setIsModalOpen(true);
    }

    async function onConfirmDelete() {
        if (!confirmDeleteId) return;
        try {
            await deleteService.mutateAsync(confirmDeleteId);
            toast.success("Service supprimé");
        } catch (error: any) {
            toast.error(error?.message || "Échec de la suppression");
        } finally {
            setConfirmDeleteId(null);
            setConfirmDeleteName("");
        }
    }

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mb-4" />
            <p className="text-gray-500 font-medium">Chargement des services...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher service, département..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 h-11 border-gray-200 focus:ring-teal-500 focus:border-teal-500 rounded-lg bg-gray-50/50"
                    />
                </div>
                <Button
                    onClick={handleCreate}
                    className="bg-[#0DBDB5] hover:bg-[#0044aa] text-white px-6 h-11 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-5 h-5" />
                    Nouveau Service
                </Button>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b border-gray-200">
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Service</TableHead>
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Département</TableHead>
                            <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Description</TableHead>
                            <TableHead className="py-4 px-6 text-right text-xs font-bold uppercase text-gray-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedServices.length > 0 ? (
                            paginatedServices.map((service: any) => (
                                <TableRow key={service.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                                    <TableCell className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{service.name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{service.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        {service.department ? (
                                            <div className="flex items-center gap-2">
                                                <div className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-md border border-teal-100 uppercase">
                                                    {service.department.abbreviation || "DEPT"}
                                                </div>
                                                <span className="text-sm font-medium text-gray-600">{service.department.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Non assigné</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <span className="text-sm text-gray-500 line-clamp-1">{service.description || "-"}</span>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 text-gray-400">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(service)}
                                                className="h-9 w-9 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setConfirmDeleteId(service.id);
                                                    setConfirmDeleteName(service.name);
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
                                <TableCell colSpan={4} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <PackageOpen className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun service trouvé</h3>
                                        <p className="text-gray-500 max-w-sm font-medium px-4">
                                            {searchQuery
                                                ? "Désolé, nous n'avons trouvé aucun résultat pour votre recherche."
                                                : "Commencez par organiser votre structure en ajoutant votre premier service."}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t flex items-center justify-between">
                        <p className="text-sm text-gray-500 font-medium">
                            Page <span className="font-bold text-gray-900">{currentPage}</span> sur <span className="font-bold text-gray-900">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-9 px-4 font-semibold shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-9 px-4 font-semibold shadow-sm"
                            >
                                Suivant <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for Create/Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedService ? "Éditer le Service" : "Ajouter un Service"}
            >
                <ServiceForm
                    initialData={selectedService}
                    onSuccess={() => setIsModalOpen(false)}
                />
            </Modal>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={onConfirmDelete}
                title="Supprimer le service"
                description={`Êtes-vous sûr de vouloir supprimer le service "${confirmDeleteName}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="destructive"
            />
        </div>
    );
}
