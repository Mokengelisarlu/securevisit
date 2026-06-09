import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';

export default function KioskLayout() {
  const { deviceToken, isCheckingToken } = useAuth();
  const { tenantSlug, isLoadingSlug } = useApi();

  // If not paired or missing tenant slug, redirect to pairing
  if ((!isCheckingToken && !deviceToken) || (!isLoadingSlug && !tenantSlug)) {
    return <Redirect href="/(auth)/pairing" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

