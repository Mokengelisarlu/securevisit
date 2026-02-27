import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createService } from '../queries/tenant-data';

export function useCreateService(tenantSlug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; description?: string; departmentId?: string }) =>
            createService(tenantSlug, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services', tenantSlug] });
        },
    });
}
