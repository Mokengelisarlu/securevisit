import { View, Text, Pressable, ActivityIndicator, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
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

export default function InsideScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const { data, isLoading, error, refetch } = useGetPublicOnSiteVisitors(deviceToken, 10_000);

  const visitors = [...data.visitors].sort(
    (a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime()
  );

  return (
    <ScreenWrapper padX={false}>
      <View className="px-6 pt-8 pb-4">
        <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
          <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
        </Pressable>
        <Text className="text-3xl font-black text-teal-900">{t('operator.insideSection')}</Text>
        <Text className="text-base text-teal-600 mt-1">
          {visitors.length > 0 ? `${visitors.length} ${t('operator.insideCount')}` : t('operator.insideEmpty')}
        </Text>
      </View>

      {isLoading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#0F766E" size="large" />
        </View>
      ) : error ? (
        <Card className="mx-6 items-center py-6">
          <Text className="text-red-500 text-center">{error}</Text>
          <Pressable onPress={() => refetch()} className="mt-3">
            <Text className="text-teal-700 font-bold">{t('common.retry')}</Text>
          </Pressable>
        </Card>
      ) : visitors.length === 0 ? (
        <View className="items-center py-12">
          <Text className="text-slate-400 text-center">{t('operator.insideEmpty')}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          {visitors.map((v: OnSiteVisitor) => (
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
                {v.visitor.company ? <Text className="text-sm text-slate-500">{v.visitor.company}</Text> : null}
                <Text className="text-xs text-teal-600 mt-0.5">
                  {t('success.checkedInAtTime')} {formatTime(v.checkInAt)}
                </Text>
              </View>
              <View className="bg-teal-100 rounded-full px-3 py-1">
                <Text className="text-teal-700 text-xs font-bold">{t('common.onsiteStatus')}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
