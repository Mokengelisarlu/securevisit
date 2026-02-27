"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCreatePublicVisit } from "../hooks/useCreatePublicVisit.hook";
import { useCheckoutPublicVisit } from "../hooks/useCheckoutPublicVisit.hook";
import { usePingDevice } from "../hooks/useDeviceManagement.hook";
import { getPublicOnSiteVisitors } from "../queries/tenant-data";
import {
    useGetPublicDepartments,
    useGetPublicServices,
    useGetPublicVisitorTypes,
    useGetPublicHosts,
    useGetPublicOnSiteVisitors,
    useSearchPublicVisitors,
    useGetPublicSettings,
} from "../hooks/useGetPublicTenantData";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    CheckCircle2,
    ArrowRight,
    UserCircle,
    ClipboardList,
    Building,
    LogOut,
    LogIn,
    Search as SearchIcon,
    ChevronRight,
    Clock,
    ShieldCheck,
    UserPlus,
    UserCheck,
    Phone,
    AlertCircle,
    Scale,
    Shield,
    ArrowLeft,
    Car,
    Users,
    Truck,
    Bike
} from "lucide-react";
import { SignaturePad } from "../components/SignaturePad";
import { CameraCapture } from "../components/CameraCapture";
import { uploadToBlob } from "../server/upload";
import { cn } from "@/lib/utils";
import { KioskPairingScreen } from "../components/KioskPairingScreen";
import { prefetchKioskData } from "../queries/prefetch";

/* ─────────────────────────────────────────────
   Form Schema
 ───────────────────────────────────────────── */
const formSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    visitorTypeId: z.string().optional(),
    hostId: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    serviceId: z.string().optional().nullable(),
    purpose: z.string().optional().nullable(),

    // Vehicle fields
    hasVehicle: z.boolean(),
    plateNumber: z.string().optional().nullable(),
    vehicleType: z.enum(["CAR", "TRUCK", "MOTORCYCLE", "OTHER"]).optional().nullable(),
    vehicleBrand: z.string().optional().nullable(),
    vehicleColor: z.string().optional().nullable(),
    passengerCount: z.number().min(0).max(50),
});

type FormSchema = z.infer<typeof formSchema>;

interface VisitorKioskFormProps {
    tenantSlug: string;
}

/* ─────────────────────────────────────────────
   State types
───────────────────────────────────────────── */
type KioskMode = "IN" | "OUT" | null;
type VisitorMode = "new" | "existing" | null; // in-flow sub-choice

type MaskedVisitor = {
    id: string;
    firstName: string;
    lastNameMasked: string;
    phoneMasked: string | null;
    company: string | null;
    visitorTypeId: string | null;
    visitorTypeName: string | null;
};

