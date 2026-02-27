/**
 * Prefetch utility for optimizing data loading
 * Use these functions to preload data before the user needs it
 */

import { QueryClient } from "@tanstack/react-query";
import {
    getDepartments,
    getHosts,
    getVisitors,
    getVisitorTypes,
    getServices,
    getDashboardStats,
    getBusinessSettings,
    getPublicDepartments,
    getPublicServices,
    getPublicVisitorTypes,
    getPublicHosts,
    getPublicOnSiteVisitors,
} from "./tenant-data";

/**
 * Prefetch all dashboard data
 * Call this when user navigates to dashboard
 */
export async function prefetchDashboardData(
    queryClient: QueryClient,
    tenantSlug: string
) {
    return Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["dashboardStats", tenantSlug],
            queryFn: () => getDashboardStats(tenantSlug),
            staleTime: 1000 * 60, // 1 minute
        }),
        queryClient.prefetchQuery({
            queryKey: ["visits", tenantSlug],
            queryFn: () => getVisitors(tenantSlug),
        }),
        queryClient.prefetchQuery({
            queryKey: ["visitors", tenantSlug],
            queryFn: () => getVisitors(tenantSlug),
        }),
    ]);
}

/**
 * Prefetch all tenant settings and configuration
 * Call this on app initialization or settings page
 */
export async function prefetchTenantSettings(
    queryClient: QueryClient,
    tenantSlug: string
) {
    return Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["business-settings", tenantSlug],
            queryFn: () => getBusinessSettings(tenantSlug),
            staleTime: 1000 * 60 * 30, // 30 minutes
        }),
        queryClient.prefetchQuery({
            queryKey: ["departments", tenantSlug],
            queryFn: () => getDepartments(tenantSlug),
            staleTime: 1000 * 60 * 30,
        }),
        queryClient.prefetchQuery({
            queryKey: ["services", tenantSlug],
            queryFn: () => getServices(tenantSlug),
            staleTime: 1000 * 60 * 30,
        }),
        queryClient.prefetchQuery({
            queryKey: ["hosts", tenantSlug],
            queryFn: () => getHosts(tenantSlug),
            staleTime: 1000 * 60 * 30,
        }),
        queryClient.prefetchQuery({
            queryKey: ["visitor-types", tenantSlug],
            queryFn: () => getVisitorTypes(tenantSlug),
            staleTime: 1000 * 60 * 30,
        }),
    ]);
}

/**
 * Prefetch all kiosk data
 * Call this when the kiosk page loads
 */
export async function prefetchKioskData(
    queryClient: QueryClient,
    tenantSlug: string,
    deviceToken: string
) {
    return Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["public-departments", tenantSlug, deviceToken],
            queryFn: () => getPublicDepartments(tenantSlug, deviceToken),
            staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
            queryKey: ["public-services", tenantSlug, deviceToken],
            queryFn: () => getPublicServices(tenantSlug, deviceToken),
            staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
            queryKey: ["public-visitor-types", tenantSlug, deviceToken],
            queryFn: () => getPublicVisitorTypes(tenantSlug, deviceToken),
            staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
            queryKey: ["public-hosts", tenantSlug, deviceToken],
            queryFn: () => getPublicHosts(tenantSlug, deviceToken),
            staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
            queryKey: ["public-on-site-visitors", tenantSlug, deviceToken],
            queryFn: () => getPublicOnSiteVisitors(tenantSlug, deviceToken),
            staleTime: 1000 * 30, // 30 seconds for on-site data
        }),
    ]);
}

/**
 * Prefetch single visitor for detailed view options
 * Useful when hovering over visitor names/links
 */
export async function prefetchVisitor(
    queryClient: QueryClient,
    tenantSlug: string,
    visitorId: string
) {
    return queryClient.prefetchQuery({
        queryKey: ["visitor", tenantSlug, visitorId],
        queryFn: async () => {
            // Get from visitors list cache if available
            const cached = queryClient.getQueryData(["visitors", tenantSlug]) as any[];
            if (cached) {
                return cached.find((v: any) => v.id === visitorId);
            }
            // Otherwise fetch individually
            const visitors = await getVisitors(tenantSlug);
            return visitors.find((v: any) => v.id === visitorId);
        },
    });
}
