"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVisitorType } from "../queries/tenant-data";
import { useTenant } from "@/lib/tenant-provider";

export function useCreateVisitorType() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            if (!slug) throw new Error("No tenant slug");
            return createVisitorType(slug, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["visitor-types", slug] });
        },
    });
}
