"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVisitorType } from "../queries/tenant-data";
import { useTenant } from "@/lib/tenant-provider";

export function useUpdateVisitorType() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
            if (!slug) throw new Error("No tenant slug");
            return updateVisitorType(slug, id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["visitor-types", slug] });
        },
    });
}
