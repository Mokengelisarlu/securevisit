import { View, Text, Pressable, Image, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenWrapper, Card, Button } from '@/src/components/ui';
import { useVisitDraft } from '@/src/contexts/VisitDraftContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useTranslation } from 'react-i18next';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAMERA_SIZE = SCREEN_WIDTH - 48;
const GUIDE_WIDTH = CAMERA_SIZE * 0.5;
const GUIDE_HEIGHT = CAMERA_SIZE * 0.65;

export default function PhotoScreen() {
  const { draft, updateDraft } = useVisitDraft();
  const { kioskSettings } = useApi();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [activeMode, setActiveMode] = useState<'visitor' | 'vehicle' | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { t } = useTranslation();
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
    setFacing(mode === 'visitor' ? 'front' : 'back');
  }

  function handleContinue() {
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
        <Text className="text-slate-600 text-lg">{t('common.loading')}</Text>
      </ScreenWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenWrapper className="justify-center items-center px-6">
        <Text className="text-lg text-teal-900 font-bold text-center mb-4">
          {t('photo.titleVisitor')}
        </Text>
        <Text className="text-base text-slate-600 text-center mb-6">
          Photos are optional. You can skip this step.
        </Text>
        <View className="gap-3">
          <Button onPress={requestPermission} size="lg">
            {t('common.continue')}
          </Button>
          <Button onPress={handleContinue} variant="ghost" size="md">
            {t('common.skip')}
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
            <Text className="text-teal-700 text-base font-semibold">{t('common.back')}</Text>
          </Pressable>
          <Text className="text-3xl font-black text-teal-900">{t('photo.titleVisitor')}</Text>
          <Text className="text-base text-teal-600 mt-1">
            Capture visitor and vehicle photos
          </Text>
        </View>

        <View className="gap-4 flex-1">
          {kioskSettings?.requireVisitorPhoto === 1 ? (
            <Card>
              <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">
                {t('photo.titleVisitor')}
              </Text>
              {visitorPhoto ? (
                <View className="gap-3">
                  <Image
                    source={{ uri: visitorPhoto }}
                    className="w-full aspect-square rounded-xl bg-slate-200"
                    resizeMode="cover"
                  />
                  <Button
                    onPress={() => openCamera('visitor')}
                    variant="ghost"
                    size="sm"
                  >
                    {t('photo.retakePhoto')}
                  </Button>
                </View>
              ) : (
                <Button
                  onPress={() => openCamera('visitor')}
                  variant="secondary"
                  size="md"
                >
                  {t('photo.titleVisitor')}
                </Button>
              )}
            </Card>
          ) : null}

          {draft.vehicle && kioskSettings?.requireVehiclePhoto === 1 ? (
            <Card>
              <Text className="text-sm font-bold text-teal-700 uppercase tracking-wide mb-3">
                {t('photo.titleVehicle')}
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
                    {t('photo.retakePhoto')}
                  </Button>
                </View>
              ) : (
                <Button
                  onPress={() => openCamera('vehicle')}
                  variant="secondary"
                  size="md"
                >
                  {t('photo.titleVehicle')}
                </Button>
              )}
            </Card>
          ) : null}
        </View>

        <View className="pb-6">
          <Button onPress={handleContinue} size="lg">
            {t('common.continue')}
          </Button>
        </View>
      </View>

      <Modal
        visible={activeMode !== null}
        animationType="slide"
        onRequestClose={() => setActiveMode(null)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Camera area */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: CAMERA_SIZE, height: CAMERA_SIZE }}>
              <CameraView
                ref={cameraRef}
                style={{ width: '100%', height: '100%' }}
                facing={facing}
                mode="picture"
                onCameraReady={() => setCameraReady(true)}
                onMountError={(e) => setCameraError(e.message)}
              />
              {/* Head positioning guide */}
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                pointerEvents="none"
              >
                <View
                  style={{
                    width: GUIDE_WIDTH,
                    height: GUIDE_HEIGHT,
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.5)',
                    borderRadius: 12,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Controls section */}
          <View style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 20 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
              {activeMode === 'visitor' ? t('photo.titleVisitor') : t('photo.titleVehicle')}
            </Text>

            {cameraError ? (
              <Text style={{ color: '#f87171', fontSize: 14, textAlign: 'center' }}>{cameraError}</Text>
            ) : null}

            {!cameraReady && !cameraError ? (
              <View style={{ alignItems: 'center', gap: 12 }}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14 }}>{t('common.loading')}</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40 }}>
                <Pressable
                  onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{t('photo.flipCamera')}</Text>
                </Pressable>
                <Pressable
                  onPress={handleCapture}
                  disabled={capturing}
                  style={({ pressed }: any) => ({
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    borderWidth: 4,
                    borderColor: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  {capturing ? (
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
                  ) : (
                    <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' }} />
                  )}
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => setActiveMode(null)}
              style={({ pressed }: any) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 12,
              })}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{t('photo.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
