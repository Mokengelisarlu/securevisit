"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    User,
    Building2,
    Calendar,
    ArrowLeft,
    Phone,
    Tag,
    Clock,
    MapPin,
    Loader2,
    CalendarCheck2,
    Search,
    Filter
} from "lucide-react";
import { useGetVisitorById, useGetVisits } from "@/features/tenants/hooks/useGetTenantData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import Link from "next/link";

export default function VisitorDetailsPage() {
    const { slug, id } = useParams() as { slug: string; id: string };
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: visitor, isLoading: isVisitorLoading } = useGetVisitorById(slug, id);
    const { data: visits, isLoading: isVisitsLoading } = useGetVisits(slug, { visitorId: id });

    const filteredVisits = useMemo(() => {
        if (!visits) return [];
        return visits.filter((v: any) =>
            (v.host?.fullName && v.host.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.purpose && v.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.department?.name && v.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [visits, searchQuery]);

    if (isVisitorLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-gray-500 font-medium">Chargement du profil visiteur...</p>
            </div>
        );
    }

    if (!visitor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h3 className="text-xl font-bold text-gray-900">Visiteur non trouvé</h3>
                <Button onClick={() => router.back()}>Retour</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 py-6 max-w-6xl mx-auto">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fiche Visiteur</h1>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest">
                                ID: {visitor.id.split('-')[0]}
                            </Badge>
                        </div>
                        <p className="text-gray-500 font-medium mt-1 italic">Dernière activité le {visits?.[0] ? format(new Date(visits[0].checkInAt || visits[0].createdAt), "d MMMM yyyy", { locale: fr }) : "Aucune"}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Profile Sidebar (1 Column) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl border border-gray-100">
                        <CardHeader className="bg-slate-50 pb-16 relative overflow-hidden">
                            {/* Blurred photo background effect */}
                            {(visitor.photoUrl || visits?.[0]?.visitorPhotoUrl) && (
                                <div
                                    className="absolute inset-0 opacity-10 blur-2xl scale-150"
                                    style={{
                                        backgroundImage: `url(/api/tenants/${slug}/photos?url=${encodeURIComponent(visitor.photoUrl || visits![0].visitorPhotoUrl)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                />
                            )}
                            <div className="relative z-10 w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center text-3xl font-black text-gray-300 border-4 border-white shadow-xl overflow-hidden mt-4">
                                {visitor.photoUrl || visits?.[0]?.visitorPhotoUrl ? (
                                    <img
                                        src={`/api/tenants/${slug}/photos?url=${encodeURIComponent(visitor.photoUrl || visits![0].visitorPhotoUrl)}`}
                                        alt={`${visitor.firstName} ${visitor.lastName}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-gray-200" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="-mt-8 space-y-6 pt-0">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl text-center">
                                <h2 className="text-xl font-black text-gray-900 leading-tight">{visitor.firstName} {visitor.lastName}</h2>
                                <p className="text-gray-500 font-bold flex items-center justify-center gap-2 mt-2">
                                    <Building2 className="w-4 h-4 text-blue-400" /> {visitor.company || "Individuel"}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Contact & Type</p>
                                <div className="bg-gray-50/50 p-4 rounded-2xl space-y-4 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                                            <Phone className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase">Téléphone</p>
                                            <p className="text-xs font-bold text-gray-700">{visitor.phone || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                                            <Tag className="w-4 h-4 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase">Type</p>
                                            <p className="text-xs font-bold text-gray-700">{visitor.type?.name || "Standard"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                                            <Calendar className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase">Inscrit le</p>
                                            <p className="text-xs font-bold text-gray-700">{format(new Date(visitor.createdAt), "dd/MM/yyyy")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="p-4 bg-gray-950 rounded-2xl text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total des visites</p>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <CalendarCheck2 className="w-4 h-4 text-blue-500" />
                                        <span className="text-2xl font-black text-white">{visits?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* History (3 Columns) */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl border border-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" /> Historique des Visites
                            </CardTitle>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Rechercher une visite..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 border-gray-200 focus:ring-blue-500 rounded-xl bg-white"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isVisitsLoading ? (
                                <div className="p-20 flex justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                                </div>
                            ) : filteredVisits.length > 0 ? (
                                <Table>
                                    <TableHeader className="bg-gray-50/30">
                                        <TableRow className="border-b border-gray-100">
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-gray-400">Date & Heure</TableHead>
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-gray-400">Hôte / Service</TableHead>
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-gray-400">Motif</TableHead>
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-gray-400">Statut</TableHead>
                                            <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase text-gray-400">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredVisits.map((visit: any) => (
                                            <TableRow key={visit.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                                                <TableCell className="py-4 px-6">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {(visit.checkInAt || visit.createdAt) ? format(new Date(visit.checkInAt || visit.createdAt), "dd MMM yyyy", { locale: fr }) : "N/A"}
                                                        </p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                                                            <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                                                            {(visit.checkInAt || visit.createdAt) ? format(new Date(visit.checkInAt || visit.createdAt), "HH:mm") : "--:--"}
                                                            {visit.checkOutAt && ` → ${format(new Date(visit.checkOutAt), "HH:mm")}`}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5 text-amber-400" /> {visit.host?.fullName || "Non assigné"}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-2 tracking-tighter">
                                                            <Tag className="w-3 h-3" /> {visit.department?.name || visit.service?.name || "Bureau principal"}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 max-w-[200px]">
                                                    <p className="text-xs font-medium text-gray-600 italic line-clamp-2 leading-relaxed">
                                                        "{visit.purpose}"
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge
                                                        variant="outline"
                                                        className={`
                                                            ${visit.status === "IN" ? "bg-green-50 text-green-700 border-green-100" : ""}
                                                            ${visit.status === "OUT" ? "bg-gray-50 text-gray-600 border-gray-200" : ""}
                                                            ${visit.status === "SCHEDULED" ? "bg-amber-50 text-amber-700 border-amber-100" : ""}
                                                            px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter
                                                        `}
                                                    >
                                                        {visit.status === "IN" ? "Sur place" : visit.status === "OUT" ? "Sorti" : "Prévu"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <Link href={`/visiteurs/list/${visit.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50">
                                                            Détails
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed">
                                        <Filter className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Aucune visite enregistrée</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
