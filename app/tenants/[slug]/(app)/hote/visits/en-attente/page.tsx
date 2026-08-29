"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Hourglass, Loader2, Users, Link2 } from "lucide-react";
import { useHostPortalData } from "@/features/tenants/hooks/useHostPortal.hook";
import { VisitStatusBadge } from "@/features/tenants/components/host/HostStatusBadge";
import { HostVisitActions } from "@/features/tenants/components/host/HostVisitActions";

export default function HostPendingApprovalsPage() {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading } = useHostPortalData(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="text-gray-500 font-medium">Chargement des demandes...</p>
      </div>
    );
  }

  const pending = data?.pending ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Hourglass className="w-5 h-5 text-amber-500" /> Demandes en attente
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {pending.length === 0
              ? "Aucune demande à traiter."
              : `${pending.length} demande${pending.length > 1 ? "s" : ""} à approuver, refuser ou reporter.`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {pending.length === 0 ? (
          <div className="py-20 text-center">
            <Hourglass className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-3">
              Aucune demande en attente
            </p>
          </div>
        ) : (
          pending.map((visit: any) => (
            <div key={visit.id} className="p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-black text-lg shrink-0">
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
                        Arrivée prévue :{" "}
                        <span className="font-bold text-gray-700">
                          {format(new Date(visit.arrivalAt), "EEEE dd MMM · HH:mm", { locale: fr })}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 italic truncate">« {visit.purpose || "—"} »</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 ml-0 lg:ml-4">
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-3">
                    {visit.host && (
                      <span className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                        Hôte : <span className="font-bold text-gray-700">{visit.host.firstName} {visit.host.lastName}</span>
                      </span>
                    )}
                    {visit.department?.name && (
                      <span className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5">
                        {visit.department.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {visit.participants?.length ?? 0}
                  </div>
                  <Link
                    href={`/tenants/${slug}/visiteurs/list/${visit.id}`}
                    className="text-xs font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <Link2 className="w-3.5 h-3.5" /> Détails
                  </Link>
                </div>

                <div className="lg:ml-auto">
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