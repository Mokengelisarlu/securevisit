"use client";

import { use, useMemo } from "react";
import {
    User, Mail, Phone, Building2, Calendar,
    ArrowLeft, Clock, Briefcase, ChevronRight,
    MapPin, ShieldCheck, History
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetHostById } from "@/features/tenants/hooks/useGetTenantData";
import { useGetHostHistory } from "@/features/tenants/hooks/useGetHostHistory.hook";
import { useTenant } from "@/lib/tenant-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function HostDetailsPage() {
    const params = useParams();
    const { slug: tenantSlug } = useTenant();
    const hostId = params.hostId as string;

    const { data: host, isLoading: isLoadingHost } = useGetHostById(tenantSlug || "", hostId);
    const { data: history, isLoading: isLoadingHistory } = useGetHostHistory(tenantSlug || "", hostId);

    if (isLoadingHost) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!host) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-gray-900">Hôte non trouvé</h2>
                <p className="text-gray-500 mt-2">L'hôte que vous recherchez n'existe pas ou a été supprimé.</p>
                <Button className="mt-6" asChild>
                    <Link href={`/hote/management`}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href={`/hote/management`}>
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Détails de l'Hôte</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Répertoire</span>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span className="text-xs text-blue-600 font-black uppercase tracking-widest">{host.firstName} {host.lastName}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Profile Section */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                            <div className="absolute top-4 right-4">
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md font-black text-[10px] py-1 px-3">
                                    MEMBRE ACTIF
                                </Badge>
                            </div>
                        </div>

                        <div className="px-8 pb-8 -mt-12 relative flex flex-col items-center">
                            <div className="w-28 h-28 rounded-3xl overflow-hidden border-[6px] border-white shadow-xl bg-gray-100 flex items-center justify-center group relative">
                                {host.photoUrl ? (
                                    <img src={host.photoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-gray-300" />
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                    {host.firstName} {host.lastName}
                                </h2>
                                {host.middleName && (
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mt-1">
                                        {host.middleName}
                                    </p>
                                )}
                            </div>

                            <div className="mt-8 w-full space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Département</p>
                                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100/80 transition-all hover:bg-gray-100/50">
                                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 truncate">
                                            {host.department?.name || "Non assigné"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email professionnel</p>
                                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100/80 transition-all hover:bg-gray-100/50">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 truncate">
                                            {host.email || "Non défini"}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Téléphone</p>
                                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100/80 transition-all hover:bg-gray-100/50">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-700">
                                            {host.phone || "Non défini"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100/50 flex items-start gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className="text-[11px] text-blue-800 font-bold leading-relaxed">
                            Cet hôte est autorisé à recevoir des visiteurs. Toutes les entrées sont sécurisées et archivées.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Stats / Quick Info */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Visites</p>
                            <span className="text-3xl font-black text-gray-900">{history?.length || 0}</span>
                        </div>
                        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Dernière Visite</p>
                            <span className="text-sm font-black text-gray-900">
                                {history && history.length > 0
                                    ? format(new Date(history[0].checkInAt), "dd/MM/yyyy")
                                    : "Aucune"}
                            </span>
                        </div>
                        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <History className="w-12 h-12" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Statut Site</p>
                            <Badge className="bg-emerald-500 text-white border-0 font-black text-[10px]">EN SERVICE</Badge>
                        </div>
                        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Type d'Hôte</p>
                            <span className="text-sm font-black text-blue-600">Interne</span>
                        </div>
                    </div>

                    {/* Visit History Section */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Historique des Visites</h3>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-xs font-bold">
                                Tout voir
                            </Button>
                        </div>

                        <div className="p-2">
                            {isLoadingHistory ? (
                                <div className="space-y-3 p-6">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-20 bg-gray-50/50 animate-pulse rounded-2xl border border-gray-100" />
                                    ))}
                                </div>
                            ) : history && history.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {history.map((visit: any) => (
                                        <div key={visit.id} className="group flex items-center gap-4 p-5 hover:bg-gray-50/80 transition-all rounded-2xl mx-1">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 shadow-sm group-hover:border-blue-100 transition-colors">
                                                {visit.visitor?.photoUrl ? (
                                                    <img src={visit.visitor.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                ) : (
                                                    <User className="w-6 h-6 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                                                            {visit.visitor.firstName} {visit.visitor.lastName}
                                                        </h4>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                                            {visit.visitor.type?.name || "Visiteur"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-gray-900">
                                                            {format(new Date(visit.checkInAt), "dd MMMM yyyy", { locale: fr })}
                                                        </p>
                                                        <p className="text-xs text-gray-500 font-bold flex items-center justify-end gap-1.5 mt-1">
                                                            <Clock className="w-3 h-3 text-blue-500" />
                                                            {format(new Date(visit.checkInAt), "HH:mm")}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Statut</p>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[9px] font-black uppercase tracking-tighter px-2 py-0 border-0",
                                                            visit.status === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500/70"
                                                        )}>
                                                            {visit.status === "IN" ? "Sur site" : "Terminé"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 truncate">
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Motif</p>
                                                        <span className="text-[11px] font-bold text-gray-600 truncate">
                                                            {visit.purpose || "Visite standard"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 pl-2">
                                                <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110">
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-8 border-2 border-dashed border-gray-50 rounded-[2rem] m-6">
                                    <div className="w-20 h-20 bg-gray-50/50 rounded-full flex items-center justify-center mb-6">
                                        <History className="w-10 h-10 text-gray-200" />
                                    </div>
                                    <h4 className="text-lg font-black text-gray-900 mb-2">Historique vide</h4>
                                    <p className="text-sm text-gray-400 font-bold max-w-xs leading-relaxed">
                                        Cet hôte n'a pas encore reçu de visiteurs enregistrés dans le système.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Fin du registre de sécurité</p>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/hote/management`}
                                    className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                                >
                                    Fermer le dossier
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
