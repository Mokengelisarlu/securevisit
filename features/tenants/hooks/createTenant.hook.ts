"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTenant } from "../queries/create.tenant";

type CreateTenantInput = {
  name: string;
  slug: string;
};

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, slug }: CreateTenantInput) => {
      return createTenant(name, slug);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
