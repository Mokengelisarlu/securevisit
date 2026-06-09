import { View, Text, Pressable, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useKiosk } from '@/src/contexts/KioskContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MainMenuScreen() {
  const insets = useSafeAreaInsets();
  const { clearToken } = useAuth();
  const { tenantSlug, apiBaseUrl } = useApi();
  const { setMode, resetState, justPaired, setJustPaired } = useKiosk();

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
      className="flex-1 bg-teal-50 px-6 justify-between"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {justPaired ? (
        <View className="bg-teal-600 rounded-2xl p-5 mt-4">
          <View className="items-center gap-2">
            <Text className="text-lg font-black text-white text-center">
              Pairing Successful
            </Text>
            <Text className="text-sm text-white text-center">
              This kiosk is now connected to your SecureVisit system.
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-teal-300" />
              <Text className="text-xs text-white">{tenantSlug}</Text>
            </View>
            <Pressable
              onPress={handleDismissSuccess}
              className="bg-teal-700 rounded-xl px-6 py-2 mt-2 active:bg-teal-800"
            >
              <Text className="text-white text-sm font-bold">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View className="items-center mt-4">
        <Image
          source={require('../../assets/images/icon-512x512.png')}
          className="w-28 h-28 mb-2"
          resizeMode="contain"
        />
        <Text className="text-lg font-semibold text-teal-700">SecureVisit</Text>

        <View className="flex-row items-center gap-1.5 bg-teal-100 rounded-full px-3 py-1 mt-3 mb-3">
          <View className="w-2 h-2 rounded-full bg-teal-500" />
          <Text className="text-xs font-bold text-teal-700 uppercase tracking-wider">
            Connected
          </Text>
        </View>

        <Text className="text-4xl font-black text-teal-900 text-center">
          Welcome
        </Text>

        <Text className="text-xs text-teal-500 text-center mt-1">
          {tenantSlug}
        </Text>
      </View>

      <View className="gap-6">
        <Pressable
          onPress={handleCheckIn}
          className="bg-slate-700 rounded-2xl p-8 active:bg-slate-600 active:scale-95"
        >
          <View className="items-center gap-2">
            <Text className="text-3xl font-black text-white">Check In</Text>
            <Text className="text-base text-slate-300 text-center">
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

      <View className="gap-3">
        <Pressable
          onPress={handleSettings}
          className="bg-orange-100 rounded-lg py-3 active:bg-orange-200"
        >
          <Text className="text-orange-900 text-center font-bold text-base">
            Settings
          </Text>
        </Pressable>

        <View className="flex-row items-center justify-center gap-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <Text className="text-xs text-teal-600 text-center">
            Kiosk Ready • {tenantSlug}
          </Text>
        </View>
        <Text className="text-[10px] text-teal-400 text-center">
          {apiBaseUrl}
        </Text>
      </View>
    </View>
  );
}
