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
import { Textarea } from "@/components/ui/textarea";
import { useCreateVisitorType } from "../hooks/useCreateVisitorType.hook";
import { useUpdateVisitorType } from "../hooks/useUpdateVisitorType.hook";
import { toast } from "sonner";
import { useEffect } from "react";

const formSchema = z.object({
    name: z.string().min(2, "Le nom est requis"),
    description: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface VisitorTypeFormProps {
    initialData?: {
        id: string;
        name: string;
        description: string | null;
    };
    onSuccess: () => void;
}

export function VisitorTypeForm({ initialData, onSuccess }: VisitorTypeFormProps) {
    const isEditing = !!initialData;
    const createVisitorType = useCreateVisitorType();
    const updateVisitorType = useUpdateVisitorType();

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                description: initialData.description || "",
            });
        }
    }, [initialData, form]);

    async function onSubmit(values: FormSchema) {
        try {
            if (isEditing) {
                await updateVisitorType.mutateAsync({
                    id: initialData.id,
                    data: values,
                });
                toast.success("Type de visiteur mis à jour avec succès !");
            } else {
                await createVisitorType.mutateAsync(values);
                toast.success("Type de visiteur créé avec succès !");
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
                            <FormLabel>Nom du Type</FormLabel>
                            <FormControl>
                                <Input placeholder="ex: Client, Consultant, Prestataire..." {...field} className="border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
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
                                <Textarea
                                    placeholder="Décrivez brièvement ce type de visiteur..."
                                    className="resize-none h-32 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                        type="submit"
                        disabled={createVisitorType.isPending || updateVisitorType.isPending}
                        className="px-8 bg-[#0055cc] hover:bg-[#0044aa] text-white"
                    >
                        {isEditing ? "Enregistrer" : "Créer le Type"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
