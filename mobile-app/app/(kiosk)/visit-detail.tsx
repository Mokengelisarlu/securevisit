import { View, Text, ScrollView, ActivityIndicator, Pressable, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useGetPublicVisitDetail } from '@/src/hooks/usePublicData';
import {
  useApproveVisitPublic,
  useCancelVisitPublic,
  useCheckInPublicParticipants,
  useCheckOutPublicParticipants,
  usePostponeVisitPublic,
} from '@/src/hooks/useVisits';

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    IN: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'À l\'intérieur' },
    OUT: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Sorti' },
    SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planifié' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulé' },
    PENDING_APPROVAL: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' },
    APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approuvé' },
    POSTPONED: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Reporté' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Refusé' },
  };
  const config = statusConfig[status] ?? { bg: 'bg-slate-100', text: 'text-slate-700', label: status ?? 'Inconnu' };

  return (
    <View className={`rounded-full px-3 py-1 ${config.bg}`}>
      <Text className={`text-xs font-bold ${config.text}`}>{config.label}</Text>
    </View>
  );
}

export default function VisitDetailScreen() {
  const { t } = useTranslation();
  const { visitId } = useLocalSearchParams<{ visitId: string }>();
  const { deviceToken } = useAuth();
  const { data, isLoading, error, fetchVisit } = useGetPublicVisitDetail(deviceToken);
  const { approveVisit, isLoading: approving, error: approveError } = useApproveVisitPublic(deviceToken);
  const { cancelVisit, isLoading: canceling, error: cancelError } = useCancelVisitPublic(deviceToken);
  const { checkIn, isLoading: checkingIn, error: checkInError } = useCheckInPublicParticipants(deviceToken);
  const { checkOut, isLoading: checkingOut, error: checkOutError } = useCheckOutPublicParticipants(deviceToken);
  const { postponeVisit, isLoading: postponing, error: postponeError } = usePostponeVisitPublic(deviceToken);
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newProposedDate, setNewProposedDate] = useState(() => {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    const year = nextHour.getFullYear();
    const month = String(nextHour.getMonth() + 1).padStart(2, '0');
    const day = String(nextHour.getDate()).padStart(2, '0');
    const hours = String(nextHour.getHours()).padStart(2, '0');
    const minutes = String(nextHour.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const datePickerValue = useMemo(() => {
    const parsed = new Date(newProposedDate);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [newProposedDate]);

  const handleDatePickerChange = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate) return;

    const currentValue = new Date(newProposedDate);
    const dateToKeep = new Date(selectedDate);
    const hours = Number.isNaN(currentValue.getTime()) ? 9 : currentValue.getHours();
    const minutes = Number.isNaN(currentValue.getTime()) ? 0 : currentValue.getMinutes();

    dateToKeep.setHours(hours, minutes, 0, 0);

    const year = dateToKeep.getFullYear();
    const month = String(dateToKeep.getMonth() + 1).padStart(2, '0');
    const day = String(dateToKeep.getDate()).padStart(2, '0');
    const finalHours = String(dateToKeep.getHours()).padStart(2, '0');
    const finalMinutes = String(dateToKeep.getMinutes()).padStart(2, '0');

    setNewProposedDate(`${year}-${month}-${day}T${finalHours}:${finalMinutes}`);
  };

  const handleTimePickerChange = (_event: unknown, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (!selectedTime) return;

    const currentValue = new Date(newProposedDate);
    const nextValue = new Date(currentValue);
    nextValue.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    const year = nextValue.getFullYear();
    const month = String(nextValue.getMonth() + 1).padStart(2, '0');
    const day = String(nextValue.getDate()).padStart(2, '0');
    const hours = String(nextValue.getHours()).padStart(2, '0');
    const minutes = String(nextValue.getMinutes()).padStart(2, '0');

    setNewProposedDate(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  useEffect(() => {
    if (visitId) {
      fetchVisit(visitId);
    }
  }, [visitId, fetchVisit]);

  const actionError = useMemo(
    () => approveError || cancelError || postponeError || checkInError || checkOutError || null,
    [approveError, cancelError, postponeError, checkInError, checkOutError]
  );

  const reloadDetail = async () => {
    if (visitId) {
      await fetchVisit(visitId);
    }
  };

  const handleApprove = async () => {
    if (!visitId) return;
    try {
      setActionMessage(null);
      await approveVisit(visitId);
      setActionMessage('Visite approuvée');
      await reloadDetail();
    } catch (err: any) {
      setActionMessage(err?.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleCancel = async () => {
    if (!visitId) return;
    try {
      setActionMessage(null);
      await cancelVisit(visitId, reason || 'Annulée par l\'hôte');
      setActionMessage('Visite annulée');
      await reloadDetail();
    } catch (err: any) {
      setActionMessage(err?.message || 'Erreur lors de l\'annulation');
    }
  };

  const handlePostpone = async () => {
    if (!visitId) return;
    if (!newProposedDate) {
      setActionMessage('Choisis une nouvelle date');
      return;
    }
    try {
      setActionMessage(null);
      await postponeVisit(visitId, newProposedDate, reason || 'Reportée par l\'hôte');
      setActionMessage('Visite reportée');
      await reloadDetail();
    } catch (err: any) {
      setActionMessage(err?.message || 'Erreur lors du report');
    }
  };

  const handleCheckIn = async () => {
    if (!visitId) return;
    try {
      setActionMessage(null);
      await checkIn(visitId);
      setActionMessage('Visite enregistrée');
      await reloadDetail();
    } catch (err: any) {
      setActionMessage(err?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleCheckOut = async () => {
    if (!visitId) return;
    try {
      setActionMessage(null);
      await checkOut(visitId);
      setActionMessage('Visite sortie');
      await reloadDetail();
    } catch (err: any) {
      setActionMessage(err?.message || 'Erreur lors de la sortie');
    }
  };

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
          <Text className="text-xl font-black text-teal-900">{t('visitDetail.title')}</Text>
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
                  {t('visitDetail.visitor')}
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
                    {t('visitDetail.host')}
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
                    {t('visitDetail.visitInfo')}
                </Text>
              </View>
              {data.purpose ? (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-slate-500">{t('visitDetail.purpose')}</Text>
                  <Text className="text-sm font-bold text-slate-900">{data.purpose}</Text>
                </View>
              ) : null}
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-slate-500">{t('visitDetail.type')}</Text>
                <Text className="text-sm font-bold text-slate-900">{data.visitType}</Text>
              </View>
              {data.passengerCount ? (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-slate-500">{t('visitDetail.passengers')}</Text>
                  <Text className="text-sm font-bold text-slate-900">{data.passengerCount}</Text>
                </View>
              ) : null}
              {data.checkOutAt && data.durationMinutes ? (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500">{t('visitDetail.duration')}</Text>
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

            <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
              <Text className="text-sm font-black text-teal-900 uppercase tracking-wide mb-3">
                Actions hôte
              </Text>

              {actionError ? (
                <Text className="text-red-600 text-sm mb-3">{actionError}</Text>
              ) : null}

              {actionMessage ? (
                <Text className="text-teal-700 text-sm mb-3">{actionMessage}</Text>
              ) : null}

              <View className="gap-3">
                {data.status === 'PENDING_APPROVAL' && (
                  <Pressable
                    onPress={handleApprove}
                    disabled={approving}
                    className="bg-teal-600 rounded-xl px-4 py-3 items-center"
                  >
                    <Text className="text-white font-bold">{approving ? 'Validation...' : 'Approuver'}</Text>
                  </Pressable>
                )}

                {data.status === 'APPROVED' && (
                  <Pressable
                    onPress={handleCheckIn}
                    disabled={checkingIn}
                    className="bg-teal-600 rounded-xl px-4 py-3 items-center"
                  >
                    <Text className="text-white font-bold">{checkingIn ? 'Enregistrement...' : 'Check-in'}</Text>
                  </Pressable>
                )}

                {data.status === 'IN' && (
                  <Pressable
                    onPress={handleCheckOut}
                    disabled={checkingOut}
                    className="bg-slate-800 rounded-xl px-4 py-3 items-center"
                  >
                    <Text className="text-white font-bold">{checkingOut ? 'Sortie...' : 'Sortie'}</Text>
                  </Pressable>
                )}

                {(data.status === 'PENDING_APPROVAL' || data.status === 'APPROVED' || data.status === 'POSTPONED') && (
                  <Pressable
                    onPress={handleCancel}
                    disabled={canceling}
                    className="bg-red-100 rounded-xl px-4 py-3 items-center border border-red-200"
                  >
                    <Text className="text-red-700 font-bold">{canceling ? 'Annulation...' : 'Annuler'}</Text>
                  </Pressable>
                )}

                {(data.status === 'PENDING_APPROVAL' || data.status === 'APPROVED' || data.status === 'POSTPONED') && (
                  <>
                    <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reporter la visite</Text>

                    <View className="gap-2">
                      <Pressable
                        onPress={() => setShowDatePicker(true)}
                        className="border border-slate-200 rounded-xl px-3 py-3 flex-row items-center justify-between"
                      >
                        <Text className="text-sm text-slate-800">
                          {newProposedDate ? new Date(newProposedDate).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : 'Choisir une date'}
                        </Text>
                        <Ionicons name="calendar-outline" size={18} color="#475569" />
                      </Pressable>

                      <Pressable
                        onPress={() => setShowTimePicker(true)}
                        className="border border-slate-200 rounded-xl px-3 py-3 flex-row items-center justify-between"
                      >
                        <Text className="text-sm text-slate-800">
                          {newProposedDate ? new Date(newProposedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Choisir l’heure'}
                        </Text>
                        <Ionicons name="time-outline" size={18} color="#475569" />
                      </Pressable>
                    </View>

                    {showDatePicker ? (
                      <DateTimePicker
                        value={datePickerValue}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={handleDatePickerChange}
                      />
                    ) : null}

                    {showTimePicker ? (
                      <DateTimePicker
                        value={datePickerValue}
                        mode="time"
                        display="default"
                        onChange={handleTimePickerChange}
                      />
                    ) : null}

                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Raison du report (optionnel)"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                    />
                    <Pressable
                      onPress={handlePostpone}
                      disabled={postponing}
                      className="bg-violet-100 rounded-xl px-4 py-3 items-center border border-violet-200"
                    >
                      <Text className="text-violet-700 font-bold">{postponing ? 'Report...' : 'Reporter'}</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}
