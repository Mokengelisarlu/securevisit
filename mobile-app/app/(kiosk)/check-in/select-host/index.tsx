import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, TextInput } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { useGetPublicHosts } from '@/src/hooks/usePublicData';
import type { Host } from '@/src/types/api';

function photoSrc(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('blob.vercel-storage.com')) {
    return `${baseUrl}/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function SelectHostScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const { setPendingHostSelection } = useKiosk();
  const { data: hosts, isLoading } = useGetPublicHosts(deviceToken);
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const numColumns = isTablet ? 2 : 1;

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return hosts;
    const q = query.toLowerCase();
    return hosts.filter(
      (h) =>
        `${h.firstName} ${h.lastName}`.toLowerCase().includes(q) ||
        h.department?.name?.toLowerCase().includes(q) ||
        h.phone?.toLowerCase().includes(q)
    );
  }, [hosts, query]);

  function handleSelect(host: Host) {
    setPendingHostSelection(host);
    router.back();
  }

  return (
    <ScreenWrapper padX={false}>
      <View className="px-6 pt-8 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="mb-4 self-start"
          hitSlop={12}
        >
          <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
        </Pressable>
        <Text className="text-3xl font-black text-teal-900">
          {t('visitorSearch.visitingHost')}
        </Text>
        <Text className="text-base text-teal-600 mt-1">
          {t('visitorSearch.selectHost')}
        </Text>
      </View>

      <View className="px-6 pb-4">
        <TextInput
          placeholder={t('visitorSearch.selectHost')}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          returnKeyType="search"
        />
      </View>

      <View className="flex-1 px-6">
        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#0F766E" size="large" />
            <Text className="text-teal-700 mt-3">{t('common.loading')}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-4xl font-black text-teal-400 mb-3">?</Text>
            <Text className="text-slate-500 text-center">
              {t('visitorSearch.noResults')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            key={`cols-${numColumns}`}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 active:bg-teal-50 active:border-teal-400"
                style={{ flex: 1 }}
              >
                <View className="flex-row items-center gap-4">
                  {photoSrc(item.photoUrl, apiBaseUrl) ? (
                    <Image
                      source={{ uri: photoSrc(item.photoUrl, apiBaseUrl)! }}
                      className="w-14 h-14 rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-14 h-14 rounded-full bg-teal-100 items-center justify-center">
                      <Text className="text-teal-700 text-lg font-black">
                        {item.firstName[0]}{item.lastName[0]}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">
                      {item.firstName} {item.lastName}
                    </Text>
                    {item.department?.name ? (
                      <Text className="text-sm text-teal-600 font-medium">
                        {item.department.name}
                      </Text>
                    ) : null}
                    {item.phone ? (
                      <Text className="text-sm text-slate-500">{item.phone}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
