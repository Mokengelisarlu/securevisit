import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { ScreenWrapper, Card, Button } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  useGetPublicVisitDetailPublic,
  useCheckInPublicParticipants,
  useCheckOutPublicParticipants,
} from '@/src/hooks/useVisits';
import type { VisitParticipant } from '@/src/types/api';

const CHECKABLE = ['WAITING', 'EXPECTED', 'CANCELED'];

export default function GroupManagementScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { data, isLoading, error, fetchVisit } = useGetPublicVisitDetailPublic(deviceToken);
  const { checkIn, isLoading: isCheckingIn } = useCheckInPublicParticipants(deviceToken);
  const { checkOut, isLoading: isCheckingOut } = useCheckOutPublicParticipants(deviceToken);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (id) fetchVisit(id);
    }, [id, fetchVisit])
  );

  const visit = data;
  const participants = visit?.participants ?? [];
  const isApproved = visit?.status === 'APPROVED';
  const isInside = visit?.status === 'IN' || visit?.status === 'OUT';
  const checkable = participants.filter((p) => CHECKABLE.includes(p.status));
  const selectedIds = participants.filter((p) => selected[p.id]).map((p) => p.id);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAll() {
    const next: Record<string, boolean> = {};
    for (const p of checkable) next[p.id] = true;
    setSelected(next);
  }

  function clearSelection() {
    setSelected({});
  }

  async function handleCheckInAll() {
    const target = checkable.length > 0 ? checkable.map((p) => p.id) : undefined;
    await run(() => checkIn(id, target));
  }

  async function handleCheckInSelected() {
    if (selectedIds.length === 0) return;
    await run(() => checkIn(id, selectedIds));
  }

  async function handleCheckOutMember(p: VisitParticipant) {
    await run(() => checkOut(id, [p.id]));
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await fetchVisit(id);
      setSelected({});
    } catch (e: any) {
      setActionError(e?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  function statusLabel(s: string): string {
    switch (s) {
      case 'CHECKED_IN': return 'Enregistré';
      case 'CHECKED_OUT': return 'Sorti';
      case 'EXPECTED': return 'Attendu';
      case 'WAITING': return 'En attente';
      case 'NO_SHOW': return 'Absent';
      case 'CANCELED': return 'Annulé';
      default: return s;
    }
  }

  return (
    <ScreenWrapper padX={false}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-8 pb-4">
          <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
            <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">
            {visit?.groupName || t('operator.group')}
          </Text>
          {visit ? (
            <Text className="text-base text-teal-600 mt-1">
              {t('operator.visitId')} {visit.visitNumber ?? ''} · {t('operator.participants')} {participants.length}
            </Text>
          ) : null}
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#0F766E" size="large" />
          </View>
        ) : error && !visit ? (
          <Card className="mx-6 items-center py-6">
            <Text className="text-red-500 text-center">{error}</Text>
          </Card>
        ) : visit ? (
          <View className="px-6">
            {actionError ? (
              <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-700 text-sm text-center">{actionError}</Text>
              </View>
            ) : null}

            {/* Group / individual members */}
            {participants.map((p) => {
              const isSel = !!selected[p.id];
              return (
                <Pressable
                  key={p.id}
                  onPress={() => { if (checkable.some((c) => c.id === p.id)) toggle(p.id); }}
                  className={`bg-white rounded-2xl p-4 mb-3 border flex-row items-center gap-3 ${isSel ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}
                >
                  <View className="w-10 h-10 rounded-full bg-teal-100 items-center justify-center">
                    <Text className="text-teal-600 font-black">
                      {p.visitor.firstName[0]}{p.visitor.lastName[0]}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {p.visitor.firstName} {p.visitor.lastName}
                    </Text>
                    {p.visitor.company ? (
                      <Text className="text-sm text-slate-500">{p.visitor.company}</Text>
                    ) : null}
                    <Text className="text-xs mt-0.5 font-semibold text-slate-500">
                      {t('operator.memberStatus')}: {statusLabel(p.status)}
                    </Text>
                  </View>
                  {p.status === 'CHECKED_IN' ? (
                    <Button
                      onPress={() => handleCheckOutMember(p)}
                      loading={isCheckingOut && busy}
                      variant="ghost"
                      size="sm"
                    >
                      {t('operator.memberCheckOut')}
                    </Button>
                  ) : isSel ? (
                    <View className="w-6 h-6 rounded-full bg-teal-600 items-center justify-center">
                      <Text className="text-white text-xs font-black">✓</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}

            {/* Actions */}
            {!isInside && isApproved && checkable.length > 0 ? (
              <View className="gap-3 mt-4">
                <Button onPress={handleCheckInAll} loading={isCheckingIn && busy} size="lg">
                  {`${t('operator.checkInAll')} (${String(checkable.length)})`}
                </Button>
                {checkable.length > 1 ? (
                  <View className="flex-row gap-3">
                    <Button onPress={selectAll} variant="ghost" size="md" className="flex-1">
                      Tout sélectionner
                    </Button>
                    <Button onPress={handleCheckInSelected} variant="primary" size="md" className="flex-1" disabled={selectedIds.length === 0}>
                      {`${t('operator.checkInSelected')} (${String(selectedIds.length)})`}
                    </Button>
                  </View>
                ) : null}
                {Object.keys(selected).length > 0 ? (
                  <Button onPress={clearSelection} variant="ghost" size="sm">
                    Effacer la sélection
                  </Button>
                ) : null}
              </View>
            ) : null}

            {!isApproved && !isInside ? (
              <Card className="items-center py-6 mt-4">
                <Text className="text-amber-700 font-bold">{t('operator.pending')}</Text>
                <Text className="text-slate-500 text-sm mt-1 text-center">
                  {`En attente d'approbation de l'hôte. L'enregistrement n'est pas encore possible.`}
                </Text>
              </Card>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}
