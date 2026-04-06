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
        <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
            {/* Minimalist Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/hote/management"
                    className="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Retour au répertoire</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Profile & Contact */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="flex flex-col items-center lg:items-start space-y-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border border-gray-200 p-1.5 shadow-sm overflow-hidden flex items-center justify-center">
                                <div className="w-full h-full overflow-hidden rounded-[2rem] bg-slate-100 flex items-center justify-center">
                                    {host.photoUrl ? (
                                        <img src={host.photoUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <User className="w-12 h-12 text-slate-300" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center text-blue-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="text-center lg:text-left pt-2">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {host.firstName} {host.lastName}
                            </h1>
                            {host.middleName && (
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mt-2">
                                    {host.middleName}
                                </p>
                            )}
                            <div className="mt-4">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none font-bold text-[10px] px-3 py-1 uppercase tracking-widest">
                                    Membre Actif
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-gray-200">
                        <ContactItem
                            icon={<Building2 className="w-4 h-4" />}
                            label="Département"
                            value={host.department?.name || "Non assigné"}
                        />
                        <ContactItem
                            icon={<Mail className="w-4 h-4" />}
                            label="Email Pro"
                            value={host.email || "—"}
                        />
                        <ContactItem
                            icon={<Phone className="w-4 h-4" />}
                            label="Téléphone"
                            value={host.phone || "—"}
                        />
                    </div>
                </div>

                {/* Right Column: Stats & History */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Compact Stats Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        <StatItem label="Total Visites" value={history?.length || 0} />
                        <StatItem
                            label="Dernière Visite"
                            value={history && history.length > 0 ? format(new Date(history[0].checkInAt), "dd MMM") : "—"}
                        />
                        <StatItem label="Statut" value="En Service" isStatus />
                    </div>

                    {/* Minimalist History Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Historique Récent</h3>
                            {history && history.length > 0 && (
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {history.length} entrées au total
                                </span>
                            )}
                        </div>

                        {isLoadingHistory ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-slate-50/50 animate-pulse rounded-2xl" />
                                ))}
                            </div>
                        ) : history && history.length > 0 ? (
                            <div className="space-y-1">
                                {history.map((visit: any) => (
                                    <Link
                                        key={visit.id}
                                        href={`/visiteurs/details/${visit.visitor.id}`}
                                        className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/50">
                                                {visit.visitor?.photoUrl ? (
                                                    <img src={visit.visitor.photoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    {visit.visitor.firstName} {visit.visitor.lastName}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                    {visit.purpose || "Visite de travail"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900 tabular-nums">
                                                {format(new Date(visit.checkInAt), "dd MMMM", { locale: fr })}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                {format(new Date(visit.checkInAt), "HH:mm")}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-slate-50 rounded-[2.5rem]">
                                <p className="text-sm text-slate-300 font-bold uppercase tracking-widest">Aucune visite enregistrée</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="group flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-gray-200 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-700 truncate mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function StatItem({ label, value, isStatus }: { label: string; value: string | number; isStatus?: boolean }) {
    return (
        <div className="bg-slate-50 rounded-2xl p-6 border border-gray-200">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            {isStatus ? (
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{value}</span>
                </div>
            ) : (
                <span className="text-2xl font-black text-slate-900 tabular-nums leading-none">{value}</span>
            )}
        </div>
    );
}
