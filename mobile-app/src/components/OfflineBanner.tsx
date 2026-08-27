import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetwork } from '@/src/contexts/NetworkContext';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const { t } = useTranslation();

  if (isOnline) return null;

  return (
    <View className="bg-amber-500 px-4 py-2.5 flex-row items-center justify-center">
      <View className="w-2 h-2 rounded-full bg-white mr-2 opacity-80" />
      <Text className="text-white text-sm font-bold tracking-wide">
        {t('offline.banner')}
      </Text>
    </View>
  );
}
