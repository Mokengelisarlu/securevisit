"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useCreateHost } from "../hooks/createHost.hook";
import { useUpdateHost } from "../hooks/useUpdateHost.hook";
import { useGetDepartments } from "../hooks/useGetTenantData";
import { useTenant } from "@/lib/tenant-provider";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { Camera, Upload, X, User } from "lucide-react";
import { uploadToBlob } from "../server/upload";
import { cn } from "@/lib/utils";
import { CameraCapture } from "../components/CameraCapture";

const formSchema = z.object({
    firstName: z.string().min(2, "Le prénom est requis"),
    lastName: z.string().min(2, "Le nom est requis"),
    middleName: z.string().optional().nullable(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().optional(),
    departmentId: z.string().min(1, "Le département est requis"),
    photoUrl: z.string().optional().nullable(),
});

type FormSchema = z.infer<typeof formSchema>;

interface HostFormProps {
    initialData?: {
        id: string;
        firstName: string;
        lastName: string;
        middleName: string | null;
        photoUrl: string | null;
        email: string | null;
        phone: string | null;
        departmentId: string;
    };
    onSuccess?: () => void;
}

export function HostForm({ initialData, onSuccess }: HostFormProps) {
    const { slug: tenantSlug } = useTenant();
    const isEditing = !!initialData;

    const { data: departments } = useGetDepartments(tenantSlug || "");
    const createHost = useCreateHost(tenantSlug || "");
    const updateHost = useUpdateHost();

    const [isUploading, setIsUploading] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: initialData?.firstName || "",
            lastName: initialData?.lastName || "",
            middleName: initialData?.middleName || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            departmentId: initialData?.departmentId || "",
            photoUrl: initialData?.photoUrl || "",
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (initialData) {
            form.reset({
                firstName: initialData.firstName,
                lastName: initialData.lastName,
                middleName: initialData.middleName || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                departmentId: initialData.departmentId,
                photoUrl: initialData.photoUrl || "",
            });
            setPhotoPreview(initialData.photoUrl);
        }
    }, [initialData, form]);

    async function onSubmit(values: FormSchema) {
        setIsUploading(true);
        try {
            let finalPhotoUrl = values.photoUrl;

            // If photoPreview is a data URL, it means a new file was selected
            if (photoPreview && photoPreview.startsWith("data:image")) {
                finalPhotoUrl = await uploadToBlob(
                    tenantSlug || "",
                    `host-${values.lastName}.jpg`,
                    photoPreview
                );
            } else if (!photoPreview) {
                finalPhotoUrl = null;
            }

            const dataToSubmit = {
                ...values,
                photoUrl: finalPhotoUrl,
                email: values.email || null,
                phone: values.phone || null,
                middleName: values.middleName || null,
            };

            if (isEditing) {
                await updateHost.mutateAsync({
                    id: initialData.id,
                    ...dataToSubmit,
                });
                toast.success("Hôte mis à jour avec succès !");
            } else {
                await createHost.mutateAsync(dataToSubmit);
                toast.success("Hôte créé avec succès !");
            }
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.message || "Une erreur est survenue");
        } finally {
            setIsUploading(false);
        }
    }

    if (isCameraOpen) {
        return (
            <div className="animate-in fade-in duration-300">
                <CameraCapture
                    title="Prendre une photo"
                    description="Veuillez regarder l'objectif pour la capture."
                    onCapture={(img) => {
                        setPhotoPreview(img);
                        setIsCameraOpen(false);
                    }}
                />
                <div className="flex justify-center mt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsCameraOpen(false)}
                        className="text-gray-500 font-bold"
                    >
                        Annuler
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Photo Section */}
                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="relative group">
                        <div className={cn(
                            "w-28 h-28 rounded-3xl overflow-hidden border-2 border-dashed flex items-center justify-center transition-all",
                            photoPreview ? "border-teal-500 border-solid" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        )}>
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center gap-1">
                                    <User className="w-10 h-10 opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Photo</span>
                                </div>
                            )}
                        </div>
                        {photoPreview && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPhotoPreview(null);
                                    form.setValue("photoUrl", null);
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        <div className="flex gap-2 absolute -bottom-2 -right-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Télécharger"
                                className="w-8 h-8 bg-white text-gray-700 rounded-xl flex items-center justify-center shadow-lg border hover:bg-gray-50 transition-all hover:scale-110 active:scale-95"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCameraOpen(true)}
                                title="Prendre une photo"
                                className="w-8 h-8 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-teal-700 transition-all hover:scale-110 active:scale-95"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">Photo de l'Hôte</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prénom</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Jean" className="border-gray-200 focus:border-teal-500 focus:ring-teal-500" {...field} />
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
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Dupont" className="border-gray-200 focus:border-teal-500 focus:ring-teal-500" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Postnom / Deuxième Prénom (Optionnel)</FormLabel>
                            <FormControl>
                                <Input placeholder="ex: Kabasele" className="border-gray-200 focus:border-teal-500 focus:ring-teal-500" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email (Optionnel)</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: jean.dupont@entreprise.com" className="border-gray-200 focus:border-teal-500 focus:ring-teal-500" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Téléphone (Optionnel)</FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: +243..." className="border-gray-200 focus:border-teal-500 focus:ring-teal-500" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Département</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="border-gray-200 focus:border-teal-500 focus:ring-teal-500">
                                        <SelectValue placeholder="Sélectionnez un département" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {departments?.map((dept: any) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name} {dept.abbreviation ? `(${dept.abbreviation})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                        type="submit"
                        disabled={isUploading}
                        className="px-8 bg-[#0DBDB5] hover:bg-[#0044aa] text-white"
                    >
                        {isUploading ? "Enregistrement..." : (isEditing ? "Enregistrer" : "Créer l'Hôte")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
