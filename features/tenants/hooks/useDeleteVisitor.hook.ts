"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteVisitor } from "../queries/tenant-data";
import { useTenant } from "@/lib/tenant-provider";

export function useDeleteVisitor() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (visitorId: string) => {
            if (!slug) throw new Error("No tenant slug");
            return deleteVisitor(slug, visitorId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["visitors", slug] });
        },
    });
}
