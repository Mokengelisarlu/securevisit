"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  Plus,
  User,
  Mail,
  Phone,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/lib/tenant-provider";
import { useGetHosts } from "../hooks/useGetTenantData";
import { useDeleteHost } from "../hooks/useDeleteHost.hook";
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
import { HostForm } from "../forms/HostForm";
import Link from "next/link";

const ITEMS_PER_PAGE = 8;

export function HostsList() {
  const { slug: tenantSlug } = useTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

  if (!tenantSlug) return null;

  const { data: hosts, isLoading, error } = useGetHosts(tenantSlug);
  const deleteHostMutation = useDeleteHost();

  const filteredHosts = useMemo(() => {
    if (!hosts) return [];
    return hosts.filter((h: any) => {
      const fullName = `${h.firstName} ${h.lastName} ${h.middleName || ""}`.toLowerCase();
      const query = searchQuery.toLowerCase();
      return (
        fullName.includes(query) ||
        (h.email && h.email.toLowerCase().includes(query)) ||
        (h.phone && h.phone.toLowerCase().includes(query)) ||
        (h.department?.name && h.department.name.toLowerCase().includes(query))
      );
    });
  }, [hosts, searchQuery]);

  const totalPages = Math.ceil(filteredHosts.length / ITEMS_PER_PAGE);
  const paginatedHosts = filteredHosts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function handleEdit(host: any) {
    setSelectedHost(host);
    setIsModalOpen(true);
  }

  function handleCreate() {
    setSelectedHost(null);
    setIsModalOpen(true);
  }

  async function onConfirmDelete() {
    if (!confirmDeleteId) return;
    try {
      await deleteHostMutation.mutateAsync(confirmDeleteId);
      toast.success("Hôte supprimé");
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
      <p className="text-gray-500 font-medium">Chargement des hôtes...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher nom, email, département..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 h-11 border-gray-200 focus:ring-teal-500 focus:border-teal-500 rounded-lg"
          />
        </div>
        <Button
          onClick={handleCreate}
          className="bg-[#0DBDB5] hover:bg-[#0044aa] text-white px-6 h-11 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          Nouvel Hôte
        </Button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-b border-gray-200">
              <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Nom Complet</TableHead>
              <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Département</TableHead>
              <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Contact</TableHead>
              <TableHead className="py-4 px-6 text-right text-xs font-bold uppercase text-gray-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedHosts.length > 0 ? (
              paginatedHosts.map((host: any) => (
                <TableRow key={host.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shrink-0 font-bold">
                        {host.photoUrl ? (
                          <img src={host.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs">{host.firstName[0]}{host.lastName[0]}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 leading-tight">
                          {host.firstName} {host.lastName}
                        </span>
                        {host.middleName && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-teal-600/60 leading-tight">
                            {host.middleName}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-400 font-mono mt-0.5">{host.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {host.department ? (
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-md border border-teal-100 uppercase">
                          {host.department.abbreviation || "DEPT"}
                        </div>
                        <span className="text-sm font-medium text-gray-600">{host.department.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Non assigné</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      {host.email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {host.email}
                        </div>
                      )}
                      {host.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {host.phone}
                        </div>
                      )}
                      {!host.email && !host.phone && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 text-gray-400">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-9 w-9 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                        title="Détails"
                      >
                        <Link href={`/hote/management/${host.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(host)}
                        className="h-9 w-9 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setConfirmDeleteId(host.id);
                          setConfirmDeleteName(`${host.firstName} ${host.lastName}`);
                        }}
                        className="h-9 w-9 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun hôte trouvé</h3>
                    <p className="text-gray-500 max-w-sm font-medium px-4">
                      {searchQuery
                        ? "Désolé, nous n'avons trouvé aucun résultat pour votre recherche."
                        : "Commencez par ajouter votre premier hôte interne."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white border-t gap-4">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              Page <span className="text-teal-600 font-black">{currentPage}</span> sur <span className="text-gray-900">{totalPages}</span>
              <span className="mx-2 text-gray-200">|</span>
              <span className="text-gray-500 font-bold normal-case">{filteredHosts.length} résultats</span>
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
      </div>

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedHost ? "Éditer l'Hôte" : "Ajouter un Hôte"}
      >
        <HostForm
          initialData={selectedHost}
          onSuccess={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={onConfirmDelete}
        title="Supprimer l'hôte"
        description={`Êtes-vous sûr de vouloir supprimer l'hôte "${confirmDeleteName}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="destructive"
      />
    </div>
  );
}
