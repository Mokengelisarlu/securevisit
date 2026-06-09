import { useCallback } from 'react';
import { apiCall } from '@/src/api/client';
import { useApi } from '@/src/contexts/ApiContext';
import { DeviceVerifyResponse, DevicePingResponse } from '@/src/types/api';

export function useDeviceManagement() {
  const { tenantSlug, apiBaseUrl } = useApi();

  const verifyDeviceToken = useCallback(
    async (deviceToken: string) => {
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/devices/verify`,
          {
            method: 'GET',
            deviceToken,
            baseUrl: apiBaseUrl,
          }
        );
        return (response as DeviceVerifyResponse).ok === true;
      } catch (error) {
        console.error('Device verification failed:', error);
        return false;
      }
    },
    [tenantSlug, apiBaseUrl]
  );

  const pingDevice = useCallback(
    async (deviceToken: string) => {
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/devices/ping`,
          {
            method: 'POST',
            deviceToken,
            baseUrl: apiBaseUrl,
          }
        );
        return (response as DevicePingResponse).ok;
      } catch (error) {
        console.error('Device ping failed:', error);
        return false;
      }
    },
    [tenantSlug, apiBaseUrl]
  );

  return {
    verifyDeviceToken,
    pingDevice,
  };
}
