import { View, Text, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { useCallback, useMemo } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useGetDashboard } from '@/src/hooks/useDashboard';
import { useGetPublicOnSiteVisitors } from '@/src/hooks/usePublicData';
import type { OnSiteVisitor } from '@/src/types/api';

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
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const router = useRouter();
  const { data: dashboard, isLoading: isLoadingDashboard, refetch: refetchDashboard } = useGetDashboard(deviceToken);
  const { data: onSiteVisitors, isLoading: isLoadingVisitors, error, refetch } = useGetPublicOnSiteVisitors(deviceToken);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchDashboard();
    }, [refetch, refetchDashboard])
  );

  const topVisitors = useMemo(() => {
    return [...onSiteVisitors]
      .sort((a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime())
      .slice(0, 5);
  }, [onSiteVisitors]);

  const kpis = dashboard
    ? [
        { label: 'On Site', value: dashboard.onSite },
        { label: 'Checked In', value: dashboard.arrivedToday },
        { label: 'Checked Out', value: dashboard.departedToday },
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
          <Text className="text-2xl font-black text-teal-900">Coming Soon</Text>
          <Text className="text-sm text-teal-600 mt-1">
            Dashboard features are under development.
          </Text>
        </View>

        {error ? (
          <View className="bg-red-50 rounded-2xl p-4 mb-6 border border-red-200">
            <Text className="text-red-500 text-center text-sm">{error}</Text>
            <Pressable
              onPress={() => refetch()}
              className="mt-3 bg-teal-600 rounded-xl px-6 py-2 self-center active:bg-teal-700"
            >
              <Text className="text-white font-bold text-sm">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* KPI Cards */}
        <View className="flex-row gap-3 mb-6">
          {isLoadingDashboard ? (
            <View className="flex-1 items-center py-6">
              <ActivityIndicator color="#0F766E" size="small" />
            </View>
          ) : kpis.length > 0 ? (
            kpis.map((kpi, idx) => (
              <View key={idx} className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <Text className="text-3xl font-black text-teal-700">{kpi.value}</Text>
                <Text className="text-xs font-bold text-teal-600 uppercase tracking-wide mt-1">
                  {kpi.label}
                </Text>
              </View>
            ))
          ) : null}
        </View>

        {/* Currently In */}
        <Text className="text-lg font-black text-teal-900 mb-3">Currently In</Text>

        {isLoadingVisitors ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#0F766E" size="large" />
          </View>
        ) : topVisitors.length > 0 ? (
          topVisitors.map((v: OnSiteVisitor) => (
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
                  Checked in at {formatTime(v.checkInAt)}
                </Text>
              </View>
              <View className="bg-teal-100 rounded-full px-3 py-1">
                <Text className="text-teal-700 text-xs font-bold">IN</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View className="bg-white rounded-2xl p-6 items-center border border-slate-200">
            <Text className="text-slate-400 text-center">No visitors currently on site</Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
