import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useState, useCallback, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { ScreenWrapper, Card, Button, TextInput, Select } from '@/src/components/ui';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/src/contexts/AuthContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import {
  useSearchPublicVisitors,
  useGetPublicHosts,
  useGetPublicDepartments,
} from '@/src/hooks/usePublicData';
import { useCreatePublicVisit } from '@/src/hooks/useVisits';
import type { Visitor } from '@/src/types/api';

export default function ExistingVisitorScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { results, isSearching, search } = useSearchPublicVisitors(deviceToken);
  const { createVisit, isLoading: isCheckinLoading } = useCreatePublicVisit(deviceToken);
  const { data: hosts } = useGetPublicHosts(deviceToken);
  const { data: departments } = useGetPublicDepartments(deviceToken);
  const { preselectedVisitor, setPreselectedVisitor } = useKiosk();

  const [query, setQuery] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [hostId, setHostId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (preselectedVisitor) {
      setSelectedVisitor(preselectedVisitor);
      setQuery(`${preselectedVisitor.firstName} ${preselectedVisitor.lastName}`);
      setPreselectedVisitor(null);
    }
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      setSelectedVisitor(null);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (!text.trim()) {
        setIsSearchPending(false);
        search(text).then(() => setLastSearchedQuery(''));
        return;
      }

      setIsSearchPending(true);
      debounceTimer.current = setTimeout(() => {
        (async () => {
          setIsSearchPending(false);
          try {
            await search(text);
            setLastSearchedQuery(text);
          } catch (e) {
            setLastSearchedQuery(text);
          }
        })();
      }, 400);
    },
    [search]
  );

  async function handleCheckIn() {
    if (!selectedVisitor) return;
    setSubmitError('');
    try {
      await createVisit({
        visitorId: selectedVisitor.id,
        hostId: hostId || undefined,
        departmentId: departmentId || undefined,
        purpose: purpose.trim() || undefined,
      });
      router.replace('/(kiosk)/(tabs)');
    } catch (err: any) {
      setSubmitError(err?.message || t('review.errorSubmit'));
    }
  }

  const header = (
    <View className="px-6 pt-8 pb-4">
      <Pressable
        onPress={() => router.back()}
        className="mb-4 self-start"
        hitSlop={12}
      >
        <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
      </Pressable>
      <Text className="text-3xl font-black text-teal-900">{t('visitorSearch.title')}</Text>
      <Text className="text-base text-teal-600 mt-1">
        Search by name or company
      </Text>
    </View>
  );

  const searchInput = (
    <View className="px-6 pb-4">
      <TextInput
        placeholder={t('visitorSearch.searchPlaceholder')}
        value={query}
        onChangeText={handleQueryChange}
        autoFocus
        autoCapitalize="words"
        returnKeyType="search"
      />
    </View>
  );

  const formFields = selectedVisitor ? (
    <View className="px-6 pb-4 gap-4">
      <Card className="bg-teal-50 border border-teal-300">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-semibold text-teal-700 uppercase tracking-wide">
              Selected
            </Text>
            <Text className="text-xl font-black text-teal-900 mt-1">
              {selectedVisitor.firstName} {selectedVisitor.lastName}
            </Text>
            {selectedVisitor.company ? (
              <Text className="text-sm text-teal-700">
                {selectedVisitor.company}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => setSelectedVisitor(null)}
            className="bg-teal-200 rounded-full px-3 py-1 active:bg-teal-300"
          >
            <Text className="text-teal-800 text-sm font-semibold">Change</Text>
          </Pressable>
        </View>
      </Card>

      {hosts.length > 0 ? (
        <Select
          label="Who are they visiting?"
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
        placeholder="e.g. Meeting, Delivery"
        value={purpose}
        onChangeText={setPurpose}
      />

      {submitError ? (
        <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-sm text-center">{submitError}</Text>
        </View>
      ) : null}

      {selectedVisitor.isOnSite ? (
        <View className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
          <Text className="text-yellow-700 text-sm text-center">This visitor is already checked in.</Text>
        </View>
      ) : null}

      <Button
        onPress={handleCheckIn}
        loading={isCheckinLoading}
        disabled={isCheckinLoading || selectedVisitor.isOnSite}
        size="lg"
      >
        {selectedVisitor.isOnSite ? 'Already Checked In' : 'Confirm Check-In'}
      </Button>
    </View>
  ) : null;

  return (
    <ScreenWrapper padX={false}>
      {selectedVisitor ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {header}
          {searchInput}
          {formFields}
        </ScrollView>
      ) : (
        <>
          {header}
          {searchInput}
          <View className="flex-1 px-6">
            {isSearching ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#0F766E" size="large" />
                <Text className="text-teal-700 mt-3">{t('common.loading')}</Text>
              </View>
            ) : query.length > 0 && !isSearchPending && !isSearching && results.length === 0 && lastSearchedQuery === query ? (
              <View className="items-center py-12">
                <Text className="text-4xl font-black text-teal-400 mb-3">?</Text>
                <Text className="text-slate-600 text-center">
                  {t('visitorSearch.noResults')}
                </Text>
                <Pressable
                  onPress={() => {
                    router.replace('/(kiosk)/check-in/new-visitor');
                  }}
                  className="mt-4"
                >
                  <Text className="text-teal-700 font-semibold underline">
                    Register as new visitor instead
                  </Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setSelectedVisitor(item)}
                    className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 active:bg-teal-50 active:border-teal-400"
                  >
                    <View className="flex-row items-center gap-4">
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
                        {item.phone ? (
                          <Text className="text-sm text-slate-500">{item.phone}</Text>
                        ) : null}
                      </View>
                      {item.isOnSite ? (
                        <View className="px-2 mr-3">
                          <View className="bg-teal-100 px-2 py-1 rounded-full">
                            <Text className="text-teal-700 text-xs font-bold">IN</Text>
                          </View>
                        </View>
                      ) : null}
                      <Text className="text-teal-400 text-xl">›</Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </>
      )}
    </ScreenWrapper>
  );
}
