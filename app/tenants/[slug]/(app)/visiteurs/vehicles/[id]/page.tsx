"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    User,
    Calendar,
    ArrowLeft,
    Car,
    Truck,
    Bike,
    Clock,
    MapPin,
    Loader2,
    CalendarCheck2,
    Search,
    Filter,
    Settings2,
    Tag,
    Building2,
    ZoomIn
} from "lucide-react";
import { useGetVehicleById, useGetVisits } from "@/features/tenants/hooks/useGetTenantData";
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
import { cn } from "@/lib/utils";
import { ImageModal } from "@/features/tenants/components/ImageModal";

export default function VehicleDetailsPage() {
    const { slug, id } = useParams() as { slug: string; id: string };
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: vehicle, isLoading: isVehicleLoading } = useGetVehicleById(slug, id);
    const { data: visits, isLoading: isVisitsLoading } = useGetVisits(slug, { vehicleId: id });

    // Image Modal State
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

    const handleOpenImage = (url: string, title: string) => {
        setSelectedImage({ url, title });
        setIsImageModalOpen(true);
    };

    const vehiclePhoto = vehicle?.photoUrl || (visits && visits.length > 0 ? (visits[0] as any).vehiclePhotoUrl : null);

    const filteredVisits = useMemo(() => {
        if (!visits) return [];
        return visits.filter((v: any) =>
            (`${v.visitor?.firstName} ${v.visitor?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.visitor?.company && v.visitor.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.purpose && v.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [visits, searchQuery]);

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case "TRUCK": return <Truck className="w-6 h-6" />;
            case "MOTORCYCLE": return <Bike className="w-6 h-6" />;
            default: return <Car className="w-6 h-6" />;
        }
    };

    if (isVehicleLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                <p className="text-gray-500 font-medium">Chargement des détails du véhicule...</p>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h3 className="text-xl font-bold text-gray-900">Véhicule non trouvé</h3>
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
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fiche Véhicule</h1>
                            <Badge variant="outline" className="bg-gray-900 text-white border-gray-800 px-3 py-1 text-xs font-mono font-black tracking-widest uppercase">
                                {vehicle.plateNumber}
                            </Badge>
                        </div>
                        <p className="text-gray-500 font-medium mt-1 italic">Dernière apparition le {vehicle.createdAt ? format(new Date(vehicle.createdAt), "d MMMM yyyy", { locale: fr }) : "Inconnue"}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Vehicle Sidebar (1 Column) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl border border-gray-100">
                        <CardHeader
                            className={cn(
                                "pb-12 relative overflow-hidden transition-all duration-500",
                                vehiclePhoto ? "h-48 cursor-zoom-in group" : "bg-gray-950"
                            )}
                            onClick={() => vehiclePhoto && handleOpenImage(`/api/tenants/${slug}/photos?url=${encodeURIComponent(vehiclePhoto)}`, `Véhicule: ${vehicle.plateNumber}`)}
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 z-10" />
                            {vehiclePhoto ? (
                                <>
                                    <img
                                        src={`/api/tenants/${slug}/photos?url=${encodeURIComponent(vehiclePhoto)}`}
                                        alt={vehicle.plateNumber}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <ZoomIn className="w-10 h-10 text-white" />
                                    </div>
                                </>
                            ) : (
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center text-teal-400 border border-white/10 shadow-2xl overflow-hidden">
                                    {getVehicleIcon(vehicle.type)}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="-mt-10 space-y-6 pt-0">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl text-center space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type de véhicule</p>
                                <h2 className="text-xl font-black text-gray-900 leading-tight tracking-tight uppercase">{vehicle.type}</h2>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Spécifications</p>
                                <div className="bg-gray-50/50 p-4 rounded-2xl space-y-4 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                                            <Settings2 className="w-4 h-4 text-teal-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase">Marque</p>
                                            <p className="text-xs font-bold text-gray-700">{vehicle.brand || "Non renseignée"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                                            <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: vehicle.color || 'transparent' }} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase">Couleur</p>
                                            <p className="text-xs font-bold text-gray-700 uppercase">{vehicle.color || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                                            <Calendar className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase">Première entrée</p>
                                            <p className="text-xs font-bold text-gray-700">{format(new Date(vehicle.createdAt), "dd/MM/yyyy")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="p-4 bg-teal-600 rounded-2xl text-center shadow-lg shadow-teal-200">
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Total des accès</p>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <CalendarCheck2 className="w-4 h-4 text-white/80" />
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
                                <Clock className="w-5 h-5 text-teal-500" /> Historique des Passages
                            </CardTitle>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Rechercher par conducteur..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 border-gray-200 focus:ring-teal-500 rounded-xl bg-white"
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
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-gray-400">Conducteur (Visiteur)</TableHead>
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-gray-400">Passagers</TableHead>
                                            <TableHead className="py-4 px-6 text-[10px] font-black uppercase text-gray-400">Motif & Hôte</TableHead>
                                            <TableHead className="py-4 px-6 text-right text-[10px] font-black uppercase text-gray-400">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredVisits.map((visit: any) => (
                                            <TableRow key={visit.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                                                <TableCell className="py-4 px-6">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-gray-900">{format(new Date(visit.checkInAt || visit.createdAt), "dd MMM yyyy", { locale: fr })}</p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                                                            <Clock className="w-3 h-3 text-teal-400 shrink-0" />
                                                            {format(new Date(visit.checkInAt || visit.createdAt), "HH:mm")}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Link href={`/visiteurs/registered/${visit.visitorId}`} className="flex items-center gap-3 group">
                                                        <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 font-bold text-xs ring-1 ring-teal-100 group-hover:bg-teal-100 transition-colors">
                                                            {visit.visitor?.firstName[0]}{visit.visitor?.lastName[0]}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-teal-600 transition-colors">{visit.visitor?.firstName} {visit.visitor?.lastName}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                                                <Building2 className="w-2.5 h-2.5" /> {visit.visitor?.company || "Individuel"}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Badge variant="outline" className="bg-gray-50 border-gray-100 text-gray-700 font-black px-2 py-0.5 text-[10px]">
                                                        {visit.passengerCount || 0} PERS.
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-gray-600 italic line-clamp-1 truncate">
                                                            "{visit.purpose}"
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                                                            <User className="w-3 h-3 text-amber-400" /> {visit.host?.fullName || "Non assigné"}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <Link href={`/visiteurs/list/${visit.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-teal-600 hover:bg-teal-50">
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
                                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Aucun historique trouvé</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ImageModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                imageUrl={selectedImage?.url || ""}
                title={selectedImage?.title}
            />
        </div>
    );
}
