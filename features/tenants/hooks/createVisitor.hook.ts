"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVisitor } from "../queries/tenant-data";

type CreateVisitorInput = {
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  photoUrl?: string;
  visitorTypeId?: string;
};

export function useCreateVisitor(tenantSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVisitorInput) => {
      return createVisitor(tenantSlug, input);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitors", tenantSlug] });
    },
  });
}
