import { View, Text, Pressable, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { usePairing } from '@/src/hooks/usePairing';
import { useDeviceManagement } from '@/src/hooks/useDeviceManagement';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, TextInput } from '@/src/components/ui';

export default function PairingScreen() {
  const insets = useSafeAreaInsets();
  const { saveToken, isCheckingToken } = useAuth();
  const { tenantSlug, isLoadingSlug, saveTenantSlug, clearTenantSlug, apiBaseUrl, saveApiBaseUrl, saveDeviceId, deviceId: existingDeviceId } = useApi();
  const { setJustPaired } = useKiosk();
  const { pairingCode, deviceId, isGenerating, generatePairingCode, generateReconnectPairingCode, checkPairingStatus } =
    usePairing();
  const { verifyDeviceToken } = useDeviceManagement();
  const { reconnect } = useLocalSearchParams<{ reconnect?: string }>();
  const isReconnect = reconnect === 'true';
  const [isPolling, setIsPolling] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugError, setSlugError] = useState('');
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    if (tenantSlug) {
      generateNewCode();
    }
  }, [tenantSlug, isReconnect]);

  async function handleSaveSlug() {
    const trimmed = slugInput.trim().toLowerCase();
    if (!trimmed) {
      setSlugError('Please enter your organization slug');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      setSlugError('Slug must only contain lowercase letters, numbers, and hyphens');
      return;
    }
    setSlugError('');
    setUrlError('');
    setIsSavingSlug(true);
    try {
      if (urlInput.trim()) {
        const urlTrimmed = urlInput.trim().replace(/\/+$/, '');
        if (!/^https?:\/\/.+/.test(urlTrimmed)) {
          setUrlError('URL must start with http:// or https://');
          setIsSavingSlug(false);
          return;
        }
        await saveApiBaseUrl(urlTrimmed);
      }
      await saveTenantSlug(trimmed);
    } catch (err) {
      setSlugError('Failed to save. Please try again.');
    } finally {
      setIsSavingSlug(false);
    }
  }

  async function handleChangeTenant() {
    setStatusMessage('');
    setSlugInput('');
    setSlugError('');
    setUrlInput('');
    setUrlError('');
    await clearTenantSlug();
  }

  async function handleChangeServerUrl() {
    setStatusMessage('');
    setSlugInput(tenantSlug ?? '');
    setSlugError('');
    setUrlInput('');
    setUrlError('');
    await clearTenantSlug();
  }

  async function generateNewCode() {
    try {
      setStatusMessage('Generating pairing code...');
      console.log('[pairing] generateNewCode:', { isReconnect, existingDeviceId, apiBaseUrl, tenantSlug });
      let devId: string;
      if (isReconnect && existingDeviceId) {
        try {
          const result = await generateReconnectPairingCode(existingDeviceId);
          devId = result.deviceId;
        } catch (reconnectErr) {
          console.warn('[pairing] Reconnect failed, falling back to new pairing:', reconnectErr);
          const result = await generatePairingCode();
          devId = result.deviceId;
          if (devId) {
            await saveDeviceId(devId);
          }
        }
      } else {
        const result = await generatePairingCode();
        devId = result.deviceId;
        if (devId) {
          await saveDeviceId(devId);
        }
      }
      setStatusMessage('Scan this code on your admin panel, then approve the pairing.');
      startPolling(devId);
    } catch (err) {
      console.error('[pairing] generateNewCode error:', err);
      setStatusMessage('Failed to generate code. Try again.');
    }
  }

  async function startPolling(deviceIdToPoll: string) {
    setIsPolling(true);
    try {
      const token = await checkPairingStatus(deviceIdToPoll, 2000, 180);
      if (token) {
        const isValid = await verifyDeviceToken(token);
        if (isValid) {
          await saveToken(token);
          setJustPaired(true);
          setStatusMessage('Pairing successful! Redirecting...');
          router.replace('/(kiosk)');
        } else {
          setStatusMessage('Token verification failed. Try again.');
        }
      }
    } catch (err) {
      setStatusMessage('Pairing failed or timed out. Try again.');
    } finally {
      setIsPolling(false);
    }
  }

  if (isCheckingToken || isLoadingSlug) {
    return (
      <View className="flex-1 bg-teal-50 justify-center items-center" style={{ paddingBottom: insets.bottom }}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text className="mt-4 text-teal-800">Checking device status...</Text>
      </View>
    );
  }

  // ─── First-launch: no slug stored yet ───────────────────────────────────────
  if (!tenantSlug) {
    return (
      <View className="flex-1 bg-teal-50 px-6 justify-center" style={{ paddingBottom: insets.bottom }}>
        {/* Header */}
        <View className="items-center mb-10">
          <Image
            source={require('../../assets/images/icon-512x512.png')}
            className="w-16 h-16 mb-4"
            resizeMode="contain"
          />
          <Text className="text-3xl font-black text-teal-900 text-center">
            Welcome to SecureVisit
          </Text>
          <Text className="text-base text-teal-700 text-center mt-2">
            Enter your organization slug to get started.{'\n'}This is a one-time setup.
          </Text>
        </View>

        {/* Input card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <Text className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">
            Organization Slug
          </Text>
          <TextInput
            placeholder="e.g. acme-corp"
            value={slugInput}
            onChangeText={(v) => {
              setSlugInput(v);
              if (slugError) setSlugError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="next"
            onSubmitEditing={handleSaveSlug}
            error={slugError}
          />
          <Text className="text-xs text-teal-500 mt-3">
            You can find your slug in the SecureVisit admin panel under Settings → Organization.
          </Text>

          <View className="h-px bg-teal-100 my-4" />

          <Text className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">
            Server URL
          </Text>
          <TextInput
            placeholder={apiBaseUrl}
            value={urlInput}
            onChangeText={(v) => {
              setUrlInput(v);
              if (urlError) setUrlError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleSaveSlug}
            error={urlError}
          />
          <Text className="text-xs text-teal-500 mt-3">
            Leave empty to use the default. Change this if the server URL changes.
          </Text>
        </View>

        <Button
          onPress={handleSaveSlug}
          loading={isSavingSlug}
          disabled={!slugInput.trim()}
          size="lg"
        >
          Save & Continue
        </Button>
      </View>
    );
  }

  // ─── Pairing code flow ───────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-teal-50 px-6 justify-center" style={{ paddingBottom: insets.bottom }}>
      <Text className="text-4xl font-bold text-teal-900 text-center mb-8">
        Kiosk Pairing
      </Text>

      <View className="bg-white rounded-xl p-8 mb-6 shadow-sm">
        {pairingCode ? (
          <View className="items-center">
            <Text className="text-sm font-semibold text-teal-600 mb-4 uppercase tracking-wide">
              Pairing Code
            </Text>
            <Text className="text-6xl font-black text-teal-900 tracking-widest">
              {pairingCode}
            </Text>
            <Text className="text-xs text-teal-700 mt-4 text-center">
              {tenantSlug}
            </Text>
          </View>
        ) : (
          <View className="items-center">
            <ActivityIndicator size="large" color="#14B8A6" />
            <Text className="mt-4 text-teal-800">Generating code...</Text>
          </View>
        )}
      </View>

      <Text className="text-lg text-teal-800 text-center mb-4 font-medium">
        {statusMessage}
      </Text>


      <View className="gap-3">
        <Pressable
          onPress={() => startPolling(deviceId || '')}
          disabled={isPolling || !deviceId}
          className="bg-teal-600 rounded-lg py-4 active:bg-teal-700 disabled:bg-teal-400"
        >
          <Text className="text-white text-center font-bold text-lg">
            {isPolling ? 'Polling...' : 'Check Status'}
          </Text>
        </Pressable>

        <Pressable
          onPress={generateNewCode}
          disabled={isGenerating}
          className="bg-teal-100 rounded-lg py-4 active:bg-teal-200"
        >
          <Text className="text-teal-900 text-center font-bold text-lg">
            {isGenerating ? 'Generating...' : 'New Code'}
          </Text>
        </Pressable>
      </View>

      {/* Settings links */}
      <View className="mt-8 items-center gap-2">
        <Pressable onPress={handleChangeTenant} className="active:opacity-60">
          <Text className="text-xs text-teal-500 underline">
            Change Organization Slug
          </Text>
        </Pressable>
        <Pressable onPress={handleChangeServerUrl} className="active:opacity-60">
          <Text className="text-xs text-teal-500 underline">
            Change Server URL
          </Text>
        </Pressable>
      </View>

      <Text className="text-xs text-teal-500 text-center mt-3">
        Server: {apiBaseUrl}
      </Text>

      <Text className="text-xs text-teal-600 text-center mt-2">
        This kiosk will sync visitor data with the main system.
      </Text>
    </View>
  );
}
