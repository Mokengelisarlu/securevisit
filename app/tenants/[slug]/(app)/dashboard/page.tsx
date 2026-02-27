"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Users,
    ArrowUpRight,
    Calendar,
    MessageSquare,
    LogIn,
    LogOut,
    Clock,
    Loader2,
    Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useTenant } from "@/lib/tenant-provider";
import { useDashboardStats } from "@/features/tenants/hooks/useGetTenantData";
import { useEffect } from "react";

type Tab = "departments" | "hosts" | "visitors";

export default function TenantDashboard() {
    const { slug } = useTenant();
    const { data: stats, isLoading } = useDashboardStats(slug!);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="text-gray-500 font-medium animate-pulse">Chargement de votre tableau de bord...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 6-Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Visitors Arrived */}
                <ColorfulStatCard
                    title="VISITEURS ARRIVÉS AUJOURD'HUI"
                    value={stats?.arrivedToday?.toString() || "0"}
                    icon={<LogIn className="w-10 h-10" />}
                    color="bg-emerald-500"
                />

                {/* 2. On-site */}
                <ColorfulStatCard
                    title="VISITEURS SUR PLACE"
                    value={stats?.onSite?.toString() || "0"}
                    icon={<Users className="w-10 h-10" />}
                    color="bg-sky-500"
                />

                {/* 3. DateTime Card */}
                <DateTimeCard />

                {/* 4. Visitors Departed */}
                <ColorfulStatCard
                    title="VISITEURS PARTIS AUJOURD'HUI"
                    value={stats?.departedToday?.toString() || "0"}
                    icon={<LogOut className="w-10 h-10" />}
                    color="bg-blue-600"
                />

                {/* 5. Monthly Visits */}
                <ColorfulStatCard
                    title="NOMBRE DE VISITES MENSUELLES"
                    value={stats?.monthlyVisits?.toString() || "0"}
                    icon={<Calendar className="w-10 h-10" />}
                    color="bg-slate-700"
                />

                {/* 6. SMS Messages (Replaced with Vehicles) */}
                <ColorfulStatCard
                    title="VÉHICULES SUR PLACE"
                    value={stats?.vehiclesOnSite?.toString() || "0"}
                    icon={<Car className="w-10 h-10" />}
                    color="bg-indigo-600"
                />
            </div>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Expected Visitors (Placeholder for now) */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col min-h-[350px]">
                    <div className="px-6 py-5 border-b flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <h3 className="font-bold text-gray-700 uppercase tracking-tight text-xs">Visiteurs attendus</h3>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">Aujourd'hui</Badge>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-medium text-sm">Aucun visiteur attendu pour le moment</p>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col min-h-[350px]">
                    <div className="px-6 py-5 border-b flex items-center gap-2 bg-gray-50/50">
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-bold text-gray-700 uppercase tracking-tight text-xs">Dernières activités</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {stats.recentActivities.map((activity: any) => (
                                    <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${activity.type === "CHECK_IN" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                                                {activity.type === "CHECK_IN" ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{activity.visitorName}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">Hôte: {activity.hostName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                {new Date(activity.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] font-bold px-1.5 py-0 ${activity.type === "CHECK_IN" ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-blue-200 text-blue-600 bg-blue-50"}`}
                                            >
                                                {activity.type === "CHECK_IN" ? "Entrée" : "Sortie"}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center italic text-gray-400 text-sm">
                                Aucune activité récente recorded.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ColorfulStatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
    return (
        <div className={`${color} rounded-xl shadow-md overflow-hidden flex h-36 group cursor-default hover:brightness-105 transition-all`}>
            {/* Left Icon Area */}
            <div className="w-1/3 flex items-center justify-center bg-black/10">
                <div className="text-white group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            {/* Right Value Area */}
            <div className="w-2/3 p-6 flex flex-col justify-center text-white">
                <div className="text-4xl font-bold">{value}</div>
                <div className="text-[10px] font-bold mt-1 opacity-90 leading-tight uppercase tracking-wider">{title}</div>
            </div>
        </div>
    );
}

function DateTimeCard() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const day = currentTime.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase();
    const date = currentTime.getDate();
    const month = currentTime.toLocaleDateString('fr-FR', { month: 'long' });
    const time = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="bg-[#4ecdc4] rounded-xl shadow-md overflow-hidden flex h-36">
            {/* Left Date Area */}
            <div className="w-1/3 flex flex-col items-center justify-center bg-black/10 text-white">
                <div className="text-sm font-medium opacity-80">{month}</div>
                <div className="text-4xl font-black">{date}</div>
            </div>
            {/* Right Time Area */}
            <div className="w-2/3 p-6 flex flex-col justify-center text-white">
                <div className="text-xs font-bold opacity-90 uppercase tracking-widest">{day}</div>
                <div className="text-4xl font-mono font-bold mt-1 tracking-tighter">{time}</div>
            </div>
        </div>
    );
}
