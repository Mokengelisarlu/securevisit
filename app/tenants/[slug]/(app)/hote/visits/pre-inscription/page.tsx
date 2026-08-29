"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo } from "react";
import {
  User,
  Search,
  UserPlus,
  MessageSquare,
  CalendarDays,
  Car,
  Loader2,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTenant } from "@/lib/tenant-provider";
import {
  useGetVisitors,
  useGetHosts,
  useGetVisitorTypes,
  useGetCurrentUser,
} from "@/features/tenants/hooks/useGetTenantData";
import { useHostPreRegistration } from "@/features/tenants/hooks/useHostPortal.hook";

const schema = z
  .object({
    visitorSelection: z.enum(["existing", "new"]),
    visitorId: z.string().optional(),
    newVisitor: z
      .object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        visitorTypeId: z.string().optional(),
      })
      .optional(),
    hostId: z.string().optional(),
    purpose: z.string().min(2, "Motif requis"),
    visitDate: z.string().min(1, "Date et heure requises"),
    notes: z.string().optional(),
    hasVehicle: z.boolean(),
    plateNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.visitorSelection === "existing" && !data.visitorId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Veuillez sélectionner un visiteur", path: ["visitorId"] });
    }
    if (data.visitorSelection === "new") {
      if (!data.newVisitor?.firstName || data.newVisitor.firstName.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Prénom requis (min 2)", path: ["newVisitor", "firstName"] });
      }
      if (!data.newVisitor?.lastName || data.newVisitor.lastName.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nom requis (min 2)", path: ["newVisitor", "lastName"] });
      }
      if (!data.newVisitor?.visitorTypeId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type requis", path: ["newVisitor", "visitorTypeId"] });
      }
    }
    if (data.hasVehicle && !data.plateNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Plaque d'immatriculation requise", path: ["plateNumber"] });
    }
  });

type Schema = z.infer<typeof schema>;

