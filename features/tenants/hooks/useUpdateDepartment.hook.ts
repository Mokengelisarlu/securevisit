import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDepartment } from '../queries/tenant-data';
import { useTenant } from '../../../lib/tenant-provider';

export function useUpdateDepartment() {
  const { slug } = useTenant();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, abbreviation }: { id: string; name: string; abbreviation?: string }) => {
      if (!slug) throw new Error('No tenant slug');
      return await updateDepartment(slug, id, name, abbreviation);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments', slug] });
    },
  });
}
