import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVisitor } from '../queries/tenant-data';
import { useTenant } from '../../../lib/tenant-provider';

export function useUpdateVisitor() {
  const { slug } = useTenant();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      company?: string | null;
      photoUrl?: string | null;
      visitorTypeId?: string | null;
    }) => {
      if (!slug) throw new Error('No tenant slug');
      const { id, ...rest } = payload;
      return await updateVisitor(slug, id, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visitors', slug] });
    },
  });
}
