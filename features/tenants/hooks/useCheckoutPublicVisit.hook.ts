import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutPublicVisit } from "../queries/tenant-data";

export function useCheckoutPublicVisit(tenantSlug: string, deviceToken: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (visitId: string) =>
            checkoutPublicVisit(tenantSlug, deviceToken!, visitId),
        onSuccess: () => {
            // Invalidate both stats and on-site lists
            queryClient.invalidateQueries({ queryKey: ["dashboardStats", tenantSlug] });
            queryClient.invalidateQueries({ queryKey: ["visits", tenantSlug] });
            queryClient.invalidateQueries({ queryKey: ["public-on-site-visitors", tenantSlug] });
        },
    });
}
