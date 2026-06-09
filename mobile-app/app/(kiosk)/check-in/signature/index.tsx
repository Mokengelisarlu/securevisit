import { View, Text, Pressable } from 'react-native';
import { useRef } from 'react';
import { router } from 'expo-router';
import { ScreenWrapper, Button, SignaturePad } from '@/src/components/ui';
import type { SignaturePadHandle } from '@/src/components/ui';
import { useVisitDraft } from '@/src/contexts/VisitDraftContext';

export default function SignatureScreen() {
  const { updateDraft } = useVisitDraft();
  const padRef = useRef<SignaturePadHandle>(null);

  async function handleContinue() {
    if (padRef.current && !padRef.current.isEmpty) {
      const uri = await padRef.current.capture();
      if (uri) {
        updateDraft({ signatureData: uri });
      }
    }
    router.push('/(kiosk)/check-in/review' as any);
  }

  function handleSkip() {
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
            <Text className="text-teal-700 text-base font-semibold">← Back</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">Signature</Text>
          <Text className="text-base text-teal-600 mt-1 mb-6">
            Sign using your finger on the pad below
          </Text>
        </View>

        <View className="flex-1 justify-center">
          <SignaturePad ref={padRef} />
        </View>

        <View className="pb-6 gap-3">
          <Button onPress={handleContinue} size="lg">
            Continue with Signature
          </Button>
          <Button onPress={handleSkip} variant="ghost" size="md">
            Skip — No Signature
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