/* ─────────────────────────────────────────────
   Kiosk Form Component
───────────────────────────────────────────── */
export function VisitorKioskForm({ tenantSlug }: VisitorKioskFormProps) {
    const [deviceToken, setDeviceToken] = useState<string | null>(null);
    const [isCheckingToken, setIsCheckingToken] = useState(true);
    const queryClient = useQueryClient();

    // Main flow state
    const [mode, setMode] = useState<KioskMode>(null);          // IN or OUT
    const [visitorMode, setVisitorMode] = useState<VisitorMode>(null); // new or existing
    const [step, setStep] = useState(1);                         // form step (for new visitor)
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
    const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
    const [hasVehicle, setHasVehicle] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Result / success state
    const [isSuccess, setIsSuccess] = useState(false);
    const [successType, setSuccessType] = useState<"IN" | "OUT">("IN");

    // Existing visitor search state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVisitor, setSelectedVisitor] = useState<MaskedVisitor | null>(null);

    // Checkout OUT search
    const [checkoutQuery, setCheckoutQuery] = useState("");

    // ── Token bootstrap ──────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem(`kiosk_token_${tenantSlug}`);
        setDeviceToken(token);
        setIsCheckingToken(false);
    }, [tenantSlug]);

    const handlePaired = (token: string) => {
        localStorage.setItem(`kiosk_token_${tenantSlug}`, token);
        setDeviceToken(token);
    };

    const handleResetDevice = () => {
        localStorage.removeItem(`kiosk_token_${tenantSlug}`);
        setDeviceToken(null);
    };

    // ── Prefetch data when device token is obtained ──────────────────
    useEffect(() => {
        if (deviceToken) {
            prefetchKioskData(queryClient, tenantSlug, deviceToken).catch((err) => {
                console.error("Prefetch error:", err);
            });
        }
    }, [deviceToken, tenantSlug, queryClient]);

    // ── Hooks ────────────────────────────────────────────────────────
    const createVisit = useCreatePublicVisit(tenantSlug, deviceToken);
    const checkoutVisit = useCheckoutPublicVisit(tenantSlug, deviceToken);

    const { data: visitorTypes } = useGetPublicVisitorTypes(tenantSlug, deviceToken);
    const { data: departments } = useGetPublicDepartments(tenantSlug, deviceToken);
    const { data: hosts } = useGetPublicHosts(tenantSlug, deviceToken);
    const { data: settings, refetch: refetchSettings } = useGetPublicSettings(tenantSlug, deviceToken);

    const requireSignature = settings?.requireSignature !== 0;
    const requireVisitorPhoto = settings?.requireVisitorPhoto === 1;
    const requireVehiclePhoto = settings?.requireVehiclePhoto === 1;

    const { data: services } = useGetPublicServices(tenantSlug, deviceToken);
    const { data: onSiteVisitors, isLoading: isLoadingOnSite, error: publicDataError } =
        useGetPublicOnSiteVisitors(tenantSlug, deviceToken);

    // Existing visitor search (IN mode)
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 400); // 400ms debounce delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: searchResults, isFetching: isSearching } = useSearchPublicVisitors(
        tenantSlug,
        deviceToken,
        debouncedSearchQuery
    );

    // Checkout search filtered from on-site list
    const filteredCheckout = useMemo(() => {
        if (!onSiteVisitors) return [];
        if (!checkoutQuery.trim()) return [];
        const q = checkoutQuery.toLowerCase();
        return (onSiteVisitors as any[]).filter((v: any) =>
            `${v.visitor.firstName} ${v.visitor.lastName}`.toLowerCase().includes(q) ||
            v.visitor.phone?.toLowerCase().includes(q)
        );
    }, [onSiteVisitors, checkoutQuery]);

    // If there's a data error (likely expired device token), reset
    useEffect(() => {
        if (publicDataError) handleResetDevice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicDataError]);

    // ── Heartbeat ────────────────────────────────────────────────────
    // Ping every 2 minutes so the admin dashboard can show online/offline status
    const ping = usePingDevice(tenantSlug, deviceToken);
    useEffect(() => {
        if (!deviceToken) return;
        // Immediate ping on mount
        ping.mutate();
        const interval = setInterval(() => { ping.mutate(); }, 2 * 60 * 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deviceToken]);

    // ── Form ─────────────────────────────────────────────────────────
    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            company: "",
            visitorTypeId: "",
            hostId: "",
            departmentId: "",
            serviceId: "",
            purpose: "",
            hasVehicle: false,
            plateNumber: "",
            vehicleType: undefined,
            vehicleBrand: "",
            vehicleColor: "",
            passengerCount: 0,
        },
    });

    // ── Helpers ──────────────────────────────────────────────────────
    const resetAll = () => {
        setMode(null);
        setVisitorMode(null);
        setStep(1);
        setSearchQuery("");
        setCheckoutQuery("");
        setSelectedVisitor(null);
        setHasVehicle(false);
        setVisitorPhoto(null);
        setVehiclePhoto(null);
        setSignatureData(null);
        setIsUploading(false);
        form.reset();
    };

    // ── Handlers ─────────────────────────────────────────────────────

    // New visitor submit (full form)
    async function onSubmitNew(values: FormSchema) {
        // Flow control check
        if (values.hasVehicle && requireVehiclePhoto && !vehiclePhoto) {
            setStep(2.5); // New "step" for vehicle photo
            return;
        }
        if (requireVisitorPhoto && !visitorPhoto) {
            setStep(1.5); // New "step" for visitor photo
            return;
        }
        if (requireSignature && !signatureData) {
            setStep(3);
            return;
        }

        setIsUploading(true);
        try {
            let visPhotoUrl = undefined;
            let vehPhotoUrl = undefined;

            if (visitorPhoto) {
                visPhotoUrl = await uploadToBlob(tenantSlug, `visitor-${values.lastName}.jpg`, visitorPhoto);
            }
            if (vehiclePhoto) {
                vehPhotoUrl = await uploadToBlob(tenantSlug, `vehicle-${values.plateNumber}.jpg`, vehiclePhoto);
            }

            await createVisit.mutateAsync({
                newVisitor: {
                    firstName: values.firstName!,
                    lastName: values.lastName!,
                    phone: values.phone || undefined,
                    company: values.company || undefined,
                    visitorTypeId: values.visitorTypeId!,
                },
                hostId: values.hostId || undefined,
                departmentId: values.departmentId || undefined,
                serviceId: values.serviceId || undefined,
                purpose: values.purpose || undefined,
                signatureData: signatureData || undefined,
                visitorPhotoUrl: visPhotoUrl,
                vehiclePhotoUrl: vehPhotoUrl,
                vehicle: values.hasVehicle ? {
                    plateNumber: values.plateNumber!,
                    type: values.vehicleType!,
                    brand: values.vehicleBrand || undefined,
                    color: values.vehicleColor || undefined,
                } : undefined,
                passengerCount: values.passengerCount || 0,
            });
            setSuccessType("IN");
            setIsSuccess(true);
            toast.success("Enregistrement réussi !");
        } catch (error: any) {
            toast.error(error?.message || "Une erreur est survenue");
        } finally {
            setIsUploading(false);
        }
    }

    // Existing visitor submit (just destination step)
    async function onSubmitExisting(values: FormSchema) {
        if (!selectedVisitor) return;

        // Flow control check
        if (values.hasVehicle && requireVehiclePhoto && !vehiclePhoto) {
            setStep(2.5);
            return;
        }
        if (requireVisitorPhoto && !visitorPhoto) {
            setStep(1.5);
            return;
        }
        if (requireSignature && !signatureData) {
            setStep(3);
            return;
        }

        setIsUploading(true);
        try {
            let visPhotoUrl = undefined;
            let vehPhotoUrl = undefined;

            if (visitorPhoto) {
                visPhotoUrl = await uploadToBlob(tenantSlug, `visitor-${selectedVisitor.id}.jpg`, visitorPhoto);
            }
            if (vehiclePhoto) {
                vehPhotoUrl = await uploadToBlob(tenantSlug, `vehicle-${values.plateNumber}.jpg`, vehiclePhoto);
            }

            await createVisit.mutateAsync({
                visitorId: selectedVisitor.id,
                hostId: values.hostId || undefined,
                departmentId: values.departmentId || undefined,
                serviceId: values.serviceId || undefined,
                purpose: values.purpose || undefined,
                signatureData: signatureData || undefined,
                visitorPhotoUrl: visPhotoUrl,
                vehiclePhotoUrl: vehPhotoUrl,
                vehicle: values.hasVehicle ? {
                    plateNumber: values.plateNumber!,
                    type: values.vehicleType!,
                    brand: values.vehicleBrand || undefined,
                    color: values.vehicleColor || undefined,
                } : undefined,
                passengerCount: values.passengerCount || 0,
            });
            setSuccessType("IN");
            setIsSuccess(true);
            toast.success("Enregistrement réussi !");
        } catch (error: any) {
            toast.error(error?.message || "Une erreur est survenue");
        } finally {
            setIsUploading(false);
        }
    }

    const handleCheckout = async (visitId: string) => {
        try {
            await checkoutVisit.mutateAsync(visitId);
            setSuccessType("OUT");
            setIsSuccess(true);
            toast.success("Départ enregistré !");
        } catch (error: any) {
            toast.error(error?.message || "Erreur lors du départ");
        }
    };

    /* ══════════════════════════════════════════════════════════════
       RENDERS
    ══════════════════════════════════════════════════════════════ */

    // ① Loading token
    if (isCheckingToken) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    // ② Pairing required
    if (!deviceToken) {
        return <KioskPairingScreen tenantSlug={tenantSlug} onPaired={handlePaired} />;
    }

    // ③ Success screen
    if (isSuccess) {
        return (
            <div className="w-full flex flex-col items-center justify-center gap-5 md:gap-7 text-center animate-in zoom-in duration-500 px-4">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                    <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-green-600" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mt-2 md:mt-4">
                    {successType === "IN" ? "Bienvenue !" : "Merci de votre visite !"}
                </h2>
                <p className="text-sm md:text-base text-gray-600 font-medium max-w-sm mx-auto leading-relaxed mt-1 md:mt-2">
                    {successType === "IN"
                        ? "Votre enregistrement a été effectué avec succès. Votre hôte a été prévenu."
                        : "Votre départ a été enregistré. À bientôt !"}
                </p>
                <Button
                    size="lg"
                    onClick={() => {
                        setIsSuccess(false);
                        resetAll();
                    }}
                    className="h-12 md:h-14 px-8 md:px-12 text-base md:text-lg font-black bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 mt-4 md:mt-6"
                >
                    Retour à l'accueil
                </Button>
            </div>
        );
    }

    /* ─────────── ④ Main menu (IN / OUT) ─────────── */
    if (!mode) {
        return (
            <div className="w-full flex flex-col items-center justify-center gap-6 md:gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 w-full max-w-3xl px-2 animate-in fade-in zoom-in-95 duration-500">
                    <button
                        onClick={() => {
                            setMode("IN");
                            refetchSettings?.();
                            // Prefetch data for IN mode (visitor search, hosts, departments, etc.)
                            if (deviceToken) {
                                prefetchKioskData(queryClient, tenantSlug, deviceToken).catch((err) => {
                                    console.error("Prefetch error:", err);
                                });
                            }
                        }}
                        className="group flex flex-col items-center justify-center p-6 md:p-12 bg-gradient-to-br from-blue-50 to-blue-100 border-3 border-blue-200 rounded-2xl md:rounded-3xl hover:border-blue-600 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-center min-h-44 md:min-h-56"
                    >
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-blue-700 group-hover:shadow-lg group-hover:shadow-blue-300 transition-all shadow-md">
                            <LogIn className="w-8 h-8 md:w-14 md:h-14 text-white" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-black text-gray-900 mb-2 md:mb-3">Arrivée</h3>
                        <p className="text-base md:text-lg text-gray-600 font-bold leading-snug">Je viens d'arriver</p>
                    </button>

                    <button
                        onClick={() => {
                            setMode("OUT");
                            refetchSettings?.();
                            // Prefetch on-site visitors for checkout search
                            if (deviceToken) {
                                queryClient.prefetchQuery({
                                    queryKey: ["public-on-site-visitors", tenantSlug, deviceToken],
                                    queryFn: () => getPublicOnSiteVisitors(tenantSlug, deviceToken),
                                    staleTime: 1000 * 30,
                                }).catch((err) => {
                                    console.error("Prefetch error:", err);
                                });
                            }
                        }}
                        className="group flex flex-col items-center justify-center p-6 md:p-12 bg-gradient-to-br from-orange-50 to-orange-100 border-3 border-orange-200 rounded-2xl md:rounded-3xl hover:border-orange-600 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 text-center min-h-44 md:min-h-56"
                    >
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-orange-600 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-orange-700 group-hover:shadow-lg group-hover:shadow-orange-300 transition-all shadow-md">
                            <LogOut className="w-8 h-8 md:w-14 md:h-14 text-white" />
                        </div>
                        <h3 className="text-2xl md:text-4xl font-black text-gray-900 mb-2 md:mb-3">Départ</h3>
                        <p className="text-base md:text-lg text-gray-600 font-bold leading-snug">Je m'en vais</p>
                    </button>
                </div>

                {/* Device Authorization Badge */}
                <div className="flex justify-center mt-4 md:mt-6">
                    <div className="flex flex-col md:flex-row items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-green-50 text-green-700 font-bold rounded-2xl border border-green-200 text-[10px] md:text-xs shadow-md">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                            AUTORISÉ
                        </div>
                        <button
                            onClick={handleResetDevice}
                            className="text-[9px] md:text-xs underline text-green-500 hover:text-green-700 font-bold transition-colors"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ─────────── ⑤ OUT mode: search by name or phone ─────────── */
    if (mode === "OUT") {
        const hasQuery = checkoutQuery.trim().length >= 2;
        const noResults = hasQuery && filteredCheckout.length === 0 && !isLoadingOnSite;

        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-500 w-full">
                <div className="text-center mb-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        Enregistrer votre départ
                    </h2>
                    <p className="text-lg text-gray-400 font-medium mt-1">
                        Saisissez votre nom ou numéro de téléphone
                    </p>
                </div>

                <div className="relative">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400" />
                    <Input
                        placeholder="Nom ou téléphone..."
                        value={checkoutQuery}
                        onChange={(e) => setCheckoutQuery(e.target.value)}
                        className="h-20 text-2xl pl-16 rounded-[2rem] border-2 focus:border-orange-500 shadow-lg"
                        autoFocus
                    />
                </div>

                {/* Results */}
                {hasQuery && (
                    <div className="space-y-4">
                        {isLoadingOnSite ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                            </div>
                        ) : filteredCheckout.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[45vh] overflow-y-auto p-2">
                                {filteredCheckout.map((v: any) => (
                                    <button
                                        key={v.id}
                                        onClick={() => handleCheckout(v.id)}
                                        disabled={checkoutVisit.isPending}
                                        className="flex items-center justify-between p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-orange-500 hover:bg-orange-50/30 transition-all text-left group shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        <div className="space-y-1">
                                            <h4 className="text-2xl font-black text-gray-900">
                                                {v.visitor.firstName} {v.visitor.lastName}
                                            </h4>
                                            <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-tight text-sm">
                                                <Clock className="w-4 h-4" />
                                                Arrivé à {new Date(v.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                            {v.visitor.company && (
                                                <p className="text-orange-600 font-bold text-sm tracking-widest uppercase">
                                                    {v.visitor.company}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-orange-100 p-4 rounded-2xl group-hover:bg-orange-600 transition-colors">
                                            {checkoutVisit.isPending ? (
                                                <Loader2 className="w-6 h-6 text-orange-600 group-hover:text-white animate-spin" />
                                            ) : (
                                                <ChevronRight className="w-6 h-6 text-orange-600 group-hover:text-white" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : noResults ? (
                            /* Not found → refer to security */
                            <div className="flex flex-col items-center gap-6 p-10 bg-amber-50 border-2 border-amber-200 rounded-3xl text-center">
                                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-12 h-12 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-amber-800 mb-2">
                                        Aucune visite active trouvée
                                    </h3>
                                    <p className="text-lg text-amber-700 font-medium max-w-sm mx-auto">
                                        Votre visite ne figure pas dans le registre actif. Veuillez vous adresser à l'agent de sécurité ou à la réception.
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                <div className="flex justify-center pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => { setMode(null); setCheckoutQuery(""); }}
                        className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-12"
                    >
                        Retour
                    </Button>
                </div>
            </div>
        );
    }

    /* ─────────── ⑥ IN mode: New vs Existing visitor ─────────── */
    if (mode === "IN" && !visitorMode) {
        return (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        Êtes-vous déjà enregistré ?
                    </h2>
                    <p className="text-lg text-gray-400 font-medium mt-1">
                        Choisissez une option pour continuer
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Existing visitor */}
                    <button
                        onClick={() => setVisitorMode("existing")}
                        className="group flex flex-col items-center justify-center p-12 bg-white border-4 border-blue-50 rounded-[3rem] hover:border-blue-600 hover:bg-blue-50/30 transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 text-center"
                    >
                        <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                            <UserCheck className="w-14 h-14 text-blue-600 group-hover:text-white" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-1">Visiteur enregistré</h3>
                        <p className="text-lg text-gray-500 font-bold">J'ai déjà visité</p>
                    </button>

                    {/* New visitor */}
                    <button
                        onClick={() => setVisitorMode("new")}
                        className="group flex flex-col items-center justify-center p-12 bg-white border-4 border-green-50 rounded-[3rem] hover:border-green-600 hover:bg-green-50/30 transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 text-center"
                    >
                        <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
                            <UserPlus className="w-14 h-14 text-green-600 group-hover:text-white" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-1">Nouveau visiteur</h3>
                        <p className="text-lg text-gray-500 font-bold">Première visite</p>
                    </button>
                </div>

                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => setMode(null)}
                        className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-12"
                    >
                        Retour
                    </Button>
                </div>
            </div>
        );
    }

    /* ─────────── ⑦ IN / Existing visitor: search screen ─────────── */
    if (mode === "IN" && visitorMode === "existing" && !selectedVisitor) {
        const hasQuery = searchQuery.trim().length >= 2;
        const noResults = hasQuery && !isSearching && (!searchResults || searchResults.length === 0);

        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500 w-full">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        Rechercher votre profil
                    </h2>
                    <p className="text-lg text-gray-400 font-medium mt-1">
                        Entrez votre nom ou numéro de téléphone
                    </p>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400" />
                    <Input
                        placeholder="Nom ou téléphone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-20 text-2xl pl-16 rounded-[2rem] border-2 focus:border-blue-500 shadow-lg"
                        autoFocus
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-spin" />
                    )}
                </div>

                {/* Results */}
                {hasQuery && (
                    <div className="space-y-4">
                        {(searchResults && searchResults.length > 0) ? (
                            <>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">
                                    Sélectionnez votre profil
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {(searchResults as MaskedVisitor[]).map((v) => {
                                        const isActive = onSiteVisitors?.some((visit: any) => visit.visitorId === v.id);

                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => {
                                                    if (isActive) {
                                                        toast.error("Vous êtes déjà enregistré comme présent.", {
                                                            description: "Veuillez passer par le mode 'Départ' si vous souhaitez quitter l'établissement."
                                                        });
                                                        return;
                                                    }
                                                    setSelectedVisitor(v);
                                                    // Pre-fill form so validation passes for the final submit
                                                    form.setValue("firstName", v.firstName);
                                                    form.setValue("lastName", v.lastNameMasked);
                                                    if (v.visitorTypeId) {
                                                        form.setValue("visitorTypeId", v.visitorTypeId);
                                                    }
                                                    setStep(2);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between p-7 bg-white border-2 rounded-3xl transition-all text-left group shadow-sm hover:shadow-md active:scale-95",
                                                    isActive
                                                        ? "border-amber-200 bg-amber-50/30 opacity-80 cursor-not-allowed"
                                                        : "border-gray-100 hover:border-blue-500 hover:bg-blue-50/30"
                                                )}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-2xl font-black text-gray-900">
                                                            {v.firstName} {v.lastNameMasked}
                                                        </h4>
                                                        {isActive && (
                                                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] font-black uppercase px-2 py-0.5">
                                                                Déjà sur place
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {v.phoneMasked && (
                                                        <div className="flex items-center gap-2 text-gray-500 font-medium text-base">
                                                            <Phone className="w-4 h-4" />
                                                            {v.phoneMasked}
                                                        </div>
                                                    )}
                                                    {v.company && (
                                                        <p className="text-blue-600 font-bold text-sm tracking-widest uppercase">
                                                            {v.company}
                                                        </p>
                                                    )}
                                                    {v.visitorTypeName && (
                                                        <p className="text-gray-400 text-sm font-medium">{v.visitorTypeName}</p>
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "p-4 rounded-2xl ml-4 shrink-0 transition-colors",
                                                    isActive
                                                        ? "bg-amber-100 text-amber-600"
                                                        : "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                                                )}>
                                                    {isActive ? <AlertCircle className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        ) : noResults ? (
                            /* Not found → offer to register */
                            <div className="flex flex-col items-center gap-6 p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                                    <UserPlus className="w-12 h-12 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800 mb-2">
                                        Profil introuvable
                                    </h3>
                                    <p className="text-lg text-gray-500 font-medium max-w-sm mx-auto mb-6">
                                        Aucun visiteur ne correspond à cette recherche. Souhaitez-vous vous enregistrer comme nouveau visiteur ?
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setVisitorMode("new");
                                            setSearchQuery("");
                                        }}
                                        className="h-14 px-10 text-xl font-black bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg"
                                    >
                                        <UserPlus className="w-6 h-6 mr-2" />
                                        S'enregistrer
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                <div className="flex justify-center pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => { setVisitorMode(null); setSearchQuery(""); }}
                        className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-12"
                    >
                        Retour
                    </Button>
                </div>
            </div>
        );
    }

    /* ─────────── ⑧ IN / Existing visitor: destination step ─────────── */
    if (mode === "IN" && visitorMode === "existing" && selectedVisitor) {
        return (
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmitExisting, (err) => {
                        console.error("Validation error (Existing):", err);
                        toast.error("Veuillez vérifier les informations de destination.");
                    })}
                    className="space-y-12"
                >
                    {step === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
                            {/* Visitor confirmation banner */}
                            <div className="flex items-center gap-5 p-6 bg-blue-50 border-2 border-blue-100 rounded-3xl">
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <UserCheck className="w-9 h-9 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-1">
                                        Visiteur identifié
                                    </p>
                                    <h3 className="text-2xl font-black text-gray-900">
                                        {selectedVisitor.firstName} {selectedVisitor.lastNameMasked}
                                    </h3>
                                    {selectedVisitor.phoneMasked && (
                                        <p className="text-gray-500 font-medium">{selectedVisitor.phoneMasked}</p>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <SearchIcon className="w-8 h-8 text-blue-600" />
                                Quelle est votre destination ?
                            </h3>

                            {/* Vehicle Question */}
                            <div className="space-y-6 pt-6 border-t-2 border-gray-100">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <Car className="w-8 h-8 text-blue-600" />
                                    Êtes-vous venu avec un véhicule ?
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasVehicle(true);
                                            form.setValue("hasVehicle", true);
                                        }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3",
                                            hasVehicle ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-200"
                                        )}
                                    >
                                        <Car className={cn("w-10 h-10", hasVehicle ? "text-blue-600" : "text-gray-400")} />
                                        <span className={cn("text-lg font-bold", hasVehicle ? "text-blue-900" : "text-gray-500")}>Oui</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasVehicle(false);
                                            form.setValue("hasVehicle", false);
                                        }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3",
                                            !hasVehicle ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-200"
                                        )}
                                    >
                                        <Users className={cn("w-10 h-10", !hasVehicle ? "text-blue-600" : "text-gray-400")} />
                                        <span className={cn("text-lg font-bold", !hasVehicle ? "text-blue-900" : "text-gray-500")}>Non</span>
                                    </button>
                                </div>
                            </div>

                            {hasVehicle && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-top-5 duration-500 bg-gray-50/50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField
                                            control={form.control}
                                            name="plateNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Plaque d'immatriculation</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ex: AB-123-CD" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 uppercase px-6" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="vehicleType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Type de véhicule</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-16 text-xl rounded-2xl border-2 px-6">
                                                                <SelectValue placeholder="Choisir..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="CAR" className="py-3 flex items-center gap-2 font-medium">Voiture</SelectItem>
                                                            <SelectItem value="TRUCK" className="py-3 flex items-center gap-2 font-medium">Camion</SelectItem>
                                                            <SelectItem value="MOTORCYCLE" className="py-3 flex items-center gap-2 font-medium">Moto</SelectItem>
                                                            <SelectItem value="OTHER" className="py-3 font-medium">Autre</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <FormField
                                            control={form.control}
                                            name="vehicleBrand"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Marque (Optionnel)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ex: Toyota" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 px-6" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="vehicleColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Couleur (Optionnel)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ex: Noir" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 px-6" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="passengerCount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Nombre de passagers</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-4">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-16 w-16 rounded-2xl border-2 text-2xl font-bold"
                                                                onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}
                                                            >-</Button>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                value={field.value ?? 0}
                                                                readOnly
                                                                className="h-16 text-center text-2xl font-bold rounded-2xl border-2 w-24 bg-white"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-16 w-16 rounded-2xl border-2 text-2xl font-bold"
                                                                onClick={() => field.onChange((field.value || 0) + 1)}
                                                            >+</Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            )}


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField
                                    control={form.control}
                                    name="departmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <Building className="w-5 h-5" /> Département
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger className="h-16 text-xl rounded-2xl border-2 px-6">
                                                        <SelectValue placeholder="Choisir un département" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {departments?.map((d: any) => (
                                                        <SelectItem key={d.id} value={d.id} className="text-lg py-3">
                                                            {d.name} {d.abbreviation ? `(${d.abbreviation})` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="serviceId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <ClipboardList className="w-5 h-5" /> Service
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger className="h-16 text-xl rounded-2xl border-2 px-6">
                                                        <SelectValue placeholder="Choisir un service" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {services?.map((s: any) => (
                                                        <SelectItem key={s.id} value={s.id} className="text-lg py-3">
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="hostId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <UserCircle className="w-5 h-5" /> Hôte (Qui venez-vous voir ?)
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="h-16 text-xl rounded-2xl border-2 px-6">
                                                    <SelectValue placeholder="Choisir un hôte" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {hosts?.map((h: any) => (
                                                    <SelectItem key={h.id} value={h.id} className="text-lg py-3">
                                                        {h.firstName} {h.lastName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="purpose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">
                                            Motif de la visite
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="ex: Entretien, Livraison, Réunion..."
                                                {...field}
                                                value={field.value || ""}
                                                className="h-16 text-xl rounded-2xl border-2 px-6"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center justify-between pt-8">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => { setSelectedVisitor(null); setStep(1); }}
                                    className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-10"
                                >
                                    Retour
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createVisit.isPending || isUploading}
                                    className="h-20 px-12 text-2xl font-black bg-[#0055cc] hover:bg-[#0044aa] rounded-[2rem] shadow-2xl shadow-blue-200 flex items-center gap-3 transition-all hover:scale-105 text-white"
                                >
                                    {createVisit.isPending || isUploading ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : (
                                        <>
                                            {((requireVisitorPhoto && !visitorPhoto) || (requireSignature && !signatureData) || (hasVehicle && requireVehiclePhoto && !vehiclePhoto)) ? "Suivant" : "Confirmer mon arrivée"}
                                            {((requireVisitorPhoto && !visitorPhoto) || (requireSignature && !signatureData) || (hasVehicle && requireVehiclePhoto && !vehiclePhoto)) ? <ArrowRight className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                            <div className="bg-blue-50/50 p-8 rounded-3xl border-2 border-blue-100 mb-8">
                                <h3 className="text-2xl font-black text-blue-900 mb-4 flex items-center gap-3">
                                    <Shield className="w-8 h-8 text-blue-600" />
                                    Politique de visite & Confidentialité
                                </h3>
                                <div className="prose prose-blue max-w-none text-blue-800/80 text-lg leading-relaxed whitespace-pre-wrap">
                                    {settings?.ndaPolicyText || "Veuillez lire et signer ci-dessous pour confirmer votre arrivée."}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-gray-400" /> Signature numérique
                                </label>
                                <SignaturePad
                                    onSave={(img) => setSignatureData(img)}
                                    onClear={() => setSignatureData(null)}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-8">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        if (requireVisitorPhoto) setStep(1.5);
                                        else if (hasVehicle && requireVehiclePhoto) setStep(2.5);
                                        else setStep(2);
                                    }}
                                    className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-10"
                                >
                                    Retour
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createVisit.isPending || (requireSignature && !signatureData) || isUploading}
                                    className="h-20 px-12 text-2xl font-black bg-[#0055cc] hover:bg-[#0044aa] rounded-[2rem] shadow-2xl shadow-blue-200 flex items-center gap-3 transition-all hover:scale-105 text-white disabled:opacity-50"
                                >
                                    {createVisit.isPending || isUploading ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : (
                                        <>
                                            Confirmer mon arrivée
                                            <CheckCircle2 className="w-8 h-8" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 1.5 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                            <CameraCapture
                                title="Photo du Visiteur"
                                description="Veuillez regarder la caméra pour capturer votre photo de badge."
                                onCapture={(img) => {
                                    setVisitorPhoto(img);
                                    if (hasVehicle && requireVehiclePhoto) {
                                        setStep(2.5);
                                    } else if (requireSignature) {
                                        setStep(3);
                                    } else {
                                        form.handleSubmit(onSubmitExisting)();
                                    }
                                }}
                            />
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        if (hasVehicle && requireVehiclePhoto) setStep(2.5);
                                        else setStep(2);
                                    }}
                                    className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-10"
                                >
                                    Retour
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2.5 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                            <CameraCapture
                                title="Photo du Véhicule"
                                description="Veuillez capturer une photo de la plaque ou de l'avant du véhicule."
                                onCapture={(img) => {
                                    setVehiclePhoto(img);
                                    if (requireVisitorPhoto) {
                                        setStep(1.5);
                                    } else if (requireSignature) {
                                        setStep(3);
                                    } else {
                                        form.handleSubmit(onSubmitExisting)();
                                    }
                                }}
                            />
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(2)}
                                    className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-10"
                                >
                                    Retour
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </Form>
        );
    }

    /* ─────────── ⑨ IN / New visitor: multi-step form ─────────── */
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmitNew, (err) => {
                    console.error("Validation error (New):", err);
                    toast.error("Veuillez remplir tous les champs requis.");
                })}
                className="space-y-12"
            >
                {step === 1 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Prénom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre prénom" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 focus:border-blue-500 px-6" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Nom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre nom" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 focus:border-blue-500 px-6" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Téléphone (Optionnel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre numéro" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 focus:border-blue-500 px-6" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Entreprise (Optionnel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre entreprise" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 focus:border-blue-500 px-6" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="visitorTypeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Type de Visiteur</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-16 text-xl rounded-2xl border-2 focus:border-blue-500 px-6">
                                                <SelectValue placeholder="Qui êtes-vous ?" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {visitorTypes?.map((type: any) => (
                                                <SelectItem key={type.id} value={type.id} className="text-lg py-3">
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setVisitorMode(null)}
                                className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-12"
                            >
                                Annuler
                            </Button>
                            <Button
                                type="button"
                                onClick={async () => {
                                    // Manual check because fields are optional in schema
                                    const fn = form.getValues("firstName");
                                    const ln = form.getValues("lastName");
                                    const vt = form.getValues("visitorTypeId");

                                    if (!fn || fn.length < 2) {
                                        form.setError("firstName", { message: "Prénom requis (min 2 lettres)" });
                                        return;
                                    }
                                    if (!ln || ln.length < 2) {
                                        form.setError("lastName", { message: "Nom requis (min 2 lettres)" });
                                        return;
                                    }
                                    if (!vt) {
                                        form.setError("visitorTypeId", { message: "Type de visiteur requis" });
                                        return;
                                    }

                                    const currentValues = form.getValues();
                                    if (currentValues.hasVehicle) {
                                        if (!currentValues.plateNumber) {
                                            form.setError("plateNumber", { message: "Plaque requise" });
                                            return;
                                        }
                                        if (!currentValues.vehicleType) {
                                            form.setValue("vehicleType", "CAR");
                                        }
                                    }

                                    setStep(2);
                                }}
                                className="h-20 px-12 text-2xl font-black bg-blue-600 hover:bg-blue-700 rounded-[2rem] shadow-2xl shadow-blue-100 flex items-center gap-3 transition-all hover:scale-105"
                            >
                                Suivant
                                <ArrowRight className="w-8 h-8" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 mb-8">
                            <SearchIcon className="w-8 h-8 text-blue-600" />
                            Quelle est votre destination ?
                        </h3>

                        {/* Vehicle Question */}
                        <div className="space-y-6 pt-6 border-t-2 border-gray-100">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <Car className="w-8 h-8 text-blue-600" />
                                Êtes-vous venu avec un véhicule ?
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHasVehicle(true);
                                        form.setValue("hasVehicle", true);
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3",
                                        hasVehicle ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-200"
                                    )}
                                >
                                    <Car className={cn("w-10 h-10", hasVehicle ? "text-blue-600" : "text-gray-400")} />
                                    <span className={cn("text-lg font-bold", hasVehicle ? "text-blue-900" : "text-gray-500")}>Oui</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHasVehicle(false);
                                        form.setValue("hasVehicle", false);
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3",
                                        !hasVehicle ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-200"
                                    )}
                                >
                                    <Users className={cn("w-10 h-10", !hasVehicle ? "text-blue-600" : "text-gray-400")} />
                                    <span className={cn("text-lg font-bold", !hasVehicle ? "text-blue-900" : "text-gray-500")}>Non</span>
                                </button>
                            </div>
                        </div>

                        {hasVehicle && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-top-5 duration-500 bg-gray-50/50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormField
                                        control={form.control}
                                        name="plateNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Plaque d'immatriculation</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: AB-123-CD" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 uppercase px-6" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="vehicleType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Type de véhicule</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-16 text-xl rounded-2xl border-2 px-6">
                                                            <SelectValue placeholder="Choisir..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="CAR" className="py-3 flex items-center gap-2 font-medium">Voiture</SelectItem>
                                                        <SelectItem value="TRUCK" className="py-3 flex items-center gap-2 font-medium">Camion</SelectItem>
                                                        <SelectItem value="MOTORCYCLE" className="py-3 flex items-center gap-2 font-medium">Moto</SelectItem>
                                                        <SelectItem value="OTHER" className="py-3 font-medium">Autre</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormField
                                        control={form.control}
                                        name="vehicleBrand"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Marque (Optionnel)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Toyota" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 px-6" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="vehicleColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Couleur (Optionnel)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Noir" {...field} value={field.value || ""} className="h-16 text-xl rounded-2xl border-2 px-6" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="passengerCount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Nombre de passagers</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-4">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-16 w-16 rounded-2xl border-2 text-2xl font-bold"
                                                            onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}
                                                        >-</Button>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? 0}
                                                            readOnly
                                                            className="h-16 text-center text-2xl font-bold rounded-2xl border-2 w-24 bg-white"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-16 w-16 rounded-2xl border-2 text-2xl font-bold"
                                                            onClick={() => field.onChange((field.value || 0) + 1)}
                                                        >+</Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <Building className="w-5 h-5" /> Département
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="h-16 text-xl rounded-2xl border-2 px-6">
                                                    <SelectValue placeholder="Choisir un département" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments?.map((d: any) => (
                                                    <SelectItem key={d.id} value={d.id} className="text-lg py-3">
                                                        {d.name} {d.abbreviation ? `(${d.abbreviation})` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="serviceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                                            <ClipboardList className="w-5 h-5" /> Service
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="h-16 text-xl rounded-2xl border-2 px-6">
                                                    <SelectValue placeholder="Choisir un service" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {services?.map((s: any) => (
                                                    <SelectItem key={s.id} value={s.id} className="text-lg py-3">
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="hostId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <UserCircle className="w-5 h-5" /> Hôte (Qui venez-vous voir ?)
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl>
                                            <SelectTrigger className="h-16 text-xl rounded-2xl border-2 px-6">
                                                <SelectValue placeholder="Choisir un hôte" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {hosts?.map((h: any) => (
                                                <SelectItem key={h.id} value={h.id} className="text-lg py-3">
                                                    {h.firstName} {h.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-bold text-gray-700 mb-2 block">Motif de la visite</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="ex: Entretien, Livraison, Réunion..."
                                            {...field}
                                            value={field.value || ""}
                                            className="h-16 text-xl rounded-2xl border-2 px-6"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-between pt-8">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-10"
                            >
                                Retour
                            </Button>
                            <Button
                                type="submit"
                                disabled={createVisit.isPending || isUploading}
                                className="h-20 px-12 text-2xl font-black bg-[#0055cc] hover:bg-[#0044aa] rounded-[2rem] shadow-2xl shadow-blue-200 flex items-center gap-3 transition-all hover:scale-105 text-white"
                            >
                                {createVisit.isPending || isUploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <>
                                        {((requireSignature && !signatureData) || (hasVehicle && requireVehiclePhoto && !vehiclePhoto)) ? "Suivant" : "Confirmer mon arrivée"}
                                        {((requireSignature && !signatureData) || (hasVehicle && requireVehiclePhoto && !vehiclePhoto)) ? <ArrowRight className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                        <div className="bg-blue-50/50 p-8 rounded-3xl border-2 border-blue-100 mb-8">
                            <h3 className="text-2xl font-black text-blue-900 mb-4 flex items-center gap-3">
                                <Shield className="w-8 h-8 text-blue-600" />
                                Politique de visite & Confidentialité
                            </h3>
                            <div className="prose prose-blue max-w-none text-blue-800/80 text-lg leading-relaxed whitespace-pre-wrap">
                                {settings?.ndaPolicyText || "Veuillez lire et signer ci-dessous pour confirmer votre arrivée."}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-gray-400" /> Signature numérique
                            </label>
                            <SignaturePad
                                onSave={(img) => setSignatureData(img)}
                                onClear={() => setSignatureData(null)}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-8">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(hasVehicle && requireVehiclePhoto ? 2.5 : 2)}
                                className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-10"
                            >
                                Retour
                            </Button>
                            <Button
                                type="submit"
                                disabled={createVisit.isPending || (requireSignature && !signatureData) || isUploading}
                                className="h-20 px-12 text-2xl font-black bg-[#0055cc] hover:bg-[#0044aa] rounded-[2rem] shadow-2xl shadow-blue-200 flex items-center gap-3 transition-all hover:scale-105 text-white disabled:opacity-50"
                            >
                                {createVisit.isPending || isUploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <>
                                        Confirmer mon arrivée
                                        <CheckCircle2 className="w-8 h-8" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 1.5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                        <CameraCapture
                            title="Photo du Visiteur"
                            description="Veuillez regarder la caméra pour capturer votre photo de badge."
                            onCapture={(img) => {
                                setVisitorPhoto(img);
                                if (hasVehicle && requireVehiclePhoto) {
                                    setStep(2.5);
                                } else if (requireSignature) {
                                    setStep(3);
                                } else {
                                    form.handleSubmit(onSubmitNew)();
                                }
                            }}
                        />
                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-10"
                            >
                                Retour
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2.5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
                        <CameraCapture
                            title="Photo du Véhicule"
                            description="Veuillez capturer une photo de la plaque ou de l'avant du véhicule."
                            onCapture={(img) => {
                                setVehiclePhoto(img);
                                if (requireSignature) {
                                    setStep(3);
                                } else {
                                    // Trigger submit
                                    form.handleSubmit(onSubmitNew)();
                                }
                            }}
                        />
                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(2)}
                                className="h-16 text-xl font-bold text-gray-500 hover:bg-gray-100 rounded-2xl px-10"
                            >
                                Retour
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </Form>
    );
}
