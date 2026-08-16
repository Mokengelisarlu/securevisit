import { View, Text, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useGetDashboard } from '@/src/hooks/useDashboard';
import type { RecentActivity } from '@/src/types/api';

function photoSrc(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('blob.vercel-storage.com')) {
    return `${baseUrl}/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const { data, isLoading, error, refetch } = useGetDashboard(deviceToken, 20000);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const kpis = data
    ? [
        { label: t('dashboard.kpiOnSite'), value: data.onSite },
        { label: t('dashboard.kpiCheckedIn'), value: data.arrivedToday },
        { label: t('dashboard.kpiCheckedOut'), value: data.departedToday },
        { label: t('dashboard.kpiToday'), value: data.visitsToday },
      ]
    : [];

  return (
    <ScreenWrapper padX={false}>
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="pt-8 pb-6">
          <Text className="text-3xl font-black text-teal-900">{t('dashboard.title')}</Text>
          <Text className="text-base text-teal-600 mt-1">{t('dashboard.subtitle')}</Text>
        </View>

        {error && !data ? (
          <Card className="items-center py-6 mb-6">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <Pressable
              onPress={() => refetch()}
              className="bg-teal-600 rounded-xl px-6 py-2 active:bg-teal-700"
            >
              <Text className="text-white font-bold text-sm">{t('common.retry')}</Text>
            </Pressable>
          </Card>
        ) : null}

        {isLoading && !data ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#0F766E" size="large" />
            <Text className="text-teal-700 mt-3">{t('common.loading')}</Text>
          </View>
        ) : (
          <>
            <View className="flex-row gap-3 mb-6">
              {kpis.map((kpi, idx) => (
                <View key={idx} className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                  <Text className="text-4xl font-black text-teal-700">{kpi.value}</Text>
                  <Text className="text-xs font-bold text-teal-600 uppercase tracking-wide mt-1">
                    {kpi.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="text-lg font-black text-teal-900 mb-3">
              {t('dashboard.onSiteTitle')}
            </Text>
            <View className="mb-6">
              {data && data.onSiteVisitors.length > 0 ? (
                data.onSiteVisitors.map((v) => (
                  <View
                    key={v.id}
                    className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 flex-row items-center gap-4"
                  >
                    {v.visitor.photoUrl ? (
                      <Image
                        source={{ uri: photoSrc(v.visitor.photoUrl, apiBaseUrl) }}
                        className="w-12 h-12 rounded-full bg-slate-200"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center">
                        <Text className="text-teal-600 text-lg font-black">
                          {v.visitor.firstName[0]}
                          {v.visitor.lastName[0]}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900">
                        {v.visitor.firstName} {v.visitor.lastName}
                      </Text>
                      {v.visitor.company ? (
                        <Text className="text-sm text-slate-500">{v.visitor.company}</Text>
                      ) : null}
                      <Text className="text-xs text-teal-600 mt-0.5">
                        {t('success.checkedInAt')} {formatTime(v.checkInAt)}
                      </Text>
                    </View>
                    <View className="bg-teal-100 rounded-full px-3 py-1">
                      <Text className="text-teal-700 text-xs font-bold">{t('checkOut.checkOutButton')}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Card className="items-center py-6">
                  <Text className="text-slate-500 text-center">{t('dashboard.emptyOnSite')}</Text>
                </Card>
              )}
            </View>

            <Text className="text-lg font-black text-teal-900 mb-3">
              {t('dashboard.recentTitle')}
            </Text>
            <View>
              {data && data.recentActivities.length > 0 ? (
                data.recentActivities.map((a: RecentActivity) => (
                  <View
                    key={a.id}
                    className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 flex-row items-center gap-4"
                  >
                    {a.visitorPhotoUrl ? (
                      <Image
                        source={{ uri: photoSrc(a.visitorPhotoUrl, apiBaseUrl) }}
                        className="w-12 h-12 rounded-full bg-slate-200"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center">
                        <Text className="text-teal-600 text-lg font-black">
                          {a.visitorName.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900">{a.visitorName}</Text>
                      <Text className="text-sm text-slate-500">
                        {a.hostName !== 'N/A' ? `${t('dashboard.host')} ${a.hostName}` : a.hostName}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${
                        a.type === 'CHECK_IN' ? 'bg-teal-100' : 'bg-orange-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          a.type === 'CHECK_IN' ? 'text-teal-700' : 'text-orange-700'
                        }`}
                      >
                        {a.type === 'CHECK_IN' ? t('dashboard.checkIn') : t('dashboard.checkOut')}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500 w-16 text-right">
                      {formatTime(a.time)}
                    </Text>
                  </View>
                ))
              ) : (
                <Card className="items-center py-6">
                  <Text className="text-slate-500 text-center">{t('dashboard.emptyRecent')}</Text>
                </Card>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
