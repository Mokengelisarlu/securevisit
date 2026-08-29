"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Hourglass,
  CalendarDays,
  MapPin,
  History,
  Bell,
  ChevronRight,
  Users,
  Loader2,
  User,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useHostPortalData } from "@/features/tenants/hooks/useHostPortal.hook";
import { VisitStatusBadge, ParticipantStatusBadge } from "@/features/tenants/components/host/HostStatusBadge";
import { HostVisitActions } from "@/features/tenants/components/host/HostVisitActions";

export default function HostPortalDashboardPage() {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading } = useHostPortalData(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
        <p className="text-gray-500 font-medium">Chargement de vos visites...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">Impossible de charger le portail</h2>
        <p className="text-gray-500 mt-2">Veuillez réessayer dans un instant.</p>
      </div>
    );
  }

  const { counts, pending, upcoming, inside, host } = data;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
        <div className="absolute -bottom-24 -right-8 w-48 h-48 bg-white/10 rounded-full" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-100">
            {host ? `Bienvenue, ${host.firstName} ${host.lastName}` : "Portail Hôte"}
          </p>
          <h2 className="text-3xl font-black tracking-tight mt-2">
            Gérez vos visites en un coup d’œil
          </h2>
          <p className="text-teal-50 font-medium mt-2 max-w-xl">
            {counts.pending > 0
              ? `Vous avez ${counts.pending} demande${counts.pending > 1 ? "s" : ""} en attente d'approbation.`
              : "Aucune demande en attente. Vous êtes à jour !"}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard href="/hote/visits/en-attente" icon={<Hourglass className="w-5 h-5" />} label="En attente" value={counts.pending} tone="amber" />
        <StatCard href="/hote/visits/a-venir" icon={<CalendarDays className="w-5 h-5" />} label="Prévues" value={counts.upcoming} tone="blue" />
        <StatCard href="/hote/visits/sur-place" icon={<MapPin className="w-5 h-5" />} label="Sur place" value={counts.inside} tone="green" />
        <StatCard href="/hote/visits/historique" icon={<History className="w-5 h-5" />} label="Historique" value={counts.history} tone="gray" />
        <StatCard href="/hote/visits/notifications" icon={<Bell className="w-5 h-5" />} label="Non lues" value={counts.unreadNotifications} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending preview */}
        <section className="space-y-4">
          <SectionHeader href="/hote/visits/en-attente" title="Demandes en attente" count={counts.pending} />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {pending.length === 0 ? (
              <Empty text="Aucune demande en attente" />
            ) : (
              pending.slice(0, 5).map((visit: any) => (
                <PreviewRow key={visit.id} visit={visit} actions={<HostVisitActions visit={visit} />} showArrival />
              ))
            )}
          </div>
        </section>

        {/* Preferred upcoming */}
        <section className="space-y-4">
          <SectionHeader href="/hote/visits/a-venir" title="Visites approuvées" count={counts.upcoming} />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {upcoming.length === 0 ? (
              <Empty text="Aucune visite prévue" />
            ) : (
              upcoming.slice(0, 5).map((visit: any) => (
                <PreviewRow key={visit.id} visit={visit} actions={<HostVisitActions visit={visit} />} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Inside preview */}
      <section className="space-y-4">
        <SectionHeader href="/hote/visits/sur-place" title="Visiteurs sur place" count={counts.inside} />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {inside.count === 0 ? (
            <Empty text="Personne ne se trouve actuellement sur place pour vos visites" />
          ) : (
            <>
              {(inside.individuals || []).map((visit: any) => (
                <InsideRow key={visit.id} visit={visit} />
              ))}
              {(inside.participants || []).map((p: any) => (
                <InsideRow key={p.id} p={p} />
              ))}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "amber" | "blue" | "green" | "gray" | "violet";
}) {
  const tones: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  };
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${tones[tone]}`}>
        {icon}
      </div>
      <p className="text-3xl font-black text-gray-900 tabular-nums mt-3 leading-none">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">{label}</p>
    </Link>
  );
}

function SectionHeader({ href, title, count }: { href: string; title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h3>
      <Link href={href} className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700">
        Tout voir <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{text}</p>
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-black shrink-0">
      {initials}
    </div>
  );
}

function PreviewRow({ visit, actions, showArrival }: { visit: any; actions: React.ReactNode; showArrival?: boolean }) {
  const name = visit.visitor
    ? `${visit.visitor.firstName} ${visit.visitor.lastName}`
    : visit.groupName || "Visite";
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar initials={`${visit.visitor?.firstName?.[0] || "V"}${visit.visitor?.lastName?.[0] || ""}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 truncate">{name}</p>
            <VisitStatusBadge status={visit.status} />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-0.5 flex-wrap">
            {visit.visitNumber && <span className="font-mono font-bold">{visit.visitNumber}</span>}
            {visit.host && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {visit.host.firstName} {visit.host.lastName}
              </span>
            )}
            {showArrival && visit.arrivalAt && (
              <span>{format(new Date(visit.arrivalAt), "HH:mm", { locale: fr })}</span>
            )}
            {!showArrival && visit.visitDate && (
              <span>{format(new Date(visit.visitDate), "dd MMM HH:mm", { locale: fr })}</span>
            )}
          </div>
          {visit.purpose && <p className="text-xs text-gray-400 mt-0.5 truncate italic">"{visit.purpose}"</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

function InsideRow({ visit, p }: { visit?: any; p?: any }) {
  if (p) {
    // Group participant row
    return (
      <div className="flex items-center gap-3 p-4">
        <Avatar initials={`${p.visitor?.firstName?.[0] || "V"}${p.visitor?.lastName?.[0] || ""}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 truncate">
              {p.visitor ? `${p.visitor.firstName} ${p.visitor.lastName}` : "Participant"}
            </p>
            <ParticipantStatusBadge status={p.status} />
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> {p.visit?.visitNumber}{p.visit?.groupName ? ` · ${p.visit.groupName}` : ""}
          </p>
        </div>
        {p.checkedInAt && (
          <span className="text-xs font-bold text-gray-400">
            {format(new Date(p.checkedInAt), "HH:mm", { locale: fr })}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <Avatar initials={`${visit.visitor?.firstName?.[0] || "V"}${visit.visitor?.lastName?.[0] || ""}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-900 truncate">
            {visit.visitor ? `${visit.visitor.firstName} ${visit.visitor.lastName}` : "Visiteur"}
          </p>
          <VisitStatusBadge status="IN" />
        </div>
        <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
          <Building2 className="w-3 h-3" /> {visit.host ? `${visit.host.firstName} ${visit.host.lastName}` : "Non assigné"}
          {visit.department?.name ? ` · ${visit.department.name}` : ""}
        </p>
      </div>
      {visit.checkInAt && (
        <span className="text-xs font-bold text-gray-400">
          {format(new Date(visit.checkInAt), "HH:mm", { locale: fr })}
        </span>
      )}
    </div>
  );
}