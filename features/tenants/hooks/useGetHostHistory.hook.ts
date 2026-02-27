import { useQuery } from "@tanstack/react-query";
import { getVisitsByHost } from "../queries/tenant-data";

export function useGetHostHistory(tenantSlug: string, hostId: string) {
    return useQuery({
        queryKey: ["host-history", tenantSlug, hostId],
        queryFn: () => getVisitsByHost(tenantSlug, hostId),
        enabled: !!tenantSlug && !!hostId,
    });
}
