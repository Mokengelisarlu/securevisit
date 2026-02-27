import { useQuery } from "@tanstack/react-query";
import {
    getPublicDepartments,
    getPublicServices,
    getPublicVisitorTypes,
    getPublicHosts,
    getPublicOnSiteVisitors,
    searchPublicVisitors,
    getPublicSettings
} from "../queries/tenant-data";

export function useGetPublicSettings(tenantSlug: string, deviceToken: string | null) {
    return useQuery({
        queryKey: ["public-settings", tenantSlug, deviceToken],
        queryFn: () => getPublicSettings(tenantSlug, deviceToken!),
        enabled: !!tenantSlug && !!deviceToken,
        refetchInterval: 30_000, // Sync settings every 30 seconds
        staleTime: 10_000,
    });
}

export function useGetPublicDepartments(tenantSlug: string, deviceToken: string | null) {
    return useQuery({
        queryKey: ["public-departments", tenantSlug, deviceToken],
        queryFn: () => getPublicDepartments(tenantSlug, deviceToken!),
        enabled: !!tenantSlug && !!deviceToken,
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60,
    });
}

export function useGetPublicServices(tenantSlug: string, deviceToken: string | null) {
    return useQuery({
        queryKey: ["public-services", tenantSlug, deviceToken],
        queryFn: () => getPublicServices(tenantSlug, deviceToken!),
        enabled: !!tenantSlug && !!deviceToken,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
    });
}

export function useGetPublicVisitorTypes(tenantSlug: string, deviceToken: string | null) {
    return useQuery({
        queryKey: ["public-visitor-types", tenantSlug, deviceToken],
        queryFn: () => getPublicVisitorTypes(tenantSlug, deviceToken!),
        enabled: !!tenantSlug && !!deviceToken,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
    });
}

export function useGetPublicHosts(tenantSlug: string, deviceToken: string | null) {
    return useQuery({
        queryKey: ["public-hosts", tenantSlug, deviceToken],
        queryFn: () => getPublicHosts(tenantSlug, deviceToken!),
        enabled: !!tenantSlug && !!deviceToken,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
    });
}

export function useGetPublicOnSiteVisitors(tenantSlug: string, deviceToken: string | null) {
    return useQuery({
        queryKey: ["public-on-site-visitors", tenantSlug, deviceToken],
        queryFn: () => getPublicOnSiteVisitors(tenantSlug, deviceToken!),
        enabled: !!tenantSlug && !!deviceToken,
        staleTime: 1000 * 30, // 30 seconds - needs to be fresh
        gcTime: 1000 * 60 * 5,
    });
}

export function useSearchPublicVisitors(
    tenantSlug: string,
    deviceToken: string | null,
    query: string
) {
    return useQuery({
        queryKey: ["public-visitor-search", tenantSlug, query],
        queryFn: () => searchPublicVisitors(tenantSlug, deviceToken!, query),
        enabled: !!tenantSlug && !!deviceToken && query.trim().length >= 2,
        staleTime: 30_000, // Cache results for 30 seconds
    });
}
