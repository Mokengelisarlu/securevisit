import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';

export default function ReportsSettingsScreen() {
  const { t } = useTranslation();

  return (
    <ScreenWrapper padX={false}>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-8 pb-6">
          <Pressable onPress={() => router.back()} className="mb-4 self-start" hitSlop={12}>
            <Text className="text-teal-700 text-base font-semibold">← {t('settings.backToSettings')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">{t('settings.reports')}</Text>
        </View>

        <View className="items-center py-16">
          <Ionicons name="construct-outline" size={56} color="#0F766E" />
          <Text className="text-xl font-black text-teal-900 mt-5 text-center">{t('settings.reportsComingSoon')}</Text>
          <Text className="text-sm text-slate-500 mt-2 text-center">{t('settings.reportsDescription')}</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
