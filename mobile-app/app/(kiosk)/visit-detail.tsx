import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useGetPublicVisitDetail } from '@/src/hooks/usePublicData';

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    IN: 'bg-teal-100 text-teal-700',
    OUT: 'bg-slate-100 text-slate-700',
    SCHEDULED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  const cls = styles[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <View className={`rounded-full px-3 py-1 ${cls.split(' ')[0]}`}>
      <Text className={`text-xs font-bold ${cls.split(' ')[1]}`}>{status}</Text>
    </View>
  );
}

export default function VisitDetailScreen() {
  const { t } = useTranslation();
  const { visitId } = useLocalSearchParams<{ visitId: string }>();
  const { deviceToken } = useAuth();
  const { data, isLoading, error, fetchVisit } = useGetPublicVisitDetail(deviceToken);
  const router = useRouter();

  useEffect(() => {
    if (visitId) {
      fetchVisit(visitId);
    }
  }, [visitId, fetchVisit]);

  return (
    <ScreenWrapper padX={false}>
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center gap-3 pt-12 pb-4 px-6">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#0F766E" />
          </Pressable>
          <Text className="text-xl font-black text-teal-900">{t('visitDetail.title', 'Visit Detail')}</Text>
        </View>

        {error && !data ? (
          <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 items-center py-6">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text className="text-red-500 text-center my-4">{error}</Text>
            <Pressable
              onPress={() => visitId && fetchVisit(visitId)}
              className="bg-teal-600 rounded-xl px-6 py-2 active:bg-teal-700"
            >
              <Text className="text-white font-bold text-sm">{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading && !data ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#0F766E" size="large" />
            <Text className="text-teal-700 mt-3">{t('common.loading')}</Text>
          </View>
        ) : data ? (
          <>
            <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-mono text-slate-600">{data.visitNumber}</Text>
                <StatusBadge status={data.status} />
              </View>
              <Text className="text-sm text-slate-500">
                {new Date(data.visitDate).toLocaleDateString()}
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="person" size={18} color="#0F766E" />
                <Text className="text-sm font-black text-teal-900 uppercase tracking-wide">
                  {t('visitDetail.visitor', 'Visitor')}
                </Text>
              </View>
              <Text className="text-base font-bold text-slate-900">
                {data.visitor.firstName} {data.visitor.lastName}
              </Text>
              {data.visitor.company ? (
                <Text className="text-sm text-slate-500 mt-1">{data.visitor.company}</Text>
              ) : null}
              {data.visitor.phone ? (
                <Text className="text-sm text-slate-500 mt-1">{data.visitor.phone}</Text>
              ) : null}
            </View>

            {data.host ? (
              <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="business" size={18} color="#0F766E" />
                  <Text className="text-sm font-black text-teal-900 uppercase tracking-wide">
                    {t('visitDetail.host', 'Host')}
                  </Text>
                </View>
                <Text className="text-base font-bold text-slate-900">
                  {data.host.firstName} {data.host.lastName}
                </Text>
                {data.department ? (
                  <Text className="text-sm text-slate-500 mt-1">{data.department.name}</Text>
                ) : null}
              </View>
            ) : null}

            <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="information-circle" size={18} color="#0F766E" />
                <Text className="text-sm font-black text-teal-900 uppercase tracking-wide">
                  {t('visitDetail.visitInfo', 'Visit Info')}
                </Text>
              </View>
              {data.purpose ? (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-slate-500">{t('visitDetail.purpose', 'Purpose')}</Text>
                  <Text className="text-sm font-bold text-slate-900">{data.purpose}</Text>
                </View>
              ) : null}
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-slate-500">{t('visitDetail.type', 'Type')}</Text>
                <Text className="text-sm font-bold text-slate-900">{data.visitType}</Text>
              </View>
              {data.passengerCount ? (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-slate-500">{t('visitDetail.passengers', 'Passengers')}</Text>
                  <Text className="text-sm font-bold text-slate-900">{data.passengerCount}</Text>
                </View>
              ) : null}
              {data.checkOutAt && data.durationMinutes ? (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500">{t('visitDetail.duration', 'Duration')}</Text>
                  <Text className="text-sm font-bold text-slate-900">{data.durationMinutes} min</Text>
                </View>
              ) : null}
            </View>

            {data.vehicle ? (
              <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="car" size={18} color="#0F766E" />
                  <Text className="text-sm font-black text-teal-900 uppercase tracking-wide">
                    {t('visitDetail.vehicle', 'Vehicle')}
                  </Text>
                </View>
                <Text className="text-base font-bold text-slate-900">
                  {data.vehicle.plateNumber} {data.vehicle.brand ? `- ${data.vehicle.brand}` : ''}
                </Text>
                <Text className="text-sm text-slate-500 mt-1">
                  {data.vehicle.type}{data.vehicle.color ? ` - ${data.vehicle.color}` : ''}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}
