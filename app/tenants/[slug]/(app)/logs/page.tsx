"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    useGetDeviceEvents,
    useGetDevices,
    EVENT_TYPES,
} from "@/features/tenants/hooks/useDeviceManagement.hook";
import {
    Activity,
    Loader2,
    RefreshCw,
    Terminal,
    Search,
    CheckCircle2,
    XCircle,
    UserCheck,
    UserX,
    MonitorUp,
    AlertTriangle,
    Power,
    Wifi,
    WifiOff,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type DeviceEvent = {
    id: string;
    deviceId: string;
    deviceName: string | null;
    deviceLocation: string | null;
    type: string;
    severity: string;
    message: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
};

type Device = { id: string; name: string | null };

const TYPE_LABELS: Record<string, string> = {
    CHECK_IN: "Check-in",
    CHECKOUT: "Check-out",
    ERROR: "Erreur",
    SCREEN_CHANGE: "Changement d'écran",
    COMMAND_APPLIED: "Commande appliquée",
    COMMAND_FAILED: "Commande en échec",
    REBOOT: "Redémarrage",
    ONLINE: "En ligne",
    OFFLINE: "Hors ligne",
};

const SEVERITY_STYLE: Record<string, { className: string }> = {
    info: { className: "bg-gray-100 text-gray-600" },
    warning: { className: "bg-amber-100 text-amber-700" },
    error: { className: "bg-red-100 text-red-700" },
};

function typeIcon(type: string) {
    switch (type) {
        case "CHECK_IN":
            return <UserCheck className="w-4 h-4" />;
        case "CHECKOUT":
            return <UserX className="w-4 h-4" />;
        case "EMERGENCY_MESSAGE":
        case "ERROR":
            return <AlertTriangle className="w-4 h-4" />;
        case "COMMAND_APPLIED":
            return <CheckCircle2 className="w-4 h-4" />;
        case "COMMAND_FAILED":
            return <XCircle className="w-4 h-4" />;
        case "SCREEN_CHANGE":
            return <MonitorUp className="w-4 h-4" />;
        case "REBOOT":
            return <Power className="w-4 h-4" />;
        case "ONLINE":
            return <Wifi className="w-4 h-4" />;
        case "OFFLINE":
            return <WifiOff className="w-4 h-4" />;
        default:
            return <Terminal className="w-4 h-4" />;
    }
}

export default function ActivityLogPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [deviceFilter, setDeviceFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const { data: devices } = useGetDevices(slug);
    const { data: events, isLoading, isRefetching, refetch } = useGetDeviceEvents(slug, {
        deviceId: deviceFilter === "all" ? null : deviceFilter,
        type: typeFilter === "all" ? null : typeFilter,
        limit: 100,
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Journal d&apos;activité</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Événements remontés par les dispositifs (check-in, check-out, commandes, erreurs).
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
                    {isRefetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Actualiser
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Dispositif</label>
                            <select
                                value={deviceFilter}
                                onChange={(e) => setDeviceFilter(e.target.value)}
                                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="all">Tous les dispositifs</option>
                                {(devices as Device[] | undefined)?.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name || "Sans nom"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-widest">Type d&apos;événement</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="all">Tous les types</option>
                                {EVENT_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {TYPE_LABELS[t] ?? t}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Events table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="w-5 h-5 text-teal-600" />
                        Événements des dispositifs
                    </CardTitle>
                    <CardDescription>
                        {isLoading ? "Chargement…" : `${(events as DeviceEvent[] | undefined)?.length ?? 0} entrée(s)`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : (events as DeviceEvent[] | undefined)?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                            <Search className="w-8 h-8 mb-2" />
                            <p className="text-sm">Aucun événement enregistré pour ce filtre.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                                        <th className="py-3 pr-4 font-semibold">Type</th>
                                        <th className="py-3 pr-4 font-semibold">Sévérité</th>
                                        <th className="py-3 pr-4 font-semibold">Dispositif</th>
                                        <th className="py-3 pr-4 font-semibold">Détails</th>
                                        <th className="py-3 font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(events as DeviceEvent[] | undefined)?.map((event) => {
                                        const severity = SEVERITY_STYLE[event.severity] ?? SEVERITY_STYLE.info;
                                        return (
                                            <tr key={event.id} className="border-b last:border-0 hover:bg-gray-50/70 transition-colors">
                                                <td className="py-3 pr-4">
                                                    <span className="flex items-center gap-2 font-medium text-gray-800">
                                                        <span className="text-gray-400">{typeIcon(event.type)}</span>
                                                        {TYPE_LABELS[event.type] ?? event.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${severity.className}`}>
                                                        {event.severity}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-4 text-gray-600">
                                                    {event.deviceName || "Sans nom"}
                                                    {event.deviceLocation ? ` — ${event.deviceLocation}` : ""}
                                                </td>
                                                <td className="py-3 pr-4 text-gray-500 max-w-[260px]">
                                                    {event.message ? (
                                                        <span>{event.message}</span>
                                                    ) : event.metadata ? (
                                                        <span className="block font-mono text-xs truncate">{JSON.stringify(event.metadata)}</span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-gray-600 whitespace-nowrap">
                                                    {event.createdAt ? format(new Date(event.createdAt), "d MMM 'à' HH:mm:ss", { locale: fr }) : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
