"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDepartment } from "../queries/tenant-data";

export function useCreateDepartment(tenantSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, abbreviation }: { name: string; abbreviation?: string }) => {
      return createDepartment(tenantSlug, name, abbreviation);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", tenantSlug] });
    },
  });
}
