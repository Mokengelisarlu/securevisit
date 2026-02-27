import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteHost } from '../queries/tenant-data';
import { useTenant } from '@/lib/tenant-provider';

export function useDeleteHost() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (hostId: string) => {
            if (!slug) throw new Error('No tenant slug');
            return deleteHost(slug, hostId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hosts', slug] });
        },
    });
}
