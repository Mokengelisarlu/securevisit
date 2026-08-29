"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Loader2, Building2, Clock } from "lucide-react";
import { useHostPortalData } from "@/features/tenants/hooks/useHostPortal.hook";
import { VisitStatusBadge, ParticipantStatusBadge } from "@/features/tenants/components/host/HostStatusBadge";

export default function HostCurrentlyInsidePage() {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading } = useHostPortalData(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="text-gray-500 font-medium">Chargement des visiteurs sur place...</p>
      </div>
    );
  }

  const inside = data?.inside ?? { count: 0, individuals: [], participants: [] };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 border border-green-100 flex items-center justify-center">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <p className="text-3xl font-black text-gray-900 leading-none tabular-nums">{inside.count}</p>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-1">
            Visiteur{inside.count !== 1 ? "s" : ""} actuellement sur place
          </p>
        </div>
      </div>

      {/* Group participants */}
      {(inside.participants ?? []).length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Visites de groupe</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {(inside.participants ?? []).map((p: any) => (
              <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-11 h-11 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center justify-center font-black shrink-0">
                  {p.visitor?.firstName?.[0]}{p.visitor?.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 truncate">
                      {p.visitor ? `${p.visitor.firstName} ${p.visitor.lastName}` : "Participant"}
                    </p>
                    <ParticipantStatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-gray-400">{p.visit?.visitNumber}</span>
                    {p.visit?.groupName && <span>· {p.visit.groupName}</span>}
                    {p.visit?.host && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {p.visit.host.firstName} {p.visit.host.lastName}
                      </span>
                    )}
                  </p>
                </div>
                {p.checkedInAt && (
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" /> {format(new Date(p.checkedInAt), "HH:mm", { locale: fr })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Individual walk-ins / single visits */}
      {(inside.individuals ?? []).length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Visites individuelles</h3>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {(inside.individuals ?? []).map((visit: any) => (
              <div key={visit.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-11 h-11 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center justify-center font-black shrink-0">
                  {visit.visitor?.firstName?.[0]}{visit.visitor?.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 truncate">
                      {visit.visitor ? `${visit.visitor.firstName} ${visit.visitor.lastName}` : "Visiteur"}
                    </p>
                    <VisitStatusBadge status="IN" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-gray-400">{visit.visitNumber}</span>
                    {visit.department?.name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {visit.department.name}
                      </span>
                    )}
                    {visit.host && (
                      <span>· Hôte : {visit.host.firstName} {visit.host.lastName}</span>
                    )}
                  </p>
                </div>
                {visit.checkInAt && (
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" /> {format(new Date(visit.checkInAt), "HH:mm", { locale: fr })}
                  </span>
                )}
                <Link
                  href={`/tenants/${slug}/visiteurs/list/${visit.id}`}
                  className={`text-xs font-black uppercase tracking-widest ${"text-teal-600 hover:text-teal-700"} shrink-0`}
                >
                  Détails
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {(inside.count === 0 || ((inside.participants ?? []).length === 0 && (inside.individuals ?? []).length === 0)) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto" />
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-3">
            Personne sur place pour le moment
          </p>
        </div>
      )}
    </div>
  );
}