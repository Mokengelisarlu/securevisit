import { apiCall } from '@/src/api/client';
import type { Command } from '@/src/types/api';
import { reportDeviceEvent } from '@/src/lib/device-events';

export const COMMAND_POLL_INTERVAL_MS = 10_000;

export interface EmergencyMessage {
  commandId: string;
  message: string;
  timestamp: string;
}

export interface CommandPollHandlers {
  onEmergencyMessage?: (message: EmergencyMessage) => void;
  onRefreshSettings?: () => void;
  onConfigUpdate?: (payload: Record<string, any>) => void;
  onReboot?: () => void;
  onError?: (err: Error) => void;
}

interface PollConfig {
  baseUrl: string;
  tenantSlug: string;
  deviceToken: string;
  handlers: CommandPollHandlers;
}

let activeTimer: ReturnType<typeof setInterval> | null = null;
let activeConfig: PollConfig | null = null;
let polling = false;

async function ackCommand(config: PollConfig, commandId: string) {
  try {
    await apiCall(
      `/api/tenants/${config.tenantSlug}/public/commands/${commandId}/ack`,
      {
        method: 'POST',
        deviceToken: config.deviceToken,
        baseUrl: config.baseUrl,
        retries: 2,
      }
    );
  } catch (err) {
    console.warn('[command-polling] ACK failed for', commandId, err);
  }
}

async function handleCommand(config: PollConfig, command: Command): Promise<void> {
  const { type, payload } = command;

  switch (type) {
    case 'EMERGENCY_MESSAGE': {
      const message =
        (payload as any)?.message ??
        (payload as any)?.text ??
        (payload as any)?.body ??
        'EMERGENCY';
      config.handlers.onEmergencyMessage?.({
        commandId: command.id,
        message: String(message),
        timestamp: new Date().toISOString(),
      });
      break;
    }
    case 'REFRESH_SETTINGS':
      config.handlers.onRefreshSettings?.();
      break;
    case 'CONFIG_UPDATE':
      config.handlers.onConfigUpdate?.((payload as Record<string, any>) ?? {});
      break;
    case 'REBOOT':
      config.handlers.onReboot?.();
      break;
    case 'CLEAR_CACHE':
    default:
      // Best-effort: these have no on-device runtime action; just ack.
      break;
  }

  await ackCommand(config, command.id);

  // Report the result of this command to the activity feed.
  void reportDeviceEvent({
    baseUrl: config.baseUrl,
    tenantSlug: config.tenantSlug,
    deviceToken: config.deviceToken,
    type: 'COMMAND_APPLIED',
    severity: 'info',
    message: `Commande ${type} appliquée`,
    metadata: { commandId: command.id, type },
  });
}

export async function pollCommandsOnce(config: PollConfig): Promise<boolean> {
  try {
    const response = await apiCall(
      `/api/tenants/${config.tenantSlug}/public/commands-queue`,
      {
        method: 'GET',
        deviceToken: config.deviceToken,
        baseUrl: config.baseUrl,
        retries: 1,
      }
    );
    const commands: Command[] = response?.commands ?? [];
    for (const command of commands) {
      try {
        await handleCommand(config, command);
      } catch (err) {
        console.warn('[command-polling] Failed to handle command', command.id, err);
        void reportDeviceEvent({
          baseUrl: config.baseUrl,
          tenantSlug: config.tenantSlug,
          deviceToken: config.deviceToken,
          type: 'COMMAND_FAILED',
          severity: 'error',
          message: `Échec de la commande ${command.type}`,
          metadata: {
            commandId: command.id,
            type: command.type,
            error: err instanceof Error ? err.message : String(err),
          },
        });
        if (config.handlers.onError) config.handlers.onError(err as Error);
      }
    }
    return true;
  } catch (err) {
    if (config.handlers.onError) config.handlers.onError(err as Error);
    return false;
  }
}

async function tick() {
  if (!activeConfig || polling) return;
  polling = true;
  try {
    await pollCommandsOnce(activeConfig);
  } finally {
    polling = false;
  }
}

export function startCommandPolling(config: PollConfig) {
  stopCommandPolling();
  activeConfig = config;
  void tick();
  activeTimer = setInterval(tick, COMMAND_POLL_INTERVAL_MS);
}

export function stopCommandPolling() {
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
  activeConfig = null;
  polling = false;
}

export function isCommandPollingActive(): boolean {
  return activeTimer !== null;
}
