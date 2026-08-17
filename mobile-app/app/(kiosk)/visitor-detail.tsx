import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Card } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import {
  useGetPublicVisitorDetail,
  useGetPublicVisitHistory,
} from '@/src/hooks/usePublicData';
import type { VisitHistoryEntry } from '@/src/types/api';

function photoSrc(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('blob.vercel-storage.com')) {
    return `${baseUrl}/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'IN':
      return 'bg-teal-100';
    case 'OUT':
      return 'bg-slate-100';
    case 'SCHEDULED':
      return 'bg-blue-100';
    case 'CANCELLED':
      return 'bg-red-100';
    default:
      return 'bg-slate-100';
  }
}

function getStatusTextClasses(status: string) {
  switch (status) {
    case 'IN':
      return 'text-teal-700';
    case 'OUT':
      return 'text-slate-700';
    case 'SCHEDULED':
      return 'text-blue-700';
    case 'CANCELLED':
      return 'text-red-700';
    default:
      return 'text-slate-700';
  }
}

export default function VisitorDetailScreen() {
  const { t } = useTranslation();
  const { visitorId } = useLocalSearchParams<{ visitorId: string }>();
  const router = useRouter();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();

  const {
    data: visitor,
    isLoading: isLoadingVisitor,
    error: visitorError,
    fetchVisitor,
  } = useGetPublicVisitorDetail(deviceToken);

  const {
    data: history,
    isLoading: isLoadingHistory,
    error: historyError,
    fetchHistory,
  } = useGetPublicVisitHistory(deviceToken);

  useEffect(() => {
    if (visitorId) {
      fetchVisitor(visitorId);
      fetchHistory(visitorId);
    }
  }, [visitorId]);

  const isLoading = isLoadingVisitor || isLoadingHistory;
  const error = visitorError || historyError;

  return (
    <ScreenWrapper padX={false}>
      <View className="px-6 pt-8 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="mb-4 self-start"
          hitSlop={12}
        >
          <Text className="text-teal-700 text-base font-semibold">
            ← {t('common.back')}
          </Text>
        </Pressable>
        <Text className="text-3xl font-black text-teal-900">
          {t('visitorDetail.title', 'Visitor Detail')}
        </Text>
      </View>

      {isLoading && !visitor ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#0F766E" size="large" />
          <Text className="text-teal-700 mt-3">{t('common.loading')}</Text>
        </View>
      ) : error && !visitor ? (
        <View className="px-6">
          <Card className="items-center py-6">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <Pressable
              onPress={() => {
                if (visitorId) {
                  fetchVisitor(visitorId);
                  fetchHistory(visitorId);
                }
              }}
              className="bg-teal-600 rounded-xl px-6 py-2 active:bg-teal-700"
            >
              <Text className="text-white font-bold text-sm">
                {t('common.retry')}
              </Text>
            </Pressable>
          </Card>
        </View>
      ) : visitor ? (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Card className="mb-6">
            <View className="items-center py-6 px-4">
              {visitor.photoUrl ? (
                <Image
                  source={{ uri: photoSrc(visitor.photoUrl, apiBaseUrl) }}
                  className="w-20 h-20 rounded-full bg-slate-200 mb-4"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center mb-4">
                  <Text className="text-teal-600 text-3xl font-black">
                    {visitor.firstName[0]}
                    {visitor.lastName[0]}
                  </Text>
                </View>
              )}
              <Text className="text-2xl font-black text-slate-900 text-center">
                {visitor.firstName} {visitor.lastName}
              </Text>
              {visitor.company ? (
                <Text className="text-base text-slate-500 mt-1">
                  {visitor.company}
                </Text>
              ) : null}
              {visitor.visitorTypeName ? (
                <View className="mt-3">
                  <Text className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                    {t('visitorDetail.type', 'Visitor Type')}
                  </Text>
                  <Text className="text-sm font-semibold text-slate-800 mt-0.5 text-center">
                    {visitor.visitorTypeName}
                  </Text>
                </View>
              ) : null}
              <View className="mt-3">
                <View
                  className={`rounded-full px-4 py-1.5 ${
                    visitor.isOnSite ? 'bg-teal-100' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      visitor.isOnSite ? 'text-teal-700' : 'text-slate-700'
                    }`}
                  >
                    {visitor.isOnSite
                      ? t('visitorDetail.onSite', 'On-Site')
                      : t('visitorDetail.offSite', 'Off-Site')}
                  </Text>
                </View>
              </View>
              {visitor.phone ? (
                <View className="mt-3 flex-row items-center gap-1.5">
                  <Ionicons name="call-outline" size={14} color="#64748b" />
                  <Text className="text-sm text-slate-600">
                    {visitor.phone}
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          <View className="mb-6">
            <Text className="text-lg font-black text-teal-900 mb-3">
              {t('visitorDetail.visitHistory', 'Visit History')} ({history.length})
            </Text>
            {isLoadingHistory ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#0F766E" size="small" />
              </View>
            ) : history.length === 0 ? (
              <Card className="items-center py-6">
                <Text className="text-slate-500 text-center">
                  {t('visitorDetail.noHistory', 'No visit history yet')}
                </Text>
              </Card>
            ) : (
              history.map((entry: VisitHistoryEntry) => (
                <Pressable
                  key={entry.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(kiosk)/visit-detail',
                      params: { visitId: entry.id },
                    })
                  }
                  className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 active:bg-teal-50 active:border-teal-400"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-bold text-slate-900">
                      {entry.visitNumber || entry.id.slice(0, 12)}
                    </Text>
                    <View className={`rounded-full px-3 py-1 ${getStatusBadgeClasses(entry.status)}`}>
                      <Text className={`text-xs font-bold ${getStatusTextClasses(entry.status)}`}>
                        {entry.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Ionicons name="calendar-outline" size={12} color="#64748b" />
                    <Text className="text-xs text-slate-500">
                      {formatDate(entry.visitDate)}
                      {entry.host
                        ? ` • ${entry.host.firstName} ${entry.host.lastName}`
                        : ''}
                    </Text>
                  </View>
                  {entry.purpose ? (
                    <Text className="text-xs text-slate-500" numberOfLines={1}>
                      {entry.purpose}
                    </Text>
                  ) : null}
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      ) : null}
    </ScreenWrapper>
  );
}
