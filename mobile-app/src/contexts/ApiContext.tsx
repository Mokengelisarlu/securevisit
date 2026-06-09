import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_API_BASE_URL } from '@/src/api/client';

const SLUG_STORAGE_KEY = 'kiosk_tenant_slug';
const URL_STORAGE_KEY = 'kiosk_api_base_url';
const DEVICE_ID_KEY = 'kiosk_device_id';

interface ApiContextType {
  apiBaseUrl: string;
  tenantSlug: string | null;
  deviceId: string | null;
  isLoadingSlug: boolean;
  saveTenantSlug: (slug: string) => Promise<void>;
  clearTenantSlug: () => Promise<void>;
  saveApiBaseUrl: (url: string) => Promise<void>;
  saveDeviceId: (id: string) => Promise<void>;
  clearDeviceId: () => Promise<void>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(DEFAULT_API_BASE_URL);
  const [isLoadingSlug, setIsLoadingSlug] = useState(true);

  useEffect(() => {
    loadStoredConfig();
  }, []);

  async function loadStoredConfig() {
    try {
      const slug = await SecureStore.getItemAsync(SLUG_STORAGE_KEY);
      setTenantSlug(slug || null);
      const storedUrl = await SecureStore.getItemAsync(URL_STORAGE_KEY);
      if (storedUrl) {
        setApiBaseUrl(storedUrl);
      }
      const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
      if (storedDeviceId) {
        setDeviceId(storedDeviceId);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setIsLoadingSlug(false);
    }
  }

  async function saveTenantSlug(slug: string) {
    try {
      const sanitized = slug.trim().toLowerCase();
      await SecureStore.setItemAsync(SLUG_STORAGE_KEY, sanitized);
      setTenantSlug(sanitized);
    } catch (err) {
      console.error('Failed to save tenant slug:', err);
      throw err;
    }
  }

  async function clearTenantSlug() {
    try {
      await SecureStore.deleteItemAsync(SLUG_STORAGE_KEY);
      setTenantSlug(null);
    } catch (err) {
      console.error('Failed to clear tenant slug:', err);
      throw err;
    }
  }

  async function saveApiBaseUrl(url: string) {
    try {
      const trimmed = url.trim().replace(/\/+$/, '');
      await SecureStore.setItemAsync(URL_STORAGE_KEY, trimmed);
      setApiBaseUrl(trimmed);
    } catch (err) {
      console.error('Failed to save API base URL:', err);
      throw err;
    }
  }

  async function saveDeviceId(id: string) {
    try {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
      setDeviceId(id);
    } catch (err) {
      console.error('Failed to save device ID:', err);
      throw err;
    }
  }

  async function clearDeviceId() {
    try {
      await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
      setDeviceId(null);
    } catch (err) {
      console.error('Failed to clear device ID:', err);
      throw err;
    }
  }

  return (
    <ApiContext.Provider
      value={{
        apiBaseUrl,
        tenantSlug,
        deviceId,
        isLoadingSlug,
        saveTenantSlug,
        clearTenantSlug,
        saveApiBaseUrl,
        saveDeviceId,
        clearDeviceId,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
}
