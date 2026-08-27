import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/src/api/client';
import { useApi } from '@/src/contexts/ApiContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { reportDeviceEvent } from '@/src/lib/device-events';
import {
  Visit,
  Visitor,
  OnSiteVisitor,
  VisitorKpisResponse,
  KioskSettings,
  BusinessSettings,
  VisitHistoryEntry,
  VisitDetail,
  VisitorDetail,
  Host,
  Department,
  Service,
  VisitorType,
} from '@/src/types/api';

function useTenantApiContext() {
  const { tenantSlug, apiBaseUrl } = useApi();
  const { deviceToken } = useAuth();
  return { tenantSlug, apiBaseUrl, deviceToken };
}

function buildEndpoint(slug: string | null, resource: string): string {
  return `/api/tenants/${slug}/public/${resource}`;
}

export function useDeviceSettingsQuery() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['device', 'settings', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'settings'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as KioskSettings;
    },
    enabled: !!deviceToken && !!tenantSlug,
    staleTime: 5 * 60 * 1000,
    initialData: undefined,
  });
}

export function useVisitorSearchQuery(query: string) {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['visitors', 'search', trimmed, tenantSlug],
    queryFn: async () => {
      const response = await apiCall(
        `${buildEndpoint(tenantSlug, 'search-visitors')}?q=${encodeURIComponent(trimmed)}`,
        { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
      );
      return response as Visitor[];
    },
    enabled: !!deviceToken && !!tenantSlug && trimmed.length > 0,
    placeholderData: (prev) => prev,
  });
}

export function useOnSiteVisitorsQuery(pollIntervalMs?: number) {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['visitors', 'on-site', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'on-site-visitors'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as { visitors: OnSiteVisitor[]; stats: { onSite: number; arrivedToday: number; departedToday: number } };
    },
    enabled: !!deviceToken && !!tenantSlug,
    refetchInterval: pollIntervalMs,
  });
}

export function useVisitorKpisQuery(pollIntervalMs?: number) {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['visitors', 'kpis', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'visitor-kpis'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as VisitorKpisResponse;
    },
    enabled: !!deviceToken && !!tenantSlug,
    refetchInterval: pollIntervalMs,
  });
}

export function useRecentVisitsQuery() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['visitors', 'recent-visits', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'recent-visits'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as VisitHistoryEntry[];
    },
    enabled: !!deviceToken && !!tenantSlug,
  });
}

export function usePublicHostsQuery() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['public', 'hosts', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'hosts'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as Host[];
    },
    enabled: !!deviceToken && !!tenantSlug,
    staleTime: 60 * 1000,
  });
}

export function usePublicDepartmentsQuery() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['public', 'departments', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'departments'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as Department[];
    },
    enabled: !!deviceToken && !!tenantSlug,
  });
}

export function usePublicServicesQuery() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['public', 'services', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'services'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as Service[];
    },
    enabled: !!deviceToken && !!tenantSlug,
  });
}

export function usePublicVisitorTypesQuery() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['public', 'visitor-types', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'visitor-types'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as VisitorType[];
    },
    enabled: !!deviceToken && !!tenantSlug,
  });
}

export function usePublicBusinessSettingsQuery() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['public', 'business-settings', tenantSlug],
    queryFn: async () => {
      const response = await apiCall(buildEndpoint(tenantSlug, 'business-settings'), {
        deviceToken: deviceToken ?? undefined,
        baseUrl: apiBaseUrl,
      });
      return response as BusinessSettings;
    },
    enabled: !!deviceToken && !!tenantSlug,
  });
}

export function useVisitorDetailQuery(visitorId: string) {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['visitors', 'detail', visitorId, tenantSlug],
    queryFn: async () => {
      const response = await apiCall(
        `${buildEndpoint(tenantSlug, 'visitor-detail')}?id=${visitorId}`,
        { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
      );
      return response as VisitorDetail;
    },
    enabled: !!deviceToken && !!tenantSlug && !!visitorId,
  });
}

export function useVisitDetailQuery(visitId: string) {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['visits', 'detail', visitId, tenantSlug],
    queryFn: async () => {
      const response = await apiCall(
        `${buildEndpoint(tenantSlug, 'visit-detail')}?id=${visitId}`,
        { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
      );
      return response as VisitDetail;
    },
    enabled: !!deviceToken && !!tenantSlug && !!visitId,
  });
}

export function useVisitHistoryQuery(visitorId: string) {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();

  return useQuery({
    queryKey: ['visits', 'history', visitorId, tenantSlug],
    queryFn: async () => {
      const response = await apiCall(
        `${buildEndpoint(tenantSlug, 'visit-history')}?visitorId=${visitorId}`,
        { deviceToken: deviceToken ?? undefined, baseUrl: apiBaseUrl }
      );
      return response as VisitHistoryEntry[];
    },
    enabled: !!deviceToken && !!tenantSlug && !!visitorId,
  });
}

export function useCreateVisitMutation() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitData: Omit<Visit, 'id' | 'checkInAt'>) => {
      if (!deviceToken) throw new Error('Device not paired');
      const response = await apiCall(buildEndpoint(tenantSlug, 'visits'), {
        method: 'POST',
        body: visitData,
        deviceToken,
        baseUrl: apiBaseUrl,
      });
      return response as Visit;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['visitors', 'on-site'] });
      void queryClient.invalidateQueries({ queryKey: ['visitors', 'kpis'] });
      void queryClient.invalidateQueries({ queryKey: ['visitors', 'recent-visits'] });
      if (tenantSlug && deviceToken && apiBaseUrl) {
        void reportDeviceEvent({
          baseUrl: apiBaseUrl,
          tenantSlug,
          deviceToken,
          type: 'CHECK_IN',
          severity: 'info',
          message: 'Visiteur enregistré (check-in)',
        });
      }
    },
  });
}

export function useCheckoutVisitMutation() {
  const { tenantSlug, apiBaseUrl, deviceToken } = useTenantApiContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (visitId: string) => {
      if (!deviceToken) throw new Error('Device not paired');
      const response = await apiCall(buildEndpoint(tenantSlug, 'checkouts'), {
        method: 'POST',
        body: { visitId },
        deviceToken,
        baseUrl: apiBaseUrl,
      });
      return response as Visit;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['visitors', 'on-site'] });
      void queryClient.invalidateQueries({ queryKey: ['visitors', 'kpis'] });
      void queryClient.invalidateQueries({ queryKey: ['visitors', 'recent-visits'] });
      if (tenantSlug && deviceToken && apiBaseUrl) {
        void reportDeviceEvent({
          baseUrl: apiBaseUrl,
          tenantSlug,
          deviceToken,
          type: 'CHECKOUT',
          severity: 'info',
          message: 'Visiteur sorti (check-out)',
        });
      }
    },
  }  );
}

