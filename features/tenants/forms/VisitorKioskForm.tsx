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
        console.log("Submitting New Visitor Visit...", values);
        try {
            let visPhotoUrl = undefined;
            let vehPhotoUrl = undefined;

            if (visitorPhoto) {
                visPhotoUrl = await uploadToBlob(tenantSlug, `visitor-${values.lastName}.jpg`, visitorPhoto, deviceToken || undefined);
            }
            if (vehiclePhoto) {
                vehPhotoUrl = await uploadToBlob(tenantSlug, `vehicle-${values.plateNumber}.jpg`, vehiclePhoto, deviceToken || undefined);
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
            console.error("Submission error (New):", error);
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
        console.log("Submitting Existing Visitor Visit...", values);
        try {
            let visPhotoUrl = undefined;
            let vehPhotoUrl = undefined;

            if (visitorPhoto) {
                visPhotoUrl = await uploadToBlob(tenantSlug, `visitor-${selectedVisitor.id}.jpg`, visitorPhoto, deviceToken || undefined);
            }
            if (vehiclePhoto) {
                vehPhotoUrl = await uploadToBlob(tenantSlug, `vehicle-${values.plateNumber}.jpg`, vehiclePhoto, deviceToken || undefined);
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
            console.error("Submission error (Existing):", error);
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
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
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
            <div className="w-full flex flex-col items-center justify-center gap-4 md:gap-5 text-center animate-in zoom-in duration-500 px-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-full flex items-center justify-center shadow-lg shadow-green-500/10">
                    <CheckCircle2 className="w-10 h-10 md:w-14 md:h-14 text-green-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mt-1 md:mt-2">
                    {successType === "IN" ? "Bienvenue !" : "Merci de votre visite !"}
                </h2>
                <p className="text-xs md:text-sm text-blue-200/80 font-medium max-w-sm mx-auto leading-relaxed">
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
                    className="h-10 md:h-12 px-6 md:px-10 text-sm md:text-base font-black bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 mt-3 md:mt-4"
                >
                    Retour à l'accueil
                </Button>
            </div>
        );
    }

    /* ─────────── ④ Main menu (IN / OUT) ─────────── */
    if (!mode) {
        return (
            <div className="w-full flex flex-col items-center justify-center gap-4 md:gap-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-4xl px-2 animate-in fade-in zoom-in-95 duration-500">
                    <button
                        onClick={() => {
                            setMode("IN");
                            refetchSettings?.();
                            if (deviceToken) {
                                prefetchKioskData(queryClient, tenantSlug, deviceToken).catch((err) => {
                                    console.error("Prefetch error:", err);
                                });
                            }
                        }}
                        className="group flex flex-1 items-center gap-6 p-6 md:p-8 bg-blue-600/10 border-2 border-blue-500/30 rounded-2xl md:rounded-[2rem] hover:border-blue-400 hover:bg-blue-600/20 transition-all duration-300 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 active:scale-95 text-left backdrop-blur-sm"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all shadow-md shadow-blue-500/20 shrink-0">
                            <LogIn className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-1">Arrivée</h3>
                            <p className="text-sm md:text-base text-blue-200/80 font-bold leading-snug">Je viens d'arriver</p>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            setMode("OUT");
                            refetchSettings?.();
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
                        className="group flex flex-1 items-center gap-6 p-6 md:p-8 bg-orange-600/10 border-2 border-orange-500/30 rounded-2xl md:rounded-[2rem] hover:border-orange-400 hover:bg-orange-600/20 transition-all duration-300 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 active:scale-95 text-left backdrop-blur-sm"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all shadow-md shadow-orange-500/20 shrink-0">
                            <LogOut className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-1">Départ</h3>
                            <p className="text-sm md:text-base text-orange-200/80 font-bold leading-snug">Je m'en vais</p>
                        </div>
                    </button>
                </div>

                {/* Device Authorization Badge */}
                <div className="flex justify-center mt-4 md:mt-6">
                    <div className="flex flex-col md:flex-row items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-green-500/10 text-green-400 font-bold rounded-2xl border border-green-500/30 text-[10px] md:text-xs shadow-md shadow-green-500/10">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                            AUTORISÉ
                        </div>
                        <button
                            onClick={handleResetDevice}
                            className="text-[9px] md:text-xs underline text-green-400/60 hover:text-green-300 font-bold transition-colors"
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
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-500 w-full">
                <div className="text-center mb-1">
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                        Enregistrer votre départ
                    </h2>
                    <p className="text-xs md:text-sm text-blue-200/70 font-medium">
                        Saisissez votre nom ou numéro de téléphone
                    </p>
                </div>

                <div className="relative">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-300/50" />
                    <Input
                        placeholder="Nom ou téléphone..."
                        value={checkoutQuery}
                        onChange={(e) => setCheckoutQuery(e.target.value)}
                        className="h-14 md:h-16 text-xl pl-14 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-blue-300/50 focus:border-orange-500 shadow-lg"
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
                            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto p-2 w-full mx-auto">
                                {filteredCheckout.map((v: any) => (
                                    <button
                                        key={v.id}
                                        onClick={() => handleCheckout(v.id)}
                                        disabled={checkoutVisit.isPending}
                                        className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:border-orange-500/50 hover:bg-orange-500/10 transition-all text-left group shadow-lg hover:shadow-xl active:scale-95 w-full gap-4 md:gap-6"
                                    >
                                        <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                            {/* Photo or Avatar */}
                                            {v.visitor.photoUrl ? (
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                                                    <img src={v.visitor.photoUrl} alt="Visitor" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600/20 flex items-center justify-center border-2 border-white/10 shrink-0">
                                                    <UserCircle className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
                                                </div>
                                            )}

                                            <div className="space-y-1 md:space-y-2 overflow-hidden flex-1">
                                                <h4 className="text-xl md:text-3xl font-black text-white truncate">
                                                    {v.visitor.firstName} {v.visitor.lastName}
                                                </h4>
                                                {v.visitor.company && (
                                                    <p className="text-orange-400 font-bold text-sm md:text-base tracking-widest uppercase truncate">
                                                        {v.visitor.company}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 text-blue-200/70 font-bold uppercase tracking-tight text-xs md:text-sm">
                                                    <Clock className="w-4 h-4" />
                                                    Arrivé à {new Date(v.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto shrink-0 md:ml-auto">
                                            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-sm md:text-base shadow-md group-hover:from-orange-600 group-hover:to-orange-700 transition-all w-full md:w-auto">
                                                {checkoutVisit.isPending ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                                                        Traiment...
                                                    </>
                                                ) : (
                                                    <>
                                                        Check-out
                                                        <LogOut className="w-5 h-5 md:w-6 md:h-6 ml-1 md:ml-2" />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : noResults ? (
                            /* Not found → refer to security */
                            <div className="flex flex-col items-center gap-6 p-10 bg-amber-500/10 border border-amber-500/30 rounded-3xl text-center backdrop-blur-sm mx-auto max-w-2xl">
                                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-12 h-12 text-amber-400" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <h3 className="text-2xl font-black text-amber-300 mb-2">
                                        Aucune visite active trouvée
                                    </h3>
                                    <p className="text-lg text-amber-200/70 font-medium max-w-sm mx-auto">
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
                        className="h-16 text-xl font-bold text-blue-300 hover:bg-white/10 rounded-2xl px-12"
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
            <div className="space-y-4 md:space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                    {/* Existing visitor */}
                    <button
                        onClick={() => setVisitorMode("existing")}
                        className="group flex flex-1 items-center gap-6 p-6 md:p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl md:rounded-[2rem] hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300 shadow-xl shadow-blue-500/10 active:scale-95 text-left"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                            <UserCheck className="w-8 h-8 md:w-12 md:h-12 text-blue-400 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl md:text-2xl font-black text-white mb-1">Visiteur enregistré</h3>
                            <p className="text-sm md:text-base text-blue-200/70 font-bold">J'ai déjà visité</p>
                        </div>
                    </button>

                    {/* New visitor */}
                    <button
                        onClick={() => setVisitorMode("new")}
                        className="group flex flex-1 items-center gap-6 p-6 md:p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl md:rounded-[2rem] hover:border-green-500/50 hover:bg-green-500/10 transition-all duration-300 shadow-xl shadow-green-500/10 active:scale-95 text-left"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-green-600/20 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors shrink-0">
                            <UserPlus className="w-8 h-8 md:w-12 md:h-12 text-green-400 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl md:text-2xl font-black text-white mb-1">Nouveau visiteur</h3>
                            <p className="text-sm md:text-base text-green-200/70 font-bold">Première visite</p>
                        </div>
                    </button>
                </div>

                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => setMode(null)}
                        className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-10"
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
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-right-10 duration-500 w-full">
                <div className="text-center">
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                        Rechercher votre profil
                    </h2>
                    <p className="text-xs md:text-sm text-blue-200/70 font-medium">
                        Entrez votre nom ou numéro de téléphone
                    </p>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-300/50" />
                    <Input
                        placeholder="Nom ou téléphone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 md:h-16 text-xl pl-14 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-blue-300/50 focus:border-blue-500 shadow-lg"
                        autoFocus
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-400 animate-spin" />
                    )}
                </div>

                {/* Results */}
                {hasQuery && (
                    <div className="space-y-4">
                        {(searchResults && searchResults.length > 0) ? (
                            <>
                                <p className="text-sm font-bold text-blue-300/60 uppercase tracking-widest text-center">
                                    Sélectionnez votre profil
                                </p>
                                <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto w-full mx-auto p-2">
                                    {(searchResults as MaskedVisitor[]).map((v: any) => {
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
                                                    "flex flex-col md:flex-row items-center justify-between p-6 md:p-8 bg-white/5 backdrop-blur-sm border rounded-3xl transition-all text-left group shadow-lg hover:shadow-xl active:scale-95 w-full gap-4 md:gap-6",
                                                    isActive
                                                        ? "border-amber-500/30 bg-amber-500/10 opacity-80 cursor-not-allowed"
                                                        : "border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                                    {/* Photo or Avatar */}
                                                    {v.visitorPhotoUrl ? (
                                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                                                            <img src={v.visitorPhotoUrl} alt="Visitor" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600/20 flex items-center justify-center border-2 border-white/10 shrink-0">
                                                            <UserCircle className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
                                                        </div>
                                                    )}

                                                    <div className="space-y-1 md:space-y-2 overflow-hidden flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xl md:text-3xl font-black text-white truncate">
                                                                {v.firstName} {v.lastNameMasked}
                                                            </h4>
                                                            {isActive && (
                                                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] md:text-xs font-black uppercase px-2 py-0.5 shrink-0">
                                                                    Sur place
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {v.company ? (
                                                            <p className="text-blue-400 font-bold text-sm md:text-base tracking-widest uppercase truncate">
                                                                {v.company}
                                                            </p>
                                                        ) : v.visitorTypeName ? (
                                                            <p className="text-blue-300/50 text-sm md:text-base font-medium truncate">{v.visitorTypeName}</p>
                                                        ) : null}

                                                        {v.phoneMasked && (
                                                            <div className="flex items-center gap-2 text-blue-200/60 font-medium text-xs md:text-sm">
                                                                <Phone className="w-4 h-4 md:w-5 md:h-5" />
                                                                {v.phoneMasked}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-auto shrink-0 md:ml-auto">
                                                    <div className={cn(
                                                        "flex items-center justify-center gap-2 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-sm md:text-base shadow-md transition-all w-full md:w-auto",
                                                        isActive
                                                            ? "bg-amber-500/50 cursor-not-allowed"
                                                            : "bg-gradient-to-r from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700"
                                                    )}>
                                                        {isActive ? (
                                                            <>
                                                                Déjà enregistré
                                                                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 ml-1 md:ml-2" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                Check-in
                                                                <LogIn className="w-5 h-5 md:w-6 md:h-6 ml-1 md:ml-2" />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        ) : noResults ? (
                            /* Not found → offer to register */
                            <div className="flex flex-col items-center gap-6 p-10 bg-white/5 backdrop-blur-sm border border-white/10 border-dashed rounded-3xl text-center">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                                    <UserPlus className="w-12 h-12 text-blue-300/50" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2">
                                        Profil introuvable
                                    </h3>
                                    <p className="text-lg text-blue-200/70 font-medium max-w-sm mx-auto mb-6">
                                        Aucun visiteur ne correspond à cette recherche. Souhaitez-vous vous enregistrer comme nouveau visiteur ?
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setVisitorMode("new");
                                            setSearchQuery("");
                                        }}
                                        className="h-14 px-10 text-xl font-black bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-2xl shadow-lg shadow-green-500/30"
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
                        className="h-16 text-xl font-bold text-blue-300 hover:bg-white/10 rounded-2xl px-12"
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
                    className="space-y-6"
                >
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-10 duration-500">
                            {/* Visitor confirmation banner */}
                            <div className="flex items-center gap-4 p-4 md:p-5 bg-blue-600/10 border border-blue-500/30 rounded-2xl backdrop-blur-sm mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-0.5">Visiteur</p>
                                    <h3 className="text-lg font-black text-white leading-tight">
                                        {selectedVisitor.firstName} {selectedVisitor.lastNameMasked}
                                    </h3>
                                    {selectedVisitor.phoneMasked && (
                                        <p className="text-xs md:text-sm text-blue-200/60 font-medium">{selectedVisitor.phoneMasked}</p>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                <SearchIcon className="w-6 h-6 text-blue-400" />
                                Quelle est votre destination ?
                            </h3>

                            {/* Vehicle Question */}
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                    <Car className="w-6 h-6 text-blue-400" />
                                    Êtes-vous venu avec un véhicule ?
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasVehicle(true);
                                            form.setValue("hasVehicle", true);
                                        }}
                                        className={cn(
                                            "flex items-center justify-center p-4 rounded-2xl border transition-all gap-3",
                                            hasVehicle ? "border-blue-500 bg-blue-600/20" : "border-white/10 hover:border-blue-500/30"
                                        )}
                                    >
                                        <Car className={cn("w-6 h-6", hasVehicle ? "text-blue-400" : "text-blue-300/40")} />
                                        <span className={cn("text-base font-bold", hasVehicle ? "text-white" : "text-blue-200/60")}>Oui</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasVehicle(false);
                                            form.setValue("hasVehicle", false);
                                        }}
                                        className={cn(
                                            "flex items-center justify-center p-4 rounded-2xl border transition-all gap-3",
                                            !hasVehicle ? "border-blue-500 bg-blue-600/20" : "border-white/10 hover:border-blue-500/30"
                                        )}
                                    >
                                        <Users className={cn("w-6 h-6", !hasVehicle ? "text-blue-400" : "text-blue-300/40")} />
                                        <span className={cn("text-base font-bold", !hasVehicle ? "text-white" : "text-blue-200/60")}>Non</span>
                                    </button>
                                </div>
                            </div>

                            {hasVehicle && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-5 duration-500 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="plateNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Plaque d'immatriculation</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ex: AB-123-CD" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 uppercase px-5" />
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
                                                    <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Type de véhicule</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5">
                                                                <SelectValue placeholder="Choisir..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-slate-900 border-white/20 text-white">
                                                            <SelectItem value="CAR" className="py-3 flex items-center gap-2 font-medium focus:bg-blue-600 focus:text-white transition-colors">Voiture</SelectItem>
                                                            <SelectItem value="TRUCK" className="py-3 flex items-center gap-2 font-medium focus:bg-blue-600 focus:text-white transition-colors">Camion</SelectItem>
                                                            <SelectItem value="MOTORCYCLE" className="py-3 flex items-center gap-2 font-medium focus:bg-blue-600 focus:text-white transition-colors">Moto</SelectItem>
                                                            <SelectItem value="OTHER" className="py-3 font-medium focus:bg-blue-600 focus:text-white transition-colors">Autre</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="vehicleBrand"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Marque (Optionnel)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ex: Toyota" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 px-5" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="vehicleColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Couleur (Optionnel)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ex: Noir" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 px-5" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="passengerCount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Nombre de passagers</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-3">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-12 w-12 rounded-xl border border-white/20 bg-white/10 text-white text-xl font-bold hover:bg-white/20"
                                                                onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}
                                                            >-</Button>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                value={field.value ?? 0}
                                                                readOnly
                                                                className="h-12 text-center text-xl font-bold rounded-xl border border-white/20 w-20 bg-white/10 text-white"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="h-12 w-12 rounded-xl border border-white/20 bg-white/10 text-white text-xl font-bold hover:bg-white/20"
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


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="departmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 flex items-center gap-2">
                                                <Building className="w-4 h-4" /> Département
                                            </FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value || ""}
                                                disabled={!departments || departments.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5">
                                                        <SelectValue placeholder={!departments ? "Chargement..." : "Choisir..."} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-900 border-white/20 text-white">
                                                    {departments?.map((d: any) => (
                                                        <SelectItem key={d.id} value={d.id} className="text-base py-3 focus:bg-blue-600 focus:text-white transition-colors">
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
                                            <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4" /> Service
                                            </FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value || ""}
                                                disabled={!services || services.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5">
                                                        <SelectValue placeholder={!services ? "Chargement..." : "Choisir..."} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-900 border-white/20 text-white">
                                                    {services?.map((s: any) => (
                                                        <SelectItem key={s.id} value={s.id} className="text-base py-3 focus:bg-blue-600 focus:text-white transition-colors">
                                                            {s.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="hostId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 flex items-center gap-2">
                                                <UserCircle className="w-4 h-4" /> Hôte
                                            </FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value || ""}
                                                disabled={!hosts || hosts.length === 0}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5">
                                                        <SelectValue placeholder={!hosts ? "Chargement..." : "Choisir..."} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-900 border-white/20 text-white">
                                                    {hosts?.map((h: any) => (
                                                        <SelectItem key={h.id} value={h.id} className="text-base py-3 focus:bg-blue-600 focus:text-white transition-colors">
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
                                            <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">
                                                Motif de la visite
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="ex: Réunion..."
                                                    {...field}
                                                    value={field.value || ""}
                                                    className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => { setSelectedVisitor(null); setStep(1); }}
                                    className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-8"
                                >
                                    Retour
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createVisit.isPending || isUploading}
                                    className="h-16 px-10 text-xl font-black bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center gap-3 transition-all hover:scale-105 text-white"
                                >
                                    {createVisit.isPending || isUploading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            {((requireVisitorPhoto && !visitorPhoto) || (requireSignature && !signatureData) || (hasVehicle && requireVehiclePhoto && !vehiclePhoto)) ? "Suivant" : "Confirmer"}
                                            {((requireVisitorPhoto && !visitorPhoto) || (requireSignature && !signatureData) || (hasVehicle && requireVehiclePhoto && !vehiclePhoto)) ? <ArrowRight className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 md:space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
                            <div className="w-full max-w-2xl">
                                <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/30 mb-4 backdrop-blur-sm">
                                    <h3 className="text-xl font-black text-white mb-3 flex items-center gap-3">
                                        <Shield className="w-6 h-6 text-blue-400" />
                                        Politique de visite
                                    </h3>
                                    <div className="prose prose-blue max-w-none text-blue-200/70 text-base leading-snug whitespace-pre-wrap max-h-32 overflow-y-auto">
                                        {settings?.ndaPolicyText || "Veuillez lire et signer ci-dessous pour confirmer votre arrivée."}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-blue-200 flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-blue-400" /> Signature numérique
                                </label>
                                <SignaturePad
                                    onSave={(img) => setSignatureData(img)}
                                    onClear={() => setSignatureData(null)}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        if (requireVisitorPhoto) setStep(1.5);
                                        else if (hasVehicle && requireVehiclePhoto) setStep(2.5);
                                        else setStep(2);
                                    }}
                                    className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-8"
                                >
                                    Retour
                                </Button>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="submit"
                                        disabled={createVisit.isPending || (requireSignature && !signatureData) || isUploading}
                                        className="h-16 px-10 text-xl font-black bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center gap-3 transition-all hover:scale-105 text-white disabled:opacity-50"
                                    >
                                        {createVisit.isPending || isUploading ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                Confirmer
                                                <CheckCircle2 className="w-6 h-6" />
                                            </>
                                        )}
                                    </Button>
                                    {!signatureData && requireSignature && (
                                        <p className="text-[10px] text-blue-300/40 text-center animate-pulse">
                                            Veuillez valider votre signature ci-dessus
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1.5 && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
                            <div className="w-full max-w-2xl">
                                <CameraCapture
                                    title="Photo du Visiteur"
                                    description="Veuillez regarder la caméra."
                                    onCapture={(img) => {
                                        setVisitorPhoto(img);
                                        if (hasVehicle && requireVehiclePhoto && !vehiclePhoto) {
                                            setStep(2.5);
                                        } else if (requireSignature && !signatureData) {
                                            setStep(3);
                                        } else {
                                            form.handleSubmit(onSubmitExisting)();
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(2)}
                                    className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-8"
                                >
                                    Retour
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2.5 && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
                            <div className="w-full max-w-2xl">
                                <CameraCapture
                                    title="Photo du Véhicule"
                                    description="Veuillez capturer la plaque d'immatriculation."
                                    defaultFacingMode="environment"
                                    onCapture={(img) => {
                                        setVehiclePhoto(img);
                                        if (requireVisitorPhoto && !visitorPhoto) {
                                            setStep(1.5);
                                        } else if (requireSignature && !signatureData) {
                                            setStep(3);
                                        } else {
                                            form.handleSubmit(onSubmitExisting)();
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        if (requireVisitorPhoto) setStep(1.5);
                                        else setStep(2);
                                    }}
                                    className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-8"
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
                className="space-y-6"
            >
                {step === 1 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-10 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Prénom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre prénom" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 focus:border-blue-500 px-5" />
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
                                        <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Nom</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre nom" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 focus:border-blue-500 px-5" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Téléphone (Optionnel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre numéro" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 focus:border-blue-500 px-5" />
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
                                        <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Entreprise (Optionnel)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre entreprise" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 focus:border-blue-500 px-5" />
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
                                    <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Type de Visiteur</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ""}
                                        disabled={!visitorTypes || visitorTypes.length === 0}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white focus:border-blue-500 px-5 shadow-2xl">
                                                <SelectValue placeholder={!visitorTypes ? "Chargement..." : "Qui êtes-vous ?"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-900 border-white/20 text-white">
                                            {visitorTypes && visitorTypes.length > 0 ? (
                                                visitorTypes.map((type: any) => (
                                                    <SelectItem key={type.id} value={type.id} className="text-base py-3 focus:bg-blue-600 focus:text-white transition-colors">
                                                        {type.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-slate-400 italic">
                                                    Aucun type de visiteur disponible
                                                </div>
                                            )}
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
                                className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-10"
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
                                className="h-16 px-10 text-xl font-black bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center gap-3 transition-all hover:scale-105"
                            >
                                Suivant
                                <ArrowRight className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-10 duration-500">
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                            <SearchIcon className="w-6 h-6 text-blue-400" />
                            Quelle est votre destination ?
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 flex items-center gap-2">
                                            <Building className="w-4 h-4" /> Département
                                        </FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value || ""}
                                            disabled={!departments || departments.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5">
                                                    <SelectValue placeholder={!departments ? "Chargement..." : "Choisir..."} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-white/20 text-white">
                                                {departments?.map((d: any) => (
                                                    <SelectItem key={d.id} value={d.id} className="text-base py-3 focus:bg-blue-600 focus:text-white transition-colors">
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
                                        <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4" /> Service
                                        </FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value || ""}
                                            disabled={!services || services.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5">
                                                    <SelectValue placeholder={!services ? "Chargement..." : "Choisir..."} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-white/20 text-white">
                                                {services && services.length > 0 ? (
                                                    services.map((s: any) => (
                                                        <SelectItem key={s.id} value={s.id} className="text-base py-3 focus:bg-blue-600 focus:text-white transition-colors">
                                                            {s.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-slate-400 italic">
                                                        Aucun service disponible
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="hostId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 flex items-center gap-2">
                                            <UserCircle className="w-4 h-4" /> Hôte
                                        </FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value || ""}
                                            disabled={!hosts || hosts.length === 0}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5">
                                                    <SelectValue placeholder={!hosts ? "Chargement..." : "Choisir..."} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-white/20 text-white">
                                                {hosts && hosts.length > 0 ? (
                                                    hosts.map((h: any) => (
                                                        <SelectItem key={h.id} value={h.id} className="text-base py-3 focus:bg-blue-600 focus:text-white transition-colors">
                                                            {h.firstName} {h.lastName}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-slate-400 italic">
                                                        Aucun hôte disponible
                                                    </div>
                                                )}
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
                                        <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">
                                            Motif de la visite
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="ex: Réunion..."
                                                {...field}
                                                value={field.value || ""}
                                                className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Vehicle Question */}
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                <Car className="w-6 h-6 text-blue-400" />
                                Êtes-vous venu avec un véhicule ?
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHasVehicle(true);
                                        form.setValue("hasVehicle", true);
                                    }}
                                    className={cn(
                                        "flex items-center justify-center p-4 rounded-2xl border transition-all gap-3",
                                        hasVehicle ? "border-blue-500 bg-blue-600/20" : "border-white/10 hover:border-blue-500/30"
                                    )}
                                >
                                    <Car className={cn("w-6 h-6", hasVehicle ? "text-blue-400" : "text-blue-300/40")} />
                                    <span className={cn("text-base font-bold", hasVehicle ? "text-white" : "text-blue-200/60")}>Oui</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHasVehicle(false);
                                        form.setValue("hasVehicle", false);
                                    }}
                                    className={cn(
                                        "flex items-center justify-center p-4 rounded-2xl border transition-all gap-3",
                                        !hasVehicle ? "border-blue-500 bg-blue-600/20" : "border-white/10 hover:border-blue-500/30"
                                    )}
                                >
                                    <Users className={cn("w-6 h-6", !hasVehicle ? "text-blue-400" : "text-blue-300/40")} />
                                    <span className={cn("text-base font-bold", !hasVehicle ? "text-white" : "text-blue-200/60")}>Non</span>
                                </button>
                            </div>
                        </div>

                        {hasVehicle && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-5 duration-500 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="plateNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Plaque d'immatriculation</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: AB-123-CD" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 uppercase px-5" />
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
                                                <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Type de véhicule</FormLabel>
                                                <Select 
                                                    onValueChange={field.onChange} 
                                                    value={field.value || ""}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white px-5">
                                                            <SelectValue placeholder="Choisir..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-slate-900 border-white/20 text-white">
                                                        <SelectItem value="CAR" className="py-3 flex items-center gap-2 font-medium focus:bg-blue-600 focus:text-white transition-colors">Voiture</SelectItem>
                                                        <SelectItem value="TRUCK" className="py-3 flex items-center gap-2 font-medium focus:bg-blue-600 focus:text-white transition-colors">Camion</SelectItem>
                                                        <SelectItem value="MOTORCYCLE" className="py-3 flex items-center gap-2 font-medium focus:bg-blue-600 focus:text-white transition-colors">Moto</SelectItem>
                                                        <SelectItem value="OTHER" className="py-3 font-medium focus:bg-blue-600 focus:text-white transition-colors">Autre</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="vehicleBrand"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Marque (Optionnel)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Toyota" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 px-5" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="vehicleColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Couleur (Optionnel)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="ex: Noir" {...field} value={field.value || ""} className="h-14 text-lg rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 px-5" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="passengerCount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-bold text-blue-200 mb-1.5 block">Nombre de passagers</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-12 w-12 rounded-xl border border-white/20 bg-white/10 text-white text-xl font-bold hover:bg-white/20"
                                                            onClick={() => field.onChange(Math.max(0, (field.value || 0) - 1))}
                                                        >-</Button>
                                                        <Input
                                                            type="number"
                                                            {...field}
                                                            value={field.value ?? 0}
                                                            readOnly
                                                            className="h-12 text-center text-xl font-bold rounded-xl border border-white/20 w-20 bg-white/10 text-white"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-12 w-12 rounded-xl border border-white/20 bg-white/10 text-white text-xl font-bold hover:bg-white/20"
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

                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-8"
                            >
                                Retour
                            </Button>
                            <Button
                                type="submit"
                                className="h-16 px-10 text-xl font-black bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center gap-3 transition-all hover:scale-105 text-white"
                            >
                                {((requireVisitorPhoto && !visitorPhoto) || (requireSignature && !signatureData) || (hasVehicle && requireVehiclePhoto && !vehiclePhoto)) ? "Suivant" : "Confirmer"}
                                {((requireVisitorPhoto && !visitorPhoto) || (requireSignature && !signatureData) || (hasVehicle && requireVehiclePhoto && !vehiclePhoto)) ? <ArrowRight className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 md:space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
                        <div className="w-full max-w-2xl">
                            <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/30 mb-4 backdrop-blur-sm">
                                <h3 className="text-xl font-black text-white mb-3 flex items-center gap-3">
                                    <Shield className="w-6 h-6 text-blue-400" />
                                    Politique de visite
                                </h3>
                                <div className="prose prose-blue max-w-none text-blue-200/70 text-base leading-snug whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {settings?.ndaPolicyText || "Veuillez lire et signer ci-dessous pour confirmer votre arrivée."}
                                </div>
                            </div>
                        </div>

                        <div className="w-full max-w-2xl">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-blue-200 flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-blue-400" /> Signature numérique
                                </label>
                                <SignaturePad
                                    onSave={(img) => setSignatureData(img)}
                                    onClear={() => setSignatureData(null)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (hasVehicle && requireVehiclePhoto) setStep(2.5);
                                    else if (requireVisitorPhoto) setStep(1.5);
                                    else setStep(2);
                                }}
                                className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-8"
                            >
                                Retour
                            </Button>
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="submit"
                                    disabled={createVisit.isPending || (requireSignature && !signatureData) || isUploading}
                                    className="h-16 px-10 text-xl font-black bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center gap-3 transition-all hover:scale-105 text-white disabled:opacity-50"
                                >
                                    {createVisit.isPending || isUploading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            Confirmer
                                            <CheckCircle2 className="w-6 h-6" />
                                        </>
                                    )}
                                </Button>
                                {!signatureData && requireSignature && (
                                    <p className="text-[10px] text-blue-300/40 text-center animate-pulse">
                                        Veuillez valider votre signature ci-dessus
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 1.5 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
                        <div className="w-full max-w-2xl">
                            <CameraCapture
                                title="Photo du Visiteur"
                                description="Veuillez regarder la caméra."
                                onCapture={(img) => {
                                    setVisitorPhoto(img);
                                    if (hasVehicle && requireVehiclePhoto && !vehiclePhoto) {
                                        setStep(2.5);
                                    } else if (requireSignature && !signatureData) {
                                        setStep(3);
                                    } else {
                                        form.handleSubmit(onSubmitNew)();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep(2)}
                                className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-8"
                            >
                                Retour
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2.5 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
                        <div className="w-full max-w-2xl">
                            <CameraCapture
                                title="Photo du Véhicule"
                                description="Veuillez capturer la plaque d'immatriculation."
                                defaultFacingMode="environment"
                                onCapture={(img) => {
                                    setVehiclePhoto(img);
                                    if (requireVisitorPhoto && !visitorPhoto) {
                                        setStep(1.5);
                                    } else if (requireSignature && !signatureData) {
                                        setStep(3);
                                    } else {
                                        form.handleSubmit(onSubmitNew)();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (requireVisitorPhoto) setStep(1.5);
                                    else setStep(2);
                                }}
                                className="h-12 text-lg font-bold text-blue-300 hover:bg-white/10 rounded-xl px-8"
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
