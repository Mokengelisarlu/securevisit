import { useState, useCallback, useEffect } from 'react';
import { apiCall } from '@/src/api/client';
import { useApi } from '@/src/contexts/ApiContext';
import { isDeepEqual } from '@/src/utils/deepEqual';
import {
  Visit,
  Visitor,
  PublicVisitCreateResult,
  WaitingVisit,
  ExpectedVisit,
  CurrentlyInside,
  VisitParticipant,
  ParticipantBulkResult,
  LifecycleVisit,
} from '@/src/types/api';

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
        return response as PublicVisitCreateResult;
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

export function useCreatePublicVisitor(deviceToken: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const createVisitor = useCallback(
    async (visitorData: {
      firstName: string;
      lastName: string;
      phone?: string;
      company?: string;
      visitorTypeId?: string;
    }) => {
      if (!deviceToken) throw new Error('Device not paired');

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visitors`,
          {
            method: 'POST',
            body: visitorData,
            deviceToken,
            baseUrl: apiBaseUrl,
          }
        );
        return response as Visitor;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { createVisitor, isLoading, error };
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

export function useGetWaitingVisits(deviceToken: string | null, pollIntervalMs?: number) {
  const [data, setData] = useState<WaitingVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchData = useCallback(
    async (silent = false) => {
      if (!deviceToken) {
        setIsLoading(false);
        return;
      }
      try {
        if (!silent) setIsLoading(true);
        setError((prev) => (prev === null ? prev : null));
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/waiting-visits`,
          { deviceToken, baseUrl: apiBaseUrl }
        );
        setData((prev) => (isDeepEqual(prev, response) ? prev : response));
      } catch (err: any) {
        setError((prev) => (prev === err.message ? prev : err.message));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!pollIntervalMs) return;
    const interval = setInterval(() => fetchData(true), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, pollIntervalMs]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useGetExpectedVisits(deviceToken: string | null, pollIntervalMs?: number) {
  const [data, setData] = useState<ExpectedVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchData = useCallback(
    async (silent = false) => {
      if (!deviceToken) {
        setIsLoading(false);
        return;
      }
      try {
        if (!silent) setIsLoading(true);
        setError((prev) => (prev === null ? prev : null));
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/expected-visits`,
          { deviceToken, baseUrl: apiBaseUrl }
        );
        setData((prev) => (isDeepEqual(prev, response) ? prev : response));
      } catch (err: any) {
        setError((prev) => (prev === err.message ? prev : err.message));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!pollIntervalMs) return;
    const interval = setInterval(() => fetchData(true), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, pollIntervalMs]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useGetCurrentlyInside(deviceToken: string | null, pollIntervalMs?: number) {
  const [data, setData] = useState<CurrentlyInside>({
    participants: [],
    individuals: [],
    count: 0,
    onSite: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchData = useCallback(
    async (silent = false) => {
      if (!deviceToken) {
        setIsLoading(false);
        return;
      }
      try {
        if (!silent) setIsLoading(true);
        setError((prev) => (prev === null ? prev : null));
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/inside`,
          { deviceToken, baseUrl: apiBaseUrl }
        );
        setData((prev) => (isDeepEqual(prev, response) ? prev : response));
      } catch (err: any) {
        setError((prev) => (prev === err.message ? prev : err.message));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!pollIntervalMs) return;
    const interval = setInterval(() => fetchData(true), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, pollIntervalMs]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useGetPublicVisitDetailPublic(deviceToken: string | null) {
  const [data, setData] = useState<LifecycleVisit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchVisit = useCallback(
    async (visitId: string) => {
      if (!deviceToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visit-detail-public?id=${visitId}`,
          { deviceToken, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { data, isLoading, error, fetchVisit };
}

export function useCheckInPublicParticipants(deviceToken: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const checkIn = useCallback(
    async (visitId: string, participantIds?: string[]) => {
      if (!deviceToken) throw new Error('Device not paired');
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/participants/checkin`,
          { method: 'POST', body: { visitId, participantIds }, deviceToken, baseUrl: apiBaseUrl }
        );
        return response as ParticipantBulkResult;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { checkIn, isLoading, error };
}

export function useCheckOutPublicParticipants(deviceToken: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const checkOut = useCallback(
    async (visitId: string, participantIds?: string[]) => {
      if (!deviceToken) throw new Error('Device not paired');
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/participants/checkout`,
          { method: 'POST', body: { visitId, participantIds }, deviceToken, baseUrl: apiBaseUrl }
        );
        return response as ParticipantBulkResult;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { checkOut, isLoading, error };
}

export type { VisitParticipant };
