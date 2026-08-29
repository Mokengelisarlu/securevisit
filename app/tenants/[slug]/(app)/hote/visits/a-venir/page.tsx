"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Loader2, Link2, AlertCircle } from "lucide-react";
import { useHostPortalData } from "@/features/tenants/hooks/useHostPortal.hook";
import { VisitStatusBadge, ParticipantStatusBadge } from "@/features/tenants/components/host/HostStatusBadge";
import { HostVisitActions } from "@/features/tenants/components/host/HostVisitActions";

export default function HostUpcomingVisitsPage() {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading } = useHostPortalData(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="text-gray-500 font-medium">Chargement des visites prévues...</p>
      </div>
    );
  }

  const upcoming = data?.upcoming ?? [];
  const sorted = [...upcoming].sort(
    (a: any, b: any) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime()
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" /> Visites approuvées à venir
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-1">
          {sorted.length === 0
            ? "Aucune visite approuvée à venir."
            : `${sorted.length} visite${sorted.length > 1 ? "s" : ""} approuvée${sorted.length > 1 ? "s" : ""}.`}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-20 text-center">
            <CalendarDays className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-3">
              Aucune visite approuvée
            </p>
          </div>
        ) : (
          sorted.map((visit: any) => (
            <div key={visit.id} className="p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-lg shrink-0">
                    {visit.visitor?.firstName?.[0]}{visit.visitor?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-gray-900 truncate text-base">
                        {visit.visitor ? `${visit.visitor.firstName} ${visit.visitor.lastName}` : visit.groupName || "Visite"}
                      </p>
                      <VisitStatusBadge status={visit.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1 flex-wrap">
                      <span className="font-mono font-bold text-gray-400">{visit.visitNumber}</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        <span className="font-bold text-gray-700">
                          {format(new Date(visit.visitDate), "EEEE dd MMM · HH:mm", { locale: fr })}
                        </span>
                      </span>
                      {visit.isOverdue && (
                        <span className="flex items-center gap-1 text-red-500 font-bold bg-red-50 rounded-lg px-2 py-1">
                          <AlertCircle className="w-3 h-3" /> Dépassée
                        </span>
                      )}
                    </div>
                    {visit.arrivalAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Accueil prévu : {format(new Date(visit.arrivalAt), "HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="lg:ml-auto flex flex-wrap items-center gap-2">
                  {(visit.participants ?? []).length > 0 && (
                    <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-600">
                      {visit.participants.map((p: any) => (
                        <span key={p.id} className="flex items-center gap-1">
                          {p.visitor?.firstName} {p.visitor?.lastName}
                        </span>
                      ))}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(visit.participants ?? []).map((p: any) => (
                      <ParticipantStatusBadge key={p.id} status={p.status} />
                    ))}
                  </div>
                  <Link
                    href={`/tenants/${slug}/visiteurs/list/${visit.id}`}
                    className="text-xs font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <Link2 className="w-3.5 h-3.5" /> Détails
                  </Link>
                  <HostVisitActions visit={visit} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}