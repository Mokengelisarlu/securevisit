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
import { useCreateTenant } from "../hooks/createTenant.hook";

/* ---------------------------------------
   Schema
--------------------------------------- */
const formSchema = z.object({
  name: z.string().min(2, "Le nom de l'entreprise est requis"),

  slug: z
    .string()
    .min(2, "L'URL est requise")
    .max(20, "L'URL doit être courte")
    .regex(/^[a-z0-9-]+$/, "Uniquement des lettres minuscules, chiffres et tirets"),
});

/* ---------------------------------------
   Props
--------------------------------------- */
interface CreateTenantFormProps {
  onSuccess?: (slug: string) => void;
}

/* ---------------------------------------
   Component
--------------------------------------- */
export function CreateTenantForm({ onSuccess }: CreateTenantFormProps) {
  const createTenant = useCreateTenant();
  const router = useRouter();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });



  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await createTenant.mutateAsync({
        name: values.name,
        slug: values.slug,
      });

      toast.success("Portail créé avec succès !");
      form.reset();

      // 🔁 Use result slug for redirect to ensure consistency
      if (onSuccess) {
        onSuccess(result.slug);
      } else {
        router.push("/tenants");
      }
    } catch (error: any) {
      // 🟥 Slug conflict
      if (error?.status === 409) {
        form.setError("slug", {
          type: "manual",
          message: "Cette URL est déjà utilisée",
        });

        toast.error("URL déjà utilisée");
        return;
      }

      // 🟠 Generic error fallback
      toast.error(
        error?.message || "Une erreur est survenue. Veuillez réessayer."
      );
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Company name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#374151] font-medium mb-1.5">Nom de l'entreprise</FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme Corporation"
                  className="bg-[#F9FAFB] border-[#E5E7EB] focus:border-[#0DBDB5] focus:ring-[#0DBDB5]/20 rounded-xl py-3 text-[#0E1116] placeholder:text-[#9CA3AF]"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        {/* Acronyme / Slug */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <div className="space-y-1">
                <FormLabel className="text-[#374151] font-medium mb-1.5">Votre URL de portail</FormLabel>
                <p className="text-xs text-[#6B7280]">
                  Ceci est l'adresse unique que vous utiliserez pour accéder à votre système.
                </p>
              </div>
              <FormControl>
                <div className="relative flex items-center">
                  <Input
                    placeholder="mon-entreprise"
                    className="bg-[#F9FAFB] border-[#E5E7EB] focus:border-[#0DBDB5] focus:ring-[#0DBDB5]/20 rounded-xl py-3 text-[#0E1116] placeholder:text-[#9CA3AF] pr-40"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                  <div className="absolute right-3 px-3 py-1 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] pointer-events-none">
                    <span className="text-sm font-semibold text-[#6B7280]">.securevisit.com</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button
          type="submit"
          disabled={createTenant.isPending}
          className="w-full bg-[#0DBDB5] hover:bg-[#0CA8A0] text-white font-medium py-7 rounded-xl shadow-lg shadow-[#0DBDB5]/20 transition-all active:scale-[0.98] mt-4"
        >
          {createTenant.isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Création en cours...</span>
            </div>
          ) : (
            "Créer mon portail professionnel"
          )}
        </Button>

        {createTenant.isError && (
          <p className="text-sm text-yellow-500">
            {(createTenant.error as Error).message}
          </p>
        )}
      </form>
    </Form>
  );
}
