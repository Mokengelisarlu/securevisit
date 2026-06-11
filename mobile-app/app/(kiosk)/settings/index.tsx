import { View, Text, Pressable, ScrollView, Alert, Image as RNImage } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ScreenWrapper, Card, TextInput, Button } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';

export default function SettingsScreen() {
  const { clearToken, deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl, deviceId, saveApiBaseUrl, clearTenantSlug, clearDeviceId } = useApi();
  const { resetState } = useKiosk();
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  function tokenPreview() {
    if (!deviceToken) return 'None';
    if (deviceToken.length <= 20) return deviceToken;
    return deviceToken.substring(0, 10) + '...' + deviceToken.substring(deviceToken.length - 6);
  }

  async function handleSaveUrl() {
    if (!urlInput.trim()) return;
    const trimmed = urlInput.trim().replace(/\/+$/, '');
    if (!/^https?:\/\/.+/.test(trimmed)) {
      setUrlError('URL must start with http:// or https://');
      return;
    }
    setUrlError('');
    setIsSavingUrl(true);
    try {
      await saveApiBaseUrl(trimmed);
      setUrlInput('');
    } catch (err) {
      setUrlError('Failed to save URL.');
    } finally {
      setIsSavingUrl(false);
    }
  }

  function handleRePair() {
    Alert.alert(
      'Re-Pair Device',
      'This will generate a new pairing code for this device. The existing device record will be updated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-Pair',
          style: 'destructive',
          onPress: async () => {
            resetState();
            await clearToken();
            // Keep deviceId and tenantSlug for reconnect flow
            router.replace('/(auth)/pairing?reconnect=true');
          },
        },
      ]
    );
  }

  function handleClearData() {
    Alert.alert(
      'Clear Local Data',
      'This will wipe all stored data including pairing info and cached visits.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            resetState();
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
            <Text className="text-teal-700 text-base font-semibold">← Back</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900 flex-1 text-center">Settings</Text>
          <RNImage
            source={require('../../../assets/images/icon-512x512.png')}
            className="w-10 h-10"
            resizeMode="contain"
          />
        </View>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            Connection
          </Text>
          <InfoRow label="Server URL" value={apiBaseUrl} />
          <InfoRow label="Tenant Slug" value={tenantSlug || 'None'} />
          <InfoRow label="Device ID" value={deviceId || 'Unknown'} />
          <InfoRow label="Device Token" value={tokenPreview()} last />
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            Device
          </Text>
          <InfoRow label="App Version" value={Constants.expoConfig?.version || '1.0.0'} />
          <InfoRow label="Platform" value={Platform.OS + ' ' + (Platform.Version?.toString() || '')} />
          <InfoRow label="Runtime Version" value={Constants.executionEnvironment || 'Unknown'} />
          <InfoRow label="Device Name" value={Constants.deviceName || 'Unknown'} last />
        </Card>

        <Card className="mb-6">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            Server URL Override
          </Text>
          <Text className="text-xs text-teal-500 mb-3">
            Change the server URL this kiosk connects to. Useful if your server address changes.
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
              Save URL
            </Button>
          </View>
        </Card>

        <View className="gap-3">
          <Pressable
            onPress={handleRePair}
            className="bg-teal-600 rounded-xl py-4 active:bg-teal-700"
          >
            <Text className="text-white text-center font-bold text-lg">
              Re-Pair Device
            </Text>
          </Pressable>

          <Pressable
            onPress={handleClearData}
            className="bg-red-100 rounded-xl py-4 active:bg-red-200"
          >
            <Text className="text-red-700 text-center font-bold text-lg">
              Clear Local Data
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
