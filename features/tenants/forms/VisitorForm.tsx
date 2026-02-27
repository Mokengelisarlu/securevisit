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
import { useCreateVisitor } from "../hooks/createVisitor.hook";
import { useUpdateVisitor } from "../hooks/useUpdateVisitor.hook";
import { useGetVisitorTypes } from "../hooks/useGetTenantData";
import { useTenant } from "@/lib/tenant-provider";
import { toast } from "sonner";
import { useEffect } from "react";
import { User, Phone, Building2, Tag, Loader2 } from "lucide-react";

const formSchema = z.object({
    firstName: z.string().min(2, "Le prénom est requis"),
    lastName: z.string().min(2, "Le nom est requis"),
    phone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    visitorTypeId: z.string().min(1, "Le type de visiteur est requis"),
});

type FormSchema = z.infer<typeof formSchema>;

interface VisitorFormProps {
    initialData?: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        company: string | null;
        visitorTypeId: string | null;
    };
    onSuccess?: () => void;
}

export function VisitorForm({ initialData, onSuccess }: VisitorFormProps) {
    const { slug } = useTenant();
    const isEditing = !!initialData;
    const createVisitor = useCreateVisitor(slug!);
    const updateVisitor = useUpdateVisitor();
    const { data: visitorTypes, isLoading: isLoadingTypes } = useGetVisitorTypes(slug!);

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: initialData?.firstName || "",
            lastName: initialData?.lastName || "",
            phone: initialData?.phone || "",
            company: initialData?.company || "",
            visitorTypeId: initialData?.visitorTypeId || "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                firstName: initialData.firstName,
                lastName: initialData.lastName,
                phone: initialData.phone || "",
                company: initialData.company || "",
                visitorTypeId: initialData.visitorTypeId || "",
            });
        }
    }, [initialData, form]);

    async function onSubmit(values: FormSchema) {
        try {
            const dataToSubmit = {
                ...values,
                phone: values.phone || undefined,
                company: values.company || undefined,
            };

            if (isEditing) {
                await updateVisitor.mutateAsync({
                    id: initialData.id,
                    ...dataToSubmit,
                });
                toast.success("Visiteur mis à jour avec succès !");
            } else {
                await createVisitor.mutateAsync(dataToSubmit);
                toast.success("Visiteur enregistré avec succès !");
                if (!isEditing) form.reset();
            }
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.message || "Une erreur est survenue");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    Prénom
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Jean" {...field} className="h-11" />
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
                                <FormLabel className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    Nom
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Dupont" {...field} className="h-11" />
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
                                <FormLabel className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    Téléphone (Optionnel)
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: +243..." {...field} value={field.value || ""} className="h-11" />
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
                                <FormLabel className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    Entreprise (Optionnel)
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="ex: Google, Freelance..." {...field} value={field.value || ""} className="h-11" />
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
                            <FormLabel className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-gray-400" />
                                Type de Visiteur
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Sélectionnez un type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {isLoadingTypes ? (
                                        <div className="flex items-center justify-center p-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        </div>
                                    ) : (
                                        visitorTypes?.map((type: any) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                        type="submit"
                        disabled={createVisitor.isPending || updateVisitor.isPending}
                        className="px-8 bg-[#0055cc] hover:bg-[#0044aa] h-11 text-white font-bold rounded-lg shadow-sm transition-all hover:scale-[1.02]"
                    >
                        {createVisitor.isPending || updateVisitor.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {isEditing ? "Mettre à jour" : "Enregistrer le Visiteur"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
