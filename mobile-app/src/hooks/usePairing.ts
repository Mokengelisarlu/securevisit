import { useState, useCallback } from 'react';
import { apiCall } from '@/src/api/client';
import { useApi } from '@/src/contexts/ApiContext';
import { PairingCodeResponse, PairingStatusResponse } from '@/src/types/api';

export function usePairing() {
  const { tenantSlug, apiBaseUrl } = useApi();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  const generatePairingCode = useCallback(async () => {
    setIsGenerating(true);
    setPollError(null);
    try {
      const response = await apiCall(
        `/api/tenants/${tenantSlug}/devices/pairing-code`,
        { method: 'POST', baseUrl: apiBaseUrl }
      );
      const data = response as PairingCodeResponse;
      const code = data.pairingCode || (data as any).code;
      const id = data.deviceId || (data as any).id || '';
      setPairingCode(code);
      setDeviceId(id);
      return { code, deviceId: id };
    } catch (error: any) {
      setPollError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [tenantSlug, apiBaseUrl]);

  const checkPairingStatus = useCallback(
    async (pollDeviceId: string, intervalMs = 2000, maxAttempts = 180) => {
      setIsPolling(true);
      setPollError(null);

      let attempts = 0;
      while (attempts < maxAttempts) {
        try {
          const response = await apiCall(
            `/api/tenants/${tenantSlug}/devices/pairing-status?deviceId=${pollDeviceId}`,
            { baseUrl: apiBaseUrl }
          );
          const data = response as PairingStatusResponse;

          if (data.isPaired && data.deviceToken) {
            setIsPolling(false);
            return data.deviceToken;
          }

          // Still pending, wait and retry
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
          attempts++;
        } catch (error: any) {
          if (attempts >= maxAttempts - 1) {
            setPollError(error.message || 'Polling timeout');
            setIsPolling(false);
            throw error;
          }
          // Continue polling on error
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
          attempts++;
        }
      }

      setPollError('Pairing timeout - please try again');
      setIsPolling(false);
      throw new Error('Pairing timeout');
    },
    [tenantSlug, apiBaseUrl]
  );

  return {
    pairingCode,
    deviceId,
    isGenerating,
    isPolling,
    pollError,
    generatePairingCode,
    checkPairingStatus,
  };
}
