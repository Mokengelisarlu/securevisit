"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  PackageOpen
} from "lucide-react";
import { toast } from "sonner";

import { useTenant } from "@/lib/tenant-provider";
import { useGetDepartments } from "../hooks/useGetTenantData";
import { useUpdateDepartment } from "../hooks/useUpdateDepartment.hook";
import { useDeleteDepartment } from "../hooks/useDeleteDepartment.hook";

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
import { ConfirmModal } from "@/components/ConfirmModal";

const ITEMS_PER_PAGE = 5;

export function DepartmentsList() {
  const { slug: tenantSlug } = useTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Selected for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [editingAbbreviation, setEditingAbbreviation] = useState<string>("");

  // Confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

  if (!tenantSlug) {
    return <div className="text-gray-500">Aucun tenant sélectionné</div>;
  }

  const { data: departments, isLoading, error } = useGetDepartments(tenantSlug);
  const queryClient = useQueryClient();
  const router = useRouter();

  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  async function onConfirmDelete() {
    if (!confirmDeleteId) return;
    try {
      await deleteMutation.mutateAsync(confirmDeleteId);
      toast.success("Département supprimé");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Échec de la suppression");
    } finally {
      setConfirmDeleteId(null);
      setConfirmDeleteName("");
    }
  }

  function startEdit(dept: any) {
    setEditingId(dept.id);
    setEditingName(dept.name || "");
    setEditingAbbreviation(dept.abbreviation || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingAbbreviation("");
  }

  async function saveEdit(id: string) {
    if (!editingName.trim()) {
      toast.error("Le nom du département ne peut pas être vide");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        name: editingName,
        abbreviation: editingAbbreviation
      });
      toast.success("Département mis à jour");
      cancelEdit();
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Échec de la mise à jour");
    }
  }

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    return departments.filter((dept: any) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.abbreviation && dept.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [departments, searchQuery]);

  const totalPages = Math.ceil(filteredDepartments.length / ITEMS_PER_PAGE);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
      <p className="text-gray-500">Chargement des départements...</p>
    </div>
  );

  if (error) return (
    <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
      <div className="p-2 bg-red-100 rounded-lg">
        <PackageOpen className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold">Erreur</p>
        <p className="text-sm">Échec du chargement des départements. Veuillez réessayer.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Table Actions & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher (nom, abr)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {filteredDepartments.length} département{filteredDepartments.length > 1 ? 's' : ''} au total
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[80px] text-xs font-bold uppercase tracking-wider text-gray-500 py-4 px-6 text-center">Abréviation</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-gray-500 py-4 px-6">Nom du Département</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-gray-500 py-4 px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDepartments.length > 0 ? (
              paginatedDepartments.map((dept: any) => (
                <TableRow key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-4 px-6">
                    {editingId === dept.id ? (
                      <Input
                        value={editingAbbreviation}
                        onChange={(e) => setEditingAbbreviation(e.target.value)}
                        placeholder="Abr"
                        className="h-9 w-16 text-center"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(dept.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                    ) : (
                      <div className="w-12 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto border border-blue-100">
                        <span className="text-xs font-bold text-blue-600 uppercase">
                          {dept.abbreviation || <Building2 className="w-4 h-4 text-blue-400" />}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {editingId === dept.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        className="h-9 min-w-[200px]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(dept.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{dept.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono tracking-tight">{dept.id}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === dept.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => saveEdit(dept.id)}
                            disabled={updateMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 h-8 px-4"
                          >
                            Enregistrer
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8">
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(dept)}
                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setConfirmDeleteId(dept.id);
                              setConfirmDeleteName(dept.name);
                            }}
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <PackageOpen className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun département trouvé</h3>
                    <p className="text-gray-500 max-w-sm">
                      {searchQuery
                        ? "Nous n'avons trouvé aucun résultat correspondant à votre recherche."
                        : "Commencez par ajouter votre premier département ci-dessus."}
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
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-900">{currentPage}</span> sur <span className="font-semibold text-gray-900">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 gap-1"
              >
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={onConfirmDelete}
        title="Supprimer le département"
        description={`Êtes-vous sûr de vouloir supprimer le département "${confirmDeleteName}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="destructive"
      />
    </div>
  );
}
