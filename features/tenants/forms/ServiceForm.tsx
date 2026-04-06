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
import { useCreateService } from "../hooks/createService.hook";
import { useUpdateService } from "../hooks/useUpdateService.hook";
import { useGetDepartments } from "../hooks/useGetTenantData";
import { useTenant } from "@/lib/tenant-provider";
import { toast } from "sonner";
import { useEffect } from "react";

const formSchema = z.object({
    name: z.string().min(2, "Le nom du service est requis"),
    description: z.string().optional(),
    departmentId: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface ServiceFormProps {
    initialData?: {
        id: string;
        name: string;
        description: string | null;
        departmentId: string | null;
    };
    onSuccess: () => void;
}

export function ServiceForm({ initialData, onSuccess }: ServiceFormProps) {
    const { slug: tenantSlug } = useTenant();
    const isEditing = !!initialData;

    const { data: departments } = useGetDepartments(tenantSlug || "");
    const createService = useCreateService(tenantSlug || "");
    const updateService = useUpdateService();

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            departmentId: initialData?.departmentId || "",
        },
    });

    // Handle case where initialData might be provided later or changed
    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                description: initialData.description || "",
                departmentId: initialData.departmentId || "",
            });
        }
    }, [initialData, form]);

    async function onSubmit(values: FormSchema) {
        try {
            const dataToSubmit = {
                ...values,
                departmentId: values.departmentId === "none" ? undefined : values.departmentId,
            };

            if (isEditing) {
                await updateService.mutateAsync({
                    id: initialData.id,
                    data: dataToSubmit,
                });
                toast.success("Service mis à jour avec succès !");
            } else {
                await createService.mutateAsync(dataToSubmit);
                toast.success("Service créé avec succès !");
            }
            onSuccess();
        } catch (error: any) {
            toast.error(error?.message || "Une erreur est survenue");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom du Service</FormLabel>
                            <FormControl>
                                <Input placeholder="ex: Maintenance Informatique" className="border-gray-200 focus:border-blue-500 focus:ring-blue-500" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optionnel)</FormLabel>
                            <FormControl>
                                <Input placeholder="ex: Support technique de niveau 1" className="border-gray-200 focus:border-blue-500 focus:ring-blue-500" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Département</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                        <SelectValue placeholder="Sélectionnez un département" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">Aucun département</SelectItem>
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
                        disabled={createService.isPending || updateService.isPending}
                        className="px-8 bg-[#0055cc] hover:bg-[#0044aa] text-white"
                    >
                        {isEditing ? "Enregistrer" : "Créer le Service"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
