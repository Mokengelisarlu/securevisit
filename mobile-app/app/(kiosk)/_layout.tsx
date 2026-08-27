import { Stack, Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { OfflineBanner } from '@/src/components/OfflineBanner';

export default function KioskLayout() {
  const { deviceToken, isCheckingToken } = useAuth();
  const { tenantSlug, isLoadingSlug } = useApi();

  // If not paired or missing tenant slug, redirect to pairing
  if ((!isCheckingToken && !deviceToken) || (!isLoadingSlug && !tenantSlug)) {
    return <Redirect href="/(auth)/pairing" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
}

