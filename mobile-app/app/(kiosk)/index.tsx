import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { useGetPublicBusinessSettings } from '@/src/hooks/usePublicData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MainMenuScreen() {
  const insets = useSafeAreaInsets();
  const { deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl, businessSettings: cachedBusiness, saveBusinessSettings } = useApi();
  const { data: business, isLoading } = useGetPublicBusinessSettings(deviceToken);
  const { setMode, resetState, justPaired, setJustPaired } = useKiosk();

  const effectiveBusiness = cachedBusiness || business;
  const tenantName = effectiveBusiness?.name || tenantSlug || 'SecureVisit';
  const logoSrc = effectiveBusiness?.logoUrl
    ? effectiveBusiness.logoUrl.includes('blob.vercel-storage.com')
      ? `${apiBaseUrl}/api/blob?url=${encodeURIComponent(effectiveBusiness.logoUrl)}`
      : effectiveBusiness.logoUrl
    : null;

  // Cache business settings from API after first successful fetch
  const { useEffect } = require('react');
  useEffect(() => {
    if (business && !cachedBusiness && !isLoading) {
      saveBusinessSettings(business);
    }
  }, [business, cachedBusiness, isLoading, saveBusinessSettings]);

  async function handleCheckIn() {
    setJustPaired(false);
    resetState();
    setMode('IN');
    router.push('/(kiosk)/check-in');
  }

  async function handleCheckOut() {
    setJustPaired(false);
    resetState();
    setMode('OUT');
    router.push('/(kiosk)/check-out');
  }

  async function handleDismissSuccess() {
    setJustPaired(false);
  }

  function handleSettings() {
    (router as any).push('/(kiosk)/settings');
  }

  return (
    <View
      className="flex-1 bg-teal-50 px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {justPaired ? (
        <View className="bg-teal-600 rounded-2xl p-5 mt-4 mb-4">
          <View className="items-center gap-2">
            <Text className="text-lg font-black text-white text-center">
              Pairing Successful
            </Text>
            <Text className="text-sm text-white text-center">
              This kiosk is now connected to {tenantName}.
            </Text>
            <Pressable
              onPress={handleDismissSuccess}
              className="bg-teal-700 rounded-xl px-6 py-2 mt-2 active:bg-teal-800"
            >
              <Text className="text-white text-sm font-bold">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View className="flex-1" style={{ flex: 1 }}>
        <View className="flex-1 justify-center items-center" style={{ flex: 1 }}>
          <View className="flex-row items-center justify-center gap-2 mb-4">
            <Image
              source={require('../../assets/images/icon-512x512.png')}
              className="w-10 h-10"
              resizeMode="contain"
            />
            <Text className="text-xl font-black text-teal-700">SecureVisit</Text>
          </View>
          <View className="items-center gap-3">
            {logoSrc ? (
              <Image
                source={{ uri: logoSrc }}
                className="w-28 h-28 rounded-xl"
                resizeMode="contain"
              />
            ) : (
              <Image
                source={require('../../assets/images/icon-512x512.png')}
                className="w-28 h-28"
                resizeMode="contain"
              />
            )}
            <Text className="text-4xl font-black text-teal-900 text-center" style={{ maxWidth: '90%' }}>
              {tenantName}
            </Text>
          </View>
        </View>

        <View className="flex-1 justify-center items-center" style={{ flex: 1 }}>
          <View className="w-full items-center gap-6">
            <Text className="text-xl font-normal text-teal-600 text-center">
              Welcome
            </Text>
            <View className="gap-6 w-full">
              <Pressable
                onPress={handleCheckIn}
                className="bg-teal-700 rounded-2xl p-8 active:bg-teal-800 active:scale-95"
              >
                <View className="items-center gap-2">
                  <Text className="text-3xl font-black text-white">Check In</Text>
                  <Text className="text-base text-white text-center">
                    Register your arrival
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={handleCheckOut}
                className="rounded-2xl p-8 border-2 border-teal-600 bg-transparent active:bg-teal-50 active:scale-95"
              >
                <View className="items-center gap-2">
                  <Text className="text-3xl font-black text-teal-700">Check Out</Text>
                  <Text className="text-base text-teal-600 text-center">
                    Register your departure
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>

        <View className="flex-1 justify-center items-center gap-2" style={{ flex: 1 }}>
          <Pressable
            onPress={handleSettings}
            className="active:opacity-60"
          >
            <Text className="text-teal-600 text-base font-semibold underline">
              Settings
            </Text>
          </Pressable>

          <View className="flex-row items-center justify-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <Text className="text-xs text-teal-600 text-center">
              Kiosk online
            </Text>
          </View>
          <Text className="text-[10px] text-teal-400 text-center">
            Powered by Mokengeli Sarlu
          </Text>
        </View>
      </View>
    </View>
  );
}