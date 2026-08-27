"use client";

import { useState } from "react";
import { Loader2, Send, Terminal, ShieldAlert, RefreshCw, Trash2, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/custom-modal";
import { toast } from "sonner";
import { useSendCommand, COMMAND_TYPES, COMMAND_PRIORITIES, type CommandTypeOption, type CommandPriorityOption } from "@/features/tenants/hooks/useDeviceManagement.hook";

type Device = {
    id: string;
    name: string | null;
    location?: string | null;
};

const TYPE_META: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
    EMERGENCY_MESSAGE: {
        label: "Message d'urgence",
        description: "Affiche une alerte plein écran sur le kiosque.",
        icon: <ShieldAlert className="w-4 h-4" />,
    },
    REFRESH_SETTINGS: {
        label: "Actualiser les paramètres",
        description: "Recharge les paramètres du kiosque depuis le serveur.",
        icon: <RefreshCw className="w-4 h-4" />,
    },
    CONFIG_UPDATE: {
        label: "Mise à jour de configuration",
        description: "Applique une configuration au kiosque.",
        icon: <Cog className="w-4 h-4" />,
    },
    REBOOT: {
        label: "Redémarrer",
        description: "Redémarre le kiosque (signalé au dispositif).",
        icon: <Terminal className="w-4 h-4" />,
    },
    CLEAR_CACHE: {
        label: "Vider le cache",
        description: "Supprime les données locales du kiosque.",
        icon: <Trash2 className="w-4 h-4" />,
    },
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    device: Device | null;
    tenantSlug: string;
}

export function DeviceControlPanel({ isOpen, onClose, device, tenantSlug }: Props) {
    const sendCommand = useSendCommand(tenantSlug);

    const [type, setType] = useState<CommandTypeOption>("EMERGENCY_MESSAGE");
    const [payloadText, setPayloadText] = useState("");
    const [priority, setPriority] = useState<CommandPriorityOption>("medium");

    const meta = TYPE_META[type] ?? TYPE_META.EMERGENCY_MESSAGE;

    function buildPayload(): Record<string, unknown> | null {
        switch (type) {
            case "EMERGENCY_MESSAGE": {
                const message = payloadText.trim();
                if (!message) {
                    toast.error("Le message d'urgence est requis");
                    return null;
                }
                return { message };
            }
            case "CONFIG_UPDATE": {
                const trimmed = payloadText.trim();
                if (!trimmed) return {};
                try {
                    return JSON.parse(trimmed);
                } catch {
                    toast.error("La configuration doit être un JSON valide");
                    return null;
                }
            }
            default:
                return null;
        }
    }

    async function handleSend() {
        if (!device) return;
        const payload = buildPayload();
        if (payload === null) return;

        try {
            await sendCommand.mutateAsync({ deviceId: device.id, type, payload, priority });
            toast.success(`Commande « ${meta.label} » envoyée à ${device.name || "l'appareil"}`);
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur lors de l'envoi de la commande");
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Envoyer une commande au dispositif" size="2xl">
            {device && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Destinataire : <span className="font-semibold text-gray-900">{device.name || "Dispositif sans nom"}</span>
                        {device.location ? ` (${device.location})` : ""}
                    </p>

                    {/* Command type */}
                    <div>
                        <Label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                            Type de commande
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {COMMAND_TYPES.map((t) => {
                                const m = TYPE_META[t];
                                const active = type === t;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                                            active
                                                ? "border-teal-600 bg-teal-50"
                                                : "border-gray-200 bg-white hover:border-teal-300"
                                        }`}
                                    >
                                        <span className={`mt-0.5 ${active ? "text-teal-600" : "text-gray-400"}`}>{m.icon}</span>
                                        <span>
                                            <span className={`block text-sm font-semibold ${active ? "text-teal-700" : "text-gray-800"}`}>
                                                {m.label}
                                            </span>
                                            <span className="block text-xs text-gray-500">{m.description}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Priority */}
                    {(type === "EMERGENCY_MESSAGE" || type === "CONFIG_UPDATE") && (
                        <div>
                            <Label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                                Priorité
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {COMMAND_PRIORITIES.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                                            priority === p
                                                ? "bg-teal-600 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payload */}
                    {type === "EMERGENCY_MESSAGE" && (
                        <div>
                            <Label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                                Message d&apos;urgence
                            </Label>
                            <Textarea
                                placeholder="Ex : Situation de sécurité — merci de rester calme."
                                value={payloadText}
                                onChange={(e) => setPayloadText(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                    )}
                    {type === "CONFIG_UPDATE" && (
                        <div>
                            <Label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2 block">
                                Configuration (JSON)
                            </Label>
                            <Textarea
                                placeholder='{"requireSignature": 1}'
                                value={payloadText}
                                onChange={(e) => setPayloadText(e.target.value)}
                                rows={3}
                                className="resize-none font-mono text-xs"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={sendCommand.isPending}>
                            Annuler
                        </Button>
                        <Button onClick={handleSend} disabled={sendCommand.isPending || !type}>
                            {sendCommand.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Envoyer la commande
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
