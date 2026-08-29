"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const VISIT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  IN: { label: "Sur place", className: "bg-green-100 text-green-700 border-green-200" },
  OUT: { label: "Sorti", className: "bg-gray-100 text-gray-700 border-gray-200" },
  CANCELLED: { label: "Annulé", className: "bg-red-100 text-red-700 border-red-200" },
  SCHEDULED: { label: "Prévu", className: "bg-amber-100 text-amber-700 border-amber-200" },
  PENDING_APPROVAL: { label: "En attente", className: "bg-amber-100 text-amber-700 border-amber-200" },
  APPROVED: { label: "Approuvé", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  POSTPONED: { label: "Reporté", className: "bg-violet-100 text-violet-700 border-violet-200" },
  REJECTED: { label: "Refusé", className: "bg-red-100 text-red-700 border-red-200" },
};

export const PARTICIPANT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  EXPECTED: { label: "Attendu", className: "bg-blue-100 text-blue-700 border-blue-200" },
  WAITING: { label: "En attente", className: "bg-amber-100 text-amber-700 border-amber-200" },
  CHECKED_IN: { label: "Sur place", className: "bg-green-100 text-green-700 border-green-200" },
  CHECKED_OUT: { label: "Sorti", className: "bg-gray-100 text-gray-700 border-gray-200" },
  NO_SHOW: { label: "Absent", className: "bg-red-100 text-red-700 border-red-200" },
  CANCELED: { label: "Annulé", className: "bg-rose-100 text-rose-700 border-rose-200" },
};

export function visitStatusConfig(status: string) {
  return VISIT_STATUS_CONFIG[status] ?? {
    label: status?.replace(/_/g, " ") ?? "Inconnu",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };
}

export function participantStatusConfig(status: string) {
  return PARTICIPANT_STATUS_CONFIG[status] ?? {
    label: status?.replace(/_/g, " ") ?? "Inconnu",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };
}

export function VisitStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = visitStatusConfig(status);
  return (
    <Badge variant="outline" className={cn(config.className, "px-3 py-1 font-bold text-[10px] uppercase tracking-wider", className)}>
      {config.label}
    </Badge>
  );
}

export function ParticipantStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = participantStatusConfig(status);
  return (
    <Badge variant="outline" className={cn(config.className, "px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider", className)}>
      {config.label}
    </Badge>
  );
}