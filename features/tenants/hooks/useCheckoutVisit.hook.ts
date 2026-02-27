import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkoutVisit } from "../queries/tenant-data";

export function useCheckoutVisit(tenantSlug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (visitId: string) => checkoutVisit(tenantSlug, visitId),
        onSuccess: () => {
            // Invalidate visits query to refresh the list
            queryClient.invalidateQueries({ queryKey: ["visits", tenantSlug] });
        },
    });
}
