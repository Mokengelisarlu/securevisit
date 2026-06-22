import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { ScreenWrapper, Card, Button } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useVisitDraft } from '@/src/contexts/VisitDraftContext';
import { useCreatePublicVisit } from '@/src/hooks/useVisits';
import { uploadFile } from '@/src/api/client';

function isLocalFileUri(uri?: string | null) {
  return !!uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('blob:'));
}

export default function ReviewScreen() {
  const { deviceToken } = useAuth();
  const { draft, resetDraft } = useVisitDraft();
  const { tenantSlug, apiBaseUrl } = useApi();
  const { createVisit, isLoading } = useCreatePublicVisit(deviceToken);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  async function uploadMediaIfNeeded(
    mediaUri: string | undefined,
    filename: string
  ): Promise<string | undefined> {
    if (!mediaUri || !isLocalFileUri(mediaUri)) {
      return mediaUri;
    }

    if (!deviceToken) {
      throw new Error('Device not paired');
    }

    const response = await uploadFile(
      `/api/tenants/${tenantSlug}/upload?filename=${encodeURIComponent(filename)}`,
      mediaUri,
      filename,
      deviceToken,
      (progress) => setUploadProgress(progress),
      apiBaseUrl
    );

    return response?.url || mediaUri;
  }

  async function handleSubmit() {
    setError('');
    setUploadProgress(0);

    try {
      const visitorPhotoUrl = await uploadMediaIfNeeded(
        draft.visitorPhotoUrl,
        `visitor-${Date.now()}.jpg`
      );
      const vehiclePhotoUrl = await uploadMediaIfNeeded(
        draft.vehiclePhotoUrl,
        `vehicle-${Date.now()}.jpg`
      );
      const signatureData = await uploadMediaIfNeeded(
        draft.signatureData,
        `signature-${Date.now()}.png`
      );

      await createVisit({
        newVisitor: {
          firstName: draft.firstName!,
          lastName: draft.lastName!,
          phone: draft.phone,
          company: draft.company,
          visitorTypeId: draft.visitorTypeId!,
        },
        hostId: draft.hostId,
        departmentId: draft.departmentId,
        purpose: draft.purpose,
        ...(draft.vehicle
          ? {
              vehicle: {
                plateNumber: draft.vehicle.plateNumber,
                type: draft.vehicle.type,
                brand: draft.vehicle.brand,
                color: draft.vehicle.color,
              },
              passengerCount: draft.vehicle.passengerCount,
            }
          : {}),
        visitorPhotoUrl,
        vehiclePhotoUrl,
        signatureData,
      } as any);
      setSuccess(true);
      setTimeout(() => {
        resetDraft();
        router.replace('/(kiosk)');
      }, 1800);
    } catch (err: any) {
      setError(err?.message || 'Check-in failed. Please try again.');
    } finally {
      setUploadProgress(null);
    }
  }

  if (success) {
    return (
      <ScreenWrapper className="justify-center items-center">
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center">
            <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 13l4 4L19 7"
                stroke="#0F766E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text className="text-3xl font-black text-teal-900 text-center">
            Checked In
          </Text>
          <Text className="text-lg text-teal-600 text-center">
            {draft.firstName} {draft.lastName} has been checked in successfully.
          </Text>
        </View>
      </ScreenWrapper>
    );
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
          <Text className="text-3xl font-black text-teal-900">Review</Text>
          <Text className="text-base text-teal-600 mt-1">
            Confirm the details before check-in
          </Text>
        </View>

        <Card className="mb-4">
          <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">
            Visitor
          </Text>
          <Text className="text-lg font-bold text-slate-900">
            {draft.firstName} {draft.lastName}
          </Text>
          {draft.company ? (
            <Text className="text-sm text-slate-500 mt-1">{draft.company}</Text>
          ) : null}
          {draft.phone ? (
            <Text className="text-sm text-slate-500">{draft.phone}</Text>
          ) : null}
        </Card>

        {draft.vehicle ? (
          <Card className="mb-4">
            <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">
              Vehicle
            </Text>
            <Text className="text-base font-bold text-slate-900">
              {draft.vehicle.plateNumber}
            </Text>
            <Text className="text-sm text-slate-500">
              {draft.vehicle.type} {draft.vehicle.brand ? `- ${draft.vehicle.brand}` : ''} {draft.vehicle.color ? `(${draft.vehicle.color})` : ''}
            </Text>
            {draft.vehicle.passengerCount ? (
              <Text className="text-sm text-slate-500">
                Passengers: {draft.vehicle.passengerCount}
              </Text>
            ) : null}
          </Card>
        ) : null}

        {draft.visitorPhotoUrl || draft.vehiclePhotoUrl ? (
          <Card className="mb-4">
            <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">
              Photos
            </Text>
            <View className="gap-3">
              {draft.visitorPhotoUrl ? (
                <View>
                  <Text className="text-xs font-semibold text-slate-500 mb-1">Visitor</Text>
                  <Image
                    source={{ uri: draft.visitorPhotoUrl }}
                    className="w-full h-40 rounded-xl bg-slate-200"
                    resizeMode="cover"
                  />
                </View>
              ) : null}
              {draft.vehiclePhotoUrl ? (
                <View>
                  <Text className="text-xs font-semibold text-slate-500 mb-1">Vehicle</Text>
                  <Image
                    source={{ uri: draft.vehiclePhotoUrl }}
                    className="w-full h-40 rounded-xl bg-slate-200"
                    resizeMode="cover"
                  />
                </View>
              ) : null}
            </View>
          </Card>
        ) : null}

        {draft.signatureData ? (
          <Card className="mb-4">
            <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">
              Signature
            </Text>
            <Image
              source={{ uri: draft.signatureData }}
              className="w-full h-24 rounded-xl bg-slate-200"
              resizeMode="contain"
            />
          </Card>
        ) : null}

        {error ? (
          <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-700 text-sm text-center">{error}</Text>
          </View>
        ) : null}

        {uploadProgress !== null ? (
          <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-slate-700 text-sm text-center">
              Uploading media: {uploadProgress}%
            </Text>
          </View>
        ) : null}

        <Button
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          size="lg"
        >
          Complete Check-In
        </Button>
      </ScrollView>
    </ScreenWrapper>
  );
}
