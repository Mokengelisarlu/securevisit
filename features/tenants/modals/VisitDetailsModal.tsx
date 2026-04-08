"use client";

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
    X,
    Briefcase,
    Phone,
    LogIn,
    LogOut
} from "lucide-react";
import { Modal } from "@/components/ui/custom-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VisitDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    visit: any;
}

export function VisitDetailsModal({ isOpen, onClose, visit }: VisitDetailsModalProps) {
    if (!visit) return null;

    const statusConfig = {
        IN: { label: "Sur place", color: "bg-green-100 text-green-700 border-green-200" },
        OUT: { label: "Sorti", color: "bg-gray-100 text-gray-700 border-gray-200" },
        CANCELLED: { label: "Annulé", color: "bg-red-100 text-red-700 border-red-200" },
        SCHEDULED: { label: "Prévu", color: "bg-amber-100 text-amber-700 border-amber-200" },
    };

    const config = statusConfig[visit.status as keyof typeof statusConfig] || statusConfig.IN;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Détails de la visite: ${visit.visitNumber}`}>
            <div className="space-y-8 py-2 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin">
                {/* Header Stats */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center font-black text-teal-600">
                            {visit.visitor.firstName[0]}{visit.visitor.lastName[0]}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{visit.visitor.firstName} {visit.visitor.lastName}</h3>
                            <Badge className={`${config.color} px-2 py-0.5 text-[10px] uppercase font-black tracking-widest mt-0.5`}>
                                {config.label}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">N° Visite</p>
                        <p className="font-mono font-bold text-gray-700">{visit.visitNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visitor Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-4 h-4 text-teal-500" /> Profil Visiteur
                        </h4>
                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-bold text-gray-700">{visit.visitor.company || "Individuel"}</span>
                            </div>
                            {visit.visitor.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-bold text-gray-700">{visit.visitor.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Tag className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-bold text-gray-700">{visit.visitor.type?.name || "Standard"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Destination Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal-500" /> Destination
                        </h4>
                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Briefcase className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-bold text-gray-700">
                                    {visit.host ? `${visit.host.firstName} ${visit.host.lastName}` : "Non assigné"}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-bold text-gray-700">
                                    {visit.department?.name || visit.service?.name || "Bureau principal"}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 border-t pt-3 mt-1">
                                <Shield className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-bold text-gray-700 italic">"{visit.purpose}"</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-500" /> Historique
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-teal-100 flex items-center justify-center">
                                <LogIn className="w-5 h-5 text-teal-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-teal-400 uppercase">Check-in</p>
                                <p className="text-sm font-black text-blue-900">
                                    {visit.checkInAt ? format(new Date(visit.checkInAt), "Pp", { locale: fr }) : "À venir"}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                                <LogOut className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Check-out</p>
                                <p className="text-sm font-black text-gray-700">
                                    {visit.checkOutAt ? format(new Date(visit.checkOutAt), "Pp", { locale: fr }) : "--:--"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compliance & Signature */}
                {visit.signatureData && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FileSignature className="w-4 h-4 text-teal-500" /> Conformité & Signature
                            </h4>
                            {visit.policyAcceptedAt && (
                                <p className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 border border-green-100">
                                    <Shield className="w-3 h-3" />
                                    Accepté le {format(new Date(visit.policyAcceptedAt), "Pp", { locale: fr })}
                                </p>
                            )}
                        </div>
                        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center">
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 w-full max-w-[400px]">
                                <img
                                    src={visit.signatureData}
                                    alt="Signature du visiteur"
                                    className="w-full h-auto max-h-[150px] object-contain mix-blend-multiply"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-tighter">
                                Document signé numériquement au check-in par {visit.visitor.firstName} {visit.visitor.lastName}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button onClick={onClose} className="bg-gray-900 hover:bg-black text-white px-8 rounded-xl font-bold h-11">
                        Fermer
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
