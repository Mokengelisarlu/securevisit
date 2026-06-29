import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card, Button, TextInput, Select } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVisitDraft } from '@/src/contexts/VisitDraftContext';
import {
  useGetPublicVisitorTypes,
  useGetPublicHosts,
  useGetPublicDepartments,
} from '@/src/hooks/usePublicData';

export default function NewVisitorScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { updateDraft } = useVisitDraft();
  const { data: visitorTypes } = useGetPublicVisitorTypes(deviceToken);
  const { data: hosts } = useGetPublicHosts(deviceToken);
  const { data: departments } = useGetPublicDepartments(deviceToken);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [visitorTypeId, setVisitorTypeId] = useState('');
  const [hostId, setHostId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!visitorTypeId) e.visitorTypeId = 'Please select a visitor type';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;
    updateDraft({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      visitorTypeId,
      hostId: hostId || undefined,
      departmentId: departmentId || undefined,
      purpose: purpose.trim() || undefined,
    });
    router.push('/(kiosk)/check-in/vehicle' as any);
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
          <Pressable
            onPress={() => router.back()}
            className="mb-4 self-start"
            hitSlop={12}
          >
            <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">{t('visitorSearch.newVisitor')}</Text>
          <Text className="text-base text-teal-600 mt-1">
            Fill in the visitor details below
          </Text>
        </View>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            Personal Info
          </Text>
          <View className="gap-4">
            <TextInput
              label={`${t('visitorForm.firstName')} *`}
              placeholder={t('visitorForm.firstNamePlaceholder')}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              error={errors.firstName}
            />
            <TextInput
              label={`${t('visitorForm.lastName')} *`}
              placeholder={t('visitorForm.lastNamePlaceholder')}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              error={errors.lastName}
            />
            <TextInput
              label={t('visitorForm.phone')}
              placeholder="e.g. +1 234 567 8900"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              label={t('visitorForm.company')}
              placeholder={t('visitorForm.companyPlaceholder')}
              value={company}
              onChangeText={setCompany}
              autoCapitalize="words"
            />
          </View>
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            Visit Details
          </Text>
          <View className="gap-4">
            <Select
              label="Visitor Type *"
              placeholder="Select visitor type"
              value={visitorTypeId}
              options={visitorTypes.map((vt) => ({ value: vt.id, label: vt.name }))}
              onChange={setVisitorTypeId}
              error={errors.visitorTypeId}
            />

            {hosts.length > 0 ? (
              <Select
                label="Who are you visiting?"
                placeholder="Select a host"
                value={hostId}
                options={hosts.map((h) => ({ value: h.id, label: `${h.firstName} ${h.lastName}`.trim() }))}
                onChange={setHostId}
              />
            ) : null}

            {departments.length > 0 ? (
              <Select
                label="Department"
                placeholder="Select a department"
                value={departmentId}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                onChange={setDepartmentId}
              />
            ) : null}

            <TextInput
              label="Purpose of Visit"
              placeholder="e.g. Meeting, Delivery, Interview"
              value={purpose}
              onChangeText={setPurpose}
            />
          </View>
        </Card>

        <Button onPress={handleContinue} size="lg" className="mb-4">
          {t('common.continue')}
        </Button>
      </ScrollView>
    </ScreenWrapper>
  );
}
