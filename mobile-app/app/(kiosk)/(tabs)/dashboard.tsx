import { View, Text, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useGetDashboard } from '@/src/hooks/useDashboard';
import { useGetPublicRecentVisits } from '@/src/hooks/usePublicData';
import type { VisitHistoryEntry } from '@/src/types/api';

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

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetDashboard(deviceToken, 20000);
  const { data: recentVisits, isLoading: isLoadingVisits } = useGetPublicRecentVisits(deviceToken);

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
            {/* KPI Cards */}
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

            {/* On-Site Visitors */}
            <Text className="text-lg font-black text-teal-900 mb-3">
              {t('dashboard.onSiteTitle')}
            </Text>
            <View className="mb-6">
              {data && data.onSiteVisitors.length > 0 ? (
                data.onSiteVisitors.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(kiosk)/visitor-detail',
                        params: { visitorId: v.visitor.id },
                      })
                    }
                    className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 flex-row items-center gap-4 active:bg-teal-50 active:border-teal-400"
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
                  </Pressable>
                ))
              ) : (
                <Card className="items-center py-6">
                  <Text className="text-slate-500 text-center">{t('dashboard.emptyOnSite')}</Text>
                </Card>
              )}
            </View>

            {/* Recent Visit History */}
            <Text className="text-lg font-black text-teal-900 mb-3">
              {t('dashboard.recentVisitsTitle', 'Recent Visits')}
            </Text>
            <View>
              {isLoadingVisits ? (
                <View className="items-center py-8">
                  <ActivityIndicator color="#0F766E" size="small" />
                </View>
              ) : recentVisits && recentVisits.length > 0 ? (
                recentVisits.map((visit: VisitHistoryEntry) => (
                  <Pressable
                    key={visit.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(kiosk)/visit-detail',
                        params: { visitId: visit.id },
                      })
                    }
                    className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 active:bg-teal-50 active:border-teal-400"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-bold text-slate-900">
                        {visit.visitor?.firstName} {visit.visitor?.lastName}
                      </Text>
                      <View className={`rounded-full px-3 py-1 ${getStatusBadgeClasses(visit.status)}`}>
                        <Text className={`text-xs font-bold ${getStatusTextClasses(visit.status)}`}>
                          {visit.status}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xs text-slate-500">
                        {formatDate(visit.visitDate)}
                      </Text>
                      {visit.host ? (
                        <Text className="text-xs text-slate-500">
                          {visit.host.firstName} {visit.host.lastName}
                        </Text>
                      ) : null}
                    </View>
                    {visit.purpose ? (
                      <Text className="text-xs text-slate-400 mt-1" numberOfLines={1}>
                        {visit.purpose}
                      </Text>
                    ) : null}
                  </Pressable>
                ))
              ) : (
                <Card className="items-center py-6">
                  <Text className="text-slate-500 text-center">
                    {t('dashboard.emptyRecent', 'No recent visits')}
                  </Text>
                </Card>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
