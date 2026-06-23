import { Stack } from 'expo-router';
import './globals.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { KioskProvider } from '@/src/contexts/KioskContext';
import { ApiProvider, useApi } from '@/src/contexts/ApiContext';
import { VisitDraftProvider } from '@/src/contexts/VisitDraftContext';

function RootContent() {
  const { isCheckingToken } = useAuth();
  const { isLoadingSlug } = useApi();

  if (isCheckingToken || isLoadingSlug) {
    return (
      <View className="flex-1 bg-teal-50 justify-center items-center">
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ApiProvider>
          <KioskProvider>
            <VisitDraftProvider>
              <RootContent />
            </VisitDraftProvider>
          </KioskProvider>
        </ApiProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
