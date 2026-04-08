"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    useGetDevices,
    usePairDevice,
    useDeleteDevice,
    useUpdateDevice,
    useReconnectDevice,
} from "@/features/tenants/hooks/useDeviceManagement.hook";
import {
    Monitor,
    Plus,
    Trash2,
    AlertCircle,
    Loader2,
    ShieldCheck,
    MapPin,
    FileText,
    Calendar,
    Activity,
    Wifi,
    WifiOff,
    Edit2,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Modal } from "@/components/ui/custom-modal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Device = {
    id: string;
    name: string | null;
    description: string | null;
    location: string | null;
    deviceType: string | null;
    isPaired: number | null;
    pairedAt: Date | null;
    lastActiveAt: Date | null;
    createdAt: Date | null;
};

/* ─────────────────────────────────────────────
   Helper: is a device online?
   Online = pinged within the last 5 minutes
───────────────────────────────────────────── */
function isOnline(lastActiveAt: Date | string | null): boolean {
    if (!lastActiveAt) return false;
    return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000;
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function DispositifPage() {
    const params = useParams();
    const slug = params.slug as string;

    // Pairing form state (for new devices)
    const [isAdding, setIsAdding] = useState(false);
    const [pairingCode, setPairingCode] = useState("");
    const [deviceName, setDeviceName] = useState("");
    const [deviceLocation, setDeviceLocation] = useState("");
    const [deviceDescription, setDeviceDescription] = useState("");

    // Edit state
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [editName, setEditName] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [editDescription, setEditDescription] = useState("");

    // Reconnect state
    const [reconnectTarget, setReconnectTarget] = useState<Device | null>(null);
    const [reconnectCode, setReconnectCode] = useState("");

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);

    const { data: devices, isLoading } = useGetDevices(slug);
    const pairMutation = usePairDevice(slug);
    const deleteMutation = useDeleteDevice(slug);
    const updateMutation = useUpdateDevice(slug);
    const reconnectMutation = useReconnectDevice(slug);

    /* ── Pairing (New) ─────────────────────────────── */
    const handlePair = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pairingCode || !deviceName) {
            toast.error("Le nom et le code d'appairage sont requis");
            return;
        }
        try {
            await pairMutation.mutateAsync({
                pairingCode,
                deviceName,
                location: deviceLocation || undefined,
                description: deviceDescription || undefined,
            });
            toast.success("Appareil appairé avec succès");
            setIsAdding(false);
            setPairingCode("");
            setDeviceName("");
            setDeviceLocation("");
            setDeviceDescription("");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'appairage");
        }
    };

    /* ── Edit ────────────────────────────────────────── */
    const openEditModal = (device: Device) => {
        setEditingDevice(device);
        setEditName(device.name || "");
        setEditLocation(device.location || "");
        setEditDescription(device.description || "");
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDevice) return;
        try {
            await updateMutation.mutateAsync({
                deviceId: editingDevice.id,
                data: {
                    name: editName,
                    location: editLocation,
                    description: editDescription,
                },
            });
            toast.success("Dispositif mis à jour");
            setEditingDevice(null);
        } catch {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    /* ── Reconnect ───────────────────────────────────── */
    const handleReconnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reconnectTarget || !reconnectCode) return;
        try {
            await reconnectMutation.mutateAsync({
                deviceId: reconnectTarget.id,
                pairingCode: reconnectCode,
            });
            toast.success("Dispositif reconnecté avec succès");
            setReconnectTarget(null);
            setReconnectCode("");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la reconnexion");
        }
    };

    /* ── Delete ──────────────────────────────────────── */
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success("Dispositif supprimé");
        } catch {
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeleteTarget(null);
        }
    };

    /* ════════════════════════════════════════════════
       RENDER
    ════════════════════════════════════════════════ */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dispositifs</h1>
                    <p className="text-gray-500">Gérez vos bornes d'accueil et tablettes sécurisées.</p>
                </div>
                <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                    <Plus className="w-4 h-4 mr-2" />
                    Appairer un dispositif
                </Button>
            </div>

            {/* Pairing form (for new device) */}
            {isAdding && (
                <Card className="border-teal-200 bg-white animate-in slide-in-from-top-4 duration-300 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-teal-600" />
                            Nouvel Appairage
                        </CardTitle>
                        <CardDescription>
                            Saisissez les informations du dispositif et le code affiché sur l'écran du kiosque.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePair} className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1 block">
                                        Nom du dispositif *
                                    </label>
                                    <Input
                                        placeholder="ex: Borne Accueil Principal"
                                        value={deviceName}
                                        onChange={(e) => setDeviceName(e.target.value)}
                                        className="bg-white"
                                        required
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1 block">
                                        Code d'appairage *
                                    </label>
                                    <Input
                                        placeholder="XXXXXX"
                                        value={pairingCode}
                                        onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                                        maxLength={6}
                                        className="bg-white font-mono text-center text-lg tracking-widest"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1 block">
                                    Emplacement
                                </label>
                                <Input
                                    placeholder="ex: Hall d'entrée..."
                                    value={deviceLocation}
                                    onChange={(e) => setDeviceLocation(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1 block">
                                    Description
                                </label>
                                <Textarea
                                    placeholder="Notes optionnelles..."
                                    value={deviceDescription}
                                    onChange={(e) => setDeviceDescription(e.target.value)}
                                    className="bg-white resize-none"
                                    rows={2}
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} disabled={pairMutation.isPending}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={pairMutation.isPending}>
                                    {pairMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                    Confirmer l'appairage
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Device list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-52 bg-gray-100 animate-pulse rounded-xl" />
                    ))
                ) : devices && devices.length > 0 ? (
                    (devices as Device[]).map((device) => {
                        const online = isOnline(device.lastActiveAt);
                        return (
                            <Card key={device.id} className="bg-white hover:shadow-md transition-shadow border-gray-100">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-2 rounded-lg ${online ? "bg-green-50" : "bg-gray-100"}`}>
                                            <Monitor className={`w-6 h-6 ${online ? "text-green-600" : "text-gray-400"}`} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {online ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                    <Wifi className="w-3 h-3" /> En ligne
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                    <WifiOff className="w-3 h-3" /> Hors ligne
                                                </span>
                                            )}

                                            <div className="flex gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-teal-600"
                                                    onClick={() => openEditModal(device)}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-green-600"
                                                    onClick={() => setReconnectTarget(device)}
                                                    title="Re-connecter un appareil"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-600"
                                                    onClick={() => setDeleteTarget(device)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <CardTitle className="mt-4 text-lg">{device.name || "Dispositif sans nom"}</CardTitle>
                                    {device.location && (
                                        <div className="flex items-center gap-1.5 text-sm text-teal-600 font-medium mt-0.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {device.location}
                                        </div>
                                    )}
                                    {device.description && (
                                        <CardDescription className="flex items-start gap-1.5 mt-1">
                                            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                            {device.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 border-t pt-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Activity className="w-3.5 h-3.5" /> Dernière activité
                                            </span>
                                            <span className="text-gray-900 font-medium">
                                                {device.lastActiveAt
                                                    ? format(new Date(device.lastActiveAt), "d MMM 'à' HH:mm", { locale: fr })
                                                    : "Jamais"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Calendar className="w-3.5 h-3.5" /> Appairé le
                                            </span>
                                            <span className="text-gray-900 font-medium">
                                                {device.pairedAt ? format(new Date(device.pairedAt), "d MMM yyyy", { locale: fr }) : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center">
                        <AlertCircle className="w-8 h-8 text-gray-300 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900">Aucun dispositif appairé</h2>
                        <Button onClick={() => setIsAdding(true)} className="mt-6" variant="outline">Commencer l'appairage</Button>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <Modal isOpen={!!editingDevice} onClose={() => setEditingDevice(null)} title="Modifier le dispositif">
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Nom</label>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Emplacement</label>
                        <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setEditingDevice(null)}>Annuler</Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Reconnect Modal */}
            <Modal isOpen={!!reconnectTarget} onClose={() => setReconnectTarget(null)} title="Reconnecter le dispositif">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Si vous avez remplacé ou réinitialisé l'appareil physique, saisissez le nouveau code d'appairage affiché sur son écran pour qu'il reprenne ce créneau.
                    </p>
                    <form onSubmit={handleReconnect} className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-2 block text-center">
                                Nouveau code d'appairage
                            </label>
                            <Input
                                placeholder="XXXXXX"
                                value={reconnectCode}
                                onChange={(e) => setReconnectCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                className="font-mono text-center text-3xl tracking-[0.5em] py-8"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setReconnectTarget(null)}>Annuler</Button>
                            <Button type="submit" disabled={reconnectMutation.isPending} className="bg-green-600 hover:bg-green-700">
                                {reconnectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reconnecter
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete confirmation (Standard alert dialog wrapper) */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Supprimer le dispositif ?"
                description={`Voulez-vous vraiment révoquer l'accès pour "${deleteTarget?.name}" ?`}
                confirmText="Supprimer"
                variant="destructive"
            />
        </div>
    );
}
