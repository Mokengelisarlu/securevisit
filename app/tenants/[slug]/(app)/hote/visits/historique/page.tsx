"use client";

import { useParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Loader2 } from "lucide-react";
import { useHostPortalData } from "@/features/tenants/hooks/useHostPortal.hook";
import { VisitStatusBadge } from "@/features/tenants/components/host/HostStatusBadge";

export default function HostHistoryPage() {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading } = useHostPortalData(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="text-gray-500 font-medium">Chargement de l'historique...</p>
      </div>
    );
  }

  const history = data?.history ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" /> Historique des visites
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Dernières visites terminées, reportées ou refusées.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {history.length === 0 ? (
          <div className="py-20 text-center">
            <History className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-3">
              Aucune visite dans l'historique
            </p>
          </div>
        ) : (
          history.map((visit: any) => (
            <div key={visit.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="w-11 h-11 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center justify-center font-black shrink-0">
                {visit.visitor?.firstName?.[0]}{visit.visitor?.lastName?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900 truncate">
                    {visit.visitor ? `${visit.visitor.firstName} ${visit.visitor.lastName}` : visit.groupName || "Visite"}
                  </p>
                  <VisitStatusBadge status={visit.status} />
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-gray-400">{visit.visitNumber}</span>
                  <span>{format(new Date(visit.visitDate), "EEEE dd MMM yyyy · HH:mm", { locale: fr })}</span>
                  {visit.host && <span>· {visit.host.firstName} {visit.host.lastName}</span>}
                  {visit.reason && <span className="text-red-500">· {visit.reason}</span>}
                </p>
              </div>
              {(visit.checkOutAt || visit.status === "OUT") && (
                <span className="text-xs font-bold text-gray-400 shrink-0">
                  Sortie : {format(new Date(visit.checkOutAt || visit.updatedAt), "dd MMM · HH:mm", { locale: fr })}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}