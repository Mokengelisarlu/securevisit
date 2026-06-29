import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card, Button, TextInput } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useGetPublicOnSiteVisitors } from '@/src/hooks/usePublicData';
import { useCheckoutPublicVisit } from '@/src/hooks/useVisits';
import type { OnSiteVisitor } from '@/src/types/api';

function photoSrc(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('blob.vercel-storage.com')) {
    return `${baseUrl}/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export default function CheckOutScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const {
    data: onSiteVisitors,
    isLoading,
    error,
  } = useGetPublicOnSiteVisitors(deviceToken);
  const { checkoutVisit, isLoading: isCheckingOut } =
    useCheckoutPublicVisit(deviceToken);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<OnSiteVisitor | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const filtered = query.trim()
    ? onSiteVisitors.filter((v) => {
        const name =
          `${v.visitor.firstName} ${v.visitor.lastName}`.toLowerCase();
        const company = (v.visitor.company ?? '').toLowerCase();
        const q = query.toLowerCase();
        return name.includes(q) || company.includes(q);
      })
    : onSiteVisitors;

  async function handleCheckOut() {
    if (!selected) return;
    setSubmitError('');
    try {
      await checkoutVisit(selected.id);
      setSuccess(true);
      setTimeout(() => {
        router.replace('/(kiosk)');
      }, 1800);
    } catch (err: any) {
      setSubmitError(err?.message || t('checkOut.errorCheckOut'));
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let day: string;
    if (checkDate.getTime() === today.getTime()) {
      day = t('success.today');
    } else if (checkDate.getTime() === yesterday.getTime()) {
      day = t('success.yesterday');
    } else {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      day = `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
    }

    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${day} - ${time}`;
  }

  if (success) {
    return (
      <ScreenWrapper className="justify-center items-center">
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center">
            <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 13l4 4L19 7"
                stroke="#0F766E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text className="text-3xl font-black text-teal-900 text-center">
            {t('success.checkOutTitle')}
          </Text>
          <Text className="text-lg text-teal-600 text-center">
            {t('success.checkOutMessage', { visitorName: `${selected?.visitor.firstName} ${selected?.visitor.lastName}` })}
          </Text>
        </View>
      </ScreenWrapper>
    );
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
        <Text className="text-3xl font-black text-teal-900">{t('checkOut.title')}</Text>
        <Text className="text-base text-teal-600 mt-1">
          {onSiteVisitors.length > 0
            ? `${onSiteVisitors.length} visitor${onSiteVisitors.length !== 1 ? 's' : ''} currently on-site`
            : 'Find a visitor to check out'}
        </Text>
      </View>

      <View className="px-6 pb-4">
        <TextInput
          placeholder={t('checkOut.searchPlaceholder')}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setSelected(null);
          }}
          autoCapitalize="words"
        />
      </View>

      {selected ? (
        <View className="px-6 pb-4 gap-4 flex-1 justify-center">
          <Card className="bg-white border-2 border-teal-400 overflow-hidden">
            <View className="flex-row">
              {/* Left half: photo / avatar */}
              <View className="w-1/2 bg-teal-50 items-center justify-center py-8 px-4">
                {selected.visitor.photoUrl ? (
                  <Image
                    source={{ uri: photoSrc(selected.visitor.photoUrl, apiBaseUrl) }}
                    className="w-40 h-40 rounded-full bg-slate-200"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-40 h-40 rounded-full bg-teal-100 items-center justify-center">
                    <Text className="text-teal-600 text-5xl font-black">
                      {selected.visitor.firstName[0]}
                      {selected.visitor.lastName[0]}
                    </Text>
                  </View>
                )}
              </View>
              {/* Right half: details */}
              <View className="w-1/2 justify-center py-8 px-5 gap-2.5">
                <Text className="text-2xl font-black text-slate-900 leading-tight">
                  {selected.visitor.firstName}{'\n'}
                  {selected.visitor.lastName}
                </Text>
                {selected.visitor.phone ? (
                  <Text className="text-base text-slate-600">
                    {selected.visitor.phone}
                  </Text>
                ) : null}
                {selected.visitor.company ? (
                  <Text className="text-sm text-slate-500">
                    {selected.visitor.company}
                  </Text>
                ) : null}
                <View className="mt-2">
                  <Text className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                    {t('success.checkedInAt')}
                  </Text>
                  <Text className="text-sm font-semibold text-slate-800 mt-0.5">
                    {formatDate(selected.checkInAt)}
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {submitError ? (
            <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
              <Text className="text-red-700 text-sm text-center">{submitError}</Text>
            </View>
          ) : null}

          <View className="gap-3">
            <Button
              onPress={handleCheckOut}
              loading={isCheckingOut}
              disabled={isCheckingOut}
              size="lg"
              variant="primary"
            >
              {t('checkOut.confirmTitle')}
            </Button>
            <Button
              onPress={() => setSelected(null)}
              variant="ghost"
              size="md"
            >
              {t('common.cancel')}
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-1 px-6">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#0F766E" size="large" />
              <Text className="text-teal-700 mt-3">{t('common.loading')}</Text>
            </View>
          ) : error ? (
            <Card className="items-center py-6">
              <Text className="text-red-500 text-center">{error}</Text>
            </Card>
          ) : filtered.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl font-black text-teal-400 mb-3">0</Text>
              <Text className="text-slate-600 text-center text-base">
                {query
                  ? `No on-site visitors matching "${query}"`
                  : t('checkOut.noCheckedInVisitors')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelected(item)}
                  className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 active:bg-teal-50 active:border-teal-400"
                >
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center">
                      <Text className="text-teal-600 text-lg font-black">
                        {item.visitor.firstName[0]}
                        {item.visitor.lastName[0]}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900">
                        {item.visitor.firstName} {item.visitor.lastName}
                      </Text>
                      {item.visitor.company ? (
                        <Text className="text-sm text-slate-500">
                          {item.visitor.company}
                        </Text>
                      ) : null}
                      <Text className="text-xs text-teal-600 mt-0.5">
                        {t('checkOut.checkedIn')}{' '}
                        {new Date(item.checkInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View className="bg-teal-100 rounded-full px-3 py-1">
                      <Text className="text-teal-700 text-xs font-bold">
                        {t('checkOut.checkOutButton')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}
