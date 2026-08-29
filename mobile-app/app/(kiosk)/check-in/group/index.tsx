import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card, Button, TextInput, Select } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { useGroupDraft } from '@/src/contexts/GroupDraftContext';
import {
  useGetPublicHosts,
  useGetPublicDepartments,
} from '@/src/hooks/usePublicData';
import { useCreatePublicVisit } from '@/src/hooks/useVisits';

export default function GroupVisitScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const {
    draft,
    updateDraft,
    removeMember,
    resetDraft,
  } = useGroupDraft();
  const { pendingHostSelection, setPendingHostSelection } = useKiosk();
  const { data: hosts } = useGetPublicHosts(deviceToken);
  const { data: departments } = useGetPublicDepartments(deviceToken);
  const { createVisit, isLoading } = useCreatePublicVisit(deviceToken);

  const [hostId, setHostId] = useState(draft.hostId || '');
  const [departmentId, setDepartmentId] = useState(draft.departmentId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (pendingHostSelection) {
      setHostId(pendingHostSelection.id);
      if (pendingHostSelection.departmentId) {
        setDepartmentId(pendingHostSelection.departmentId);
      }
      setPendingHostSelection(null);
    }
  }, [pendingHostSelection, setPendingHostSelection]);

  function validate() {
    const e: Record<string, string> = {};
    if (!draft.groupName.trim()) e.groupName = t('group.requiredGroupName');
    if (draft.members.length === 0) e.members = t('group.requiredMembers');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitError('');
    try {
      await createVisit({
        visitorId: draft.members[0].id,
        hostId: hostId || undefined,
        departmentId: departmentId || undefined,
        purpose: draft.purpose,
        visitType: 'GROUP',
        groupName: draft.groupName.trim(),
        organization: draft.organization.trim() || undefined,
        participantCount: draft.members.length,
        participants: draft.members.map((m) => ({ visitorId: m.id })),
      } as any);
      setSuccess(true);
      setTimeout(() => {
        resetDraft();
        router.replace('/(kiosk)/(tabs)');
      }, 1800);
    } catch (err: any) {
      setSubmitError(err?.message || t('group.submitError'));
    }
  }

  if (success) {
    return (
      <ScreenWrapper className="justify-center items-center">
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center">
            <Ionicons name="checkmark" size={40} color="#0F766E" />
          </View>
          <Text className="text-3xl font-black text-teal-900 text-center">
            {t('group.submittedTitle')}
          </Text>
          <Text className="text-lg text-teal-600 text-center">
            {t('group.submittedMessage')}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padX={false}>
      <ScrollView
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="pt-8 pb-6">
          <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
            <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">{t('group.title')}</Text>
          <Text className="text-base text-teal-600 mt-1">{t('group.subtitle')}</Text>
        </View>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            {t('group.members')}
          </Text>

          {draft.members.length === 0 ? (
            <View className="items-center py-6">
              <Ionicons name="people-outline" size={40} color="#94a3b8" />
              <Text className="text-slate-400 text-center mt-2">{t('group.noMembers')}</Text>
              {errors.members ? (
                <Text className="text-xs text-red-500 mt-1">{errors.members}</Text>
              ) : null}
            </View>
          ) : (
            <View className="gap-3">
              {draft.members.map((member) => (
                <View
                  key={member.id}
                  className="flex-row items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200"
                >
                  <View className="w-10 h-10 rounded-full bg-teal-100 items-center justify-center">
                    <Text className="text-teal-700 font-black">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {member.firstName} {member.lastName}
                    </Text>
                    {member.company ? (
                      <Text className="text-sm text-slate-500">{member.company}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => removeMember(member.id)}
                    hitSlop={10}
                    className="p-1"
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
              <Text className="text-sm text-slate-500">
                {t('group.memberCount', { count: draft.members.length })}
              </Text>
            </View>
          )}

          <Button
            onPress={() => router.push('/(kiosk)/check-in/group/add-members' as any)}
            variant="secondary"
            size="md"
            className="mt-4 w-full"
          >
            {t('group.addMember')}
          </Button>
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            {t('group.title')}
          </Text>
          <View className="gap-4">
            <TextInput
              label={`${t('group.groupName')} *`}
              placeholder={t('group.groupNamePlaceholder')}
              value={draft.groupName}
              onChangeText={(v) => updateDraft({ groupName: v })}
              autoCapitalize="words"
              error={errors.groupName}
            />
            <TextInput
              label={t('group.organization')}
              placeholder={t('group.organizationPlaceholder')}
              value={draft.organization}
              onChangeText={(v) => updateDraft({ organization: v })}
              autoCapitalize="words"
            />

            {hosts.length > 0 ? (
              <Pressable
                onPress={() => router.push('/(kiosk)/check-in/select-host' as any)}
                className="bg-white rounded-xl border border-slate-200 p-4 flex-row items-center justify-between active:bg-teal-50 active:border-teal-400"
              >
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {t('visitorSearch.visitingHost')}
                  </Text>
                  {hostId ? (
                    <Text className="text-base font-bold text-slate-900">
                      {hosts.find((h) => h.id === hostId)?.firstName}{' '}
                      {hosts.find((h) => h.id === hostId)?.lastName}
                    </Text>
                  ) : (
                    <Text className="text-base text-slate-400">{t('visitorForm.hostPlaceholder')}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </Pressable>
            ) : null}

            {departments.length > 0 ? (
              <Select
                label={t('visitorSearch.department')}
                placeholder={t('visitorSearch.selectDepartment')}
                value={departmentId}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                onChange={setDepartmentId}
              />
            ) : null}

            <TextInput
              label={t('visitorSearch.purpose')}
              placeholder={t('visitorForm.purposePlaceholder')}
              value={draft.purpose || ''}
              onChangeText={(v) => updateDraft({ purpose: v })}
            />
          </View>
        </Card>

        {submitError ? (
          <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-700 text-sm text-center">{submitError}</Text>
          </View>
        ) : null}

        <Button
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          size="lg"
          className="mb-4"
        >
          {t('group.submitGroup')}
        </Button>
      </ScrollView>
    </ScreenWrapper>
  );
}
