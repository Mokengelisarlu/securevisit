"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  UserCheck,
  Clock,
  UserX,
  Search,
  Building,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useTenant } from "@/lib/tenant-provider";
import { useDashboardStats } from "@/features/tenants/hooks/useGetTenantData";
import { DigitalClock } from "@/components/DigitalClock";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function TenantDashboard() {
  const { slug } = useTenant();
  const { data: stats, isLoading } = useDashboardStats(slug!);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
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

      tl.from(".dashboard-section", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
      }, "-=0.4");
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
          <div className="absolute inset-0 blur-xl bg-teal-400/20 animate-pulse rounded-full" />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Synchronisation</p>
          <p className="text-slate-300 text-[9px] font-bold uppercase tracking-widest">Calcul des métriques en temps réel</p>
        </div>
      </div>
    );
  }

  const filteredActivities = stats?.recentActivities?.filter((activity: any) => {
    const matchesSearch = activity.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.hostName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" ||
      (selectedStatus === "current" && activity.type === "CHECK_IN") ||
      (selectedStatus === "departed" && activity.type === "CHECK_OUT");
    return matchesSearch && matchesStatus;
  });

  const chartData = stats?.weeklyTrend || [];

  return (
    <div ref={containerRef} className="min-h-screen bg-transparent p-0">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="dashboard-header flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
            <p className="text-slate-500 font-medium mt-1">Suivi et analyses des visiteurs en temps réel</p>
          </div>
          <div className="flex items-center space-x-6">
            <DigitalClock />
            <div className="bg-teal-600 p-3 rounded-2xl shadow-lg shadow-teal-500/20">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Visiteurs Actuels"
            value={stats?.onSite || 0}
            icon={<Users className="w-6 h-6 text-teal-600" />}
            iconBg="bg-teal-50"
            trendIcon={<TrendingUp className="w-4 h-4 text-green-500" />}
            trendText="+12% depuis hier"
            trendColor="text-green-600"
          />
          <StatCard
            title="Total (Aujourd'hui)"
            value={stats?.arrivedToday || 0}
            icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
            iconBg="bg-emerald-50"
            trendIcon={<Calendar className="w-4 h-4 text-teal-500" />}
            trendText="Aujourd'hui"
            trendColor="text-teal-500"
          />
          <StatCard
            title="En Attente"
            value={0}
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            iconBg="bg-amber-50"
            trendIcon={<Clock className="w-4 h-4 text-amber-500" />}
            trendText="Moy. 5 min"
            trendColor="text-amber-600"
          />
          <StatCard
            title="Visiteurs Partis"
            value={stats?.departedToday || 0}
            icon={<UserX className="w-6 h-6 text-slate-600" />}
            iconBg="bg-slate-50"
            trendIcon={<TrendingUp className="w-4 h-4 text-green-500" />}
            trendText="+8% depuis hier"
            trendColor="text-green-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 dashboard-section bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Analyse du Flux</h2>
                <p className="text-sm text-slate-500 mt-1">Évolution des visites sur 7 jours</p>
              </div>
              <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-teal-600 mr-1" />
                Visites
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Visites"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Summary Card */}
          <div className="dashboard-section bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-8">Résumé d&apos;aujourd&apos;hui</h2>
            <div className="space-y-6">
              <SummaryRow label="Heure de Pointe" value="11:00 - 12:00" />
              <SummaryRow label="Durée Moyenne" value="2.5 heures" />
              <SummaryRow label="Lieu le plus Visité" value="Accueil Principal" />
              <SummaryRow label="Nouveaux Visiteurs" value={stats?.arrivedToday || 0} />

              <div className="pt-6 mt-6 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 relative overflow-hidden">
                  <TrendingUp className="w-5 h-5 text-teal-500 mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Smart Insights</p>
                  <p className="text-sm font-medium leading-relaxed text-slate-700">
                    &quot;Le flux de visiteurs est en hausse de 12% par rapport à hier.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Visitors Table */}
        <div className="dashboard-section bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">Dernières Visites</h2>
              <div className="flex items-center gap-4 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher des visiteurs..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-medium text-slate-700"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Tous les Statuts</option>
                  <option value="current">Présent</option>
                  <option value="departed">Parti</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Visiteur</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hôte d&apos;accueil</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Heure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredActivities && filteredActivities.length > 0 ? (
                  filteredActivities.map((activity: any) => (
                    <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                            {activity.visitorName?.charAt(0) || "V"}
                          </div>
                          <span className="text-sm font-bold text-slate-900">{activity.visitorName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-sm text-gray-600">{activity.hostName}</span>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${activity.type === "CHECK_IN"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-800"
                          }`}>
                          {activity.type === "CHECK_IN" ? "Présent" : "Parti"}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right font-medium text-gray-500 text-sm">
                        {activity.time ? new Date(activity.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center text-gray-400">
                      Aucun mouvement détecté
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, iconBg, trendIcon, trendText, trendColor }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 dashboard-section">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <div className="flex items-center mt-2">
            <span className="flex-shrink-0 mr-1">{trendIcon}</span>
            <span className={`text-sm ${trendColor}`}>{trendText}</span>
          </div>
        </div>
        <div className={`${iconBg} p-3 rounded-lg flex-shrink-0 ml-4`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-600 text-sm">{label}</span>
      <span className="font-bold text-slate-900 text-sm">{value}</span>
    </div>
  );
}
