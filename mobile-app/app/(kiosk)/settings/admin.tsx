import { View, Text, Pressable, ScrollView, Alert, TextInput as NativeTextInput } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper, Button } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { changeLanguage, getCurrentLanguage } from '@/src/i18n';

export default function AdminSettingsScreen() {
  const { t } = useTranslation();
  const { clearToken, deviceToken } = useAuth();
  const {
    apiBaseUrl,
    saveApiBaseUrl,
    clearTenantSlug,
    clearDeviceId,
    clearBusinessSettings,
    clearKioskSettings,
  } = useApi();
  const { resetState } = useKiosk();
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [currentLang, setCurrentLang] = useState<'fr' | 'en'>(getCurrentLanguage());

  function tokenPreview() {
    if (!deviceToken) return t('settings.unknown');
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
    } catch {
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
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-8 pb-6">
          <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
            <Text className="text-teal-700 text-base font-semibold">← {t('settings.backToSettings')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">{t('settings.admin')}</Text>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">{t('settings.language')}</Text>
          <View className="flex-row gap-2">
            <Pressable onPress={() => handleLanguageSwitch('fr')} className={`flex-1 rounded-xl py-3 active:opacity-80 ${currentLang === 'fr' ? 'bg-teal-600' : 'bg-teal-100'}`}>
              <Text className={`text-center font-bold text-base ${currentLang === 'fr' ? 'text-white' : 'text-teal-700'}`}>{t('settings.languageFrench')}</Text>
            </Pressable>
            <Pressable onPress={() => handleLanguageSwitch('en')} className={`flex-1 rounded-xl py-3 active:opacity-80 ${currentLang === 'en' ? 'bg-teal-600' : 'bg-teal-100'}`}>
              <Text className={`text-center font-bold text-base ${currentLang === 'en' ? 'text-white' : 'text-teal-700'}`}>{t('settings.languageEnglish')}</Text>
            </Pressable>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">{t('settings.serverUrlOverride')}</Text>
          <Text className="text-xs text-teal-500 mb-3">{t('settings.reconnectDescription')}</Text>
          <NativeTextInput
            placeholder={t('settings.serverUrlPlaceholder')}
            value={urlInput}
            onChangeText={(value) => { setUrlInput(value); if (urlError) setUrlError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleSaveUrl}
            className="border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
          />
          {urlError ? <Text className="text-red-600 text-sm mt-2">{urlError}</Text> : null}
          <View className="mt-3">
            <Button onPress={handleSaveUrl} loading={isSavingUrl} disabled={!urlInput.trim() || isSavingUrl} size="sm">{t('common.save')}</Button>
          </View>
          <Text className="text-xs text-slate-500 mt-3">{apiBaseUrl}</Text>
        </View>

        <View className="gap-3">
          <Pressable onPress={handleRePair} className="bg-teal-600 rounded-xl py-4 active:bg-teal-700">
            <Text className="text-white text-center font-bold text-lg">{t('settings.reconnect')}</Text>
          </Pressable>
          <Pressable onPress={handleClearData} className="bg-red-100 rounded-xl py-4 active:bg-red-200">
            <Text className="text-red-700 text-center font-bold text-lg">{t('settings.clearData')}</Text>
          </Pressable>
        </View>
        <Text className="text-xs text-slate-400 mt-4 text-center">{t('settings.deviceToken')}: {tokenPreview()}</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}
