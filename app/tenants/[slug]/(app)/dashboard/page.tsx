"use client";

import React from "react";
import {
    Building2,
    LogIn,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Loader2,
    BarChart3,
    Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { useTenant } from "@/lib/tenant-provider";
import { useDashboardStats } from "@/features/tenants/hooks/useGetTenantData";
import { DigitalClock } from "@/components/DigitalClock";

export default function TenantDashboard() {
    const { slug } = useTenant();
    const { data: stats, isLoading } = useDashboardStats(slug!);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useGSAP(() => {
        if (!isLoading && containerRef.current) {
            const tl = gsap.timeline();

            tl.from(".dashboard-header", {
                y: -20,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            });

            tl.from(".stat-card", {
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "back.out(1.7)"
            }, "-=0.4");

            tl.from(".dashboard-section", {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power2.out"
            }, "-=0.6");

            tl.from(".chart-bar", {
                scaleY: 0,
                duration: 1.5,
                stagger: 0.1,
                transformOrigin: "bottom",
                ease: "elastic.out(1, 0.75)"
            }, "-=1");
        }
    }, [isLoading]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                    <div className="absolute inset-0 blur-xl bg-blue-400/20 animate-pulse rounded-full" />
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Synchronisation</p>
                    <p className="text-slate-300 text-[9px] font-bold uppercase tracking-widest">Calcul des métriques en temps réel</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="space-y-10 max-w-[1600px] mx-auto pb-16 relative">
            <div className="flex items-center justify-between dashboard-header">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Aperçu de l&apos;activité de votre lobby</p>
                </div>
                <DigitalClock />
            </div>

            {/* Row 1: 3-Card Gradient Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GradientStatCard
                    title="Présents sur site"
                    value={stats?.onSite?.toString() || "0"}
                    icon={<Building2 className="w-8 h-8" />}
                    gradient="from-[#0055cc] to-[#3b82f6]"
                    className="stat-card"
                />
                <GradientStatCard
                    title="Arrivées aujourd'hui"
                    value={stats?.arrivedToday?.toString() || "0"}
                    icon={<LogIn className="w-8 h-8" />}
                    gradient="from-[#f97316] to-[#fbbf24]"
                    className="stat-card"
                />
                <GradientStatCard
                    title="Moyenne hebdomadaire"
                    value={stats?.weeklyAverage?.toString() || "0"}
                    icon={<TrendingUp className="w-8 h-8" />}
                    gradient="from-[#6366f1] to-[#a855f7]"
                    className="stat-card"
                />
            </div>

            {/* Row 2: Full-Width Visitors Table */}
            <div className="card-white dashboard-section overflow-hidden border border-slate-200/50">
                <div className="p-8 border-b border-slate-100/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                        <h2 className="text-2xl font-black text-slate-800">
                            Dernières visites <span className="text-slate-400 font-bold ml-1 text-xl">({stats?.recentActivities?.length || 0})</span>
                        </h2>

                        <div className="flex items-center gap-2 ml-4 bg-white border border-slate-200 rounded-[10px] p-1 px-3 shadow-sm">
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
                            <tr className="border-b border-slate-100/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <th className="px-8 py-6 font-black whitespace-nowrap">Statut</th>
                                <th className="px-8 py-6 font-black whitespace-nowrap">Nom du visiteur</th>
                                <th className="px-8 py-6 font-black whitespace-nowrap">Motif de visite</th>
                                <th className="px-8 py-6 font-black whitespace-nowrap">Hôte d&apos;accueil</th>
                                <th className="px-8 py-6 font-black text-right whitespace-nowrap">Heure</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                                stats.recentActivities.slice(0, 5).map((activity: any) => (
                                    <tr key={activity.id} className="group hover:bg-slate-50/80 transition-all duration-300 cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${activity.type === "CHECK_IN" ? "bg-emerald-500" : "bg-blue-500"} shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-125`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                                                    {activity.type === "CHECK_IN" ? "Sur place" : "Parti"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs uppercase group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-500">
                                                    {activity.visitorName?.charAt(0) || "V"}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900 block whitespace-nowrap">
                                                    {activity.visitorName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-[8px] whitespace-nowrap uppercase tracking-wider">
                                                {activity.purpose || "Visite standard"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                                                <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{activity.hostName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-slate-400 text-xs tabular-nums whitespace-nowrap">
                                            {new Date(activity.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Users className="w-12 h-12 text-slate-400" />
                                            <p className="italic text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Aucun mouvement détecté</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Row 3: Analytics Row (Trend Chart + Info Card) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Trend Chart - 2/3 width on wide screens */}
                <div className="lg:col-span-2 card-white dashboard-section p-8 flex flex-col min-h-[450px] border border-slate-200/50">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Flux hebdomadaire</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Évolution des visites sur 7 jours</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-[14px] flex items-center justify-center text-blue-600 shadow-sm">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-4 mb-6 min-h-[220px] px-2">
                        {stats?.weeklyTrend?.map((item: any, idx: number) => {
                            const maxCount = Math.max(...stats.weeklyTrend.map((t: any) => t.count), 1);
                            const height = (item.count / maxCount) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-6 group h-full">
                                    <div className="w-full relative flex items-end justify-center h-full">
                                        <div className="w-full bg-slate-50/50 rounded-2xl transition-colors absolute bottom-0 h-full border border-slate-100/50 group-hover:bg-slate-100/80" />
                                        <div
                                            className="chart-bar w-full bg-gradient-to-t from-blue-700 via-blue-600 to-blue-400 rounded-2xl transition-all duration-500 ease-out shadow-lg shadow-blue-500/20 relative z-10 group-hover:brightness-110"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-2xl whitespace-nowrap z-20 border border-white/10 backdrop-blur-md">
                                                {item.count} visites
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45 border-r border-b border-white/10" />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                                        {item.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-8 border-t border-slate-100 mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total semaine</span>
                        </div>
                        <span className="text-xl font-black text-slate-900 tabular-nums">
                            {stats?.weeklyTrend?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}
                        </span>
                    </div>
                </div>

                {/* Info Card - 1/3 width */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[450px] dashboard-section">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/30 blur-[100px] rounded-full -mr-24 -mt-24" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/20 blur-[80px] rounded-full -ml-16 -mb-16" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-8 border border-white/10">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Smart Insights</span>
                        <h4 className="text-3xl font-black mt-4 leading-[1.1] tracking-tight">Optimisez vos ressources.</h4>
                        <p className="text-sm text-slate-400 mt-6 font-medium leading-relaxed italic opacity-80 decoration-blue-500/30 underline-offset-4 decoration-1">
                            &quot;Le flux de visiteurs atteint son pic entre <span className="text-white font-bold not-italic">09:00</span> et <span className="text-white font-bold not-italic">11:00</span>. Nous recommandons de renforcer l&apos;accueil.&quot;
                        </p>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-[0.2em] h-14 rounded-2xl shadow-xl shadow-blue-600/30 group transition-all duration-500">
                            <span className="group-hover:scale-105 transition-transform">Voir les analyses</span>
                        </Button>
                        <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">Généré par SecureVisit AI</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GradientStatCard({ title, value, icon, gradient, className }: { title: string; value: string; icon: React.ReactNode; gradient: string; className?: string }) {
    return (
        <div className={`bg-gradient-to-br ${gradient} rounded-[2.5rem] p-8 relative overflow-hidden group shadow-xl shadow-slate-200/50 transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl ${className}`}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-[60px] rounded-full -mr-20 -mt-20 transition-transform duration-1000 group-hover:scale-125" />
            <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 bg-white/20 rounded-[22px] flex items-center justify-center text-white backdrop-blur-md border border-white/20 transition-all duration-700 group-hover:bg-white/30 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                    {icon}
                </div>
                <div className="text-white space-y-1">
                    <div className="text-5xl font-black tracking-tighter drop-shadow-sm">{value}</div>
                    <div className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">{title}</div>
                </div>
            </div>
        </div>
    );
}

