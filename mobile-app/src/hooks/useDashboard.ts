import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/src/api/client';
import { useApi } from '@/src/contexts/ApiContext';
import type { DashboardData } from '@/src/types/api';

export function useGetDashboard(deviceToken: string | null, pollIntervalMs?: number) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchDashboard = useCallback(async () => {
    if (!deviceToken) return;

    try {
      const response = await apiCall(
        `/api/tenants/${tenantSlug}/public/dashboard`,
        { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
      );
      setData(response as DashboardData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  useEffect(() => {
    if (!deviceToken) return;

    fetchDashboard();

    let interval: ReturnType<typeof setInterval> | null = null;
    if (pollIntervalMs) {
      interval = setInterval(fetchDashboard, pollIntervalMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deviceToken, fetchDashboard, pollIntervalMs]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
