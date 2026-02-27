import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    generatePairingCode,
    checkPairingStatus,
    pairDevice,
    getDevices,
    deleteDevice,
    pingDevice,
    updateDevice,
    reconnectDevice,
} from "../queries/tenant-data";

export function useGeneratePairingCode(tenantSlug: string) {
    return useMutation({
        mutationFn: () => generatePairingCode(tenantSlug),
    });
}

export function useCheckPairingStatus(tenantSlug: string, deviceId: string | null) {
    return useQuery({
        queryKey: ["pairing-status", tenantSlug, deviceId],
        queryFn: () => checkPairingStatus(tenantSlug, deviceId!),
        enabled: !!deviceId,
        refetchInterval: (query) => {
            if (query.state.data?.isPaired) return false;
            return 1000; // Poll every 1 second
        },
    });
}

export function usePairDevice(tenantSlug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pairingCode,
            deviceName,
            location,
            description,
        }: {
            pairingCode: string;
            deviceName: string;
            location?: string;
            description?: string;
        }) => pairDevice(tenantSlug, pairingCode, deviceName, location, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices", tenantSlug] });
        },
    });
}

export function useGetDevices(tenantSlug: string) {
    return useQuery({
        queryKey: ["devices", tenantSlug],
        queryFn: () => getDevices(tenantSlug),
        // Auto-refresh every 30s so online/offline status stays current
        refetchInterval: 30_000,
    });
}

export function useDeleteDevice(tenantSlug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (deviceId: string) => deleteDevice(tenantSlug, deviceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices", tenantSlug] });
        },
    });
}

/**
 * Sends a heartbeat ping every `intervalMs` ms from the kiosk.
 * Keeps lastActiveAt fresh so the admin can show online/offline status.
 */
export function usePingDevice(tenantSlug: string, deviceToken: string | null) {
    return useMutation({
        mutationFn: () => pingDevice(tenantSlug, deviceToken!),
    });
}

export function useUpdateDevice(tenantSlug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ deviceId, data }: { deviceId: string; data: { name?: string; location?: string; description?: string } }) =>
            updateDevice(tenantSlug, deviceId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices", tenantSlug] });
        },
    });
}

export function useReconnectDevice(tenantSlug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ deviceId, pairingCode }: { deviceId: string; pairingCode: string }) =>
            reconnectDevice(tenantSlug, deviceId, pairingCode),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices", tenantSlug] });
        },
    });
}
