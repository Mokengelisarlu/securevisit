import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';
import { useKiosk } from '@/src/contexts/KioskContext';

export default function CheckInStartScreen() {
  const { t } = useTranslation();
  const { setVisitorMode } = useKiosk();

  function handleNewVisitor() {
    setVisitorMode('new');
    router.push('/(kiosk)/check-in/new-visitor');
  }

  function handleExistingVisitor() {
    setVisitorMode('existing');
    router.push('/(kiosk)/check-in/existing-visitor');
  }

  return (
    <ScreenWrapper>
      <View className="pt-8 pb-6">
        <Pressable
          onPress={() => router.back()}
          className="mb-6 self-start"
          hitSlop={12}
        >
          <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
        </Pressable>
        <Text className="text-4xl font-black text-teal-900">{t('mainMenu.checkIn')}</Text>
        <Text className="text-lg text-teal-600 mt-1 font-medium">
          {t('visitorSearch.title')}
        </Text>
      </View>

      <View className="gap-6 flex-1 justify-center">
        <Pressable
          onPress={handleNewVisitor}
          className="bg-slate-700 rounded-2xl p-8 active:bg-slate-600 active:scale-95"
        >
          <View className="items-center gap-2">
            <Text className="text-2xl font-black text-white">{t('visitorSearch.newVisitor')}</Text>
            <Text className="text-base text-slate-100 text-center">
              {t('visitorSearch.newVisitorDescription')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleExistingVisitor}
          className="bg-white border-2 border-teal-500 rounded-2xl p-8 active:bg-teal-50 active:scale-95"
        >
          <View className="items-center gap-2">
            <Text className="text-2xl font-black text-teal-900">{t('visitorSearch.selectVisitor')}</Text>
            <Text className="text-base text-teal-600 text-center">
              {t('visitorSearch.selectVisitorDescription')}
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="pb-6">
        <Text className="text-xs text-teal-500 text-center">
          {t('visitorSearch.recentVisitors')}
        </Text>
      </View>
    </ScreenWrapper>
  );
}
