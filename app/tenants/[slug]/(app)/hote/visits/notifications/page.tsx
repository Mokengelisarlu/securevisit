"use client";

import { useParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Loader2, MailOpen, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHostPortalData, useMarkNotificationRead } from "@/features/tenants/hooks/useHostPortal.hook";
import { NotificationTypeIcon } from "@/features/tenants/components/host/NotificationTypeIcon";

export default function HostNotificationsPage() {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading } = useHostPortalData(slug);
  const markRead = useMarkNotificationRead(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        <p className="text-gray-500 font-medium">Chargement des notifications...</p>
      </div>
    );
  }

  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n: any) => !n.isRead);

  async function handleMarkRead(id: string) {
    try {
      await markRead.mutateAsync(id);
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la mise à jour");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-500" /> Notifications
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {unread.length === 0
              ? "Vous n'avez aucune notification non lue."
              : `${unread.length} notification${unread.length > 1 ? "s" : ""} non lue${unread.length > 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-3">
              Aucune notification
            </p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n.id}
              className={cn(
                "p-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors",
                !n.isRead && "bg-violet-50/40"
              )}
            >
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", n.isRead ? "bg-gray-50 text-gray-400 border border-gray-100" : "bg-violet-100 text-violet-600 border border-violet-200")}>
                <NotificationTypeIcon type={n.type} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn("text-sm truncate", n.isRead ? "font-semibold text-gray-500" : "font-black text-gray-900")}>
                    {n.title}
                  </p>
                  {!n.isRead && n.visitId && (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-teal-600 text-white rounded-lg px-2 py-0.5">
                      Visite
                    </span>
                  )}
                </div>
                {n.body && <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>}
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {format(new Date(n.createdAt), "EEEE dd MMM · HH:mm", { locale: fr })}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  disabled={markRead.isPending}
                  className="shrink-0 text-[10px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-700 flex items-center gap-1 disabled:opacity-50"
                >
                  {markRead.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <MailOpen className="w-3 h-3" />}
                  Marquer lue
                </button>
              )}
              {n.isRead && n.readAt && (
                <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Lue
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}