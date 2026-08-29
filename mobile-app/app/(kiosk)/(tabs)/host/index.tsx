import { View, Text, ScrollView, ActivityIndicator, Pressable, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useGetPublicHostSummary } from '@/src/hooks/usePublicData';

function photoSrc(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('blob.vercel-storage.com')) {
    return `${baseUrl}/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function HostListScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data, isLoading, error, refetch } = useGetPublicHostSummary(deviceToken);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const hosts = data ?? [];

  return (
    <ScreenWrapper padX={false}>
      <View className="flex-1 px-6 pt-8 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-3xl font-black text-teal-900">{t('host.title')}</Text>
          <Ionicons name="people" size={26} color="#0F766E" />
        </View>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#0F766E" size="large" />
          </View>
        ) : error ? (
          <View className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <Text className="text-red-500 text-center text-sm">{error}</Text>
            <Pressable
              onPress={() => refetch()}
              className="mt-3 bg-teal-600 rounded-xl px-6 py-2 self-center active:bg-teal-700"
            >
              <Text className="text-white font-bold text-sm">{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : hosts.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-slate-200">
            <Text className="text-slate-400 text-center">{t('host.empty')}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="flex-row flex-wrap">
              {hosts.map((host) => (
                <Pressable
                  key={host.id}
                  onPress={() => router.push({ pathname: '/(kiosk)/(tabs)/host/[id]', params: { id: host.id } })}
                  className={`rounded-2xl p-4 mb-3 bg-white border border-slate-200 active:bg-teal-50 active:border-teal-400 ${
                    isTablet ? 'w-[48.5%] mr-[3%]' : 'w-full'
                  }`}
                  style={isTablet ? { marginRight: '3%' } : undefined}
                >
                  <View className="flex-row items-center gap-3">
                    {host.photoUrl ? (
                      <Image
                        source={{ uri: photoSrc(host.photoUrl, apiBaseUrl) }}
                        className="w-12 h-12 rounded-full bg-slate-200"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center">
                        <Text className="text-teal-700 text-lg font-black">
                          {host.firstName[0]}
                          {host.lastName[0]}
                        </Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900">
                        {host.firstName} {host.lastName}
                      </Text>
                      {host.department?.name ? (
                        <Text className="text-sm text-slate-500" numberOfLines={1}>
                          {host.department.name}
                        </Text>
                      ) : (
                        <Text className="text-sm text-slate-400">{t('host.none')}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </View>

                  <View className="flex-row justify-between mt-4 pt-3 border-t border-slate-100">
                    <HostStat
                      icon="calendar-outline"
                      value={host.totalToday}
                      label={t('host.totalToday')}
                      color="#0F766E"
                    />
                    <HostStat
                      icon="time-outline"
                      value={host.expected}
                      label={t('host.expected')}
                      color="#0284C7"
                    />
                    <HostStat
                      icon="alert-circle-outline"
                      value={host.waiting}
                      label={t('host.waiting')}
                      color="#D97706"
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}

function HostStat({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: string }) {
  return (
    <View className="items-center flex-1">
      <Ionicons name={icon} size={16} color={color} />
      <Text className="text-xl font-black text-slate-900 mt-1">{value}</Text>
      <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-center" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
