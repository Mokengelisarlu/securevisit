"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHost } from "../queries/tenant-data";

type CreateHostInput = {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  photoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  departmentId: string;
};

export function useCreateHost(tenantSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHostInput) => {
      return createHost(tenantSlug, input);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts", tenantSlug] });
    },
  });
}
