import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPublicVisit } from "../queries/tenant-data";

export function useCreatePublicVisit(tenantSlug: string, deviceToken: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Parameters<typeof createPublicVisit>[2]) =>
            createPublicVisit(tenantSlug, deviceToken!, data),
        onSuccess: () => {
            // Invalidate both stats and visits lists since a new visit affects both
            queryClient.invalidateQueries({ queryKey: ["dashboardStats", tenantSlug] });
            queryClient.invalidateQueries({ queryKey: ["visits", tenantSlug] });
        },
    });
}
