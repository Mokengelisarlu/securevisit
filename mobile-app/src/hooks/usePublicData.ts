import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/src/api/client';
import { useApi } from '@/src/contexts/ApiContext';
import {
  Visitor,
  Host,
  Department,
  Service,
  VisitorType,
  BusinessSettings,
  KioskSettings,
  OnSiteVisitor,
} from '@/src/types/api';

interface UseFetchOptions {
  retry?: number;
}

export function useGetPublicVisitors(
  deviceToken: string | null,
  options: UseFetchOptions = {}
) {
  const [data, setData] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visitors`,
          { deviceToken: deviceToken ?? undefined, retries: options.retry ?? 3, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [deviceToken, tenantSlug, apiBaseUrl, options.retry]);

  return { data, isLoading, error };
}

export function useSearchPublicVisitors(deviceToken: string | null) {
  const [results, setResults] = useState<Visitor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { tenantSlug, apiBaseUrl } = useApi();

  const search = useCallback(
    async (query: string) => {
      if (!deviceToken || !query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/search-visitors?q=${encodeURIComponent(query)}`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setResults(response);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [deviceToken, tenantSlug, apiBaseUrl]
  );

  return { results, isSearching, search };
}

export function useGetPublicHosts(deviceToken: string | null) {
  const [data, setData] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/hosts`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  return { data, isLoading, error };
}

export function useGetPublicDepartments(deviceToken: string | null) {
  const [data, setData] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/departments`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  return { data, isLoading, error };
}

export function useGetPublicServices(deviceToken: string | null) {
  const [data, setData] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/services`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  return { data, isLoading, error };
}

export function useGetPublicVisitorTypes(deviceToken: string | null) {
  const [data, setData] = useState<VisitorType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visitor-types`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  return { data, isLoading, error };
}

export function useGetPublicSettings(deviceToken: string | null, pollIntervalMs?: number) {
  const [data, setData] = useState<KioskSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/settings`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        if (!cancelled) setData(response as KioskSettings);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();

    let interval: ReturnType<typeof setInterval> | null = null;
    if (pollIntervalMs) {
      interval = setInterval(fetch, pollIntervalMs);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [deviceToken, tenantSlug, apiBaseUrl, pollIntervalMs]);

  return { data, isLoading, error };
}

export function useGetPublicOnSiteVisitors(deviceToken: string | null) {
  const [data, setData] = useState<OnSiteVisitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/on-site-visitors`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  return { data, isLoading, error };
}

export function useGetPublicBusinessSettings(deviceToken: string | null) {
  const [data, setData] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/business-settings`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  return { data, isLoading, error };
}
