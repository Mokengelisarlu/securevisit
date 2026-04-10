"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    useGeneratePairingCode,
    useCheckPairingStatus
} from "../hooks/useDeviceManagement.hook";
import Image from "next/image";
import {
    Loader2,
    RefreshCw,
} from "lucide-react";

interface KioskPairingScreenProps {
    tenantSlug: string;
    onPaired: (token: string) => void;
}

export function KioskPairingScreen({ tenantSlug, onPaired }: KioskPairingScreenProps) {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [pairingCode, setPairingCode] = useState<string | null>(null);

    const generateMutation = useGeneratePairingCode(tenantSlug);
    const { data: status } = useCheckPairingStatus(tenantSlug, deviceId);

    const handleGenerate = async () => {
        try {
            const result = await generateMutation.mutateAsync();
            setDeviceId(result.deviceId);
            setPairingCode(result.pairingCode);
        } catch (error) {
            console.error("Failed to generate pairing code", error);
        }
    };

    useEffect(() => {
        handleGenerate();
    }, []);

    useEffect(() => {
        if (status?.isPaired && status.deviceToken) {
            onPaired(status.deviceToken);
        }
    }, [status, onPaired]);

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-4xl font-black text-red-500 mb-4 tracking-tight">Appairage Nécessaire</h2>
            <p className=" text-teal-800/80 font-medium max-w-md mx-auto mb-12">
                Ce dispositif n'est pas encore autorisé. Veuillez entrer le code suivant dans votre tableau de bord admin.
            </p>

            <div className="bg-white border border-teal-100 p-10 rounded-[3rem] shadow-xl shadow-teal-900/5 mb-12 w-full max-w-sm">
                {generateMutation.isPending ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                        <span className="font-bold text-teal-600 uppercase tracking-widest text-sm">Génération...</span>
                    </div>
                ) : pairingCode ? (
                    <div className="space-y-4">
                        <div className="text-6xl font-mono font-black tracking-[0.3em] text-teal-600">
                            {pairingCode}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-teal-600/70 font-bold uppercase tracking-widest text-[10px]">
                            <RefreshCw className="w-3 h-3 animate-spin duration-[4s]" />
                            En attente d'autorisation...
                        </div>
                        <button
                            onClick={handleGenerate}
                            className="mt-6 text-teal-600/60 hover:text-teal-500 text-sm font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
                            disabled={generateMutation.isPending}
                        >
                            <RefreshCw className={`w-3 h-3 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                            Régénérer le code
                        </button>
                    </div>
                ) : (
                    <Button onClick={handleGenerate} variant="outline" size="lg" className="rounded-2xl border-teal-200 text-teal-600 hover:bg-teal-50">
                        Réessayer
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-6 w-full max-w-sm text-sm text-teal-800/70 font-medium">
                <div className="flex items-center gap-3 justify-center">
                    <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">1</span>
                    Allez dans "Dispositifs" sur votre PC
                </div>
                <div className="flex items-center gap-3 justify-center">
                    <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">2</span>
                    Cliquez sur "Appairer un dispositif"
                </div>
                <div className="flex items-center gap-3 justify-center">
                    <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">3</span>
                    Entrez le code {pairingCode}
                </div>
            </div>
        </div>
    );
}
