import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    generatePairingCode,
    checkPairingStatus,
    pingDevice,
} from "../client/kiosk-api";
import {
    pairDevice,
    getDevices,
    deleteDevice,
    updateDevice,
    reconnectDevice,
    sendDeviceCommand,
    getCommandLogs,
    getDeviceEvents,
} from "../queries/tenant-data";

export const COMMAND_TYPES = [
    "CONFIG_UPDATE",
    "REBOOT",
    "EMERGENCY_MESSAGE",
    "CLEAR_CACHE",
    "REFRESH_SETTINGS",
] as const;

export const COMMAND_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const EVENT_TYPES = [
    "CHECK_IN",
    "CHECKOUT",
    "ERROR",
    "SCREEN_CHANGE",
    "COMMAND_APPLIED",
    "COMMAND_FAILED",
    "REBOOT",
    "ONLINE",
    "OFFLINE",
] as const;

export type DeviceEventTypeOption = (typeof EVENT_TYPES)[number];

export type CommandTypeOption = (typeof COMMAND_TYPES)[number];
export type CommandPriorityOption = (typeof COMMAND_PRIORITIES)[number];

/**
 * [ADMIN] Send a command to a device. The device picks it up via its
 * 10-second command polling (see mobile-app/src/lib/command-polling.ts).
 */
export function useSendCommand(tenantSlug: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            deviceId,
            type,
            payload,
            priority,
        }: {
            deviceId: string;
            type: CommandTypeOption;
            payload?: Record<string, unknown>;
            priority?: CommandPriorityOption;
        }) =>
            sendDeviceCommand(tenantSlug, deviceId, type, payload ?? null, priority ?? "medium"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices", tenantSlug] });
        },
    });
}

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

/**
 * [ADMIN] Fetch recent device command logs (activity feed).
 * Polls every 10s so new commands/acks show up.
 */
export function useGetCommandLogs(
    tenantSlug: string,
    filters: { deviceId?: string | null; status?: string | null; limit?: number } = {}
) {
    return useQuery({
        queryKey: ["command-logs", tenantSlug, filters.deviceId ?? null, filters.status ?? null, filters.limit ?? 100],
        queryFn: () => getCommandLogs(tenantSlug, filters),
        refetchInterval: 10_000,
    });
}

/**
 * [ADMIN] Fetch device events for the activity feed.
 * Polls every 10s so new events/lets-keep-live flows show up.
 */
export function useGetDeviceEvents(
    tenantSlug: string,
    filters: { deviceId?: string | null; type?: string | null; limit?: number } = {}
) {
    return useQuery({
        queryKey: ["device-events", tenantSlug, filters.deviceId ?? null, filters.type ?? null, filters.limit ?? 100],
        queryFn: () => getDeviceEvents(tenantSlug, filters),
        refetchInterval: 10_000,
    });
}
