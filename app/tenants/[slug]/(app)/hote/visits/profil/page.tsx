"use client";

import { useParams } from "next/navigation";
import {
  Loader2,
  AlertTriangle,
  UserCircle,
  Mail,
  Phone,
  Building2,
  Hash,
  Shield,
} from "lucide-react";
import { useHostPortalData } from "@/features/tenants/hooks/useHostPortal.hook";

export default function HostProfilePage() {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading } = useHostPortalData(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="text-gray-500 font-medium">Chargement du profil...</p>
      </div>
    );
  }

  const host = data?.host;
  const actor = data?.actor;

  return (
    <div className="space-y-6">
      {data && !host && actor?.role === "HOST" && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black text-amber-800 uppercase tracking-widest text-xs">
              Fiche hôte non liée
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Votre compte Hôte n’est pas encore associé à une fiche hôte. L’administrateur doit créer
              une fiche hôte avec votre adresse e-mail afin que vos visites puissent être rattachées.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 h-32 relative">
          <div className="absolute -bottom-10 left-8 w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center font-black text-2xl text-teal-600">
            {host ? `${host.firstName?.[0]}${host.lastName?.[0]}` : actor?.role?.[0]}
          </div>
        </div>
        <div className="pt-12 px-8 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-gray-900">
              {host ? `${host.firstName} ${host.middleName ? host.middleName + " " : ""}${host.lastName}` : "Profil hôte"}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-black uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5" /> Hôte
            </span>
          </div>
          {host && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProfileRow icon={<Mail className="w-4 h-4" />} label="E-mail" value={host.email || "—"} />
              <ProfileRow icon={<Phone className="w-4 h-4" />} label="Téléphone" value={host.phone || "—"} />
              <ProfileRow icon={<Building2 className="w-4 h-4" />} label="Département" value={host.department?.name || "—"} />
              <ProfileRow icon={<Hash className="w-4 h-4" />} label="Fiche hôte" value={host.id.substring(0, 8)} />
            </div>
          )}
          {!host && actor && (
            <div className="mt-6 grid grid-cols-1 gap-4">
              <ProfileRow icon={<UserCircle className="w-4 h-4" />} label="Identifiant" value={actor.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
      <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-teal-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}