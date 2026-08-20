import * as SecureStore from 'expo-secure-store';

export const DEVICE_ID_STORAGE_KEY = 'vms_device_divice_id';

function randomId(): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

/**
 * Returns a stable per-install physical device identifier (diviceId).
 *
 * Note: despite the typo in DB column name (`divice_id`), we keep `diviceId` in code
 * to match the task.
 */
export async function getOrCreateDiviceId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
  } catch (err) {
    console.error('Failed to read deviceId from SecureStore:', err);
  }

  const created = randomId();
  try {
    await SecureStore.setItemAsync(DEVICE_ID_STORAGE_KEY, created);
  } catch (err) {
    console.error('Failed to save deviceId to SecureStore:', err);
  }
  return created;
}
