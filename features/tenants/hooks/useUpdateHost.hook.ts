import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateHost } from '../queries/tenant-data';
import { useTenant } from '../../../lib/tenant-provider';

export function useUpdateHost() {
  const { slug } = useTenant();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      firstName?: string;
      lastName?: string;
      middleName?: string | null;
      photoUrl?: string | null;
      email?: string | null;
      phone?: string | null;
      departmentId?: string;
    }) => {
      if (!slug) throw new Error('No tenant slug');
      const { id, ...rest } = payload;
      return await updateHost(slug, id, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hosts', slug] });
    },
  });
}
