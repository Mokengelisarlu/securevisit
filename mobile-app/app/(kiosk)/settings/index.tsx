import { View, Text, Pressable, ScrollView, Alert, Image as RNImage } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Card, TextInput, Button } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { changeLanguage, getCurrentLanguage } from '@/src/i18n';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { clearToken, deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl, deviceId, saveApiBaseUrl, clearTenantSlug, clearDeviceId, clearBusinessSettings, clearKioskSettings } = useApi();
  const { resetState } = useKiosk();
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [currentLang, setCurrentLang] = useState<'fr' | 'en'>(getCurrentLanguage());

  function tokenPreview() {
    if (!deviceToken) return 'None';
    if (deviceToken.length <= 20) return deviceToken;
    return deviceToken.substring(0, 10) + '...' + deviceToken.substring(deviceToken.length - 6);
  }

  async function handleSaveUrl() {
    if (!urlInput.trim()) return;
    const trimmed = urlInput.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/.+/.test(trimmed)) {
      setUrlError(t('pairing.errorServerUrl'));
      return;
    }
    setUrlError('');
    setIsSavingUrl(true);
    try {
      await saveApiBaseUrl(trimmed);
      setUrlInput('');
    } catch (err) {
      setUrlError(t('errors.generic'));
    } finally {
      setIsSavingUrl(false);
    }
  }

  function handleLanguageSwitch(lang: 'fr' | 'en') {
    changeLanguage(lang);
    setCurrentLang(lang);
  }

  function handleRePair() {
    Alert.alert(
      t('settings.reconnectConfirmTitle'),
      t('settings.reconnectConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.reconnect'),
          style: 'destructive',
          onPress: async () => {
            resetState();
            await clearToken();
            router.replace('/(auth)/pairing?reconnect=true');
          },
        },
      ]
    );
  }

  function handleClearData() {
    Alert.alert(
      t('settings.clearDataConfirmTitle'),
      t('settings.clearDataConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            resetState();
            await clearBusinessSettings();
            await clearKioskSettings();
            await clearDeviceId();
            await clearTenantSlug();
            await clearToken();
            router.replace('/(auth)/pairing');
          },
        },
      ]
    );
  }

  return (
    <ScreenWrapper padX={false}>
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="pt-8 pb-6 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="mb-4 self-start"
            hitSlop={12}
          >
            <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900 flex-1 text-center">{t('settings.title')}</Text>
          <RNImage
            source={require('../../../assets/images/icon-512x512.png')}
            className="w-10 h-10"
            resizeMode="contain"
          />
        </View>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            {t('settings.connection')}
          </Text>
          <InfoRow label={t('settings.serverUrl')} value={apiBaseUrl} />
          <InfoRow label={t('settings.tenantSlug')} value={tenantSlug || t('common.no')} />
          <InfoRow label={t('settings.deviceId')} value={deviceId || 'Unknown'} />
          <InfoRow label="Device Token" value={tokenPreview()} last />
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            {t('settings.deviceInfo')}
          </Text>
          <InfoRow label={t('settings.appVersion')} value={Constants.expoConfig?.version || '1.0.0'} />
          <InfoRow label="Platform" value={Platform.OS + ' ' + (Platform.Version?.toString() || '')} />
          <InfoRow label="Runtime Version" value={Constants.executionEnvironment || 'Unknown'} />
          <InfoRow label={t('settings.deviceName')} value={Constants.deviceName || 'Unknown'} last />
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            {t('settings.language')}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => handleLanguageSwitch('fr')}
              className={`flex-1 rounded-xl py-3 active:opacity-80 ${currentLang === 'fr' ? 'bg-teal-600' : 'bg-teal-100'}`}
            >
              <Text className={`text-center font-bold text-base ${currentLang === 'fr' ? 'text-white' : 'text-teal-700'}`}>
                {t('settings.languageFrench')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleLanguageSwitch('en')}
              className={`flex-1 rounded-xl py-3 active:opacity-80 ${currentLang === 'en' ? 'bg-teal-600' : 'bg-teal-100'}`}
            >
              <Text className={`text-center font-bold text-base ${currentLang === 'en' ? 'text-white' : 'text-teal-700'}`}>
                {t('settings.languageEnglish')}
              </Text>
            </Pressable>
          </View>
        </Card>

        <Card className="mb-6">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            Server URL Override
          </Text>
          <Text className="text-xs text-teal-500 mb-3">
            {t('settings.reconnectDescription')}
          </Text>
          <TextInput
            placeholder="https://your-server.com"
            value={urlInput}
            onChangeText={(v) => {
              setUrlInput(v);
              if (urlError) setUrlError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleSaveUrl}
            error={urlError}
          />
          <View className="mt-3">
            <Button
              onPress={handleSaveUrl}
              loading={isSavingUrl}
              disabled={!urlInput.trim() || isSavingUrl}
              size="sm"
            >
              {t('common.save')}
            </Button>
          </View>
        </Card>

        <View className="gap-3">
          <Pressable
            onPress={handleRePair}
            className="bg-teal-600 rounded-xl py-4 active:bg-teal-700"
          >
            <Text className="text-white text-center font-bold text-lg">
              {t('settings.reconnect')}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleClearData}
            className="bg-red-100 rounded-xl py-4 active:bg-red-200"
          >
            <Text className="text-red-700 text-center font-bold text-lg">
              {t('settings.clearData')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between items-center py-2 ${!last ? 'border-b border-teal-100' : ''}`}>
      <Text className="text-sm font-semibold text-teal-600">{label}</Text>
      <Text className="text-sm text-slate-800 max-w-[55%] text-right" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
