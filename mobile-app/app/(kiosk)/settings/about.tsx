import { View, Text, Pressable, ScrollView, Image as RNImage, Platform } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';

export default function AboutSettingsScreen() {
  const { t } = useTranslation();
  const { deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl, deviceId } = useApi();

  return (
    <ScreenWrapper padX={false}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-8 pb-6">
          <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
            <Text className="text-teal-700 text-base font-semibold">← {t('settings.backToSettings')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">{t('settings.about')}</Text>
        </View>

        <View className="items-center mb-8">
          <RNImage source={require('../../../assets/images/icon-512x512.png')} className="w-24 h-24 mb-3" resizeMode="contain" />
          <Text className="text-2xl font-black text-teal-900">{t('settings.appName')}</Text>
          <Text className="text-sm text-teal-600 mt-1">{t('settings.poweredBy', { company: 'Mokengeli SARL' })}</Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <InfoRow label={t('settings.appVersion')} value={Constants.expoConfig?.version || '1.0.0'} />
          <InfoRow label={t('settings.builder')} value="Mokengeli SARL" />
          <InfoRow label={t('settings.platform')} value={`${Platform.OS} ${Platform.Version?.toString() || ''}`} />
          <InfoRow label={t('settings.runtimeVersion')} value={Constants.executionEnvironment || t('settings.unknown')} />
          <InfoRow label={t('settings.deviceName')} value={Constants.deviceName || t('settings.unknown')} />
          <Text className="text-xs font-bold text-teal-600 uppercase tracking-wide mt-5 mb-2">{t('settings.connection')}</Text>
          <InfoRow label={t('settings.serverUrl')} value={apiBaseUrl} />
          <InfoRow label={t('settings.tenantSlug')} value={tenantSlug || t('common.no')} />
          <InfoRow label={t('settings.deviceId')} value={deviceId || t('settings.unknown')} />
          <InfoRow label={t('settings.deviceToken')} value={tokenPreview(deviceToken, t('settings.unknown'))} last />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function tokenPreview(token: string | null, fallback: string) {
  if (!token) return fallback;
  if (token.length <= 20) return token;
  return `${token.substring(0, 10)}...${token.substring(token.length - 6)}`;
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between items-center py-2 ${!last ? 'border-b border-teal-100' : ''}`}>
      <Text className="text-sm font-semibold text-teal-600">{label}</Text>
      <Text className="text-sm text-slate-800 max-w-[55%] text-right" numberOfLines={1}>{value}</Text>
    </View>
  );
}
