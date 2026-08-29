import { View, Text, ScrollView, ActivityIndicator, Image, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useNetwork } from '@/src/contexts/NetworkContext';
import { useGetPublicOnSiteVisitors, useGetPublicVisitorKpis, useGetPublicBusinessSettings } from '@/src/hooks/usePublicData';
import { useGetWaitingVisits, useGetExpectedVisits } from '@/src/hooks/useVisits';
import { getQueue, onQueueChange } from '@/src/lib/offline-queue';
import VisitorBottomSheet from '@/src/components/VisitorBottomSheet';
import type { OnSiteVisitor, WaitingVisit, ExpectedVisit } from '@/src/types/api';

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

function formatHeaderDateTime(date: Date, lang: string): string {
  const datePart = new Intl.DateTimeFormat(lang, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return `${datePart} - ${timePart}`;
}

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const { deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl, businessSettings: cachedBusiness, saveBusinessSettings } = useApi();
  const router = useRouter();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { data: business, isLoading: isBusinessLoading, error: businessError } =
    useGetPublicBusinessSettings(deviceToken);
  const { data: siteData, isLoading, error, refetch } = useGetPublicOnSiteVisitors(deviceToken, isFocused ? 10_000 : undefined);
  const {
    data: kpiData,
    isLoading: isKpiLoading,
    error: kpiError,
    refetch: refetchKpis,
  } = useGetPublicVisitorKpis(deviceToken, isFocused ? 10_000 : undefined);

  const { data: waitingData } = useGetWaitingVisits(deviceToken, isFocused ? 10_000 : undefined);
  const { data: expectedData, refetch: refetchExpected } = useGetExpectedVisits(deviceToken, isFocused ? 10_000 : undefined);

  const waitingVisits = waitingData ?? [];
  const expectedVisits = expectedData ?? [];

  const [selectedVisitor, setSelectedVisitor] = useState<OnSiteVisitor | null>(null);
  const [showDashboardSplash, setShowDashboardSplash] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const { isOnline } = useNetwork();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
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
        console.log('[Dashboard] focus refresh: on-site-visitors + visitor-kpis + operator');
      }
      refetch();
      refetchKpis();
      refetchExpected();
    }, [refetch, refetchKpis, refetchExpected])
  );

  const onSiteVisitors = siteData?.visitors ?? [];
  const kpisData = kpiData ?? { onSite: 0, outToday: 0, totalToday: 0 };

  const sortedVisitors = useMemo(() => {
    return [...onSiteVisitors].sort(
      (a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime()
    );
  }, [onSiteVisitors]);

  const expectedToday = expectedVisits.length;

  const pendingVisits = useMemo(() => {
    return waitingVisits
      .filter((v: WaitingVisit) => v.status === 'PENDING_APPROVAL')
      .sort((a, b) => {
        const am = a.waitingMinutes ?? 0;
        const bm = b.waitingMinutes ?? 0;
        if (am !== bm) return bm - am;
        return new Date(a.arrivalAt ?? 0).getTime() - new Date(b.arrivalAt ?? 0).getTime();
      });
  }, [waitingVisits]);

  const waitingApproval = pendingVisits.length;
  const approved = waitingVisits.filter((v: WaitingVisit) => v.status === 'APPROVED').length;
  const currentlyInside = kpisData.onSite;
  const totalVisits = kpisData.totalToday;
  const checkedOut = kpisData.outToday;

  const waitingPreview = pendingVisits.slice(0, 5);
  const expectedPreview = expectedVisits.slice(0, 5);
  const onSitePreview = sortedVisitors.slice(0, 5);

  function formatWait(minutes: number | null): string {
    if (minutes == null) return '—';
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
  }

  if (showDashboardSplash) {
    return (
      <View className="flex-1 bg-emerald-100 items-center justify-center relative">
        <StatusBar hidden />
        <Image
          source={require('../../../../assets/images/icon-512x512.png')}
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
        <View className="pt-8 pb-4 px-6 flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-3 flex-1">
            {logoSrc ? (
              <Image
                source={{ uri: logoSrc }}
                className="w-12 h-12 rounded-xl"
                resizeMode="contain"
              />
            ) : (
              <Image
                source={require('../../../../assets/images/icon-512x512.png')}
                className="w-12 h-12"
                resizeMode="contain"
              />
            )}
            <Text className="text-2xl font-black text-teal-900" numberOfLines={1}>{tenantName}</Text>
          </View>
          <Text className="text-xs font-bold text-teal-700 text-right">
            {formatHeaderDateTime(now, i18n.language)}
          </Text>
        </View>

        {/* Search bar (routes to search screen) */}
        <View className="px-6 pb-3">
          <Pressable
            onPress={() => router.push('/(kiosk)/(tabs)/home/search')}
            className="flex-row items-center px-4 py-3 rounded-xl border border-teal-300 bg-white active:bg-teal-50"
          >
            <Ionicons name="search" size={20} color="#94a3b8" />
            <Text className="text-lg text-slate-400 ml-2">
              {t('visitorSearch.searchPlaceholder')}
            </Text>
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
        <View className={`px-6 mb-5 ${isTablet ? 'max-w-2xl w-full self-center' : ''}`}>
          {isKpiLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color="#0F766E" size="large" />
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {[
                { value: expectedToday, label: t('dashboard.kpiExpected'), sub: t('dashboard.kpiExpectedSub'), icon: 'calendar-outline', primary: true, attention: false },
                { value: waitingApproval, label: t('dashboard.kpiWaitingApproval'), sub: null, icon: 'time-outline', primary: false, attention: true },
                { value: approved, label: t('dashboard.kpiApproved'), sub: null, icon: 'checkmark-circle-outline', primary: false, attention: false },
                { value: currentlyInside, label: t('dashboard.kpiCurrentlyInside'), sub: t('dashboard.kpiInsideSub'), icon: 'log-in-outline', primary: true, attention: false },
                { value: totalVisits, label: t('dashboard.kpiTotal'), sub: null, icon: 'people-outline', primary: false, attention: false },
                { value: checkedOut, label: t('dashboard.kpiCheckedOut'), sub: null, icon: 'log-out-outline', primary: false, attention: false },
              ].map((kpi, idx) => {
                const iconColor = kpi.primary ? '#ffffff' : kpi.attention ? '#d97706' : '#0d9488';
                const numberColor = kpi.primary ? 'text-white' : kpi.attention ? 'text-amber-700' : 'text-teal-700';
                const labelColor = kpi.primary ? 'text-teal-100' : kpi.attention ? 'text-amber-800' : 'text-teal-600';
                const subColor = kpi.primary ? 'text-teal-100' : kpi.attention ? 'text-amber-700' : 'text-slate-400';
                return (
                  <View
                    key={idx}
                    className={`w-[31%] rounded-2xl p-4 shadow-sm border ${
                      kpi.primary
                        ? 'bg-teal-700 border-teal-700'
                        : kpi.attention
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    <View className="flex-row justify-end items-center">
                      <Ionicons name={kpi.icon as never} size={24} color={iconColor} />
                    </View>
                    <View className="flex-1 justify-center">
                      <Text
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                        numberOfLines={1}
                        className={`font-black ${isTablet ? 'text-6xl' : 'text-5xl'} ${numberColor}`}
                      >
                        {kpi.value}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-xs font-bold uppercase tracking-wide text-right ${labelColor}`} numberOfLines={2}>
                        {kpi.label}
                      </Text>
                      {kpi.sub ? (
                        <Text className={`text-[10px] font-semibold text-right mt-0.5 ${subColor}`} numberOfLines={2}>
                          {kpi.sub}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Waiting for approval */}
        <View className="flex-row items-center justify-between mt-6 mb-3 px-6">
          <Text className="text-lg font-black text-teal-900">{t('operator.waitingSection')}</Text>
          <Pressable
            onPress={() => router.push('/(kiosk)/operator/waiting' as never)}
            hitSlop={12}
            className="flex-row items-center"
          >
            <Text className="text-teal-600 font-bold text-sm">{t('operator.viewList')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#0d9488" />
          </Pressable>
        </View>

        {waitingPreview.length > 0 ? (
          <View className="px-6">
            {waitingPreview.map((v: WaitingVisit) => (
              <View
                key={v.id}
                className="bg-white rounded-2xl p-4 mb-3 border border-amber-200 flex-row items-center gap-4"
              >
                {v.visitorPhotoUrl || v.visitor.photoUrl ? (
                  <Image
                    source={{ uri: photoSrc(v.visitorPhotoUrl || v.visitor.photoUrl, apiBaseUrl) }}
                    className="w-12 h-12 rounded-full bg-slate-200"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center">
                    <Text className="text-amber-700 text-lg font-black">
                      {v.visitor.firstName[0]}
                      {v.visitor.lastName[0]}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900">
                    {v.groupName || `${v.visitor.firstName} ${v.visitor.lastName}`}
                  </Text>
                  {v.organization ? (
                    <Text className="text-sm text-slate-500">{v.organization}</Text>
                  ) : v.visitor.company ? (
                    <Text className="text-sm text-slate-500">{v.visitor.company}</Text>
                  ) : null}
                  <Text className="text-xs text-amber-700 mt-0.5">
                    {t('operator.waitingSince')} {formatWait(v.waitingMinutes)}
                  </Text>
                </View>
                <View className="bg-amber-100 rounded-full px-3 py-1">
                  <Text className="text-amber-700 text-xs font-bold">{t('operator.waiting')}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-6 items-center border border-slate-200 mx-6">
            <Text className="text-slate-400 text-center">{t('operator.waitingEmpty')}</Text>
          </View>
        )}

        {/* Approved visitors waiting to check in */}
        <View className="flex-row items-center justify-between mt-6 mb-3 px-6">
          <Text className="text-lg font-black text-teal-900">{t('operator.expectedSection')}</Text>
          <Pressable
            onPress={() => router.push('/(kiosk)/operator/expected' as never)}
            hitSlop={12}
            className="flex-row items-center"
          >
            <Text className="text-teal-600 font-bold text-sm">{t('operator.viewList')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#0d9488" />
          </Pressable>
        </View>

        {expectedPreview.length > 0 ? (
          <View className="px-6">
            {expectedPreview.map((v: ExpectedVisit) => (
              <View
                key={v.id}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 flex-row items-center gap-4"
              >
                {v.visitorPhotoUrl || v.visitor.photoUrl ? (
                  <Image
                    source={{ uri: photoSrc(v.visitorPhotoUrl || v.visitor.photoUrl, apiBaseUrl) }}
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
                    {v.groupName || `${v.visitor.firstName} ${v.visitor.lastName}`}
                  </Text>
                  {v.organization ? (
                    <Text className="text-sm text-slate-500">{v.organization}</Text>
                  ) : v.visitor.company ? (
                    <Text className="text-sm text-slate-500">{v.visitor.company}</Text>
                  ) : null}
                  {v.arrivalAt ? (
                    <Text className="text-xs text-teal-600 mt-0.5">
                      {t('operator.waitingSince')} {formatTime(v.arrivalAt)}
                    </Text>
                  ) : null}
                </View>
                <View className="bg-teal-100 rounded-full px-3 py-1">
                  <Text className="text-teal-700 text-xs font-bold">{t('operator.approved')}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-6 items-center border border-slate-200 mx-6">
            <Text className="text-slate-400 text-center">{t('operator.expectedEmpty')}</Text>
          </View>
        )}

        {/* Currently In */}
        <View className="flex-row items-center justify-between mt-6 mb-3 px-6">
          <Text className="text-lg font-black text-teal-900">{t('dashboard.onSiteTitle')}</Text>
          <Pressable
            onPress={() => router.push('/(kiosk)/operator/inside' as never)}
            hitSlop={12}
            className="flex-row items-center"
          >
            <Text className="text-teal-600 font-bold text-sm">{t('operator.viewList')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#0d9488" />
          </Pressable>
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#0F766E" size="large" />
          </View>
        ) : sortedVisitors.length > 0 ? (
          <View className="px-6">
            {onSitePreview.map((v: OnSiteVisitor) => (
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
                      {t('success.checkedInAtTime')} {formatTime(v.checkInAt)}
                    </Text>
                  </View>
                  <View className="bg-teal-100 rounded-full px-3 py-1">
                      <Text className="text-teal-700 text-xs font-bold">{t('common.onsiteStatus')}</Text>
                  </View>
                </Pressable>
              ))}
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
