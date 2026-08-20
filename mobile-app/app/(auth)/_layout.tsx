import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';

export default function AuthLayout() {
  const { deviceToken, isCheckingToken } = useAuth();
  const { tenantSlug, isLoadingSlug } = useApi();

  // If already paired and has slug, redirect to the kiosk tabs home screen
  if (!isCheckingToken && !isLoadingSlug && deviceToken && tenantSlug) {
    return <Redirect href="/(kiosk)/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

