import { View, Text, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { useNetwork } from '@/src/contexts/NetworkContext';
import { useGetPublicOnSiteVisitors, useGetPublicVisitorKpis, useGetPublicBusinessSettings } from '@/src/hooks/usePublicData';
import { getQueue, onQueueChange } from '@/src/lib/offline-queue';
import VisitorBottomSheet from '@/src/components/VisitorBottomSheet';
import type { OnSiteVisitor } from '@/src/types/api';

const DASHBOARD_SPLASH_DISMISS_DELAY_MS = 500;

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
  const { tenantSlug, apiBaseUrl, businessSettings: cachedBusiness, saveBusinessSettings } = useApi();
  const { setMode, resetState, setJustPaired } = useKiosk();
  const router = useRouter();
  const navigation = useNavigation();
  const { data: business, isLoading: isBusinessLoading, error: businessError } =
    useGetPublicBusinessSettings(deviceToken);
  const { data: siteData, isLoading, error, refetch } = useGetPublicOnSiteVisitors(deviceToken, 10_000);
  const {
    data: kpiData,
    isLoading: isKpiLoading,
    error: kpiError,
    refetch: refetchKpis,
  } = useGetPublicVisitorKpis(deviceToken, 10_000);

  const [selectedVisitor, setSelectedVisitor] = useState<OnSiteVisitor | null>(null);
  const [showDashboardSplash, setShowDashboardSplash] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const { isOnline } = useNetwork();

  useEffect(() => {
    if ((!isLoading && !isKpiLoading) || error || kpiError) {
      const dismissTimer = setTimeout(() => {
        setShowDashboardSplash(false);
      }, DASHBOARD_SPLASH_DISMISS_DELAY_MS);

      return () => clearTimeout(dismissTimer);
    }
  }, [error, isKpiLoading, isLoading, kpiError]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: showDashboardSplash ? { display: 'none' } : undefined,
    });

    return () => {
      navigation.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation, showDashboardSplash]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[Dashboard] business-settings state:', {
      resource: 'business-settings',
      loading: isBusinessLoading,
      hasBusiness: Boolean(business || cachedBusiness),
      error: businessError,
    });
  }, [business, cachedBusiness, isBusinessLoading, businessError]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[Dashboard] on-site-visitors state:', {
      resource: 'on-site-visitors',
      loading: isLoading,
      visitorCount: siteData?.visitors?.length ?? 0,
      stats: siteData?.stats ?? null,
      error,
    });
  }, [isLoading, siteData, error]);

  useEffect(() => {
    if (!__DEV__) return;
    console.log('[Dashboard] visitor-kpis state:', {
      resource: 'visitor-kpis',
      loading: isKpiLoading,
      data: kpiData,
      error: kpiError,
    });
  }, [isKpiLoading, kpiData, kpiError]);

  useEffect(() => {
    async function refreshCount() {
      const queue = await getQueue();
      setPendingCount(queue.filter((a) => a.status === 'pending' || a.status === 'failed').length);
    }
    refreshCount();
    const unsub = onQueueChange(refreshCount);
    return unsub;
  }, []);

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
      if (__DEV__) {
        console.log('[Dashboard] focus refresh: on-site-visitors + visitor-kpis');
      }
      refetch();
      refetchKpis();
    }, [refetch, refetchKpis])
  );

  const onSiteVisitors = siteData?.visitors ?? [];
  const kpisData = kpiData ?? { onSite: 0, outToday: 0, totalToday: 0 };

  const sortedVisitors = useMemo(() => {
    return [...onSiteVisitors].sort(
      (a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime()
    );
  }, [onSiteVisitors]);

  const kpis = [
    { label: t('dashboard.kpiOnSite'), value: kpisData.onSite },
    { label: t('dashboard.kpiToday'), value: kpisData.totalToday },
    { label: t('dashboard.kpiCheckedOut'), value: kpisData.outToday },
  ];

  function handleCheckIn() {
    setJustPaired(false);
    resetState();
    setMode('IN');
    router.push('/(kiosk)/check-in');
  }

  if (showDashboardSplash) {
    return (
      <View className="flex-1 bg-emerald-100 items-center justify-center relative">
        <StatusBar hidden />
        <Image
          source={require('../../../assets/images/icon-512x512.png')}
          className="w-36 h-36"
          resizeMode="contain"
        />
        <View className="absolute bottom-8 left-0 right-0 items-center">
          <Text className="text-emerald-900 text-sm font-semibold">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScreenWrapper padX={false}>
      <StatusBar hidden={false} />
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
            <Text className="text-white text-lg font-black">{t('dashboard.checkIn')}</Text>
          </Pressable>
        </View>

        {pendingCount > 0 ? (
          <Pressable
            onPress={() => router.push('/(kiosk)/offline' as any)}
            className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex-row items-center gap-3 active:bg-amber-100"
          >
            <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center">
              <Text className="text-white text-sm font-black">{pendingCount}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-amber-900 text-sm font-bold">{t('offline.pending')}</Text>
              <Text className="text-amber-700 text-xs">{isOnline ? t('offline.onlineWarning') : t('offline.offlineWarning')}</Text>
            </View>
          </Pressable>
        ) : null}

        {error ? (
          <View className="bg-red-50 rounded-2xl p-4 mx-6 mb-5 border border-red-200">
            <Text className="text-red-500 text-center text-sm">{error}</Text>
            <Pressable
              onPress={() => refetch()}
              className="mt-3 bg-teal-600 rounded-xl px-6 py-2 self-center active:bg-teal-700"
            >
              <Text className="text-white font-bold text-sm">{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {/* KPI Cards */}
        {kpiError ? (
          <View className="bg-red-50 rounded-2xl p-4 mx-6 mb-5 border border-red-200">
            <Text className="text-red-500 text-center text-sm">{t('dashboard.unableToLoadKpis')}</Text>
            <Pressable
              onPress={() => refetchKpis()}
              className="mt-3 bg-teal-600 rounded-xl px-6 py-2 self-center active:bg-teal-700"
            >
              <Text className="text-white font-bold text-sm">{t('dashboard.retryKpis')}</Text>
            </Pressable>
          </View>
        ) : null}
        <View className="flex-row gap-3 px-6 mb-5">
          {isKpiLoading ? (
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
        <Text className="text-lg font-black text-teal-900 mb-3 px-6">{t('dashboard.onSiteTitle')}</Text>

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
                      {t('success.checkedInAt')} {formatTime(v.checkInAt)}
                    </Text>
                  </View>
                  <View className="bg-teal-100 rounded-full px-3 py-1">
                      <Text className="text-teal-700 text-xs font-bold">{t('common.onsiteStatus')}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-6 items-center border border-slate-200 mx-6">
            <Text className="text-slate-400 text-center">{t('dashboard.emptyOnSite')}</Text>
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
