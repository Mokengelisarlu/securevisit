import { Stack } from 'expo-router';
import './globals.css';
import '@/src/i18n';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { KioskProvider } from '@/src/contexts/KioskContext';
import { ApiProvider, useApi } from '@/src/contexts/ApiContext';
import { VisitDraftProvider } from '@/src/contexts/VisitDraftContext';
import { NetworkProvider, useNetwork } from '@/src/contexts/NetworkContext';
import { ReactQueryProvider } from '@/src/lib/react-query-provider';
import { useKioskHeartbeat } from '@/src/hooks/useHeartbeat';
import { useCommandPolling } from '@/src/hooks/useCommandPolling';
import { EmergencyBanner } from '@/src/components/EmergencyBanner';
import { useEffect, useRef } from 'react';
import { startAutoSync, stopAutoSync, syncQueue } from '@/src/lib/sync-engine';

function SyncEffect() {
  const { deviceToken } = useAuth();
  const { tenantSlug, apiBaseUrl } = useApi();
  const { isOnline } = useNetwork();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!hasStartedRef.current) {
      startAutoSync(
        () => deviceToken,
        () => tenantSlug,
        () => apiBaseUrl,
        () => isOnline
      );
      hasStartedRef.current = true;
    }

    return () => {
      stopAutoSync();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOnline && deviceToken && tenantSlug) {
      syncQueue(deviceToken, tenantSlug, apiBaseUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, deviceToken, tenantSlug]);

  return null;
}

function CommandPollingLayer() {
  const { emergencyMessage, dismissEmergency } = useCommandPolling();
  return <EmergencyBanner message={emergencyMessage} onDismiss={dismissEmergency} />;
}

function RootContent() {
  const { isCheckingToken } = useAuth();
  const { isLoadingSlug } = useApi();

  useKioskHeartbeat();

  if (isCheckingToken || isLoadingSlug) {
    return (
      <View className="flex-1 bg-teal-50 justify-center items-center">
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  return (
    <>
      <SyncEffect />
      <CommandPollingLayer />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
        <AuthProvider>
          <ApiProvider>
            <NetworkProvider>
              <KioskProvider>
                <VisitDraftProvider>
                  <ReactQueryProvider>
                    <RootContent />
                  </ReactQueryProvider>
                </VisitDraftProvider>
              </KioskProvider>
            </NetworkProvider>
          </ApiProvider>
        </AuthProvider>
    </SafeAreaProvider>
  );
}
