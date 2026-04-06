"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo } from "react";
import {
    User,
    Search,
    UserPlus,
    Building2,
    Tag,
    Loader2,
    MessageSquare,
    MapPin,
    Compass,
    X,
    CalendarDays,
    Car
} from "lucide-react";
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
import { useTenant } from "@/lib/tenant-provider";
import {
    useGetVisitors,
    useGetHosts,
    useGetVisitorTypes,
    useGetDepartments,
    useGetServices
} from "../hooks/useGetTenantData";
import { useCreateScheduledVisit } from "../hooks/useScheduledVisits.hook";
import { toast } from "sonner";
import { Modal } from "@/components/ui/custom-modal";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const preRegisterFormSchema = z.object({
    visitorSelection: z.enum(["existing", "new"]),
    visitorId: z.string().optional(),
    newVisitor: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        visitorTypeId: z.string().optional(),
    }).optional(),
    destinationType: z.enum(["host", "department", "service"]),
    hostId: z.string().optional(),
    departmentId: z.string().optional(),
    serviceId: z.string().optional(),
    purpose: z.string().min(1, "Motif requis"),
    visitDate: z.string().min(1, "Date et heure requises"),
    hasVehicle: z.boolean(),
    vehicle: z.object({
        plateNumber: z.string().optional(),
        type: z.enum(["CAR", "TRUCK", "MOTORCYCLE", "OTHER"]),
        brand: z.string().optional(),
        color: z.string().optional(),
    }),
    passengerCount: z.number().min(0),
}).superRefine((data, ctx) => {
    if (data.visitorSelection === "existing" && !data.visitorId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Veuillez sélectionner un visiteur",
            path: ["visitorId"],
        });
    }

    if (data.visitorSelection === "new") {
        if (!data.newVisitor?.firstName || data.newVisitor.firstName.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Prénom requis (min 2)",
                path: ["newVisitor", "firstName"],
            });
        }
        if (!data.newVisitor?.lastName || data.newVisitor.lastName.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Nom requis (min 2)",
                path: ["newVisitor", "lastName"],
            });
        }
        if (!data.newVisitor?.visitorTypeId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Type requis",
                path: ["newVisitor", "visitorTypeId"],
            });
        }
    }

    if (data.destinationType === "host" && !data.hostId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Hôte requis",
            path: ["hostId"],
        });
    }
    if (data.destinationType === "department" && !data.departmentId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Département requis",
            path: ["departmentId"],
        });
    }
    if (data.destinationType === "service" && !data.serviceId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Service requis",
            path: ["serviceId"],
        });
    }

    if (data.hasVehicle && !data.vehicle?.plateNumber) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Plaque d'immatriculation requise",
            path: ["vehicle", "plateNumber"],
        });
    }
});

type PreRegisterFormSchema = z.infer<typeof preRegisterFormSchema>;

interface PreRegisterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PreRegisterFormModal({ isOpen, onClose }: PreRegisterFormModalProps) {
    const { slug } = useTenant();
    const [visitorSearch, setVisitorSearch] = useState("");
    const [hostSearch, setHostSearch] = useState("");
    const [deptSearch, setDeptSearch] = useState("");
    const [serviceSearch, setServiceSearch] = useState("");

    const { data: visitors } = useGetVisitors(slug!);
    const { data: hosts } = useGetHosts(slug!);
    const { data: visitorTypes } = useGetVisitorTypes(slug!);
    const { data: departments } = useGetDepartments(slug!);
    const { data: services } = useGetServices(slug!);

    const createScheduledVisit = useCreateScheduledVisit(slug!);

    const form = useForm<PreRegisterFormSchema>({
        resolver: zodResolver(preRegisterFormSchema),
        defaultValues: {
            visitorSelection: "existing",
            visitorId: "",
            destinationType: "host",
            purpose: "",
            hostId: "",
            departmentId: "",
            serviceId: "",
            visitDate: "",
            newVisitor: {
                firstName: "",
                lastName: "",
                phone: "",
                company: "",
                visitorTypeId: "",
            },
            hasVehicle: false,
            vehicle: {
                plateNumber: "",
                type: "CAR",
                brand: "",
                color: "",
            },
            passengerCount: 0,
        },
    });

    const visitorSelection = form.watch("visitorSelection");
    const destinationType = form.watch("destinationType");

    const filteredVisitors = useMemo(() => {
        if (!visitors || !visitorSearch) return [];
        return visitors.filter((v: any) =>
            `${v.firstName} ${v.lastName}`.toLowerCase().includes(visitorSearch.toLowerCase()) ||
            (v.company && v.company.toLowerCase().includes(visitorSearch.toLowerCase()))
        ).slice(0, 5);
    }, [visitors, visitorSearch]);

