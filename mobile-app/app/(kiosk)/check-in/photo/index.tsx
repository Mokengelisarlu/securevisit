import { View, Text, Pressable, Image, Modal, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenWrapper, Card, Button } from '@/src/components/ui';
import { useVisitDraft } from '@/src/contexts/VisitDraftContext';
import { useApi } from '@/src/contexts/ApiContext';

export default function PhotoScreen() {
  const { draft, updateDraft } = useVisitDraft();
  const { kioskSettings } = useApi();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [activeMode, setActiveMode] = useState<'visitor' | 'vehicle' | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [visitorPhoto, setVisitorPhoto] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);

  async function handleCapture() {
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      if (photo?.uri) {
        if (activeMode === 'visitor') {
          setVisitorPhoto(photo.uri);
          updateDraft({ visitorPhotoUrl: photo.uri });
        } else {
          setVehiclePhoto(photo.uri);
          updateDraft({ vehiclePhotoUrl: photo.uri });
        }
      }
      setActiveMode(null);
    } catch {
      setActiveMode(null);
    } finally {
      setCapturing(false);
    }
  }

  function openCamera(mode: 'visitor' | 'vehicle') {
    setCameraReady(false);
    setCameraError(null);
    setActiveMode(mode);
  }

  function handleContinue() {
    // Sync local photo state to draft — explicitly clears any stale URLs from a previous visitor
    updateDraft({
      visitorPhotoUrl: visitorPhoto ?? undefined,
      vehiclePhotoUrl: vehiclePhoto ?? undefined,
    });
    if (kioskSettings?.requireSignature === 1) {
      router.push('/(kiosk)/check-in/signature' as any);
    } else {
      router.push('/(kiosk)/check-in/review' as any);
    }
  }

  if (!permission) {
    return (
      <ScreenWrapper className="justify-center items-center">
        <Text className="text-slate-600 text-lg">Requesting camera permission...</Text>
      </ScreenWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenWrapper className="justify-center items-center px-6">
        <Text className="text-lg text-teal-900 font-bold text-center mb-4">
          Camera Access Required
        </Text>
        <Text className="text-base text-slate-600 text-center mb-6">
          Photos are optional. You can skip this step.
        </Text>
        <View className="gap-3">
          <Button onPress={requestPermission} size="lg">
            Grant Permission
          </Button>
          <Button onPress={handleContinue} variant="ghost" size="md">
            Skip Photos
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padX={false}>
      <View className="flex-1 px-6">
        <View className="pt-8 pb-6">
          <Pressable
            onPress={() => router.back()}
            className="mb-4 self-start"
            hitSlop={12}
          >
            <Text className="text-teal-700 text-base font-semibold">← Back</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">Photos</Text>
          <Text className="text-base text-teal-600 mt-1">
            Capture visitor and vehicle photos
          </Text>
        </View>

        <View className="gap-4 flex-1">
          {kioskSettings?.requireVisitorPhoto === 1 ? (
            <Card>
              <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">
                Visitor Photo
              </Text>
              {visitorPhoto ? (
                <View className="gap-3">
                  <Image
                    source={{ uri: visitorPhoto }}
                    className="w-full h-48 rounded-xl bg-slate-200"
                    resizeMode="cover"
                  />
                  <Button
                    onPress={() => openCamera('visitor')}
                    variant="ghost"
                    size="sm"
                  >
                    Retake
                  </Button>
                </View>
              ) : (
                <Button
                  onPress={() => openCamera('visitor')}
                  variant="secondary"
                  size="md"
                >
                  Take Visitor Photo
                </Button>
              )}
            </Card>
          ) : null}

          {draft.vehicle && kioskSettings?.requireVehiclePhoto === 1 ? (
            <Card>
              <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">
                Vehicle Photo
              </Text>
              {vehiclePhoto ? (
                <View className="gap-3">
                  <Image
                    source={{ uri: vehiclePhoto }}
                    className="w-full h-48 rounded-xl bg-slate-200"
                    resizeMode="cover"
                  />
                  <Button
                    onPress={() => openCamera('vehicle')}
                    variant="ghost"
                    size="sm"
                  >
                    Retake
                  </Button>
                </View>
              ) : (
                <Button
                  onPress={() => openCamera('vehicle')}
                  variant="secondary"
                  size="md"
                >
                  Take Vehicle Photo
                </Button>
              )}
            </Card>
          ) : null}
        </View>

        <View className="pb-6">
          <Button onPress={handleContinue} size="lg">
            Continue
          </Button>
        </View>
      </View>

      <Modal
        visible={activeMode !== null}
        animationType="slide"
        onRequestClose={() => setActiveMode(null)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            mode="picture"
            onCameraReady={() => setCameraReady(true)}
            onMountError={(e) => setCameraError(e.message)}
          >
            <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 64 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                  {activeMode === 'visitor' ? 'Visitor Photo' : 'Vehicle Photo'}
                </Text>
                {cameraError ? (
                  <Text style={{ color: '#f87171', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                    {cameraError}
                  </Text>
                ) : null}
              </View>

              {!cameraReady && !cameraError ? (
                <View style={{ alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 14, marginTop: 12 }}>Initializing camera...</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: 24 }}>
                  <Pressable
                    onPress={handleCapture}
                    disabled={capturing}
                    style={({ pressed }: any) => ({
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: 4,
                      borderColor: '#fff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    {capturing ? (
                      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    ) : (
                      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' }} />
                    )}
                  </Pressable>
                </View>
              )}

              <Pressable
                onPress={() => setActiveMode(null)}
                style={({ pressed }: any) => ({
                  alignSelf: 'center',
                  backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                })}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
            </View>
          </CameraView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
