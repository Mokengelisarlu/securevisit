import { View, Text, FlatList, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card, Button } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useNetwork } from '@/src/contexts/NetworkContext';
import {
  getQueue,
  retryFailedAction,
  retryAllFailed,
  removeAction,
  onQueueChange,
  type OfflineAction,
} from '@/src/lib/offline-queue';
import { syncQueue, onSyncEvent } from '@/src/lib/sync-engine';

export default function OfflineScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl } = useApi();
  const { isOnline } = useNetwork();
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const refreshQueue = useCallback(async () => {
    const items = await getQueue();
    setQueue(items);
  }, []);

  useEffect(() => {
    refreshQueue();
    const unsub = onQueueChange(refreshQueue);
    return unsub;
  }, [refreshQueue]);

  useEffect(() => {
    const unsub = onSyncEvent((event) => {
      if (event.status === 'syncing') {
        setSyncing(true);
        setSyncMessage(null);
      } else if (event.status === 'success') {
        setSyncMessage(t('offline.syncSuccess'));
        refreshQueue();
      } else if (event.status === 'failed') {
        setSyncMessage(t('offline.syncFailed'));
        refreshQueue();
      }
    });
    return unsub;
  }, [t, refreshQueue]);

  useEffect(() => {
    if (queue.length === 0 && !syncing) {
      setSyncMessage(null);
    }
  }, [queue.length, syncing]);

  async function handleSyncAll() {
    if (!deviceToken || !tenantSlug) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncQueue(deviceToken, tenantSlug, apiBaseUrl);
      if (result.synced > 0 && result.failed === 0) {
        setSyncMessage(t('offline.allSynced', { count: result.synced }));
      } else if (result.synced > 0) {
        setSyncMessage(
          t('offline.partialSync', { synced: result.synced, failed: result.failed })
        );
      } else {
        setSyncMessage(t('offline.syncFailed'));
      }
    } catch {
      setSyncMessage(t('offline.syncFailed'));
    } finally {
      setSyncing(false);
      refreshQueue();
    }
  }

  async function handleRetryAction(id: string) {
    await retryFailedAction(id);
    refreshQueue();
  }

  async function handleRemoveAction(id: string) {
    await removeAction(id);
    refreshQueue();
  }

  async function handleRetryAll() {
    await retryAllFailed();
    refreshQueue();
  }

  function formatActionType(type: OfflineAction['type']): string {
    switch (type) {
      case 'check_in':
        return t('offline.actionCheckIn');
      case 'checkout':
        return t('offline.actionCheckout');
      default:
        return type;
    }
  }

  function formatTime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (checkDate.getTime() === today.getTime()) {
      return t('success.today');
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const pendingCount = queue.filter((a) => a.status === 'pending').length;
  const failedCount = queue.filter((a) => a.status === 'failed').length;
  const totalCount = queue.length;

  return (
    <ScreenWrapper padX={false}>
      <View className="px-6 pt-8 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="mb-4 self-start"
          hitSlop={12}
        >
          <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
        </Pressable>
        <Text className="text-3xl font-black text-teal-900">{t('offline.title')}</Text>
        <Text className="text-base text-teal-600 mt-1">
          {isOnline ? t('offline.onlineMessage') : t('offline.offlineMessage')}
        </Text>
      </View>

      {!isOnline ? (
        <View className="mx-6 mb-4 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex-row items-center gap-3">
          <View className="w-3 h-3 rounded-full bg-amber-500" />
          <Text className="text-amber-800 text-sm font-semibold flex-1">
            {t('offline.offlineWarning')}
          </Text>
        </View>
      ) : (
        <View className="mx-6 mb-4 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex-row items-center gap-3">
          <View className="w-3 h-3 rounded-full bg-teal-500" />
          <Text className="text-teal-800 text-sm font-semibold flex-1">
            {t('offline.onlineWarning')}
          </Text>
        </View>
      )}

      <View className="mx-6 mb-4 flex-row gap-3">
        <Card className="flex-1 items-center py-3">
          <Text className="text-2xl font-black text-teal-700">{totalCount}</Text>
          <Text className="text-xs text-slate-500 font-semibold">{t('offline.total')}</Text>
        </Card>
        <Card className="flex-1 items-center py-3">
          <Text className="text-2xl font-black text-amber-600">{pendingCount}</Text>
          <Text className="text-xs text-slate-500 font-semibold">{t('offline.pending')}</Text>
        </Card>
        <Card className="flex-1 items-center py-3">
          <Text className="text-2xl font-black text-red-600">{failedCount}</Text>
          <Text className="text-xs text-slate-500 font-semibold">{t('offline.failed')}</Text>
        </Card>
      </View>

      {syncMessage ? (
        <View className="mx-6 mb-4 bg-slate-100 rounded-xl px-4 py-3">
          <Text className="text-slate-700 text-sm text-center font-semibold">
            {syncMessage}
          </Text>
        </View>
      ) : null}

      <View className="mx-6 mb-4 gap-3">
        <Button
          onPress={handleSyncAll}
          loading={syncing}
          disabled={syncing || totalCount === 0 || !isOnline}
          size="lg"
        >
          {t('offline.retryAll')}
        </Button>
        {failedCount > 0 ? (
          <Button
            onPress={handleRetryAll}
            variant="ghost"
            size="md"
            disabled={syncing}
          >
            {t('offline.retryFailed')}
          </Button>
        ) : null}
      </View>

      <View className="flex-1 px-6">
        {totalCount === 0 ? (
          <View className="items-center py-12">
            <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mb-4">
              <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 13l4 4L19 7"
                  stroke="#0F766E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text className="text-lg font-bold text-slate-700 text-center">
              {t('offline.emptyTitle')}
            </Text>
            <Text className="text-sm text-slate-500 text-center mt-1">
              {t('offline.emptySubtitle')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Card className="mb-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <View
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.status === 'pending'
                            ? 'bg-amber-500'
                            : item.status === 'syncing'
                            ? 'bg-blue-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <Text className="text-sm font-bold text-slate-800">
                        {formatActionType(item.type)}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        {item.status === 'pending'
                          ? t('offline.statusPending')
                          : item.status === 'syncing'
                          ? t('offline.statusSyncing')
                          : t('offline.statusFailed')}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500">
                      {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                    </Text>
                    {item.payload?.visitData?.newVisitor ? (
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {item.payload.visitData.newVisitor.firstName}{' '}
                        {item.payload.visitData.newVisitor.lastName}
                      </Text>
                    ) : null}
                    {item.payload?.visitId ? (
                      <Text className="text-xs text-slate-500 mt-0.5">
                        Visit #{item.payload.visitId.slice(0, 8)}…
                      </Text>
                    ) : null}
                    {item.error ? (
                      <Text className="text-xs text-red-500 mt-1" numberOfLines={2}>
                        {item.error}
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row gap-2 ml-3">
                    {item.status === 'failed' ? (
                      <Pressable
                        onPress={() => handleRetryAction(item.id)}
                        className="bg-teal-100 rounded-lg px-3 py-1.5"
                      >
                        <Text className="text-teal-700 text-xs font-bold">
                          {t('common.retry')}
                        </Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => handleRemoveAction(item.id)}
                      className="bg-slate-100 rounded-lg px-3 py-1.5"
                    >
                      <Text className="text-slate-500 text-xs font-bold">
                        {t('common.clear')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
