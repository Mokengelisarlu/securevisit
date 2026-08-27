import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useGetWaitingVisits } from '@/src/hooks/useVisits';
import type { WaitingVisit } from '@/src/types/api';

function escalationColor(level: string) {
  if (level === 'critical') return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' };
  if (level === 'warning') return { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' };
  return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' };
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h${min % 60}`;
}

export default function WaitingScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { data, isLoading, error, refetch } = useGetWaitingVisits(deviceToken, 10_000);

  return (
    <ScreenWrapper padX={false}>
      <View className="px-6 pt-8 pb-4">
        <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
          <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
        </Pressable>
        <Text className="text-3xl font-black text-teal-900">{t('operator.waitingSection')}</Text>
        <Text className="text-base text-teal-600 mt-1">
          {data.length > 0 ? `${data.length} en attente` : t('operator.waitingEmpty')}
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
      ) : data.length === 0 ? (
        <View className="items-center py-12">
          <Text className="text-slate-400 text-center">{t('operator.waitingEmpty')}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          {data.map((v: WaitingVisit) => {
            const c = escalationColor(v.escalation);
            return (
              <Pressable
                key={v.id}
                onPress={() => router.push(`/(kiosk)/operator/group/${v.id}` as never)}
                className={`bg-white rounded-2xl p-4 mb-3 border ${c.border}`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center">
                    <Text className="text-teal-600 font-black">
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
                    <Text className="text-xs text-slate-400 mt-0.5">
                      {t('operator.visitId')} {v.visitNumber} · {t('operator.waitingSince')} {timeAgo(v.arrivalAt)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2 mt-3">
                  <View className={`rounded-full px-3 py-1 ${v.status === 'PENDING_APPROVAL' ? 'bg-amber-100' : 'bg-teal-100'}`}>
                    <Text className={`text-xs font-bold ${v.status === 'PENDING_APPROVAL' ? 'text-amber-700' : 'text-teal-700'}`}>
                      {v.status === 'PENDING_APPROVAL' ? t('operator.pending') : t('operator.approved')}
                    </Text>
                  </View>
                  {v.escalation !== 'normal' ? (
                    <View className={`rounded-full px-3 py-1 ${c.bg}`}>
                      <Text className={`text-xs font-bold ${c.text}`}>
                        {v.escalation === 'critical' ? t('operator.escalationCritical') : t('operator.escalationWarning')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
