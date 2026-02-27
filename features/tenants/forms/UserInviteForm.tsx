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
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { authorizeUser } from "../queries/tenant-data";
import { useTenant } from "@/lib/tenant-provider";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Shield, User } from "lucide-react";

const formSchema = z.object({
    firstName: z.string().min(1, { message: "Le prénom est requis" }),
    lastName: z.string().min(1, { message: "Le nom est requis" }),
    middleName: z.string().optional(),
    email: z.string().email({ message: "Email invalide" }),
    role: z.enum(["ROOT", "ADMIN", "SECURITY", "RECEPTION"], {
        message: "Veuillez sélectionner un rôle",
    }),
});

interface UserInviteFormProps {
    onSuccess: () => void;
}

export function UserInviteForm({ onSuccess }: UserInviteFormProps) {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            middleName: "",
            email: "",
            role: "RECEPTION",
        },
    });

    const isSubmitting = form.formState.isSubmitting;

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!slug) return;

        try {
            await authorizeUser(
                slug,
                values.email,
                values.role,
                values.firstName,
                values.lastName,
                values.middleName || undefined
            );
            toast.success(`Accès autorisé pour ${values.firstName} ${values.lastName}`);
            queryClient.invalidateQueries({ queryKey: ["tenant-users", slug] });
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">

                {/* Identity Row */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-400">Prénom *</FormLabel>
                                <FormControl>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <Input
                                            placeholder="Jean"
                                            className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold uppercase" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-400">Nom *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="DUPONT"
                                        className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium uppercase"
                                        {...field}
                                        onChange={e => field.onChange(e.target.value.toUpperCase())}
                                    />
                                </FormControl>
                                <FormMessage className="text-[10px] font-bold uppercase" />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-400">Deuxième prénom <span className="text-gray-300 font-bold normal-case">(optionnel)</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Marie"
                                    className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold uppercase" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-400">Adresse email *</FormLabel>
                            <FormControl>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <Input
                                        placeholder="exemple@entreprise.com"
                                        className="pl-10 h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium"
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold uppercase" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-widest text-gray-400">Rôle assigné *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-100 focus:bg-white transition-all font-medium">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-gray-400" />
                                            <SelectValue placeholder="Choisir un rôle" />
                                        </div>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                    <SelectItem value="ROOT" className="py-3 font-bold text-indigo-700">ROOT (Super Admin)</SelectItem>
                                    <SelectItem value="ADMIN" className="py-3 font-bold text-blue-700">ADMINISTRATEUR</SelectItem>
                                    <SelectItem value="SECURITY" className="py-3 font-bold text-emerald-700">SÉCURITÉ</SelectItem>
                                    <SelectItem value="RECEPTION" className="py-3 font-bold text-amber-700">RÉCEPTION</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px] font-bold uppercase" />
                        </FormItem>
                    )}
                />

                <div className="pt-2 flex flex-col gap-3">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Autoriser l'accès
                    </Button>
                    <p className="text-[10px] text-gray-400 text-center font-bold px-4 leading-relaxed tracking-tight">
                        Le collaborateur pourra se connecter avec son compte Clerk via cet email. Son rôle sera appliqué automatiquement.
                    </p>
                </div>
            </form>
        </Form>
    );
}