    const filteredHosts = useMemo(() => {
        if (!hosts || !hostSearch) return [];
        return hosts.filter((h: any) =>
            `${h.firstName} ${h.lastName}`.toLowerCase().includes(hostSearch.toLowerCase())
        ).slice(0, 5);
    }, [hosts, hostSearch]);

    const filteredDepts = useMemo(() => {
        if (!departments || !deptSearch) return [];
        return departments.filter((d: any) =>
            d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
            (d.abbreviation && d.abbreviation.toLowerCase().includes(deptSearch.toLowerCase()))
        ).slice(0, 5);
    }, [departments, deptSearch]);

    const filteredServices = useMemo(() => {
        if (!services || !serviceSearch) return [];
        return services.filter((s: any) =>
            s.name.toLowerCase().includes(serviceSearch.toLowerCase())
        ).slice(0, 5);
    }, [services, serviceSearch]);

    async function onSubmit(values: PreRegisterFormSchema) {
        try {
            await createScheduledVisit.mutateAsync({
                visitorId: values.visitorSelection === "existing" ? values.visitorId : undefined,
                newVisitor: values.visitorSelection === "new" ? {
                    firstName: values.newVisitor!.firstName!,
                    lastName: values.newVisitor!.lastName!,
                    phone: values.newVisitor?.phone || "",
                    company: values.newVisitor?.company || "",
                    visitorTypeId: values.newVisitor!.visitorTypeId!,
                } : undefined,
                hostId: values.destinationType === "host" ? values.hostId : undefined,
                departmentId: (values.destinationType === "department" || values.destinationType === "service") ? values.departmentId : undefined,
                serviceId: values.destinationType === "service" ? values.serviceId : undefined,
                purpose: values.purpose,
                visitDate: new Date(values.visitDate),
                vehicle: values.hasVehicle ? {
                    plateNumber: values.vehicle!.plateNumber!,
                    type: values.vehicle!.type!,
                    brand: values.vehicle?.brand,
                    color: values.vehicle?.color,
                } : undefined,
                passengerCount: values.hasVehicle ? values.passengerCount : 0,
            });

            toast.success("Visite pré-enregistrée avec succès !");
            form.reset();
            setVisitorSearch("");
            setHostSearch("");
            setDeptSearch("");
            setServiceSearch("");
            onClose();
        } catch (error: any) {
            console.error("Error pre-registering visit:", error);
            toast.error(error?.message || "Erreur lors du pré-enregistrement");
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pré-enregistrer un Visiteur">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => form.setValue("visitorSelection", "existing")}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${visitorSelection === "existing" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                                }`}
                        >
                            Visiteur existant
                        </button>
                        <button
                            type="button"
                            onClick={() => form.setValue("visitorSelection", "new")}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${visitorSelection === "new" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"
                                }`}
                        >
                            Nouveau visiteur
                        </button>
                    </div>

                    {visitorSelection === "existing" ? (
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="visitorId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase text-gray-400">Rechercher Visiteur</FormLabel>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Tapez un nom..."
                                                className="pl-9 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                value={visitorSearch || ""}
                                                onChange={(e) => {
                                                    setVisitorSearch(e.target.value);
                                                    if (field.value) field.onChange("");
                                                }}
                                            />
                                            {field.value && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange("");
                                                        setVisitorSearch("");
                                                    }}
                                                    className="absolute right-3 top-3"
                                                >
                                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                                </button>
                                            )}
                                            {visitorSearch && filteredVisitors.length > 0 && !field.value && (
                                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md animate-in fade-in slide-in-from-top-2 z-50 absolute w-full mt-1">
                                                    {filteredVisitors.map((v: any) => (
                                                        <button
                                                            key={v.id}
                                                            type="button"
                                                            onClick={() => {
                                                                field.onChange(v.id);
                                                                setVisitorSearch(`${v.firstName} ${v.lastName}`);
                                                            }}
                                                            className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">{v.firstName} {v.lastName}</p>
                                                                <p className="text-xs text-gray-500">{v.company || "Individuel"}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="newVisitor.firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Prénom" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="newVisitor.lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Nom" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="newVisitor.phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Téléphone" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="newVisitor.company"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Entreprise" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="newVisitor.visitorTypeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                                    <SelectValue placeholder="Type de visiteur" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {visitorTypes?.map((t: any) => (
                                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="visitDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase text-gray-400">Date et Heure prévue</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input type="datetime-local" {...field} className="pl-9 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase text-gray-400">Motif</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input placeholder="ex: Réunion..." {...field} value={field.value || ""} className="pl-9 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-200 mt-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Car className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Véhicule & Passagers</p>
                                    <p className="text-xs text-gray-500">Enregistrer les détails du transport</p>
                                </div>
                            </div>
                            <Switch
                                checked={form.watch("hasVehicle")}
                                onCheckedChange={(checked) => form.setValue("hasVehicle", checked)}
                            />
                        </div>

                        {form.watch("hasVehicle") && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <FormField
                                    control={form.control}
                                    name="vehicle.plateNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-gray-400">Plaque d'immatriculation</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: AA-123-BB" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vehicle.type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-gray-400">Type de véhicule</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                                        <SelectValue placeholder="Sélectionner un type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="CAR">Voiture</SelectItem>
                                                    <SelectItem value="TRUCK">Camion</SelectItem>
                                                    <SelectItem value="MOTORCYCLE">Moto</SelectItem>
                                                    <SelectItem value="OTHER">Autre</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vehicle.brand"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-gray-400">Marque (Optionnel)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="ex: Toyota, Mercedes..." {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="passengerCount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase text-gray-400">Passagers suppl.</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="destinationType"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-xs font-bold uppercase text-gray-400">Destination</FormLabel>
                                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                field.onChange("host");
                                                form.setValue("hostId", "");
                                                form.setValue("departmentId", "");
                                                form.setValue("serviceId", "");
                                                setHostSearch("");
                                                setDeptSearch("");
                                                setServiceSearch("");
                                            }}
                                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${field.value === "host" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                                                }`}
                                        >
                                            <User className="w-3 h-3" /> Hôte
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                field.onChange("department");
                                                form.setValue("hostId", "");
                                                form.setValue("departmentId", "");
                                                form.setValue("serviceId", "");
                                                setHostSearch("");
                                                setDeptSearch("");
                                                setServiceSearch("");
                                            }}
                                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${field.value === "department" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                                                }`}
                                        >
                                            <MapPin className="w-3 h-3" /> Département
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                field.onChange("service");
                                                form.setValue("hostId", "");
                                                form.setValue("departmentId", "");
                                                form.setValue("serviceId", "");
                                                setHostSearch("");
                                                setDeptSearch("");
                                                setServiceSearch("");
                                            }}
                                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${field.value === "service" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                                                }`}
                                        >
                                            <Compass className="w-3 h-3" /> Service
                                        </button>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {destinationType === "host" && (
                            <FormField
                                control={form.control}
                                name="hostId"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Employé..."
                                                className="pl-9 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                value={hostSearch || ""}
                                                onChange={(e) => {
                                                    setHostSearch(e.target.value);
                                                    if (field.value) field.onChange("");
                                                }}
                                            />
                                            {hostSearch && filteredHosts.length > 0 && !field.value && (
                                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md absolute w-full z-50 mt-1">
                                                    {filteredHosts.map((h: any) => (
                                                        <button
                                                            key={h.id}
                                                            type="button"
                                                            onClick={() => {
                                                                field.onChange(h.id);
                                                                setHostSearch(`${h.firstName} ${h.lastName}`);
                                                            }}
                                                            className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
                                                        >
                                                            <p className="text-sm font-bold text-gray-900">{h.firstName} {h.lastName}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {destinationType === "department" && (
                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Département..."
                                                className="pl-9 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                value={deptSearch || ""}
                                                onChange={(e) => {
                                                    setDeptSearch(e.target.value);
                                                    if (field.value) field.onChange("");
                                                }}
                                            />
                                            {deptSearch && filteredDepts.length > 0 && !field.value && (
                                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md absolute w-full z-50 mt-1">
                                                    {filteredDepts.map((d: any) => (
                                                        <button
                                                            key={d.id}
                                                            type="button"
                                                            onClick={() => {
                                                                field.onChange(d.id);
                                                                setDeptSearch(d.name);
                                                            }}
                                                            className="w-full flex items-center p-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
                                                        >
                                                            <p className="text-sm font-bold text-gray-900">{d.name}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {destinationType === "service" && (
                            <FormField
                                control={form.control}
                                name="serviceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Service..."
                                                className="pl-9 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                                value={serviceSearch || ""}
                                                onChange={(e) => {
                                                    setServiceSearch(e.target.value);
                                                    if (field.value) field.onChange("");
                                                }}
                                            />
                                            {serviceSearch && filteredServices.length > 0 && !field.value && (
                                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md absolute w-full z-50 mt-1">
                                                    {filteredServices.map((s: any) => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => {
                                                                field.onChange(s.id);
                                                                setServiceSearch(s.name);
                                                            }}
                                                            className="w-full flex items-center p-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0"
                                                        >
                                                            <p className="text-sm font-bold text-gray-900">{s.name}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="px-6 font-bold"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={createScheduledVisit.isPending}
                            className="px-10 bg-[#0055cc] hover:bg-[#0044aa] font-bold text-white shadow-lg h-11 rounded-lg"
                        >
                            {createScheduledVisit.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : <UserPlus className="w-4 h-4 mr-2" />}
                            Confirmer la pré-inscription
                        </Button>
                    </div>
                </form>
            </Form>
        </Modal >
    );
}
