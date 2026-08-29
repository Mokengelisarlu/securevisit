"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getHostPortalData,
  approveVisit,
  rejectVisit,
  postponeVisit,
  cancelVisit,
  markNotificationRead,
  createHostPreRegistration,
  getWaitingVisits,
  getPendingVisitRequests,
  getCurrentlyInside,
} from "../queries/visits-lifecycle";

/* =====================================================
   HOST PORTAL — read snapshot (15s polling)
===================================================== */

const HOST_PORTAL_POLL_MS = 15000;
const SNAPSHOT_POLL_MS = 30000;
const SKIP_REFETCH_IF_FRESH_MS = 10000;
const STALE_MS = 10000;

/**
 * Returns a `refetchInterval` that only schedules the next fetch when the
 * cached data is at least SKIP_REFETCH_IF_FRESH_MS old. `refetchInterval`
 * ignores `staleTime`, so without this the public polling queries would re-run
 * the queryFn on every tick even right after a mutation-driven invalidation.
 */
function refetchIntervalWhenStale(intervalMs: number) {
  return (query: { state: { dataUpdatedAt: number } }) => {
    if (!query.state.dataUpdatedAt) return intervalMs;
    return Date.now() - query.state.dataUpdatedAt >= SKIP_REFETCH_IF_FRESH_MS ? intervalMs : false;
  };
}

export function useHostPortalData(tenantSlug: string) {
  return useQuery({
    queryKey: ["host-portal", tenantSlug],
    queryFn: () => getHostPortalData(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: STALE_MS,
    refetchInterval: refetchIntervalWhenStale(HOST_PORTAL_POLL_MS),
  });
}

/* =====================================================
   OPERATOR / ADMIN — lifecycle reads (waiting banner etc.)
===================================================== */

export function useGetWaitingVisits(tenantSlug: string) {
  return useQuery({
    queryKey: ["waiting-visits", tenantSlug],
    queryFn: () => getWaitingVisits(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: STALE_MS,
    refetchInterval: refetchIntervalWhenStale(SNAPSHOT_POLL_MS),
  });
}

export function useGetPendingApprovals(tenantSlug: string) {
  return useQuery({
    queryKey: ["pending-approvals", tenantSlug],
    queryFn: () => getPendingVisitRequests(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: STALE_MS,
    refetchInterval: refetchIntervalWhenStale(SNAPSHOT_POLL_MS),
  });
}

export function useGetCurrentlyInside(tenantSlug: string) {
  return useQuery({
    queryKey: ["currently-inside", tenantSlug],
    queryFn: () => getCurrentlyInside(tenantSlug),
    enabled: !!tenantSlug,
    staleTime: STALE_MS,
    refetchInterval: refetchIntervalWhenStale(SNAPSHOT_POLL_MS),
  });
}

/* =====================================================
   HOST PORTAL — mutations
===================================================== */

function invalidatePortal(queryClient: ReturnType<typeof useQueryClient>, tenantSlug: string) {
  queryClient.invalidateQueries({ queryKey: ["host-portal", tenantSlug] });
  queryClient.invalidateQueries({ queryKey: ["visits", tenantSlug] });
  queryClient.invalidateQueries({ queryKey: ["scheduled-visits", tenantSlug] });
  queryClient.invalidateQueries({ queryKey: ["dashboardStats", tenantSlug] });
  queryClient.invalidateQueries({ queryKey: ["waiting-visits", tenantSlug] });
  queryClient.invalidateQueries({ queryKey: ["pending-approvals", tenantSlug] });
  queryClient.invalidateQueries({ queryKey: ["currently-inside", tenantSlug] });
}

export function useApproveVisit(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitId: string) => approveVisit(tenantSlug, visitId),
    onSuccess: () => invalidatePortal(queryClient, tenantSlug),
  });
}

export function useRejectVisit(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { visitId: string; reason?: string | null }) =>
      rejectVisit(tenantSlug, args.visitId, args.reason ?? null),
    onSuccess: () => invalidatePortal(queryClient, tenantSlug),
  });
}

export function usePostponeVisit(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { visitId: string; newProposedDate: Date; reason?: string | null }) =>
      postponeVisit(tenantSlug, args.visitId, args.newProposedDate, args.reason ?? null),
    onSuccess: () => invalidatePortal(queryClient, tenantSlug),
  });
}

export function useCancelVisit(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { visitId: string; reason?: string | null }) =>
      cancelVisit(tenantSlug, args.visitId, args.reason ?? null),
    onSuccess: () => invalidatePortal(queryClient, tenantSlug),
  });
}

export function useMarkNotificationRead(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(tenantSlug, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-portal", tenantSlug] });
    },
  });
}

export function useHostPreRegistration(tenantSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createHostPreRegistration>[1]) =>
      createHostPreRegistration(tenantSlug, data),
    onSuccess: () => invalidatePortal(queryClient, tenantSlug),
  });
}