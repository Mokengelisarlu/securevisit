import { View, Text, Pressable, ScrollView, Image as RNImage } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';

export default function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <ScreenWrapper padX={false}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="pt-8 pb-6">
          <Text className="text-3xl font-black text-teal-900">{t('settings.title')}</Text>
          <Text className="text-base text-teal-600 mt-1">{t('settings.appName')}</Text>
        </View>

        <View className="gap-3">
          <SettingsLink
            icon="information-circle-outline"
            title={t('settings.about')}
            description={t('settings.aboutDescription')}
            onPress={() => router.push('/(kiosk)/settings/about' as any)}
          />
          <SettingsLink
            icon="shield-checkmark-outline"
            title={t('settings.admin')}
            description={t('settings.adminDescription')}
            onPress={() => router.push('/(kiosk)/settings/admin' as any)}
          />
          <SettingsLink
            icon="bar-chart-outline"
            title={t('settings.reports')}
            description={t('settings.reportsDescription')}
            onPress={() => router.push('/(kiosk)/settings/reports' as any)}
          />
        </View>

        <View className="items-center mt-16 pb-6">
          <RNImage source={require('../../../assets/images/icon-512x512.png')} className="w-16 h-16 mb-2" resizeMode="contain" />
          <Text className="text-lg font-black text-teal-900">{t('settings.appName')}</Text>
          <Text className="text-sm text-teal-600 mt-1">
            {t('settings.poweredBy', { company: 'Mokengeli SARL' })}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function SettingsLink({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b border-slate-200 py-5 active:bg-teal-50"
      accessibilityRole="button"
    >
      <View className="w-11 h-11 rounded-full bg-teal-100 items-center justify-center mr-4">
        <Ionicons name={icon} size={23} color="#0F766E" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-teal-900">{title}</Text>
        <Text className="text-sm text-slate-500 mt-1">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
    </Pressable>
  );
}
