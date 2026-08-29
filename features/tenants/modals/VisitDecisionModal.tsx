"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/custom-modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, ThumbsDown, CalendarClock, Ban, AlertTriangle } from "lucide-react";
import { useTenant } from "@/lib/tenant-provider";
import { useRejectVisit, usePostponeVisit, useCancelVisit } from "../hooks/useHostPortal.hook";

export type DecisionMode = "reject" | "postpone" | "cancel";

const MODE_META: Record<
  DecisionMode,
  { title: string; confirmLabel: string; desc: string; icon: React.ReactNode }
> = {
  reject: {
    title: "Refuser la visite",
    confirmLabel: "Refuser la visite",
    desc: "Le visiteur et l'équipe d'accueil seront notifiés de ce refus.",
    icon: <ThumbsDown className="w-4 h-4 mr-2" />,
  },
  postpone: {
    title: "Reporter la visite",
    confirmLabel: "Reporter",
    desc: "Proposez une nouvelle date. La visite reste en attente jusqu'à l'accord du visiteur.",
    icon: <CalendarClock className="w-4 h-4 mr-2" />,
  },
  cancel: {
    title: "Annuler la visite",
    confirmLabel: "Annuler la visite",
    desc: "Cette action est définitive et sera consignée dans l'audit de la visite.",
    icon: <Ban className="w-4 h-4 mr-2" />,
  },
};

interface VisitDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DecisionMode;
  visit: any;
}

export function VisitDecisionModal({ isOpen, onClose, mode, visit }: VisitDecisionModalProps) {
  const { slug } = useTenant();
  const [reason, setReason] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [error, setError] = useState("");

  const reject = useRejectVisit(slug || "");
  const postpone = usePostponeVisit(slug || "");
  const cancel = useCancelVisit(slug || "");

  if (!visit) return null;

  const meta = MODE_META[mode];
  const isPending =
    mode === "reject" ? reject.isPending : mode === "postpone" ? postpone.isPending : cancel.isPending;

  async function handleSubmit() {
    setError("");
    try {
      if (mode === "postpone") {
        if (!proposedDate) {
          setError("Veuillez choisir une nouvelle date.");
          return;
        }
        await postpone.mutateAsync({
          visitId: visit.id,
          newProposedDate: new Date(proposedDate),
          reason: reason || null,
        });
        toast.success("Visite reportée.");
      } else if (mode === "reject") {
        await reject.mutateAsync({ visitId: visit.id, reason: reason || null });
        toast.success("Visite refusée.");
      } else {
        await cancel.mutateAsync({ visitId: visit.id, reason: reason || null });
        toast.success("Visite annulée.");
      }
      onClose();
      setReason("");
      setProposedDate("");
    } catch (e: any) {
      setError(e?.message || "Une erreur est survenue");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={meta.title} size="md">
      <div className="space-y-6">
        {/* Visit summary */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-teal-600 shadow-sm">
            {visit.visitor?.firstName?.[0]}{visit.visitor?.lastName?.[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">
              {visit.visitor ? `${visit.visitor.firstName} ${visit.visitor.lastName}` : "Visite"}
            </p>
            <p className="text-xs text-gray-500 font-mono font-bold">{visit.visitNumber}</p>
            {visit.groupName && (
              <p className="text-xs text-gray-500 font-semibold truncate">{visit.groupName}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm text-gray-600">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p>{meta.desc}</p>
        </div>

        {mode === "postpone" && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Nouvelle date et heure proposée
            </label>
            <div className="relative">
              <CalendarClock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="datetime-local"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="pl-9 h-11 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {mode === "postpone" ? "Motif du report" : mode === "reject" ? "Motif du refus" : "Motif de l'annulation"}{" "}
            <span className="text-gray-300 normal-case">(optionnel)</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Expliquez votre décision..."
            className="min-h-[90px] border-gray-200 focus:border-teal-500 focus:ring-teal-500"
          />
        </div>

        {error && (
          <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} className="font-bold px-6">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className={
              mode === "reject" || mode === "cancel"
                ? "bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg h-11 rounded-xl px-6"
                : "bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg h-11 rounded-xl px-6"
            }
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : meta.icon}
            {meta.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}