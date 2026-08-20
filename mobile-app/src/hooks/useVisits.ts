import { useState, useCallback } from 'react';
import { apiCall } from '@/src/api/client';
import { useApi } from '@/src/contexts/ApiContext';
import { Visit } from '@/src/types/api';

export function useCreatePublicVisit(deviceToken: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const createVisit = useCallback(
    async (visitData: Omit<Visit, 'id' | 'checkInAt'>) => {
      if (!deviceToken) throw new Error('Device not paired');

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visits`,
          {
            method: 'POST',
            body: visitData,
            deviceToken,
            baseUrl: apiBaseUrl,
          }
        );
        return response as Visit;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { createVisit, isLoading, error };
}

export function useCheckoutPublicVisit(deviceToken: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const checkoutVisit = useCallback(
    async (visitId: string) => {
      if (!deviceToken) throw new Error('Device not paired');

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/checkouts`,
          {
            method: 'POST',
            body: { visitId },
            deviceToken,
            baseUrl: apiBaseUrl,
          }
        );
        return response as Visit;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { checkoutVisit, isLoading, error };
}
