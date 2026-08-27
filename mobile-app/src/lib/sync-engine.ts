import {
  getQueue,
  updateAction,
  removeAction,
  onQueueChange,
  type OfflineAction,
} from '@/src/lib/offline-queue';
import { apiCall, uploadFile, DEFAULT_API_BASE_URL } from '@/src/api/client';

type SyncListener = (event: {
  action: OfflineAction;
  status: 'syncing' | 'success' | 'failed';
  error?: string;
}) => void;

let syncListeners: SyncListener[] = [];
let isSyncing = false;
let stopRequested = false;

export function onSyncEvent(listener: SyncListener): () => void {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
}

function emitSyncEvent(event: {
  action: OfflineAction;
  status: 'syncing' | 'success' | 'failed';
  error?: string;
}) {
  syncListeners.forEach((l) => l(event));
}

function isNetworkError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('failed') ||
    msg.includes('aborted') ||
    msg.includes('timeout') ||
    err?.name === 'TypeError'
  );
}

function isLocalFileUri(uri?: string | null): boolean {
  return (
    !!uri &&
    (uri.startsWith('file://') ||
      uri.startsWith('content://') ||
      uri.startsWith('blob:'))
  );
}

async function processCheckIn(
  action: OfflineAction,
  deviceToken: string,
  tenantSlug: string,
  apiBaseUrl: string
): Promise<void> {
  const { filesToUpload, visitData } = action.payload;

  const fileMap: Record<string, string> = {};

  if (filesToUpload && Array.isArray(filesToUpload)) {
    for (const file of filesToUpload) {
      if (!file.uri || !isLocalFileUri(file.uri)) {
        if (file.key && file.serverUrl) {
          fileMap[file.key] = file.serverUrl;
        }
        continue;
      }

      const response = await uploadFile(
        `/api/tenants/${tenantSlug}/upload?filename=${encodeURIComponent(file.filename)}`,
        file.uri,
        file.filename,
        deviceToken,
        undefined,
        apiBaseUrl
      );
      fileMap[file.key] = response.url;
    }
  }

  const payload = {
    ...visitData,
    ...(fileMap.visitorPhotoUrl ? { visitorPhotoUrl: fileMap.visitorPhotoUrl } : {}),
    ...(fileMap.vehiclePhotoUrl ? { vehiclePhotoUrl: fileMap.vehiclePhotoUrl } : {}),
    ...(fileMap.signatureData ? { signatureData: fileMap.signatureData } : {}),
  };

  await apiCall(`/api/tenants/${tenantSlug}/public/visits`, {
    method: 'POST',
    body: payload,
    deviceToken,
    baseUrl: apiBaseUrl,
    retries: 1,
  });
}

async function processCheckout(
  action: OfflineAction,
  deviceToken: string,
  tenantSlug: string,
  apiBaseUrl: string
): Promise<void> {
  const { visitId } = action.payload;

  await apiCall(`/api/tenants/${tenantSlug}/public/checkouts`, {
    method: 'POST',
    body: { visitId },
    deviceToken,
    baseUrl: apiBaseUrl,
    retries: 1,
  });
}

async function processAction(
  action: OfflineAction,
  deviceToken: string,
  tenantSlug: string,
  apiBaseUrl: string
): Promise<void> {
  if (action.type === 'check_in') {
    await processCheckIn(action, deviceToken, tenantSlug, apiBaseUrl);
  } else if (action.type === 'checkout') {
    await processCheckout(action, deviceToken, tenantSlug, apiBaseUrl);
  }
}

export async function syncQueue(
  deviceToken: string,
  tenantSlug: string,
  apiBaseUrl: string = DEFAULT_API_BASE_URL
): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;
  stopRequested = false;

  let synced = 0;
  let failed = 0;

  try {
    const queue = await getQueue();
    const pending = queue.filter((a) => a.status === 'pending');

    for (const action of pending) {
      if (stopRequested) break;

      await updateAction(action.id, { status: 'syncing' });
      emitSyncEvent({ action, status: 'syncing' });

      try {
        await processAction(action, deviceToken, tenantSlug, apiBaseUrl);
        await removeAction(action.id);
        emitSyncEvent({ action, status: 'success' });
        synced++;
      } catch (err: any) {
        const newRetryCount = action.retryCount + 1;
        const isNetErr = isNetworkError(err);

        if (newRetryCount >= action.maxRetries || !isNetErr) {
          await updateAction(action.id, {
            status: 'failed',
            retryCount: newRetryCount,
            error: err?.message || 'Sync failed',
          });
          emitSyncEvent({ action, status: 'failed', error: err?.message });
          failed++;
        } else {
          const backoffMs = Math.pow(2, newRetryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          await updateAction(action.id, {
            status: 'pending',
            retryCount: newRetryCount,
          });

          if (!stopRequested) {
            const queue2 = await getQueue();
            const stillPending = queue2.filter(
              (a) => a.status === 'pending' && a.id === action.id
            );
            if (stillPending.length > 0) {
              await updateAction(action.id, { status: 'syncing' });
              emitSyncEvent({ action, status: 'syncing' });
              try {
                await processAction(
                  stillPending[0],
                  deviceToken,
                  tenantSlug,
                  apiBaseUrl
                );
                await removeAction(action.id);
                emitSyncEvent({ action, status: 'success' });
                synced++;
                failed--;
              } catch (err2: any) {
                await updateAction(action.id, {
                  status: 'failed',
                  retryCount: action.maxRetries,
                  error: err2?.message || 'Sync failed after retry',
                });
                emitSyncEvent({
                  action,
                  status: 'failed',
                  error: err2?.message,
                });
              }
            }
          }
        }
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

export function stopSync(): void {
  stopRequested = true;
}

export function getIsSyncing(): boolean {
  return isSyncing;
}

let autoSyncUnsubscribe: (() => void) | null = null;

export function startAutoSync(
  getDeviceToken: () => string | null,
  getTenantSlug: () => string | null,
  getApiBaseUrl: () => string,
  checkOnline: () => boolean
): void {
  stopAutoSync();

  autoSyncUnsubscribe = onQueueChange(async () => {
    if (!checkOnline() || isSyncing) return;

    const token = getDeviceToken();
    const slug = getTenantSlug();
    if (!token || !slug) return;

    await syncQueue(token, slug, getApiBaseUrl());
  });
}

export function stopAutoSync(): void {
  if (autoSyncUnsubscribe) {
    autoSyncUnsubscribe();
    autoSyncUnsubscribe = null;
  }
}
