"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVisitorType } from "../queries/tenant-data";
import { useTenant } from "@/lib/tenant-provider";

export function useDeleteVisitorType() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!slug) throw new Error("No tenant slug");
            return deleteVisitorType(slug, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["visitor-types", slug] });
        },
    });
}
