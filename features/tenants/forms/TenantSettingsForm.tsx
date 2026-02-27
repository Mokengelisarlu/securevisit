"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Camera, Loader2, Save, Shield } from "lucide-react";
import { updateSettings } from "../queries/tenant-data";

interface TenantSettingsFormProps {
    tenantSlug: string;
    initialData: {
        ndaPolicyText: string | null;
        requireSignature: number | null;
        requireVisitorPhoto: number | null;
        requireVehiclePhoto: number | null;
    };
}

export function TenantSettingsForm({ tenantSlug, initialData }: TenantSettingsFormProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [ndaPolicyText, setNdaPolicyText] = useState(initialData.ndaPolicyText || "");
    const [requireSignature, setRequireSignature] = useState(initialData.requireSignature !== 0);
    const [requireVisitorPhoto, setRequireVisitorPhoto] = useState(initialData.requireVisitorPhoto !== 0);
    const [requireVehiclePhoto, setRequireVehiclePhoto] = useState(initialData.requireVehiclePhoto !== 0);

    async function handleSave() {
        setIsPending(true);
        try {
            await updateSettings(tenantSlug, {
                ndaPolicyText,
                requireSignature: requireSignature ? 1 : 0,
                requireVisitorPhoto: requireVisitorPhoto ? 1 : 0,
                requireVehiclePhoto: requireVehiclePhoto ? 1 : 0,
            });
            toast.success("Paramètres mis à jour avec succès.");
            router.refresh();
        } catch (error: any) {
            toast.error(error?.message || "Une erreur est survenue lors de la mise à jour.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
            <CardHeader className="bg-blue-50/50 pb-8 pt-8 px-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-gray-900">Conformité Légale</CardTitle>
                        <CardDescription className="text-gray-500 font-medium mt-1">
                            Gérez votre texte de politique (NDA), les exigences de signature et de capture photo pour le Kiosk.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                    <Label htmlFor="ndaText" className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Texte de la Politique / NDA
                    </Label>
                    <Textarea
                        id="ndaText"
                        placeholder="Saisissez ici le texte que les visiteurs doivent lire avant de signer..."
                        value={ndaPolicyText}
                        onChange={(e) => setNdaPolicyText(e.target.value)}
                        className="min-h-[200px] text-base rounded-xl border-gray-200 focus:border-blue-500 reflection-none transition-all"
                    />
                    <p className="text-xs text-gray-400 font-medium italic">
                        Ce texte s'affichera à l'étape finale de l'enregistrement sur le Kiosk.
                    </p>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-colors hover:bg-gray-100/50">
                    <div className="space-y-1">
                        <Label htmlFor="reqSign" className="text-base font-bold text-gray-800">
                            Exiger une signature numérique
                        </Label>
                        <p className="text-sm text-gray-500 font-medium">
                            Oblige les visiteurs à signer sur l'écran avant de confirmer leur arrivée.
                        </p>
                    </div>
                    <Switch
                        id="reqSign"
                        checked={requireSignature}
                        onCheckedChange={setRequireSignature}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col justify-between p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50 transition-colors hover:bg-blue-50/50">
                        <div className="space-y-1 mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Camera className="w-4 h-4 text-blue-600" />
                                <Label htmlFor="reqVisPhoto" className="text-base font-bold text-gray-800">
                                    Photo Visiteur
                                </Label>
                            </div>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                Capture une photo du visage du visiteur pendant l'enregistrement.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Switch
                                id="reqVisPhoto"
                                checked={requireVisitorPhoto}
                                onCheckedChange={setRequireVisitorPhoto}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col justify-between p-6 bg-amber-50/30 rounded-2xl border border-amber-100/50 transition-colors hover:bg-amber-50/50">
                        <div className="space-y-1 mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Camera className="w-4 h-4 text-amber-600" />
                                <Label htmlFor="reqVehPhoto" className="text-base font-bold text-gray-800">
                                    Photo Véhicule
                                </Label>
                            </div>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                Demande une photo de la plaque ou du véhicule (si applicable).
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Switch
                                id="reqVehPhoto"
                                checked={requireVehiclePhoto}
                                onCheckedChange={setRequireVehiclePhoto}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={isPending}
                        className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Enregistrer les modifications
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
