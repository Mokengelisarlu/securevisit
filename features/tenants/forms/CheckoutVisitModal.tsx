"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/custom-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LogOut, Clock, User, Building2, Loader2, X } from "lucide-react";
import { useTenant } from "@/lib/tenant-provider";
import { useGetVisits } from "../hooks/useGetTenantData";
import { useCheckoutVisit } from "../hooks/useCheckoutVisit.hook";
import { toast } from "sonner";

interface CheckoutVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CheckoutVisitModal({ isOpen, onClose }: CheckoutVisitModalProps) {
    const { slug: tenantSlug } = useTenant();
    const [searchQuery, setSearchQuery] = useState("");

    // Only get visitors who are currently IN
    const { data: onSiteVisits, isLoading } = useGetVisits(tenantSlug!, { status: "IN" });
    const checkoutMutation = useCheckoutVisit(tenantSlug!);

    const filteredVisits = useMemo(() => {
        if (!onSiteVisits) return [];
        return onSiteVisits.filter((v: any) =>
            `${v.visitor.firstName} ${v.visitor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.visitor.company && v.visitor.company.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [onSiteVisits, searchQuery]);

    const handleCheckout = async (visitId: string) => {
        try {
            await checkoutMutation.mutateAsync(visitId);
            toast.success("Visiteur enregistré en sortie avec succès !");
            // If it's the only one or if user wants to close after one checkout
            // For now, let's keep it open to allow multiple checkouts
        } catch (error: any) {
            toast.error(error?.message || "Erreur lors de l'enregistrement de la sortie");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enregistrer une Sortie">
            <div className="space-y-6">
                <p className="text-sm text-gray-500 font-medium">
                    Sélectionnez un visiteur pour enregistrer son départ.
                </p>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Rechercher un visiteur sur place..."
                        className="pl-10 h-12 bg-white border-gray-200 focus:ring-red-500 rounded-xl shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Results List */}
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                            <p className="text-gray-500 font-medium italic text-sm">Chargement des visiteurs sur place...</p>
                        </div>
                    ) : filteredVisits.length > 0 ? (
                        filteredVisits.map((visit: any) => (
                            <div
                                key={visit.id}
                                className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:border-red-200 transition-all group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 font-bold border border-red-100 shrink-0 text-xs">
                                        {visit.visitor.firstName[0]}{visit.visitor.lastName[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 leading-tight text-sm">
                                            {visit.visitor.firstName} {visit.visitor.lastName}
                                        </span>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {visit.visitor.company || "Individuel"}
                                            </span>
                                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Arrivée: {new Date(visit.checkInAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleCheckout(visit.id)}
                                    disabled={checkoutMutation.isPending}
                                    variant="ghost"
                                    className="h-9 px-3 hover:bg-red-50 hover:text-red-600 font-bold rounded-lg border border-transparent hover:border-red-100 transition-all flex items-center gap-2 text-xs"
                                >
                                    {checkoutMutation.isPending && checkoutMutation.variables === visit.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <LogOut className="w-4 h-4" />
                                    )}
                                    Sortie
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-gray-200">
                                <User className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">Aucun visiteur sur place</h3>
                            <p className="text-gray-500 text-[10px] max-w-[200px] mt-1">
                                Aucun visiteur n'est actuellement enregistré sur le site.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="font-bold text-gray-500 h-10 px-6 rounded-lg"
                    >
                        Fermer
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
