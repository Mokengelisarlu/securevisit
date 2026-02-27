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
import { useCreateVisitor } from "../hooks/createVisitor.hook";
import { useTenant } from "@/lib/tenant-provider";

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
});

type FormSchema = z.infer<typeof formSchema>;

export function CreateVisitorForm() {
  const { slug: tenantSlug } = useTenant();
  const router = useRouter();

  if (!tenantSlug) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tenant selected. Please select a tenant first.</p>
      </div>
    );
  }

  const createVisitor = useCreateVisitor(tenantSlug);
  

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      company: "",
    },
  });

  async function onSubmit(values: FormSchema) {
    try {
      await createVisitor.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        company: values.company || undefined,
      });

      toast.success("Visitor created successfully!");
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create visitor");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
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
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Doe"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
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
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
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
              <FormLabel>Company (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme Corp"
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
          disabled={createVisitor.isPending}
          className="w-full"
        >
          {createVisitor.isPending ? "Creating..." : "Create Visitor"}
        </Button>

        {createVisitor.isError && (
          <p className="text-sm text-red-500">
            {(createVisitor.error as Error).message}
          </p>
        )}
      </form>
    </Form>
  );
}
