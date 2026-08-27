import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useGetExpectedVisits } from '@/src/hooks/useVisits';
import type { ExpectedVisit } from '@/src/types/api';

function statusLabel(s: string): string {
  switch (s) {
    case 'APPROVED': return 'Approuvé';
    case 'PENDING_APPROVAL': return 'En attente';
    case 'IN': return 'À l\'intérieur';
    default: return s;
  }
}

export default function ExpectedScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { data, isLoading, error, refetch } = useGetExpectedVisits(deviceToken, 10_000);

  return (
    <ScreenWrapper padX={false}>
      <View className="px-6 pt-8 pb-4">
        <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
          <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
        </Pressable>
        <Text className="text-3xl font-black text-teal-900">{t('operator.expectedSection')}</Text>
        <Text className="text-base text-teal-600 mt-1">
          {data.length > 0 ? `${data.length} arrivée(s) attendue(s)` : t('operator.expectedEmpty')}
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
          <Text className="text-slate-400 text-center">{t('operator.expectedEmpty')}</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          {data.map((v: ExpectedVisit) => {
            const participants = v.participants ?? [];
            const waiting = participants.filter((p) => ['WAITING', 'EXPECTED'].includes(p.status)).length;
            return (
              <Pressable
                key={v.id}
                onPress={() => router.push(`/(kiosk)/operator/group/${v.id}` as never)}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 active:bg-teal-50"
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
                    ) : null}
                    {participants.length > 0 ? (
                      <Text className="text-xs text-slate-400 mt-0.5">
                        {t('operator.participants')}: {participants.length} · ({waiting} à enregistrer)
                      </Text>
                    ) : null}
                  </View>
                  <View className="bg-teal-100 rounded-full px-3 py-1">
                    <Text className="text-teal-700 text-xs font-bold">{statusLabel(v.status)}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
