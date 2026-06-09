import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ScreenWrapper, Card, Button, TextInput } from '@/src/components/ui';
import { useVisitDraft } from '@/src/contexts/VisitDraftContext';

const VEHICLE_TYPES = ['CAR', 'TRUCK', 'MOTORCYCLE', 'OTHER'] as const;

export default function VehicleScreen() {
  const { draft, setVehicle } = useVisitDraft();

  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState<'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'OTHER'>('CAR');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [passengerCount, setPassengerCount] = useState('');
  const [error, setError] = useState('');

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

    router.push('/(kiosk)/check-in/photo' as any);
  }

  function handleSkip() {
    setVehicle(null);
    router.push('/(kiosk)/check-in/photo' as any);
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
            <Text className="text-teal-700 text-base font-semibold">← Back</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">Vehicle Info</Text>
          <Text className="text-base text-teal-600 mt-1">
            Fill in vehicle details or skip if not applicable
          </Text>
        </View>

        <Card className="mb-6">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-4">
            Vehicle Details
          </Text>

          <View className="gap-4">
            <TextInput
              label="Plate Number *"
              placeholder="e.g. ABC 123"
              value={plateNumber}
              onChangeText={(t) => { setPlateNumber(t); setError(''); }}
              autoCapitalize="characters"
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
              label="Brand"
              placeholder="e.g. Toyota, Ford"
              value={brand}
              onChangeText={setBrand}
              autoCapitalize="words"
            />

            <TextInput
              label="Color"
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
            Continue with Vehicle
          </Button>
          <Button onPress={handleSkip} variant="ghost" size="md">
            Skip — No Vehicle
          </Button>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
