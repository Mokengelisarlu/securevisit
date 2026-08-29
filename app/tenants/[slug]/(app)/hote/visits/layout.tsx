"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Hourglass,
  CalendarDays,
  MapPin,
  History,
  UserPlus,
  Bell,
  UserCircle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetCurrentUser } from "@/features/tenants/hooks/useGetTenantData";

const TABS = [
  { href: "/hote/visits", label: "Tableau de bord", icon: <LayoutDashboard className="w-4 h-4" />, exact: true },
  { href: "/hote/visits/en-attente", label: "En attente", icon: <Hourglass className="w-4 h-4" />, exact: false },
  { href: "/hote/visits/a-venir", label: "Prévues", icon: <CalendarDays className="w-4 h-4" />, exact: false },
  { href: "/hote/visits/sur-place", label: "Sur place", icon: <MapPin className="w-4 h-4" />, exact: false },
  { href: "/hote/visits/historique", label: "Historique", icon: <History className="w-4 h-4" />, exact: false },
  { href: "/hote/visits/pre-inscription", label: "Pré-inscription", icon: <UserPlus className="w-4 h-4" />, exact: false },
  { href: "/hote/visits/notifications", label: "Notifications", icon: <Bell className="w-4 h-4" />, exact: false },
  { href: "/hote/visits/profil", label: "Profil", icon: <UserCircle className="w-4 h-4" />, exact: false },
];

export default function HostVisitsLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams() as { slug: string };
  const pathname = usePathname();
  const { data: user, isLoading } = useGetCurrentUser(slug);

  const allowed = !!user && ["HOST", "ADMIN", "ROOT"].includes(user.role);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
        <p className="text-gray-500 font-medium">Chargement du portail hôte...</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Accès réservé aux hôtes</h2>
        <p className="text-gray-500 max-w-sm">
          Le portail hôte est accessible aux utilisateurs disposant du rôle Hôte, Administrateur ou Super Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Portail Hôte</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Approuvez les demandes de visite et suivez vos visiteurs.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50 w-full overflow-x-auto">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                active
                  ? "bg-white text-teal-600 shadow-sm border border-gray-100"
                  : "text-gray-500 hover:bg-white/60"
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}