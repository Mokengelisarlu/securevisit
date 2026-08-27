import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = 'kiosk_offline_queue';

export type OfflineActionType = 'check_in' | 'checkout';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, any>;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

let queueChangeListeners: (() => void)[] = [];

export function onQueueChange(listener: () => void): () => void {
  queueChangeListeners.push(listener);
  return () => {
    queueChangeListeners = queueChangeListeners.filter((l) => l !== listener);
  };
}

function notifyListeners() {
  queueChangeListeners.forEach((l) => l());
}

export async function getQueue(): Promise<OfflineAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

export async function addAction(
  type: OfflineActionType,
  payload: Record<string, any>
): Promise<OfflineAction> {
  const action: OfflineAction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 3,
    status: 'pending',
  };

  const queue = await getQueue();
  queue.push(action);
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  notifyListeners();
  return action;
}

export async function updateAction(
  id: string,
  updates: Partial<OfflineAction>
): Promise<void> {
  const queue = await getQueue();
  const idx = queue.findIndex((a) => a.id === id);
  if (idx === -1) return;
  queue[idx] = { ...queue[idx], ...updates };
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  notifyListeners();
}

export async function removeAction(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((a) => a.id !== id);
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  notifyListeners();
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  notifyListeners();
}

export async function getPendingCount(): Promise<number> {
  const queue = await getQueue();
  return queue.filter((a) => a.status === 'pending').length;
}

export async function getFailedCount(): Promise<number> {
  const queue = await getQueue();
  return queue.filter((a) => a.status === 'failed').length;
}

export async function retryFailedAction(id: string): Promise<void> {
  await updateAction(id, {
    status: 'pending',
    retryCount: 0,
    error: undefined,
  });
}

export async function retryAllFailed(): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((a) =>
    a.status === 'failed'
      ? { ...a, status: 'pending' as const, retryCount: 0, error: undefined }
      : a
  );
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
  notifyListeners();
}
