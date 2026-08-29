import { View, Text, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useGetPublicHostSummary } from '@/src/hooks/usePublicData';
import { useGetWaitingVisits, useGetExpectedVisits } from '@/src/hooks/useVisits';
import type { ExpectedVisit, WaitingVisit } from '@/src/types/api';

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

export default function HostDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const router = useRouter();

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useGetPublicHostSummary(deviceToken);
  const { data: waitingData } = useGetWaitingVisits(deviceToken);
  const { data: expectedData } = useGetExpectedVisits(deviceToken);

  const host = summary?.find((h) => h.id === id);

  const waiting = (waitingData ?? []).filter((v: WaitingVisit) => v.hostId === id);
  const expected = (expectedData ?? []).filter((v: ExpectedVisit) => v.hostId === id);

  return (
    <ScreenWrapper padX={false}>
      <View className="flex-1">
        <View className="flex-row items-center gap-3 px-6 pt-8 pb-2">
          <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#0F766E" />
          </Pressable>
          <Text className="text-2xl font-black text-teal-900">{t('host.details')}</Text>
        </View>

        {isSummaryLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#0F766E" size="large" />
          </View>
        ) : summaryError ? (
          <View className="bg-red-50 rounded-2xl p-4 mx-6 border border-red-200">
            <Text className="text-red-500 text-center text-sm">{summaryError}</Text>
          </View>
        ) : !host ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-slate-200 mx-6 mt-4">
            <Text className="text-slate-400 text-center">{t('host.noHost')}</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="bg-white rounded-2xl p-5 m-6 border border-slate-200">
              <View className="flex-row items-center gap-4">
                {host.photoUrl ? (
                  <Image
                    source={{ uri: photoSrc(host.photoUrl, apiBaseUrl) }}
                    className="w-16 h-16 rounded-full bg-slate-200"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center">
                    <Text className="text-teal-700 text-2xl font-black">
                      {host.firstName[0]}
                      {host.lastName[0]}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-xl font-black text-slate-900">
                    {host.firstName} {host.lastName}
                  </Text>
                  <Text className="text-sm text-slate-500">
                    {host.department?.name ?? t('host.none')}
                  </Text>
                  {host.email ? <Text className="text-sm text-slate-500">{host.email}</Text> : null}
                  {host.phone ? <Text className="text-sm text-slate-500">{host.phone}</Text> : null}
                </View>
              </View>

              <View className="flex-row justify-between mt-5 pt-4 border-t border-slate-100">
                <DetailStat icon="calendar-outline" value={host.totalToday} label={t('host.today')} color="#0F766E" />
                <DetailStat icon="time-outline" value={host.expected} label={t('host.expected')} color="#0284C7" />
                <DetailStat icon="alert-circle-outline" value={host.waiting} label={t('host.waiting')} color="#D97706" />
              </View>
            </View>

            <Text className="text-lg font-black text-teal-900 px-6 mb-3">{t('host.waitingSection')}</Text>
            {waiting.length > 0 ? (
              <View className="px-6">
                  {waiting.map((v: WaitingVisit) => (
                  <View key={v.id} className="bg-white rounded-2xl p-4 mb-3 border border-amber-200 flex-row items-center gap-4">
                    <View className="w-11 h-11 rounded-full bg-amber-100 items-center justify-center">
                      <Text className="text-amber-700 font-black">
                        {v.visitor.firstName[0]}
                        {v.visitor.lastName[0]}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900">
                        {v.groupName || `${v.visitor.firstName} ${v.visitor.lastName}`}
                      </Text>
                      {v.organization ? (
                        <Text className="text-sm text-slate-500">{v.organization}</Text>
                      ) : v.visitor.company ? (
                        <Text className="text-sm text-slate-500">{v.visitor.company}</Text>
                      ) : null}
                    </View>
                    <View className="bg-amber-100 rounded-full px-3 py-1">
                      <Text className="text-amber-700 text-xs font-bold">{t('operator.waiting')}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-white rounded-2xl p-6 items-center border border-slate-200 mx-6 mb-4">
                <Text className="text-slate-400 text-center">{t('host.noWaiting')}</Text>
              </View>
            )}

            <Text className="text-lg font-black text-teal-900 px-6 mb-3">{t('host.expectedSection')}</Text>
            {expected.length > 0 ? (
              <View className="px-6">
                  {expected.map((v: ExpectedVisit) => (
                  <View key={v.id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 flex-row items-center gap-4">
                    <View className="w-11 h-11 rounded-full bg-teal-100 items-center justify-center">
                      <Text className="text-teal-700 font-black">
                        {v.visitor.firstName[0]}
                        {v.visitor.lastName[0]}
                      </Text>
                    </View>
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
                <Text className="text-slate-400 text-center">{t('host.noExpected')}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}

function DetailStat({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: string }) {
  return (
    <View className="items-center flex-1">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-2xl font-black text-slate-900 mt-1">{value}</Text>
      <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-center" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
