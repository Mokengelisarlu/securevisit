import { View, Text, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, TextInput } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useSearchPublicVisitors } from '@/src/hooks/usePublicData';
import VisitorBottomSheet from '@/src/components/VisitorBottomSheet';
import type { Visitor } from '@/src/types/api';

function photoSrc(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('blob.vercel-storage.com')) {
    return `${baseUrl}/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const router = useRouter();
  const { results, isSearching, search } = useSearchPublicVisitors(deviceToken);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

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

  return (
    <ScreenWrapper padX={false}>
      <View className="flex-1 px-6 pt-8">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={() => router.back()} className="flex-row items-center" hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color="#0F766E" />
            <Text className="ml-1 text-teal-700 text-base font-semibold">{t('common.back')}</Text>
          </Pressable>
          <Text className="text-2xl font-black text-teal-900">{t('visitorSearch.searchTitle')}</Text>
          <View className="w-10" />
        </View>
        <TextInput
          placeholder={t('visitorSearch.searchPlaceholder')}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="words"
          autoFocus
        />

        <Pressable
          onPress={() => router.push('/(kiosk)/check-in/type' as any)}
          className="bg-teal-700 rounded-2xl py-3.5 mt-3 flex-row items-center justify-center gap-2 active:bg-teal-800 active:scale-95"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text className="text-white text-base font-black">{t('visitorSearch.newVisitor')}</Text>
        </Pressable>

        <View className="flex-1 mt-4">
          {isSearching ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#0F766E" size="large" />
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: Visitor }) => (
                <Pressable
                  onPress={() => setSelectedVisitor(item)}
                  className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 flex-row items-center gap-4 active:bg-teal-50 active:border-teal-400"
                >
                  {item.photoUrl ? (
                    <Image
                      source={{ uri: photoSrc(item.photoUrl, apiBaseUrl) }}
                      className="w-12 h-12 rounded-full bg-slate-200"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center">
                      <Text className="text-teal-600 text-lg font-black">
                        {item.firstName[0]}
                        {item.lastName[0]}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {item.firstName} {item.lastName}
                    </Text>
                    {item.company ? (
                      <Text className="text-sm text-slate-500">{item.company}</Text>
                    ) : null}
                    {item.phone ? (
                      <Text className="text-xs text-slate-400 mt-0.5">{item.phone}</Text>
                    ) : null}
                  </View>
                  {item.isOnSite ? (
                    <View className="bg-teal-100 rounded-full px-3 py-1">
                      <Text className="text-teal-700 text-xs font-bold">{t('dashboard.kpiOnSite')}</Text>
                    </View>
                  ) : null}
                </Pressable>
              )}
            />
          ) : query.trim().length > 0 && !isSearching ? (
            <View className="items-center py-12">
              <Text className="text-slate-400 text-center">{t('visitorSearch.noResults')}</Text>
            </View>
          ) : (
            <View className="items-center py-12">
              <Text className="text-slate-400 text-center">{t('visitorSearch.typeToSearch')}</Text>
            </View>
          )}
        </View>
      </View>

      <VisitorBottomSheet
        visible={selectedVisitor !== null}
        visitor={selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />
    </ScreenWrapper>
  );
}
