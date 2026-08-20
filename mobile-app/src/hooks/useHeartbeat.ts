import { useEffect } from 'react';
import { apiCall } from '@/src/api/client';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';

const HEARTBEAT_INTERVAL_MS = 120000;

/**
 * Keeps the device's lastActiveAt fresh on the server so the admin dashboard
 * can show online/offline status. No-op when the kiosk is not paired yet.
 * Failures are intentionally silent — the device may just be offline.
 */
export function useKioskHeartbeat() {
  const { deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken || !tenantSlug) return;

    async function ping() {
      try {
        await apiCall(`/api/tenants/${tenantSlug}/devices/ping`, {
          deviceToken: deviceToken ?? undefined,
          baseUrl: apiBaseUrl,
          method: 'POST',
          body: { timestamp: new Date().toISOString() },
          retries: 1,
        });
      } catch {
        // Heartbeat failures are non-fatal
      }
    }

    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [deviceToken, tenantSlug, apiBaseUrl]);
}
