import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteService } from '../queries/tenant-data';
import { useTenant } from '@/lib/tenant-provider';

export function useDeleteService() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (serviceId: string) => {
            if (!slug) throw new Error('No tenant slug');
            return deleteService(slug, serviceId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services', slug] });
        },
    });
}
