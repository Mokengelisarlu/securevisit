"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useHostPortalData } from "../../hooks/useHostPortal.hook";

export function NotificationsBell({ slug }: { slug: string }) {
  const { data } = useHostPortalData(slug);
  const unread = data?.counts?.unreadNotifications ?? 0;

  return (
    <Link
      href={`/tenants/${slug}/hote/visits/notifications`}
      title="Notifications"
      className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1 border-2 border-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}