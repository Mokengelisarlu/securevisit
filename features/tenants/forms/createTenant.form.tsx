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
  name: z.string().min(2, "Company name is required"),

  slug: z
    .string()
    .min(2, "Acronyme is required")
    .max(20, "Acronyme must be short")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
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

      toast.success("Tenant created successfully!");
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
          message: "This acronyme is already used",
        });

        toast.error("Acronyme already in use");
        return;
      }

      // 🟠 Generic error fallback
      toast.error(
        error?.message || "Something went wrong. Please try again."
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
              <FormLabel>Company name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme Corporation"
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
              <FormLabel>Acronyme (short name)</FormLabel>
              <FormControl>
                <Input
                  placeholder="acme"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <Button
          type="submit"
          disabled={createTenant.isPending}
          className="w-full"
        >
          {createTenant.isPending ? "Creating..." : "Create tenant"}
        </Button>

        {createTenant.isError && (
          <p className="text-sm text-red-500">
            {(createTenant.error as Error).message}
          </p>
        )}
      </form>
    </Form>
  );
}
