// Base API client for VMS SaaS endpoints

import type { UploadResponse } from '@/src/types/api';

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.11.102:3000';

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

  const normalizedBaseUrl = (baseUrl || DEFAULT_API_BASE_URL)
    .trim()
    .replace(/\/+$/, '');

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

  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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

            let fallbackTimer: ReturnType<typeof setInterval> | null = null;
            let currentFallback = 0;

            const startFallback = () => {
              if (fallbackTimer) return;
              currentFallback = 2;
              onProgress?.(currentFallback);
              fallbackTimer = setInterval(() => {
                // increase slowly up to 90
                const inc = Math.floor(Math.random() * 6) + 2; // 2-7
                currentFallback = Math.min(90, currentFallback + inc);
                onProgress?.(currentFallback);
              }, 500);
            };

            const stopFallback = () => {
              if (fallbackTimer) {
                clearInterval(fallbackTimer);
                fallbackTimer = null;
              }
            };

            let sawLengthComputable = false;

            xhr.upload.onprogress = (event: ProgressEvent) => {
              if (event.lengthComputable) {
                sawLengthComputable = true;
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress?.(percent);
              } else {
                // start a fallback incremental progress if we don't get computable length
                startFallback();
              }
            };

            xhr.onload = () => {
              try {
                stopFallback();
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
              stopFallback();
              reject(new Error('Upload failed: network error'));
            };
            xhr.onabort = () => {
              stopFallback();
              reject(new Error('Upload aborted'));
            };

            // Start a short timeout: if we don't receive a progress event in 200ms, start fallback
            const progressWait = setTimeout(() => {
              if (!sawLengthComputable) startFallback();
            }, 200);

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
