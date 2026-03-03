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
              <FormLabel className="text-white">Nom de l'entreprise</FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme Corporation"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage className="text-yellow-500" />
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
                <FormLabel className="text-white">Votre Url</FormLabel>
                <p className="text-xs text-slate-400">
                  Ceci est l'URL que vous utiliserez pour accéder à votre application.
                </p>
              </div>
              <FormControl>
                <div className="relative flex items-center">
                  <Input
                    placeholder="mon-entreprise"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 pr-36"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                  <div className="absolute right-3 px-2 py-1 bg-slate-700/50 rounded border border-slate-600 pointer-events-none">
                    <span className="text-sm font-medium text-slate-300">.securevisit.com</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage className="text-yellow-500" />
            </FormItem>
          )}
        />


        <Button
          type="submit"
          disabled={createTenant.isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-6 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          {createTenant.isPending ? "Création en cours..." : "Créer mon portail"}
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
