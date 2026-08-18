import { View, Text, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { useGetPublicOnSiteVisitors, useGetPublicVisitorKpis, useGetPublicBusinessSettings } from '@/src/hooks/usePublicData';
import VisitorBottomSheet from '@/src/components/VisitorBottomSheet';
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
  const { tenantSlug, apiBaseUrl, businessSettings: cachedBusiness, saveBusinessSettings } = useApi();
  const { setMode, resetState, setJustPaired } = useKiosk();
  const router = useRouter();
  const { data: business } = useGetPublicBusinessSettings(deviceToken);
  const { data: siteData, isLoading, error, refetch } = useGetPublicOnSiteVisitors(deviceToken);
  const { data: kpiData } = useGetPublicVisitorKpis(deviceToken);

  const [selectedVisitor, setSelectedVisitor] = useState<OnSiteVisitor | null>(null);

  const effectiveBusiness = cachedBusiness || business;
  const tenantName = effectiveBusiness?.name || tenantSlug || 'SecureVisit';
  const logoSrc = effectiveBusiness?.logoUrl
    ? effectiveBusiness.logoUrl.includes('blob.vercel-storage.com')
      ? `${apiBaseUrl}/api/blob?url=${encodeURIComponent(effectiveBusiness.logoUrl)}`
      : effectiveBusiness.logoUrl
    : null;

  useEffect(() => {
    if (business && !cachedBusiness) {
      saveBusinessSettings(business);
    }
  }, [business, cachedBusiness, saveBusinessSettings]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onSiteVisitors = siteData?.visitors ?? [];
  const kpisData = kpiData?.kpis ?? { onSite: 0, outToday: 0, totalToday: 0 };

  const sortedVisitors = useMemo(() => {
    return [...onSiteVisitors].sort(
      (a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime()
    );
  }, [onSiteVisitors]);

  const kpis = [
    { label: 'On Site', value: kpisData.onSite },
    { label: 'Today', value: kpisData.totalToday },
    { label: 'Checked Out', value: kpisData.outToday },
  ];

  function handleCheckIn() {
    setJustPaired(false);
    resetState();
    setMode('IN');
    router.push('/(kiosk)/check-in');
  }

  return (
    <ScreenWrapper padX={false}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Tenant header */}
        <View className="pt-8 pb-4 px-6 items-center">
          {logoSrc ? (
            <Image
              source={{ uri: logoSrc }}
              className="w-20 h-20 rounded-xl"
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../../../assets/images/icon-512x512.png')}
              className="w-20 h-20"
              resizeMode="contain"
            />
          )}
          <Text className="text-2xl font-black text-teal-900 mt-3">{tenantName}</Text>
        </View>

        {/* Check-in button */}
        <View className="px-6 mb-5">
          <Pressable
            onPress={handleCheckIn}
            className="bg-teal-700 rounded-2xl py-4 active:bg-teal-800 active:scale-95 items-center"
          >
            <Text className="text-white text-lg font-black">Check In</Text>
          </Pressable>
        </View>

        {error ? (
          <View className="bg-red-50 rounded-2xl p-4 mx-6 mb-5 border border-red-200">
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
        <View className="flex-row gap-3 px-6 mb-5">
          {isLoading ? (
            <View className="flex-1 items-center py-6">
              <ActivityIndicator color="#0F766E" size="small" />
            </View>
          ) : (
            kpis.map((kpi, idx) => (
              <View key={idx} className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <Text className="text-3xl font-black text-teal-700">{kpi.value}</Text>
                <Text className="text-xs font-bold text-teal-600 uppercase tracking-wide mt-1">
                  {kpi.label}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Currently In */}
        <Text className="text-lg font-black text-teal-900 mb-3 px-6">Currently In</Text>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#0F766E" size="large" />
          </View>
        ) : sortedVisitors.length > 0 ? (
          <View className="px-6" style={{ maxHeight: 400 }}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              {sortedVisitors.map((v: OnSiteVisitor) => (
                <Pressable
                  key={v.id}
                  onPress={() => setSelectedVisitor(v)}
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
              ))}
            </ScrollView>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-6 items-center border border-slate-200 mx-6">
            <Text className="text-slate-400 text-center">No visitors currently on site</Text>
          </View>
        )}
      </ScrollView>

      <VisitorBottomSheet
        visible={selectedVisitor !== null}
        visitor={selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
        onCheckoutComplete={() => refetch()}
      />
    </ScreenWrapper>
  );
}
