"use client";

import { useState, useMemo } from "react";
import {
    Search,
    Clock,
    MapPin,
    LogOut,
    Filter,
    Calendar as CalendarIcon,
    ChevronDown,
    User,
    Building2,
    Tag,
    Loader2,
    UserPlus,
    CalendarCheck2,
    Car,
    Footprints
} from "lucide-react";
import { format, startOfToday, endOfToday, startOfYesterday, endOfYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { useTenant } from "@/lib/tenant-provider";
import { useGetVisits } from "../hooks/useGetTenantData";
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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { VisitFormModal } from "../forms/VisitFormModal";
import { CheckoutVisitModal } from "../forms/CheckoutVisitModal";
import { PreRegisterFormModal } from "../forms/PreRegisterFormModal";
import { useCheckInScheduledVisit } from "../hooks/useScheduledVisits.hook";
import { toast } from "sonner";
import { VisitDetailsModal } from "../modals/VisitDetailsModal";
import { Eye } from "lucide-react";

type TabType = "today" | "on-site" | "exited" | "scheduled";

export function TabbedVisitsList() {
    const { slug: tenantSlug } = useTenant();
    const [activeTab, setActiveTab] = useState<TabType>("today");
    const [dateFilter, setDateFilter] = useState("today");
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isPreRegisterModalOpen, setIsPreRegisterModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedVisitForDetails, setSelectedVisitForDetails] = useState<any>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const checkInVisit = useCheckInScheduledVisit(tenantSlug!);

    // Advanced Date Range state (custom)
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const filters = useMemo(() => {
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        switch (dateFilter) {
            case "today":
                startDate = startOfToday();
                endDate = endOfToday();
                break;
            case "yesterday":
                startDate = startOfYesterday();
                endDate = endOfYesterday();
                break;
            case "this-week":
                startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
                endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
                break;
            case "this-month":
                startDate = startOfMonth(new Date());
                endDate = endOfMonth(new Date());
                break;
            case "custom":
                if (customStartDate) startDate = new Date(customStartDate);
                if (customEndDate) endDate = new Date(customEndDate);
                break;
        }

        let status: "IN" | "OUT" | "SCHEDULED" | undefined;
        if (activeTab === "on-site") status = "IN";
        if (activeTab === "exited") status = "OUT";
        if (activeTab === "scheduled") status = "SCHEDULED";

        return { startDate, endDate, status };
    }, [activeTab, dateFilter, customStartDate, customEndDate]);

    const { data: visits, isLoading } = useGetVisits(tenantSlug!, filters);

    const filteredVisits = useMemo(() => {
        if (!visits) return [];
        return visits.filter((v: any) =>
            `${v.visitor.firstName} ${v.visitor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.visitor.company && v.visitor.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.purpose && v.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [visits, searchQuery]);

    const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
    const paginatedVisits = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredVisits.slice(start, start + itemsPerPage);
    }, [filteredVisits, currentPage]);

    // Reset pagination when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, dateFilter, activeTab]);

    return (
        <div className="space-y-6">
            {/* Row 1: Action Buttons Group */}
            <div className="flex flex-wrap gap-3 items-center justify-end">
                <Button
                    onClick={() => setIsCheckoutModalOpen(true)}
                    variant="outline"
                    className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 font-black uppercase tracking-widest text-xs px-6 h-12 rounded-2xl shadow-sm transition-all hover:scale-[1.02] flex items-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Enregistrer une Sortie
                </Button>

                <Button
                    onClick={() => setIsPreRegisterModalOpen(true)}
                    variant="outline"
                    className="flex-1 md:flex-none border-blue-200 text-blue-600 hover:bg-blue-50 font-black uppercase tracking-widest text-xs px-6 h-12 rounded-2xl shadow-sm transition-all hover:scale-[1.02] flex items-center gap-2"
                >
                    <CalendarCheck2 className="w-4 h-4" />
                    Pré-enregistrer
                </Button>

                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-6 h-12 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Nouvelle Visite
                </Button>
            </div>

            {/* Row 2: Full-width Tabs */}
            <div className="bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50 w-full overflow-x-auto">
                <div className="flex w-full min-w-max md:min-w-0">
                    <button
                        onClick={() => setActiveTab("today")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "today"
                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                            : "text-gray-500 hover:bg-white/50"
                            }`}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        Journal du jour
                    </button>
                    <button
                        onClick={() => setActiveTab("on-site")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "on-site"
                            ? "bg-white text-green-600 shadow-sm border border-gray-100"
                            : "text-gray-500 hover:bg-white/50"
                            }`}
                    >
                        <MapPin className="w-4 h-4" />
                        Sur place
                    </button>
                    <button
                        onClick={() => setActiveTab("exited")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "exited"
                            ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                            : "text-gray-500 hover:bg-white/50"
                            }`}
                    >
                        <LogOut className="w-4 h-4" />
                        Sorties terminées
                    </button>
                    <button
                        onClick={() => setActiveTab("scheduled")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "scheduled"
                            ? "bg-white text-amber-600 shadow-sm border border-gray-100"
                            : "text-gray-500 hover:bg-white/50"
                            }`}
                    >
                        <CalendarCheck2 className="w-4 h-4" />
                        Visites prévues
                    </button>
                </div>
            </div>

            <VisitFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            <CheckoutVisitModal
                isOpen={isCheckoutModalOpen}
                onClose={() => setIsCheckoutModalOpen(false)}
            />

            <PreRegisterFormModal
                isOpen={isPreRegisterModalOpen}
                onClose={() => setIsPreRegisterModalOpen(false)}
            />

            <VisitDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedVisitForDetails(null);
                }}
                visit={selectedVisitForDetails}
            />

            {/* Row 3: Filters Bar (Prominent Search) */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Rechercher par nom, entreprise ou motif de visite..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 pl-12 bg-white border-gray-200 focus:ring-blue-500 rounded-2xl shadow-sm text-base font-medium placeholder:text-gray-400"
                    />
                </div>

                <div className="w-full md:w-64">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="h-14 bg-white border-gray-200 rounded-2xl shadow-sm px-6 font-bold text-gray-700">
                            <div className="flex items-center gap-3">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <SelectValue placeholder="Choisir une période" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-xl font-bold">
                            <SelectItem value="today">Aujourd'hui</SelectItem>
                            <SelectItem value="yesterday">Hier</SelectItem>
                            <SelectItem value="this-week">Cette semaine</SelectItem>
                            <SelectItem value="this-month">Ce mois-ci</SelectItem>
                            <SelectItem value="custom">Plage personnalisée</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {dateFilter === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Date & Heure de début</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                            <Input
                                type="datetime-local"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="h-12 pl-12 bg-white border-blue-100 rounded-xl font-bold text-blue-900"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Date & Heure de fin</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                            <Input
                                type="datetime-local"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="h-12 pl-12 bg-white border-blue-100 rounded-xl font-bold text-blue-900"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <p className="text-gray-500 font-medium">Chargement des visites...</p>
                    </div>
                ) : filteredVisits.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Visiteur</TableHead>
                                <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Destination</TableHead>
                                <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Arrivée / Prévu</TableHead>
                                <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Sortie</TableHead>
                                <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500">Statut</TableHead>
                                <TableHead className="py-4 px-6 text-xs font-bold uppercase text-gray-500 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedVisits.map((visit: any) => (
                                <TableRow key={visit.id} className="hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100 font-bold shrink-0">
                                                {visit.visitor.firstName[0]}{visit.visitor.lastName[0]}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-gray-900 truncate">
                                                    {visit.visitor.firstName} {visit.visitor.lastName}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
                                                        <Building2 className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{visit.visitor.company || "Individuel"}</span>
                                                    </div>
                                                    {visit.vehicleId ? (
                                                        <Link href={`/visiteurs/vehicles/${visit.vehicleId}`}>
                                                            <Badge variant="outline" className="h-5 px-1.5 border-gray-800 bg-gray-900 text-white flex items-center gap-1 shrink-0 cursor-pointer hover:bg-gray-800 transition-colors">
                                                                <Car className="w-3 h-3" />
                                                                <span className="text-[9px] font-bold uppercase font-mono tracking-tighter">{visit.vehicle?.plateNumber}</span>
                                                            </Badge>
                                                        </Link>
                                                    ) : visit.visitType === "WALK_IN" ? (
                                                        <Badge variant="outline" className="h-5 px-1.5 border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center gap-1 shrink-0">
                                                            <Footprints className="w-3 h-3" />
                                                            <span className="text-[9px] font-bold uppercase">Walk-in</span>
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                {visit.host ? `${visit.host.firstName} ${visit.host.lastName}` : "Non assigné"}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Tag className="w-3.5 h-3.5 text-gray-400" />
                                                {visit.department?.name || visit.service?.name || "Bureau principal"}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-gray-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Clock className={`w-3.5 h-3.5 ${visit.status === "SCHEDULED" ? "text-amber-400" : "text-blue-400"}`} />
                                            {visit.status === "SCHEDULED" ? (
                                                <span>{new Date(visit.visitDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            ) : visit.checkInAt ? (
                                                <span>{new Date(visit.checkInAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            ) : (
                                                <span className="text-gray-300">--:--</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-400 ml-5">
                                            {visit.status === "SCHEDULED"
                                                ? new Date(visit.visitDate).toLocaleDateString()
                                                : visit.checkInAt
                                                    ? new Date(visit.checkInAt).toLocaleDateString()
                                                    : "--/--/----"
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-gray-600 font-medium font-mono">
                                        {visit.checkOutAt ? (
                                            <div className="flex items-center gap-2">
                                                <LogOut className="w-3.5 h-3.5 text-red-400" />
                                                {new Date(visit.checkOutAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">--:--</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-4 px-6">
                                        <Badge
                                            className={`
                        ${visit.status === "IN" ? "bg-green-100 text-green-700 border-green-200" : ""}
                        ${visit.status === "OUT" ? "bg-gray-100 text-gray-700 border-gray-200" : ""}
                        ${visit.status === "CANCELLED" ? "bg-red-100 text-red-700 border-red-200" : ""}
                        ${visit.status === "SCHEDULED" ? "bg-amber-100 text-amber-700 border-amber-200" : ""}
                        px-3 py-1 font-bold text-[10px] uppercase tracking-wider
                      `}
                                            variant="outline"
                                        >
                                            {visit.status === "IN" ? "Sur place" : visit.status === "OUT" ? "Sorti" : visit.status === "CANCELLED" ? "Annulé" : "Prévu"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/visiteurs/list/${visit.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-lg border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            {visit.status === "SCHEDULED" && (
                                                <Button
                                                    size="sm"
                                                    onClick={async () => {
                                                        try {
                                                            await checkInVisit.mutateAsync(visit.id);
                                                            toast.success("Visiteur enregistré (Check-in) !");
                                                        } catch (err: any) {
                                                            toast.error(err.message || "Erreur lors du check-in");
                                                        }
                                                    }}
                                                    disabled={checkInVisit.isPending}
                                                    className="bg-green-600 hover:bg-green-700 h-8 text-[11px] font-bold"
                                                >
                                                    {checkInVisit.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CalendarCheck2 className="w-3 h-3 mr-1" />}
                                                    Arrivée
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Filter className="w-8 h-8 text-gray-200" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Aucune visite trouvée</h3>
                        <p className="text-gray-500 max-w-sm mt-1">
                            Ajustez vos filtres ou effectuez une recherche pour trouver des visites spécifiques.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm gap-4">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                        Page <span className="text-blue-600 font-black">{currentPage}</span> sur <span className="text-gray-900">{totalPages}</span>
                        <span className="mx-2 text-gray-200">|</span>
                        <span className="text-gray-500 font-bold normal-case">{filteredVisits.length} résultats</span>
                    </p>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex-1 md:flex-none h-11 px-8 rounded-xl border-gray-100 shadow-sm font-black uppercase tracking-widest text-[10px] transition-all hover:bg-gray-50 disabled:opacity-30"
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="flex-1 md:flex-none h-11 px-8 rounded-xl border-gray-100 shadow-sm font-black uppercase tracking-widest text-[10px] transition-all hover:bg-gray-50 disabled:opacity-30"
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
