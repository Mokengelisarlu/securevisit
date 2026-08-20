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
    if (!firstName.trim()) e.firstName = t('visitorForm.requiredFirstName');
    if (!lastName.trim()) e.lastName = t('visitorForm.requiredLastName');
    if (!visitorTypeId) e.visitorTypeId = t('visitorForm.requiredVisitorType');
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
            {t('visitorForm.fillDetails')}
          </Text>
        </View>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            {t('visitorForm.personalInfo')}
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
              placeholder={t('visitorForm.phonePlaceholderExample')}
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
            {t('visitorForm.visitDetails')}
          </Text>
          <View className="gap-4">
            <Select
              label={`${t('visitorForm.visitorType')} *`}
              placeholder={t('visitorForm.visitorTypePlaceholder')}
              value={visitorTypeId}
              options={visitorTypes.map((vt) => ({ value: vt.id, label: vt.name }))}
              onChange={setVisitorTypeId}
              error={errors.visitorTypeId}
            />

            {hosts.length > 0 ? (
              <Select
                label={t('visitorSearch.visitingHost')}
                placeholder={t('visitorForm.hostPlaceholder')}
                value={hostId}
                options={hosts.map((h) => ({ value: h.id, label: `${h.firstName} ${h.lastName}`.trim() }))}
                onChange={setHostId}
              />
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
