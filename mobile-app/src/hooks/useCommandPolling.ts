import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import {
  startCommandPolling,
  stopCommandPolling,
  type EmergencyMessage,
} from '@/src/lib/command-polling';

const EMERGENCY_DISMISS_MS = 30_000;

export function useCommandPolling() {
  const { deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl } = useApi();

  const [emergencyMessage, setEmergencyMessage] = useState<EmergencyMessage | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRefreshSettings = useCallback(() => {
    setRefreshVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!deviceToken || !tenantSlug) return;

    startCommandPolling({
      baseUrl: apiBaseUrl,
      tenantSlug,
      deviceToken,
      handlers: {
        onEmergencyMessage: (message) => {
          setEmergencyMessage(message);
          if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = setTimeout(() => setEmergencyMessage(null), EMERGENCY_DISMISS_MS);
        },
        onRefreshSettings: triggerRefreshSettings,
        onConfigUpdate: triggerRefreshSettings,
      },
    });

    return () => {
      stopCommandPolling();
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [deviceToken, tenantSlug, apiBaseUrl, triggerRefreshSettings]);

  const dismissEmergency = useCallback(() => {
    setEmergencyMessage(null);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  return { emergencyMessage, dismissEmergency, refreshVersion };
}
