import { View, Text, Pressable } from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { ScreenWrapper, Button, SignaturePad } from '@/src/components/ui';
import type { SignaturePadHandle } from '@/src/components/ui';
import { useVisitDraft } from '@/src/contexts/VisitDraftContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useTranslation } from 'react-i18next';

export default function SignatureScreen() {
  const { updateDraft } = useVisitDraft();
  const { kioskSettings } = useApi();
  const padRef = useRef<SignaturePadHandle>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const { t } = useTranslation();

  function handleClear() {
    padRef.current?.clear();
    setHasSignature(false);
  }

  async function handleContinue() {
    if (padRef.current && !padRef.current.isEmpty) {
      const uri = await padRef.current.capture();
      if (uri) {
        updateDraft({ signatureData: uri });
      }
    } else {
      // Ensure any previous visitor's signature is cleared
      updateDraft({ signatureData: undefined });
    }
    router.push('/(kiosk)/check-in/review' as any);
  }

  function handleSkip() {
    // Explicitly clear any leftover signature from a previous visitor
    updateDraft({ signatureData: undefined });
    router.push('/(kiosk)/check-in/review' as any);
  }

  return (
    <ScreenWrapper padX={false}>
      <View className="flex-1 px-6 justify-between">
        <View className="pt-8">
          <Pressable
            onPress={() => router.back()}
            className="mb-4 self-start"
            hitSlop={12}
          >
            <Text className="text-teal-700 text-base font-semibold">{t('common.back')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">{t('signature.title')}</Text>
          <Text className="text-base text-teal-600 mt-1 mb-6">
            Sign using your finger on the pad below
          </Text>
        </View>

        <View className="flex-1 justify-center">
          {/* Header row above the pad */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {t('signature.signHere')}
            </Text>
            {hasSignature && (
              <Pressable
                onPress={handleClear}
                hitSlop={12}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 active:bg-red-100"
              >
                <Text className="text-red-600 text-sm font-semibold">{t('signature.clear')}</Text>
              </Pressable>
            )}
          </View>

          <SignaturePad
            ref={padRef}
            onStrokeStart={() => setHasSignature(true)}
          />
        </View>

        <View className="pb-6 gap-3">
          <Button onPress={handleContinue} size="lg">
            {t('signature.continue')}
          </Button>
          {kioskSettings?.requireSignature !== 1 ? (
            <Button onPress={handleSkip} variant="ghost" size="md">
              {t('signature.skip')}
            </Button>
          ) : null}
        </View>
      </View>
    </ScreenWrapper>
  );
}

