import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { EmergencyMessage } from '@/src/lib/command-polling';

interface Props {
  message: EmergencyMessage | null;
  onDismiss: () => void;
}

export function EmergencyBanner({ message, onDismiss }: Props) {
  const { t } = useTranslation();

  if (!message) return null;

  return (
    <View className="absolute inset-0 z-50 bg-black/70 items-center justify-center px-6">
      <View className="w-full max-w-md bg-red-600 rounded-3xl p-6 shadow-2xl">
        <Text className="text-white text-center font-black text-xl mb-2 uppercase tracking-wide">
          {t('emergency.title', 'Emergency')}
        </Text>
        <Text className="text-white text-center text-lg font-semibold leading-relaxed">
          {message.message}
        </Text>
        <View className="mt-6">
          <Pressable
            onPress={onDismiss}
            className="bg-white rounded-xl py-3 active:opacity-90"
            hitSlop={12}
          >
            <Text className="text-red-700 text-center font-bold text-lg">
              {t('emergency.dismiss', 'Dismiss')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
