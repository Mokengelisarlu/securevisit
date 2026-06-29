import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ScreenWrapper, Card, Button, TextInput } from '@/src/components/ui';
import { useApi } from '@/src/contexts/ApiContext';
import { useVisitDraft } from '@/src/contexts/VisitDraftContext';
import { useTranslation } from 'react-i18next';

const VEHICLE_TYPES = ['CAR', 'TRUCK', 'MOTORCYCLE', 'OTHER'] as const;

export default function VehicleScreen() {
  const { draft, setVehicle } = useVisitDraft();
  const { kioskSettings } = useApi();

  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState<'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'OTHER'>('CAR');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [passengerCount, setPassengerCount] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();

  function handleContinue() {
    if (!plateNumber.trim()) {
      setError('Plate number is required');
      return;
    }

    setVehicle({
      plateNumber: plateNumber.trim().toUpperCase(),
      type,
      brand: brand.trim() || undefined,
      color: color.trim() || undefined,
      passengerCount: passengerCount ? parseInt(passengerCount, 10) : undefined,
    });

    navigateNext(true);
  }

  function handleSkip() {
    setVehicle(null);
    navigateNext(false);
  }

  function navigateNext(hasVehicle: boolean) {
    const requireVisitorPhoto = kioskSettings?.requireVisitorPhoto === 1;
    const requireVehiclePhoto = kioskSettings?.requireVehiclePhoto === 1 && hasVehicle;
    const requireSignature = kioskSettings?.requireSignature === 1;

    if (requireVisitorPhoto || requireVehiclePhoto) {
      router.push('/(kiosk)/check-in/photo' as any);
    } else if (requireSignature) {
      router.push('/(kiosk)/check-in/signature' as any);
    } else {
      router.push('/(kiosk)/check-in/review' as any);
    }
  }

  return (
    <ScreenWrapper padX={false}>
      <ScrollView
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="pt-8 pb-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-4 self-start"
            hitSlop={12}
          >
            <Text className="text-teal-700 text-base font-semibold">{t('common.back')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">{t('vehicle.title')}</Text>
          <Text className="text-base text-teal-600 mt-1">
            Fill in vehicle details or skip if not applicable
          </Text>
        </View>

        <Card className="mb-6">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            {t('vehicle.title')}
          </Text>

          <View className="gap-4">
            <TextInput
              label={`${t('vehicle.plateNumber')} *`}
              placeholder={t('vehicle.plateNumberPlaceholder')}
              value={plateNumber}
              onChangeText={(t) => { setPlateNumber(t.toUpperCase()); setError(''); }}
              error={error}
            />

            <View>
              <Text className="text-sm font-semibold text-slate-700 mb-2">
                Vehicle Type *
              </Text>
              <View className="gap-2">
                {VEHICLE_TYPES.map((vt) => (
                  <Pressable
                    key={vt}
                    onPress={() => setType(vt)}
                    className={`px-4 py-3 rounded-xl border-2 ${
                      type === vt
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        type === vt ? 'text-teal-800' : 'text-slate-700'
                      }`}
                    >
                      {vt === 'CAR' ? 'Car' : vt === 'TRUCK' ? 'Truck' : vt === 'MOTORCYCLE' ? 'Motorcycle' : 'Other'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextInput
              label={t('vehicle.make')}
              placeholder="e.g. Toyota, Ford"
              value={brand}
              onChangeText={setBrand}
              autoCapitalize="words"
            />

            <TextInput
              label={t('vehicle.color')}
              placeholder="e.g. White, Black"
              value={color}
              onChangeText={setColor}
              autoCapitalize="words"
            />

            <TextInput
              label="Passenger Count"
              placeholder="e.g. 2"
              value={passengerCount}
              onChangeText={setPassengerCount}
              keyboardType="number-pad"
            />
          </View>
        </Card>

        {error ? (
          <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-700 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          <Button onPress={handleContinue} size="lg">
            {t('common.continue')}
          </Button>
          <Button onPress={handleSkip} variant="ghost" size="md">
            {t('vehicle.skipVehicle')}
          </Button>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
