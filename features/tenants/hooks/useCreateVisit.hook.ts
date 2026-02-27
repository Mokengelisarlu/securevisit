"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createVisit } from "../queries/tenant-data";
import { useTenant } from "@/lib/tenant-provider";

export function useCreateVisit() {
    const { slug } = useTenant();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            visitorId?: string;
            newVisitor?: {
                firstName: string;
                lastName: string;
                phone?: string;
                company?: string;
                visitorTypeId?: string;
            };
            hostId?: string;
            departmentId?: string;
            serviceId?: string;
            purpose?: string;
            vehicle?: {
                plateNumber: string;
                type: "CAR" | "TRUCK" | "MOTORCYCLE" | "OTHER";
                brand?: string;
                color?: string;
            };
            passengerCount?: number;
        }) => {
            if (!slug) throw new Error("No tenant slug");
            return createVisit(slug, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["visits", slug] });
        },
    });
}
