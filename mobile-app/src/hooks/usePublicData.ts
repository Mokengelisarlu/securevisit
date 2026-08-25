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
  VisitorDetail,
  VisitDetail,
  VisitHistoryEntry,
  VisitorKpisResponse,
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

const hostsCache: { data: Host[]; ts: number } = { data: [], ts: 0 };
const HOSTS_STALE_MS = 60_000;

export function useGetPublicHosts(deviceToken: string | null) {
  const [data, setData] = useState<Host[]>(hostsCache.data);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) return;

    let cancelled = false;

    async function fetchFresh() {
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/hosts`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        if (cancelled) return;
        hostsCache.data = response;
        hostsCache.ts = Date.now();
        setData(response);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const stale = Date.now() - hostsCache.ts > HOSTS_STALE_MS;
    if (hostsCache.data.length === 0 || stale) {
      setIsLoading(hostsCache.data.length === 0);
      fetchFresh();
    } else {
      setIsLoading(false);
    }

    return () => { cancelled = true; };
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

export function useGetPublicBusinessSettings(deviceToken: string | null) {
  const [data, setData] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/business-settings`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        if (!cancelled) setData(response as BusinessSettings);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
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
  const [data, setData] = useState<{ visitors: OnSiteVisitor[]; stats: { onSite: number; arrivedToday: number; departedToday: number } }>({ visitors: [], stats: { onSite: 0, arrivedToday: 0, departedToday: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchVisitors = useCallback(async () => {
    if (!deviceToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
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
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  return { data, isLoading, error, refetch: fetchVisitors };
}

export function useGetPublicVisitorDetail(deviceToken: string | null) {
  const [data, setData] = useState<VisitorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchVisitor = useCallback(
    async (visitorId: string) => {
      if (!deviceToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visitor-detail?id=${visitorId}`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
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

  return { data, isLoading, error, fetchVisitor };
}

export function useGetPublicVisitDetail(deviceToken: string | null) {
  const [data, setData] = useState<VisitDetail | null>(null);
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
          `/api/tenants/${tenantSlug}/public/visit-detail?id=${visitId}`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
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

export function useGetPublicVisitHistory(deviceToken: string | null) {
  const [data, setData] = useState<VisitHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchHistory = useCallback(
    async (visitorId: string) => {
      if (!deviceToken) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/visit-history?visitorId=${visitorId}`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
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

  return { data, isLoading, error, fetchHistory };
}

export function useGetPublicRecentVisits(deviceToken: string | null) {
  const [data, setData] = useState<VisitHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  useEffect(() => {
    if (!deviceToken) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall(
          `/api/tenants/${tenantSlug}/public/recent-visits`,
          { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
        );
        if (!cancelled) setData(response);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  return { data, isLoading, error };
}

export function useGetPublicVisitorKpis(deviceToken: string | null) {
  const [data, setData] = useState<VisitorKpisResponse>({
    onSite: 0,
    outToday: 0,
    totalToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantSlug, apiBaseUrl } = useApi();

  const fetchData = useCallback(async () => {
    if (!deviceToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiCall(
        `/api/tenants/${tenantSlug}/public/visitor-kpis`,
        { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
      );
      setData(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [deviceToken, tenantSlug, apiBaseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
