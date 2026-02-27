import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDepartment } from '../queries/tenant-data';
import { useTenant } from '@/lib/tenant-provider';

export function useDeleteDepartment() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (departmentId: string) => {
            if (!slug) throw new Error('No tenant slug');
            return deleteDepartment(slug, departmentId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments', slug] });
        },
    });
}
