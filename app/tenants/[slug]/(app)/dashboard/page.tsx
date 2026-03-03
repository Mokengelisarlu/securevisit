"use client";

import React from "react";
import {
    Building2,
    LogIn,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Loader2,
    BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useTenant } from "@/lib/tenant-provider";
import { useDashboardStats } from "@/features/tenants/hooks/useGetTenantData";
import { DigitalClock } from "@/components/DigitalClock";

export default function TenantDashboard() {
    const { slug } = useTenant();
    const { data: stats, isLoading } = useDashboardStats(slug!);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">Initialisation...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1600px] mx-auto pb-12">

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tableau de bord</h1>
                <DigitalClock />
            </div>

            {/* Row 1: 3-Card Gradient Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GradientStatCard
                    title="Présents sur site"
                    value={stats?.onSite?.toString() || "0"}
                    icon={<Building2 className="w-8 h-8" />}
                    gradient="from-[#0055cc] to-[#3b82f6]"
                />
                <GradientStatCard
                    title="Arrivées aujourd'hui"
                    value={stats?.arrivedToday?.toString() || "0"}
                    icon={<LogIn className="w-8 h-8" />}
                    gradient="from-[#f97316] to-[#fbbf24]"
                />
                <GradientStatCard
                    title="Moyenne hebdomadaire"
                    value={stats?.weeklyAverage?.toString() || "0"}
                    icon={<TrendingUp className="w-8 h-8" />}
                    gradient="from-[#6366f1] to-[#a855f7]"
                />
            </div>

            {/* Row 2: Full-Width Visitors Table */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black text-slate-800">
                            Dernières visites <span className="text-slate-400 font-bold ml-1 text-xl">(5)</span>
                        </h2>

                        <div className="flex items-center gap-2 ml-4 bg-white border border-slate-200 rounded-lg p-1 px-3 shadow-sm">
                            <button className="p-1 hover:text-blue-600 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter px-2">
                                {new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <button className="p-1 hover:text-blue-600 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5 font-black whitespace-nowrap">Statut</th>
                                <th className="px-8 py-5 font-black whitespace-nowrap">Nom du visiteur</th>
                                <th className="px-8 py-5 font-black whitespace-nowrap">Motif</th>
                                <th className="px-8 py-5 font-black whitespace-nowrap">Hôte</th>
                                <th className="px-8 py-5 font-black text-right whitespace-nowrap">Heure</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/10">
                            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                                stats.recentActivities.slice(0, 5).map((activity: any) => (
                                    <tr key={activity.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${activity.type === "CHECK_IN" ? "bg-emerald-500" : "bg-blue-500"} shadow-sm transition-transform group-hover:scale-125 group-active:scale-95`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                                    {activity.type === "CHECK_IN" ? "Sur place" : "Parti"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                    {activity.visitorName?.charAt(0) || "V"}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 leading-tight block whitespace-nowrap">
                                                    {activity.visitorName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-slate-500 bg-slate-100/50 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                {activity.purpose || "Visite de travail"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{activity.hostName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-slate-400 text-xs tabular-nums whitespace-nowrap">
                                            {new Date(activity.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-16 text-center italic text-slate-300 font-bold text-xs uppercase tracking-widest">
                                        Aucune activité détectée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Row 3: Analytics Row (Trend Chart + Info Card) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart - 2/3 width on wide screens */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Flux hebdomadaire</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visites / 7 jours</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-3 mb-4 min-h-[180px]">
                        {stats?.weeklyTrend?.map((item: any, idx: number) => {
                            const maxCount = Math.max(...stats.weeklyTrend.map((t: any) => t.count), 1);
                            const height = (item.count / maxCount) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-4 group h-full">
                                    <div className="w-full relative flex items-end justify-center h-full">
                                        <div className="w-full bg-slate-50/80 rounded-2xl transition-colors absolute bottom-0 h-full border border-slate-100 group-hover:bg-slate-100" />
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-700 via-blue-600 to-blue-400 rounded-2xl transition-all duration-1000 ease-out shadow-lg shadow-blue-200/40 relative z-10 group-hover:scale-x-105 group-hover:brightness-110"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] font-black px-2 py-1 rounded-lg pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-xl whitespace-nowrap z-20">
                                                {item.count} visites
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                                        {item.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-slate-50 mt-auto">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Total semaine</span>
                            <span className="text-slate-900">{stats?.weeklyTrend?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Info Card - 1/3 width */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-center min-h-[400px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full -mr-16 -mt-16" />
                    <div className="relative z-10">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Info Rapide</span>
                        <h4 className="text-2xl font-black mt-2 leading-tight">Optimisez vos flux.</h4>
                        <p className="text-sm text-slate-400 mt-5 font-medium leading-relaxed italic">
                            "La plupart de vos visiteurs arrivent entre 09:00 et 11:00. Prévoyez plus de personnel à l'accueil."
                        </p>
                        <Button className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-xs font-black uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-blue-600/20">
                            Voir les analyses
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GradientStatCard({ title, value, icon, gradient }: { title: string; value: string; icon: React.ReactNode; gradient: string }) {
    return (
        <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-8 relative overflow-hidden group shadow-lg shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-xl`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20 transition-all group-hover:bg-white/30">
                    {icon}
                </div>
                <div className="text-white space-y-0.5">
                    <div className="text-4xl font-black tracking-tight">{value}</div>
                    <div className="text-xs font-bold opacity-80 uppercase tracking-widest">{title}</div>
                </div>
            </div>
        </div>
    );
}
