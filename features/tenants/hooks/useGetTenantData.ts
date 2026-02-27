"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDepartments,
  getHosts,
  getVisitors,
  getVisitorTypes,
  getVisits,
  getServices,
  getDashboardStats,
  getVisitById,
  getVisitorById,
  getVehicleById,
  getVehicles,
  getHostById,
  getCurrentUser
} from "../queries/tenant-data";

export function useGetCurrentUser(tenantSlug: string) {
  return useQuery({
    queryKey: ["current-user", tenantSlug],
    queryFn: () => getCurrentUser(tenantSlug),
    enabled: !!tenantSlug,
  });
}

export function useGetDepartments(tenantSlug: string) {
  return useQuery({
    queryKey: ["departments", tenantSlug],
    queryFn: () => getDepartments(tenantSlug),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // Keep 1 hour in cache
  });
}

export function useGetServices(tenantSlug: string) {
  return useQuery({
    queryKey: ["services", tenantSlug],
    queryFn: () => getServices(tenantSlug),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

export function useGetHosts(tenantSlug: string) {
  return useQuery({
    queryKey: ["hosts", tenantSlug],
    queryFn: () => getHosts(tenantSlug),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

export function useGetVisitors(tenantSlug: string) {
  return useQuery({
    queryKey: ["visitors", tenantSlug],
    queryFn: () => getVisitors(tenantSlug),
    staleTime: 1000 * 60 * 5, // 5 minutes for visitors
    gcTime: 1000 * 60 * 30,
  });
}

export function useGetVisitorTypes(tenantSlug: string) {
  return useQuery({
    queryKey: ["visitor-types", tenantSlug],
    queryFn: () => getVisitorTypes(tenantSlug),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

export function useGetVisits(
  tenantSlug: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: "IN" | "OUT" | "CANCELLED" | "SCHEDULED";
    visitorId?: string;
    vehicleId?: string;
  }
) {
  return useQuery({
    queryKey: ["visits", tenantSlug, filters],
    queryFn: () => getVisits(tenantSlug, filters),
  });
}

export function useDashboardStats(slug: string) {
  return useQuery({
    queryKey: ["dashboardStats", slug],
    queryFn: () => getDashboardStats(slug),
    refetchInterval: 30000,
  });
}

export function useGetVisitById(tenantSlug: string, visitId: string) {
  return useQuery({
    queryKey: ["visit", tenantSlug, visitId],
    queryFn: () => getVisitById(tenantSlug, visitId),
    enabled: !!tenantSlug && !!visitId,
  });
}

export function useGetVisitorById(tenantSlug: string, visitorId: string) {
  return useQuery({
    queryKey: ["visitor", tenantSlug, visitorId],
    queryFn: () => getVisitorById(tenantSlug, visitorId),
    enabled: !!tenantSlug && !!visitorId,
  });
}

export function useGetVehicleById(tenantSlug: string, vehicleId: string) {
  return useQuery({
    queryKey: ["vehicle", tenantSlug, vehicleId],
    queryFn: () => getVehicleById(tenantSlug, vehicleId),
    enabled: !!tenantSlug && !!vehicleId,
  });
}

export function useGetHostById(tenantSlug: string, hostId: string) {
  return useQuery({
    queryKey: ["host", tenantSlug, hostId],
    queryFn: () => getHostById(tenantSlug, hostId),
    enabled: !!tenantSlug && !!hostId,
  });
}

export function useGetVehicles(tenantSlug: string) {
  return useQuery({
    queryKey: ["vehicles", tenantSlug],
    queryFn: () => getVehicles(tenantSlug),
    enabled: !!tenantSlug,
  });
}
