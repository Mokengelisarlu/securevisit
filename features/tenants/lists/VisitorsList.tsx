"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetVisitors } from "../hooks/useGetTenantData";
import { deleteVisitor } from "../queries/tenant-data";
import { useUpdateVisitor } from "../hooks/useUpdateVisitor.hook";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { useTenant } from "@/lib/tenant-provider";
import { useState, useMemo } from 'react';
import { Edit2, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 6;

export function VisitorsList() {
  const { slug: tenantSlug } = useTenant();

  if (!tenantSlug) {
    return <div className="text-gray-500">No tenant selected</div>;
  }

  const { data: visitors, isLoading, error } = useGetVisitors(tenantSlug);
  const queryClient = useQueryClient();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);

  const paginatedVisitors = useMemo(() => {
    if (!visitors) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visitors.slice(start, start + ITEMS_PER_PAGE);
  }, [visitors, currentPage]);

  const totalPages = visitors ? Math.ceil(visitors.length / ITEMS_PER_PAGE) : 0;

  const deleteMutation = useMutation({
    mutationFn: (visitorId: string) => deleteVisitor(tenantSlug, visitorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitors", tenantSlug] });
      toast.success("Visitor deleted");
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete");
    },
  });

  const updateMutation = useUpdateVisitor();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [company, setCompany] = useState<string>("");

  function startEdit(v: any) {
    setEditingId(v.id);
    setFirstName(v.firstName || "");
    setLastName(v.lastName || "");
    setPhone(v.phone || "");
    setCompany(v.company || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setCompany("");
  }

  async function saveEdit(id: string) {
    try {
      await updateMutation.mutateAsync({ id, firstName, lastName, phone: phone || null, company: company || null });
      toast.success("Visitor updated");
      cancelEdit();
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
    }
  }

  if (isLoading) return <div className="text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-500">Error loading visitors</div>;
  if (!visitors?.length) return <div className="text-gray-500">No visitors yet</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paginatedVisitors.map((visitor: any) => (
          <div
            key={visitor.id}
            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-1 min-w-0">
              {editingId === visitor.id ? (
                <div className="flex flex-col gap-2 pr-4">
                  <div className="flex gap-2">
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-9 rounded-lg" />
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-9 rounded-lg" />
                  </div>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} className="h-9 rounded-lg" placeholder="Entreprise" />
                  <div className="flex gap-2">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 rounded-lg" placeholder="Téléphone" />
                    <Button size="sm" onClick={() => saveEdit(visitor.id)} disabled={updateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 h-9 rounded-lg">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-9 rounded-lg">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-black border border-blue-100">
                    {visitor.firstName[0]}{visitor.lastName[0]}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="font-bold text-gray-900 truncate">{visitor.firstName} {visitor.lastName}</p>
                    <div className="flex flex-col gap-0.5">
                      {visitor.company && (
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-300 rounded-full" /> {visitor.company}
                        </p>
                      )}
                      {visitor.phone && (
                        <p className="text-[10px] text-gray-400 font-mono">{visitor.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editingId !== visitor.id && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(visitor)} className="h-8 w-8 p-0 rounded-lg hover:text-blue-600 hover:bg-blue-50">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(visitor.id)}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 p-0 rounded-lg hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Page <span className="text-blue-600 font-black">{currentPage}</span> sur <span className="text-gray-900">{totalPages}</span>
            <span className="mx-2 text-gray-200">|</span>
            <span className="text-gray-500 font-bold normal-case">{visitors?.length} visiteurs</span>
          </p>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex-1 md:flex-none h-9 px-4 rounded-xl border-gray-100 shadow-sm font-black uppercase tracking-widest text-[9px] transition-all hover:bg-gray-50 disabled:opacity-30"
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex-1 md:flex-none h-9 px-4 rounded-xl border-gray-100 shadow-sm font-black uppercase tracking-widest text-[9px] transition-all hover:bg-gray-50 disabled:opacity-30"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
