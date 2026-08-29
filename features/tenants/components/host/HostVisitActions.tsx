"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Ban } from "lucide-react";
import { useTenant } from "@/lib/tenant-provider";
import { useApproveVisit } from "../../hooks/useHostPortal.hook";
import { VisitDecisionModal, type DecisionMode } from "../../modals/VisitDecisionModal";

/**
 * Decision buttons for a host/tenant visit.
 * - PENDING_APPROVAL → Approve / Reject / Postpone.
 * - Active (APPROVED / IN / SCHEDULED / POSTPONED) → Cancel.
 */
export function HostVisitActions({ visit }: { visit: any }) {
  const { slug } = useTenant();
  const approve = useApproveVisit(slug || "");
  const [decision, setDecision] = useState<DecisionMode | null>(null);
  const [target, setTarget] = useState<any>(null);

  const status = visit?.status;

  if (!visit) return null;

  async function handleApprove() {
    try {
      await approve.mutateAsync(visit.id);
      toast.success("Visite approuvée — le visiteur peut maintenant être accueilli.");
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'approbation");
    }
  }

  const openDecision = (mode: DecisionMode) => {
    setDecision(mode);
    setTarget(visit);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status === "PENDING_APPROVAL" && (
          <>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={approve.isPending}
              className="bg-teal-600 hover:bg-teal-700 h-9 px-4 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm"
            >
              {approve.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
              Approuver
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openDecision("reject")}
              className="h-9 px-4 text-xs font-black uppercase tracking-widest rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            >
              Refuser
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openDecision("postpone")}
              className="h-9 px-4 text-xs font-black uppercase tracking-widest rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
            >
              Reporter
            </Button>
          </>
        )}
        {["APPROVED", "IN", "SCHEDULED", "POSTPONED"].includes(status) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openDecision("cancel")}
            className="h-9 px-4 text-xs font-black uppercase tracking-widest rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          >
            <Ban className="w-3.5 h-3.5 mr-1.5" />
            Annuler
          </Button>
        )}
      </div>

      {decision && target && (
        <VisitDecisionModal
          isOpen={!!decision}
          onClose={() => {
            setDecision(null);
            setTarget(null);
          }}
          mode={decision}
          visit={target}
        />
      )}
    </>
  );
}