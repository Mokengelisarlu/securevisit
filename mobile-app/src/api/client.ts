// Base API client for VMS SaaS endpoints

import type { UploadResponse } from '@/src/types/api';

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://securevisitapp.com';

export { DEFAULT_API_BASE_URL };

export interface FetchOptions {
  headers?: Record<string, string>;
  body?: any;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export interface RequestConfig extends FetchOptions {
  baseUrl?: string;
  deviceToken?: string;
  retries?: number;
}

export interface ConnectionTestResult {
  ok: boolean;
  serverReachable: boolean;
  apiReachable: boolean;
  latencyMs?: number;
  message: string;
}

function normalizeBaseUrl(baseUrl?: string): string {
  let normalized = (baseUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');

  if (normalized.startsWith('https:') && !normalized.startsWith('https://')) {
    normalized = normalized.replace('https:', 'https://');
  } else if (normalized.startsWith('http:') && !normalized.startsWith('http://')) {
    normalized = normalized.replace('http:', 'http://');
  }

  return normalized;
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Diagnose connectivity to the API server in two steps:
 * 1. Can the device open any connection to the host (DNS/TLS/routing)?
 * 2. Do the API routes respond?
 * Returns a human-readable report suitable for display on-screen.
 */
export async function testConnection(
  baseUrl: string = DEFAULT_API_BASE_URL,
  timeoutMs: number = 10000
): Promise<ConnectionTestResult> {
  const base = normalizeBaseUrl(baseUrl);

  const startedAt = Date.now();
  try {
    await fetchWithTimeout(`${base}/`, { method: 'GET' }, timeoutMs);
  } catch (error: any) {
    const timedOut = error?.name === 'AbortError';
    const message = timedOut
      ? `Cannot reach ${base}\nRequest timed out after ${timeoutMs / 1000}s.\n\nCheck the tablet's internet (Wi-Fi/captive portal), then retry.`
      : `Cannot reach ${base}\nThe device could not open a secure connection (DNS/TLS/firewall).\n\nOn the tablet, try: Settings > Network > Private DNS > Automatic, disable VPN/ad-blocker apps, or test with a mobile hotspot.`;
    console.log('[client] testConnection failed:', error?.name, error?.message);
    return { ok: false, serverReachable: false, apiReachable: false, message };
  }

  const latencyMs = Date.now() - startedAt;

  let apiReachable = false;
  try {
    await fetchWithTimeout(
      `${base}/api/sync-user`,
      { method: 'OPTIONS', headers: { 'Content-Type': 'application/json' } },
      timeoutMs
    );
    apiReachable = true;
  } catch (error: any) {
    console.log('[client] testConnection API probe failed:', error?.name, error?.message);
  }

  const message = apiReachable
    ? `Connected to ${base}\nServer reachable (${latencyMs}ms)\nAPI reachable\n\nIf pairing still fails, the error is not network-related.`
    : `Server reachable (${latencyMs}ms) but API did not respond.\nCheck the Server URL value.`;

  return { ok: true, serverReachable: true, apiReachable, latencyMs, message };
}

/**
 * Make an authenticated API call with optional retry logic
 */
export async function apiCall(
  endpoint: string,
  config: RequestConfig = {}
): Promise<any> {
  const {
    headers = {},
    body,
    method = body ? 'POST' : 'GET',
    baseUrl,
    deviceToken,
    retries = 3,
  } = config;

  let lastError: any;

  let normalizedBaseUrl = (baseUrl || DEFAULT_API_BASE_URL)
    .trim()
    .replace(/\/+$/, '');

  // Auto-correct missing slashes from typoed manual inputs (e.g. "https:securevisitapp.com")
  if (normalizedBaseUrl.startsWith('https:') && !normalizedBaseUrl.startsWith('https://')) {
    normalizedBaseUrl = normalizedBaseUrl.replace('https:', 'https://');
  } else if (normalizedBaseUrl.startsWith('http:') && !normalizedBaseUrl.startsWith('http://')) {
    normalizedBaseUrl = normalizedBaseUrl.replace('http:', 'http://');
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `${normalizedBaseUrl}${normalizedEndpoint}`;

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (deviceToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${deviceToken}`,
        };
      }

      if (body) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        // Try JSON first; fall back to text for reverse-proxy HTML errors.
        const contentType = response.headers.get('content-type') || '';
        let errorMessage = `HTTP ${response.status}`;

        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData?.error || errorMessage;
        } else {
          const text = await response.text().catch(() => '');
          const trimmed = text?.trim();
          if (trimmed) {
            errorMessage = `${errorMessage} - ${trimmed.slice(0, 300)}`;
          }
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      lastError = error;

      if (attempt < retries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }


  throw lastError;
}

/**
 * Upload a file with progress tracking
 */
export async function uploadFile(
  endpoint: string,
  fileUri: string,
  filename: string,
  deviceToken: string,
  onProgress?: (progress: number) => void,
  baseUrl: string = DEFAULT_API_BASE_URL,
  retries = 3
): Promise<UploadResponse> {
  const mimeType = filename.toLowerCase().endsWith('.png')
    ? 'image/png'
    : filename.toLowerCase().endsWith('.svg')
    ? 'image/svg+xml'
    : 'image/jpeg';

  let normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  if (normalizedBaseUrl.startsWith('https:') && !normalizedBaseUrl.startsWith('https://')) {
    normalizedBaseUrl = normalizedBaseUrl.replace('https:', 'https://');
  } else if (normalizedBaseUrl.startsWith('http:') && !normalizedBaseUrl.startsWith('http://')) {
    normalizedBaseUrl = normalizedBaseUrl.replace('http:', 'http://');
  }

  const url = `${normalizedBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any);

      onProgress?.(0);

      // Use XMLHttpRequest to provide upload progress events in both web and React Native
      const uploadResult: UploadResponse = await new Promise<UploadResponse>(
        (resolve, reject) => {
          try {
            const xhr = new XMLHttpRequest();

            xhr.open('POST', url);

            if (deviceToken) {
              xhr.setRequestHeader('Authorization', `Bearer ${deviceToken}`);
            }

            let reportedRealProgress = false;

            xhr.upload.onprogress = (event: ProgressEvent) => {
              if (event.lengthComputable && event.total > 0) {
                reportedRealProgress = true;
                const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
                onProgress?.(percent);
              } else if (!reportedRealProgress) {
                onProgress?.(-1);
              }
            };

            xhr.onload = () => {
              try {
                const status = xhr.status;
                const text = xhr.responseText;
                const json = text ? JSON.parse(text) : null;

                if (status < 200 || status >= 300) {
                  const message = json?.error || `Upload failed: HTTP ${status}`;
                  reject(new Error(message));
                  return;
                }

                const uploadResponse = json as UploadResponse;
                if (!uploadResponse || typeof uploadResponse.url !== 'string') {
                  reject(new Error('Invalid upload response from server'));
                  return;
                }

                onProgress?.(100);
                resolve(uploadResponse);
              } catch (err) {
                reject(err);
              }
            };

            xhr.onerror = () => {
              reject(new Error('Upload failed: network error'));
            };
            xhr.onabort = () => {
              reject(new Error('Upload aborted'));
            };

            xhr.send(formData as any);
          } catch (err) {
            reject(err);
          }
        }
      );

      return uploadResult;
    } catch (error: any) {
      lastError = error;
      if (attempt < retries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
