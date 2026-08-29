import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card, Button, TextInput, Select, PhoneInput } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useGroupDraft } from '@/src/contexts/GroupDraftContext';
import {
  useSearchPublicVisitors,
  useGetPublicVisitorTypes,
} from '@/src/hooks/usePublicData';
import { useCreatePublicVisitor } from '@/src/hooks/useVisits';
import type { Visitor } from '@/src/types/api';

type MemberMode = 'existing' | 'new';

export default function AddMemberScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { addMember } = useGroupDraft();
  const { results, isSearching, search } = useSearchPublicVisitors(deviceToken);
  const { createVisitor, isLoading: isCreating } = useCreatePublicVisitor(deviceToken);
  const { data: visitorTypes } = useGetPublicVisitorTypes(deviceToken);

  const [mode, setMode] = useState<MemberMode>('existing');
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+243');
  const [company, setCompany] = useState('');
  const [visitorTypeId, setVisitorTypeId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        search(text);
      }, 400);
    },
    [search]
  );

  function selectMember(visitor: Visitor) {
    addMember(visitor);
    router.back();
  }

  function validateNew() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = t('visitorForm.requiredFirstName');
    if (!lastName.trim()) e.lastName = t('visitorForm.requiredLastName');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreateNew() {
    if (!validateNew()) return;
    setSubmitError('');
    try {
      const visitor = await createVisitor({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() ? `${phoneCountry}${phone.trim()}` : undefined,
        company: company.trim() || undefined,
        visitorTypeId: visitorTypeId || undefined,
      });
      selectMember(visitor);
    } catch (err: any) {
      setSubmitError(err?.message || t('review.errorSubmit'));
    }
  }

  const header = (
    <View className="pt-8 pb-4">
      <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
        <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
      </Pressable>
      <Text className="text-3xl font-black text-teal-900">{t('group.addMemberTitle')}</Text>

      <View className="flex-row gap-3 mt-4">
        <Pressable
          onPress={() => setMode('existing')}
          className={`flex-1 rounded-xl px-3 py-3 items-center border-2 ${
            mode === 'existing' ? 'bg-teal-700 border-teal-700' : 'bg-white border-slate-200'
          }`}
        >
          <Ionicons name="search" size={20} color={mode === 'existing' ? '#FFFFFF' : '#0F766E'} />
          <Text className={`mt-1 text-sm font-bold ${mode === 'existing' ? 'text-white' : 'text-teal-900'}`}>
            {t('group.existingUser')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('new')}
          className={`flex-1 rounded-xl px-3 py-3 items-center border-2 ${
            mode === 'new' ? 'bg-teal-700 border-teal-700' : 'bg-white border-slate-200'
          }`}
        >
          <Ionicons name="person-add" size={20} color={mode === 'new' ? '#FFFFFF' : '#0F766E'} />
          <Text className={`mt-1 text-sm font-bold ${mode === 'new' ? 'text-white' : 'text-teal-900'}`}>
            {t('group.newUser')}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (mode === 'new') {
    return (
      <ScreenWrapper padX={false}>
        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {header}

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
              <PhoneInput
                label={t('visitorForm.phone')}
                value={phone}
                onChangeText={setPhone}
                onCountryChange={setPhoneCountry}
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

          {visitorTypes.length > 0 ? (
            <Card className="mb-4">
              <Select
                label={t('visitorForm.visitorType')}
                placeholder={t('visitorForm.visitorTypePlaceholder')}
                value={visitorTypeId}
                options={visitorTypes.map((vt) => ({ value: vt.id, label: vt.name }))}
                onChange={setVisitorTypeId}
              />
            </Card>
          ) : null}

          {submitError ? (
            <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-700 text-sm text-center">{submitError}</Text>
            </View>
          ) : null}

          <Button onPress={handleCreateNew} loading={isCreating} size="lg" className="mb-4">
            {t('group.newUser')}
          </Button>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padX={false}>
      {header}
      <View className="px-6 pb-4">
        <TextInput
          placeholder={t('visitorSearch.searchPlaceholder')}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="words"
          autoFocus
        />
      </View>
      <View className="flex-1 px-6">
        {isSearching ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#0F766E" size="large" />
            <Text className="text-teal-700 mt-3">{t('common.loading')}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => selectMember(item)}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 flex-row items-center gap-4 active:bg-teal-50 active:border-teal-400"
              >
                <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center">
                  <Text className="text-teal-700 text-lg font-black">
                    {item.firstName[0]}
                    {item.lastName[0]}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900">
                    {item.firstName} {item.lastName}
                  </Text>
                  {item.company ? (
                    <Text className="text-sm text-slate-500">{item.company}</Text>
                  ) : null}
                </View>
                <Ionicons name="add-circle" size={24} color="#0F766E" />
              </Pressable>
            )}
            ListEmptyComponent={
              query.trim().length > 0 ? (
                <View className="items-center py-12">
                  <Text className="text-slate-400 text-center">{t('visitorSearch.noResults')}</Text>
                  <Pressable onPress={() => setMode('new')} className="mt-4">
                    <Text className="text-teal-700 font-semibold underline">
                      {t('group.newUser')}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View className="items-center py-12">
                  <Text className="text-slate-400 text-center">{t('visitorSearch.typeToSearch')}</Text>
                </View>
              )
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