export default function HostPreRegistrationPage() {
  const { slug } = useTenant();
  const [visitorSearch, setVisitorSearch] = useState("");
  const [hostSearch, setHostSearch] = useState("");

  const { data: visitors } = useGetVisitors(slug || "");
  const { data: hosts } = useGetHosts(slug || "");
  const { data: visitorTypes } = useGetVisitorTypes(slug || "");
  const { data: currentUser } = useGetCurrentUser(slug || "");
  const isAdmin = !!currentUser && ["ADMIN", "ROOT"].includes(currentUser.role);
  const isHost = !!currentUser && currentUser.role === "HOST";

  const create = useHostPreRegistration(slug || "");

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      visitorSelection: "existing",
      visitorId: "",
      hostId: "",
      purpose: "",
      visitDate: "",
      notes: "",
      hasVehicle: false,
      plateNumber: "",
      newVisitor: { firstName: "", lastName: "", phone: "", company: "", visitorTypeId: "" },
    },
  });

  const visitorSelection = form.watch("visitorSelection");

  const filteredVisitors = useMemo(() => {
    if (!visitors || !visitorSearch) return [];
    return visitors
      .filter(
        (v: any) =>
          `${v.firstName} ${v.lastName}`.toLowerCase().includes(visitorSearch.toLowerCase()) ||
          (v.company && v.company.toLowerCase().includes(visitorSearch.toLowerCase()))
      )
      .slice(0, 5);
  }, [visitors, visitorSearch]);

  const filteredHosts = useMemo(() => {
    if (!hosts || !hostSearch) return [];
    return hosts
      .filter((h: any) => `${h.firstName} ${h.lastName}`.toLowerCase().includes(hostSearch.toLowerCase()))
      .slice(0, 5);
  }, [hosts, hostSearch]);

  async function onSubmit(values: Schema) {
    try {
      await create.mutateAsync({
        visitorId: values.visitorSelection === "existing" ? values.visitorId : undefined,
        newVisitor:
          values.visitorSelection === "new"
            ? {
                firstName: values.newVisitor!.firstName!,
                lastName: values.newVisitor!.lastName!,
                phone: values.newVisitor?.phone || null,
                company: values.newVisitor?.company || null,
                visitorTypeId: values.newVisitor!.visitorTypeId || null,
              }
            : undefined,
        hostId: isAdmin ? values.hostId || null : null,
        purpose: values.purpose,
        visitDate: new Date(values.visitDate),
        notes: values.notes || null,
      });
      toast.success("Visite pré-inscrite avec succès !");
      form.reset();
      setVisitorSearch("");
      setHostSearch("");
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la pré-inscription");
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-2xl p-5">
        <ShieldCheck className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-teal-700">Pré-inscription d’un visiteur</p>
          <p className="text-sm text-teal-800/80 mt-1">
            La visite est enregistrée comme approuvée et visible par l’équipe d’accueil.
            {isHost ? " Elle sera automatiquement rattachée à votre compte." : ""}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => form.setValue("visitorSelection", "existing")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  visitorSelection === "existing" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500"
                }`}
              >
                Visiteur existant
              </button>
              <button
                type="button"
                onClick={() => form.setValue("visitorSelection", "new")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  visitorSelection === "new" ? "bg-white text-teal-600 shadow-sm" : "text-gray-500"
                }`}
              >
                Nouveau visiteur
              </button>
            </div>

            {visitorSelection === "existing" ? (
              <FormField
                control={form.control}
                name="visitorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-gray-400">Rechercher Visiteur</FormLabel>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tapez un nom..."
                        className="pl-9 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        value={visitorSearch}
                        onChange={(e) => {
                          setVisitorSearch(e.target.value);
                          if (field.value) field.onChange("");
                        }}
                      />
                      {field.value && (
                        <button type="button" onClick={() => { field.onChange(""); setVisitorSearch(""); }} className="absolute right-3 top-3">
                          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                      {visitorSearch && filteredVisitors.length > 0 && !field.value && (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md absolute w-full z-50 mt-1">
                          {filteredVisitors.map((v: any) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => { field.onChange(v.id); setVisitorSearch(`${v.firstName} ${v.lastName}`); }}
                              className="w-full flex items-center justify-between p-3 hover:bg-teal-50 transition-colors text-left border-b border-gray-100 last:border-0"
                            >
                              <div>
                                <p className="text-sm font-bold text-gray-900">{v.firstName} {v.lastName}</p>
                                <p className="text-xs text-gray-500">{v.company || "Individuel"}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="newVisitor.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Prénom" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newVisitor.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Nom" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="newVisitor.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Téléphone" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newVisitor.company"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Entreprise" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="newVisitor.visitorTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500">
                            <SelectValue placeholder="Type de visiteur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {visitorTypes?.map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-gray-400">Date et Heure prévue</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input type="datetime-local" {...field} className="pl-9 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-gray-400">Motif de la visite</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="ex: Réunion de coordination..." {...field} value={field.value || ""} className="pl-9 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isAdmin && (
              <FormField
                control={form.control}
                name="hostId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-gray-400">Hôte destinataire</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher un hôte..."
                        className="pl-9 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                        value={hostSearch}
                        onChange={(e) => {
                          setHostSearch(e.target.value);
                          if (field.value) field.onChange("");
                        }}
                      />
                      {hostSearch && filteredHosts.length > 0 && !field.value && (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md absolute w-full z-50 mt-1">
                          {filteredHosts.map((h: any) => (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => { field.onChange(h.id); setHostSearch(`${h.firstName} ${h.lastName}`); }}
                              className="w-full flex items-center p-3 hover:bg-teal-50 transition-colors text-left border-b border-gray-100 last:border-0"
                            >
                              <p className="text-sm font-bold text-gray-900">{h.firstName} {h.lastName}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Car className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Véhicule</p>
                    <p className="text-xs text-gray-500">Plaque d’immatriculation</p>
                  </div>
                </div>
                <Switch checked={form.watch("hasVehicle")} onCheckedChange={(c) => form.setValue("hasVehicle", c)} />
              </div>

              {form.watch("hasVehicle") && (
                <FormField
                  control={form.control}
                  name="plateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-gray-400">Plaque</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: AA-123-BB" {...field} value={field.value || ""} className="h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-gray-400">Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informations complémentaires pour l'accueil..."
                      {...field}
                      value={field.value || ""}
                      className="min-h-[80px] border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                type="submit"
                disabled={create.isPending}
                className="bg-teal-600 hover:bg-teal-700 font-bold text-white shadow-lg h-11 rounded-xl px-8"
              >
                {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Confirmer la pré-inscription
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}