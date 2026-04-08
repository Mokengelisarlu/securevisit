"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { upsertBusinessSettings } from "../queries/tenant-data";
import { useTenant } from "@/lib/tenant-provider";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Building2, Phone, Mail, Globe, MapPin, Hash, Briefcase, Image as ImageIcon, X } from "lucide-react";
import { useState, useRef } from "react";

const formSchema = z.object({
    name: z.string().min(1, "Le nom de l'entreprise est requis"),
    phone: z.string().optional(),
    email: z.string().email("Email invalide").or(z.literal("")).optional(),
    website: z.string().url("URL invalide").or(z.literal("")).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    industry: z.string().optional(),
    taxId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BusinessSettingsFormProps {
    defaultValues?: Partial<FormValues> & { logoUrl?: string | null };
}

export function BusinessSettingsForm({ defaultValues }: BusinessSettingsFormProps) {
    const { slug } = useTenant();
    const queryClient = useQueryClient();
    const [logoPreview, setLogoPreview] = useState<string | null>(defaultValues?.logoUrl || null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: defaultValues?.name || "",
            phone: defaultValues?.phone || "",
            email: defaultValues?.email || "",
            website: defaultValues?.website || "",
            address: defaultValues?.address || "",
            city: defaultValues?.city || "",
            country: defaultValues?.country || "",
            industry: defaultValues?.industry || "",
            taxId: defaultValues?.taxId || "",
        },
    });

    const isSubmitting = form.formState.isSubmitting;

    async function handleLogoUpload(file: File) {
        setUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            
            if (!res.ok) {
                toast.error(data.error || "Échec du téléchargement");
                return;
            }
            
            if (data.url) {
                setLogoPreview(data.url);
                toast.success("Logo téléchargé");
            } else {
                toast.error("Échec du téléchargement");
            }
        } catch {
            toast.error("Erreur lors du téléchargement");
        } finally {
            setUploadingLogo(false);
        }
    }

    async function onSubmit(values: FormValues) {
        if (!slug) return;
        try {
            await upsertBusinessSettings(slug, {
                ...values,
                logoUrl: logoPreview,
            });
            toast.success("Paramètres enregistrés");
            queryClient.invalidateQueries({ queryKey: ["business-settings", slug] });
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la sauvegarde");
        }
    }

    const inputClass = "h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium";
    const labelClass = "text-xs font-black uppercase tracking-widest text-gray-400";

    return (
        <div className="space-y-8">
            {/* Logo Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <p className={`${labelClass} mb-4`}>Logo de l'entreprise</p>
                <div className="flex items-center gap-6">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-blue-300 transition-all overflow-hidden group"
                    >
                        {logoPreview ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-white" />
                                </div>
                            </>
                        ) : uploadingLogo ? (
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <ImageIcon className="w-6 h-6 text-gray-300" />
                                <span className="text-[9px] font-black uppercase text-gray-300 tracking-widest">Logo</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <p className="text-sm font-bold text-gray-700">Télécharger un logo</p>
                        <p className="text-xs text-gray-400 font-medium">PNG, JPG, SVG — Max 2 MB. Taille recommandée : 256×256px.</p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="h-8 text-[10px] font-black uppercase tracking-widest rounded-lg border-gray-100"
                            >
                                {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : "Choisir un fichier"}
                            </Button>
                            {logoPreview && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setLogoPreview(null)}
                                    className="h-8 text-[10px] font-black uppercase tracking-widest rounded-lg text-red-500 hover:bg-red-50"
                                >
                                    <X className="w-3 h-3 mr-1" /> Supprimer
                                </Button>
                            )}
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                        }}
                    />
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Identity */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-teal-600" />
                            </div>
                            <p className="font-black text-sm text-gray-900 tracking-tight">Identité</p>
                        </div>

                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelClass}>Nom commercial *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Mon Entreprise S.A.R.L." className={inputClass} {...field} />
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold uppercase" />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="industry" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelClass}>Secteur d'activité</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                            <Input placeholder="Technologie, BTP, Finance…" className={`${inputClass} pl-10`} {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold uppercase" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="taxId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelClass}>N° RCCM / NIF / Tax ID</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                            <Input placeholder="CD-KNG-12-00000" className={`${inputClass} pl-10`} {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold uppercase" />
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Phone className="w-4 h-4 text-emerald-600" />
                            </div>
                            <p className="font-black text-sm text-gray-900 tracking-tight">Contact</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelClass}>Téléphone</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                            <Input placeholder="+243 xxx xxx xxx" className={`${inputClass} pl-10`} {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold uppercase" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelClass}>Email de contact</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                            <Input placeholder="contact@entreprise.com" className={`${inputClass} pl-10`} {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold uppercase" />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="website" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelClass}>Site web</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                                        <Input placeholder="https://www.entreprise.com" className={`${inputClass} pl-10`} {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold uppercase" />
                            </FormItem>
                        )} />
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-amber-600" />
                            </div>
                            <p className="font-black text-sm text-gray-900 tracking-tight">Localisation</p>
                        </div>

                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelClass}>Adresse</FormLabel>
                                <FormControl>
                                    <Input placeholder="123, Avenue de la Paix" className={inputClass} {...field} />
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold uppercase" />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelClass}>Ville</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Kinshasa" className={inputClass} {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold uppercase" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="country" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={labelClass}>Pays</FormLabel>
                                    <FormControl>
                                        <Input placeholder="République Démocratique du Congo" className={inputClass} {...field} />
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-bold uppercase" />
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-12 px-8 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-teal-200 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Enregistrer les paramètres
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
