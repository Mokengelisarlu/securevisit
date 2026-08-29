"use client";

import {
  Inbox,
  CalendarCheck2,
  XCircle,
  CalendarClock,
  Ban,
  LogIn,
  LogOut,
  UserX,
} from "lucide-react";

export function NotificationTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "VISIT_REQUEST_CREATED":
      return <Inbox className="w-5 h-5" />;
    case "VISIT_APPROVED":
      return <CalendarCheck2 className="w-5 h-5" />;
    case "VISIT_REJECTED":
      return <XCircle className="w-5 h-5" />;
    case "VISIT_POSTPONED":
      return <CalendarClock className="w-5 h-5" />;
    case "VISIT_CANCELLED":
      return <Ban className="w-5 h-5" />;
    case "VISITOR_CHECKED_IN":
      return <LogIn className="w-5 h-5" />;
    case "VISITOR_CHECKED_OUT":
      return <LogOut className="w-5 h-5" />;
    case "VISITOR_NO_SHOW":
      return <UserX className="w-5 h-5" />;
    default:
      return <Inbox className="w-5 h-5" />;
  }
}