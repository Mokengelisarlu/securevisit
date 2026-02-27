import { useQuery } from '@tanstack/react-query';
import { getServices } from '../queries/tenant-data';

export function useGetServices(tenantSlug: string) {
    return useQuery({
        queryKey: ['services', tenantSlug],
        queryFn: () => getServices(tenantSlug),
        enabled: !!tenantSlug,
    });
}
