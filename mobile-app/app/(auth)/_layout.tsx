import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';

export default function AuthLayout() {
  const { deviceToken, isCheckingToken } = useAuth();
  const { tenantSlug, isLoadingSlug } = useApi();

  // If already paired and has slug, redirect to main kiosk
  if (!isCheckingToken && !isLoadingSlug && deviceToken && tenantSlug) {
    return <Redirect href="/(kiosk)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

