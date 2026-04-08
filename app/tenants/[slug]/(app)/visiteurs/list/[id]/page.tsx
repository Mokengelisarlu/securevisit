"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    User,
    Building2,
    Calendar,
    Clock,
    MapPin,
    Tag,
    Shield,
    FileSignature,
    ArrowLeft,
    Briefcase,
    Phone,
    LogIn,
    LogOut,
    Car,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserCircle,
    ZoomIn
} from "lucide-react";
import { useGetVisitById } from "@/features/tenants/hooks/useGetTenantData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { ImageModal } from "@/features/tenants/components/ImageModal";
import { cn } from "@/lib/utils";

export default function VisitDetailsPage() {
    const { slug, id } = useParams() as { slug: string; id: string };
    const router = useRouter();
    const { data: visit, isLoading } = useGetVisitById(slug, id);

    // Image Modal State
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

    const handleOpenImage = (url: string, title: string) => {
        setSelectedImage({ url, title });
        setIsImageModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
                <p className="text-gray-500 font-medium">Chargement des détails de la visite...</p>
            </div>
        );
    }

    if (!visit) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h3 className="text-xl font-bold text-gray-900">Visite non trouvée</h3>
                <Button onClick={() => router.back()}>Retour</Button>
            </div>
        );
    }

    const statusConfig = {
        IN: { label: "Sur place", color: "bg-green-100 text-green-700 border-green-200" },
        OUT: { label: "Sorti", color: "bg-gray-100 text-gray-700 border-gray-200" },
        CANCELLED: { label: "Annulé", color: "bg-red-100 text-red-700 border-red-200" },
        SCHEDULED: { label: "Prévu", color: "bg-amber-100 text-amber-700 border-amber-200" },
    };

    const config = statusConfig[visit.status as keyof typeof statusConfig] || statusConfig.IN;

    return (
        <div className="space-y-8 py-6 max-w-5xl mx-auto">
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
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Détails de la Visite</h1>
                            <Badge className={`${config.color} px-3 py-1 text-xs uppercase font-black tracking-widest`}>
                                {config.label}
                            </Badge>
                        </div>
                        <p className="text-gray-500 font-medium mt-1">Référence: <span className="font-mono text-teal-600 font-bold">{visit.visitNumber}</span></p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (Left 2 Columns) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Visitor Card */}
                    <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-4 h-4 text-teal-500" /> Profil Visiteur
                                </CardTitle>
                                <Link href={`/visiteurs/registered/${visit.visitorId}`}>
                                    <Button variant="outline" size="sm" className="rounded-full text-xs font-bold border-teal-100 text-teal-600 hover:bg-teal-50">
                                        Voir Profil Complet
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div
                                    onClick={() => visit.visitorPhotoUrl && handleOpenImage(`/api/tenants/${slug}/photos?url=${encodeURIComponent(visit.visitorPhotoUrl)}`, `${visit.visitor.firstName} ${visit.visitor.lastName}`)}
                                    className={cn(
                                        "w-24 h-24 rounded-3xl flex items-center justify-center text-3xl font-black shadow-inner shrink-0 relative overflow-hidden group transition-all",
                                        visit.visitorPhotoUrl ? "cursor-zoom-in hover:ring-4 hover:ring-teal-100" : "bg-teal-50 text-teal-600 border-2 border-teal-100"
                                    )}
                                >
                                    {visit.visitorPhotoUrl ? (
                                        <>
                                            <img
                                                src={`/api/tenants/${slug}/photos?url=${encodeURIComponent(visit.visitorPhotoUrl)}`}
                                                alt="Photo visiteur"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <ZoomIn className="w-8 h-8 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        `${visit.visitor.firstName[0]}${visit.visitor.lastName[0]}`
                                    )}
                                </div>
                                <div className="flex-1 space-y-6 w-full">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">{visit.visitor.firstName} {visit.visitor.lastName}</h2>
                                        <p className="text-gray-500 font-bold flex items-center gap-2 mt-1">
                                            <Building2 className="w-4 h-4" /> {visit.visitor.company || "Individuel"}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphone</p>
                                            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-teal-400" /> {visit.visitor.phone || "Non renseigné"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type Visiteur</p>
                                            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                <Tag className="w-3.5 h-3.5 text-teal-400" /> {visit.visitor.type?.name || "Standard"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visit Context */}
                    <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-6">
                            <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-4 h-4 text-teal-500" /> Contexte & Destination
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hôte (Employé)</p>
                                            <p className="text-base font-bold text-gray-900">{visit.host?.fullName || "Non assigné"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Département / Service</p>
                                            <p className="text-base font-bold text-gray-900">
                                                {visit.department?.name || visit.service?.name || "Bureau principal"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-teal-50/30 rounded-3xl border border-teal-50 space-y-2">
                                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Motif de la visite</p>
                                    <p className="text-lg font-bold text-blue-900 italic">"{visit.purpose}"</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compliance & Signature */}
                    {visit.signatureData && (
                        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileSignature className="w-4 h-4 text-teal-500" /> Conformité & Signature
                                    </CardTitle>
                                    {visit.policyAcceptedAt && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 flex items-center gap-2 px-3 py-1.5 font-bold text-[10px]">
                                            <Shield className="w-3.5 h-3.5" /> ACCEPTÉ LE {visit.policyAcceptedAt ? format(new Date(visit.policyAcceptedAt), "Pp", { locale: fr }) : "N/A"}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-8">
                                <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 w-full max-w-[500px]">
                                        <img
                                            src={visit.signatureData}
                                            alt="Signature du visiteur"
                                            className="w-full h-auto max-h-[200px] object-contain mix-blend-multiply transition-transform hover:scale-105 duration-300"
                                        />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 mt-6 uppercase tracking-widest text-center">
                                        Document signé numériquement au check-in <br /> le {visit.checkInAt || visit.createdAt ? format(new Date(visit.checkInAt || visit.createdAt), "Pp", { locale: fr }) : "N/A"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar (Right 1 Column) */}
                <div className="space-y-8">
                    {/* Time Tracking */}
                    <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl border border-gray-100">
                        <CardHeader className="bg-teal-600 pb-8">
                            <CardTitle className="text-sm font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Suivi Temporel
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="-mt-4 space-y-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 border border-green-100">
                                    <LogIn className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entrée (Check-in)</p>
                                    <p className="text-sm font-black text-gray-900">
                                        {visit.checkInAt ? format(new Date(visit.checkInAt), "Pp", { locale: fr }) : "À venir"}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 border border-red-100">
                                    <LogOut className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sortie (Check-out)</p>
                                    <p className="text-sm font-black text-gray-900">
                                        {visit.checkOutAt ? format(new Date(visit.checkOutAt), "Pp", { locale: fr }) : "--:--"}
                                    </p>
                                </div>
                            </div>
                            {visit.checkInAt && visit.checkOutAt && (
                                <div className="p-4 bg-gray-900 rounded-2xl text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Durée de la visite</p>
                                    <p className="text-xl font-black text-white mt-1">
                                        {Math.floor((new Date(visit.checkOutAt).getTime() - new Date(visit.checkInAt).getTime()) / 1000 / 60)} min
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Vehicle Info */}
                    {visit.vehicleId && visit.vehicle && (
                        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl border border-gray-100">
                            <CardHeader className="bg-gray-900 pb-8">
                                <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Car className="w-4 h-4 text-teal-500" /> Véhicule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="-mt-4 space-y-4">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg text-center space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-teal-500" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plaque d'immatriculation</p>
                                        <p className="text-3xl font-black text-gray-900 tracking-tighter uppercase font-mono">{visit.vehicle.plateNumber}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</p>
                                            <p className="text-xs font-bold text-gray-700">{visit.vehicle.type}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Passagers</p>
                                            <p className="text-xs font-bold text-gray-700">{visit.passengerCount || 0}</p>
                                        </div>
                                    </div>
                                    {(visit.vehicle.brand || visit.vehicle.color) && (
                                        <div className="pt-2 border-t border-gray-100 flex justify-center gap-4">
                                            {visit.vehicle.brand && (
                                                <Badge variant="outline" className="px-3 py-1 font-bold text-[10px] uppercase">{visit.vehicle.brand}</Badge>
                                            )}
                                            {visit.vehicle.color && (
                                                <Badge variant="outline" className="px-3 py-1 font-bold text-[10px] uppercase border-gray-200">{visit.vehicle.color}</Badge>
                                            )}
                                        </div>
                                    )}

                                    {/* Vehicle Photo (Conditional) */}
                                    {visit.vehiclePhotoUrl && (
                                        <div className="pt-4 mt-2">
                                            <div className="aspect-video rounded-2xl overflow-hidden border-2 border-white shadow-md ring-1 ring-gray-100">
                                                <img
                                                    src={`/api/tenants/${slug}/photos?url=${encodeURIComponent(visit.vehiclePhotoUrl)}`}
                                                    alt="Photo véhicule"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}

                                </div>
                                <Link href={`/visiteurs/vehicles/${visit.vehicleId}`} className="block">
                                    <Button variant="outline" className="w-full rounded-2xl font-black text-xs uppercase tracking-widest h-12 border-gray-100 hover:bg-gray-50">
                                        Historique du Véhicule
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
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
