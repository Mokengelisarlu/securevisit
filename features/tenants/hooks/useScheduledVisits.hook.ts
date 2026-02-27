import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createScheduledVisit, getScheduledVisits, checkInScheduledVisit } from "../queries/tenant-data";

export function useCreateScheduledVisit(tenantSlug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Parameters<typeof createScheduledVisit>[1]) =>
            createScheduledVisit(tenantSlug, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["scheduled-visits", tenantSlug] });
            queryClient.invalidateQueries({ queryKey: ["visits", tenantSlug] });
        },
    });
}

export function useGetScheduledVisits(tenantSlug: string, date?: Date) {
    return useQuery({
        queryKey: ["scheduled-visits", tenantSlug, date],
        queryFn: () => getScheduledVisits(tenantSlug, date),
    });
}

export function useCheckInScheduledVisit(tenantSlug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (visitId: string) => checkInScheduledVisit(tenantSlug, visitId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["scheduled-visits", tenantSlug] });
            queryClient.invalidateQueries({ queryKey: ["visits", tenantSlug] });
            queryClient.invalidateQueries({ queryKey: ["dashboardStats", tenantSlug] });
        },
    });
}
