import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateService } from '../queries/tenant-data';
import { useTenant } from '@/lib/tenant-provider';

export function useUpdateService() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { name: string; description?: string; departmentId?: string };
        }) => {
            if (!slug) throw new Error('No tenant slug');
            return updateService(slug, id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services', slug] });
        },
    });
}
