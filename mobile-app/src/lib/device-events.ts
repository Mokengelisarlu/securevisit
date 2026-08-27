// Minimal device-event reporting client for the VMS SaaS backend.
// POSTs to the public events endpoint so the admin activity feed can
// surface wallet-of-life events (check-in, screen changes, command results, errors).

import { apiCall } from '@/src/api/client';

export type DeviceEventType =
  | 'CHECK_IN'
  | 'CHECKOUT'
  | 'ERROR'
  | 'SCREEN_CHANGE'
  | 'COMMAND_APPLIED'
  | 'COMMAND_FAILED'
  | 'REBOOT'
  | 'ONLINE'
  | 'OFFLINE';

export interface ReportEventInput {
  baseUrl: string;
  tenantSlug: string;
  deviceToken: string;
  type: DeviceEventType;
  severity?: 'info' | 'warning' | 'error';
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Report a device event to the backend. Best-effort: never throws to the
 * caller (the kiosk must keep running even if reporting fails).
 */
export async function reportDeviceEvent(input: ReportEventInput): Promise<void> {
  const { baseUrl, tenantSlug, deviceToken, type, severity, message, metadata } = input;
  try {
    await apiCall(`/api/tenants/${tenantSlug}/public/events`, {
      method: 'POST',
      baseUrl,
      deviceToken,
      retries: 1,
      body: { type, severity: severity ?? 'info', message: message ?? null, metadata: metadata ?? null },
    });
  } catch (err) {
    console.warn('[device-events] Failed to report event', type, err);
  }
}
