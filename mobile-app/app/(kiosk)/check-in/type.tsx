import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/src/components/ui';
import { useGroupDraft } from '@/src/contexts/GroupDraftContext';

export default function CheckInTypeScreen() {
  const { t } = useTranslation();
  const { resetDraft } = useGroupDraft();

  function handleSingleVisitor() {
    router.push('/(kiosk)/check-in');
  }

  function handleGroupVisit() {
    resetDraft();
    router.push('/(kiosk)/check-in/group');
  }

  return (
    <ScreenWrapper>
      <View className="pt-8 pb-6">
        <Pressable onPress={() => router.back()} className="mb-6 self-start" hitSlop={12}>
          <Text className="text-teal-700 text-base font-semibold">← {t('common.back')}</Text>
        </Pressable>
        <Text className="text-4xl font-black text-teal-900">{t('group.title')}</Text>
        <Text className="text-lg text-teal-600 mt-1 font-medium">
          {t('checkInType.chooseLabel')}
        </Text>
      </View>

      <View className="gap-6 flex-1 justify-center">
        <Pressable
          onPress={handleSingleVisitor}
          className="bg-white border-2 border-teal-500 rounded-2xl p-8 active:bg-teal-50 active:scale-95"
        >
          <View className="items-center gap-2">
            <Ionicons name="person-outline" size={40} color="#0F766E" />
            <Text className="text-2xl font-black text-teal-900">{t('checkInType.singleVisitor')}</Text>
            <Text className="text-base text-teal-600 text-center">
              {t('checkInType.singleVisitorDescription')}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={handleGroupVisit}
          className="bg-teal-700 rounded-2xl p-8 active:bg-teal-800 active:scale-95"
        >
          <View className="items-center gap-2">
            <Ionicons name="people-outline" size={40} color="#FFFFFF" />
            <Text className="text-2xl font-black text-white">{t('checkInType.groupVisit')}</Text>
            <Text className="text-base text-teal-100 text-center">
              {t('checkInType.groupVisitDescription')}
            </Text>
          </View>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}
