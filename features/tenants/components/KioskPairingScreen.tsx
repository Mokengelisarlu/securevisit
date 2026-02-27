"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    useGeneratePairingCode,
    useCheckPairingStatus
} from "../hooks/useDeviceManagement.hook";
import {
    ShieldAlert,
    Loader2,
    RefreshCw,
    MonitorSmartphone,
    ArrowRight
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
            <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center mb-8">
                <MonitorSmartphone className="w-12 h-12 text-blue-600" />
            </div>

            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Appairage Nécessaire</h2>
            <p className="text-xl text-gray-500 font-medium max-w-md mx-auto mb-12">
                Ce dispositif n'est pas encore autorisé. Veuillez entrer le code suivant dans votre tableau de bord admin.
            </p>

            <div className="bg-white border-4 border-blue-50 p-10 rounded-[3rem] shadow-2xl mb-12 w-full max-w-sm">
                {generateMutation.isPending ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <span className="font-bold text-blue-600 uppercase tracking-widest text-sm">Génération...</span>
                    </div>
                ) : pairingCode ? (
                    <div className="space-y-4">
                        <div className="text-6xl font-mono font-black tracking-[0.3em] text-blue-600">
                            {pairingCode}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
                            <RefreshCw className="w-3 h-3 animate-spin duration-[4s]" />
                            En attente d'autorisation...
                        </div>
                        <button
                            onClick={handleGenerate}
                            className="mt-6 text-blue-400 hover:text-blue-600 text-sm font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
                            disabled={generateMutation.isPending}
                        >
                            <RefreshCw className={`w-3 h-3 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                            Régénérer le code
                        </button>
                    </div>
                ) : (
                    <Button onClick={handleGenerate} variant="outline" size="lg" className="rounded-2xl">
                        Réessayer
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-6 w-full max-w-sm text-sm text-gray-400 font-medium">
                <div className="flex items-center gap-3 justify-center">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">1</span>
                    Allez dans "Dispositifs" sur votre PC
                </div>
                <div className="flex items-center gap-3 justify-center">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">2</span>
                    Cliquez sur "Appairer un dispositif"
                </div>
                <div className="flex items-center gap-3 justify-center">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">3</span>
                    Entrez le code {pairingCode}
                </div>
            </div>
        </div>
    );
}
