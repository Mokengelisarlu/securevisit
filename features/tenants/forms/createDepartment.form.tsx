"use client";

import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { useCreateDepartment } from "../hooks/createDepartment.hook";
import { useTenant } from "@/lib/tenant-provider";

const formSchema = z.object({
  name: z.string().min(2, "Le nom du département est requis"),
  abbreviation: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

export function CreateDepartmentForm() {
  const { slug: tenantSlug } = useTenant();
  const router = useRouter();

  if (!tenantSlug) return null;

  const createDept = useCreateDepartment(tenantSlug);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
    },
  });

  async function onSubmit(values: FormSchema) {
    try {
      await createDept.mutateAsync({
        name: values.name,
        abbreviation: values.abbreviation
      });
      toast.success("Département créé avec succès !");
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Échec de la création du département");
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-[2] space-y-1">
                <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nom du Département
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: Ressources Humaines"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="abbreviation"
            render={({ field }) => (
              <FormItem className="flex-1 space-y-1">
                <FormLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Abréviation
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="ex: RH"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={createDept.isPending}
            className="h-10 px-6 bg-[#0055cc] hover:bg-[#0044aa] text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            {createDept.isPending ? "Création..." : "Ajouter"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
