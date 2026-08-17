import {
  View,
  Text,
  ActivityIndicator,
  Image,
  Pressable,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import { useCheckoutPublicVisit } from '@/src/hooks/useVisits';
import type { OnSiteVisitor, Visitor } from '@/src/types/api';

function photoSrc(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('blob.vercel-storage.com')) {
    return `${baseUrl}/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isOnSiteVisitor(obj: any): obj is OnSiteVisitor {
  return obj && typeof obj === 'object' && 'visitor' in obj && 'checkInAt' in obj;
}

interface VisitorBottomSheetProps {
  visible: boolean;
  visitor: OnSiteVisitor | Visitor | null;
  onClose: () => void;
  onCheckoutComplete?: () => void;
}

export default function VisitorBottomSheet({ visible, visitor, onClose, onCheckoutComplete }: VisitorBottomSheetProps) {
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();
  const { checkoutVisit, isLoading: isCheckingOut } = useCheckoutPublicVisit(deviceToken);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  const isVisit = isOnSiteVisitor(visitor);
  const visitorData = isVisit ? visitor.visitor : visitor;
  const visitId = isVisit ? visitor.id : null;
  const checkInAt = isVisit ? visitor.checkInAt : null;
  const purpose = isVisit ? (visitor as OnSiteVisitor).purpose : null;
  const host = isVisit ? (visitor as OnSiteVisitor).host : null;

  async function handleCheckOut() {
    if (!visitId) return;
    setSubmitError('');
    try {
      await checkoutVisit(visitId);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        onCheckoutComplete?.();
      }, 1800);
    } catch (err: any) {
      setSubmitError(err?.message || 'Checkout failed');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableWithoutFeedback>
            <View
              className="bg-white rounded-t-3xl"
              style={{ maxHeight: screenHeight * 0.7 }}
            >
              {/* Handle bar */}
              <View className="items-center pt-3 pb-2">
                <View className="w-10 h-1 rounded-full bg-slate-300" />
              </View>

              {/* Close button */}
              <View className="flex-row justify-end px-5 pb-2">
                <Pressable onPress={onClose} hitSlop={12}>
                  <Ionicons name="close-circle" size={28} color="#94a3b8" />
                </Pressable>
              </View>

              {success ? (
                <View className="items-center px-6 py-10">
                  <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mb-4">
                    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 13l4 4L19 7"
                        stroke="#0F766E"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <Text className="text-2xl font-black text-teal-900 text-center">
                    Checked Out
                  </Text>
                  <Text className="text-sm text-teal-600 mt-2 text-center">
                    {visitorData?.firstName} {visitorData?.lastName} has been checked out.
                  </Text>
                </View>
              ) : visitorData ? (
                <View className="px-6 pb-8">
                  {/* Visitor photo / avatar */}
                  <View className="items-center mb-5">
                    {visitorData.photoUrl ? (
                      <Image
                        source={{ uri: photoSrc(visitorData.photoUrl, apiBaseUrl) }}
                        className="w-20 h-20 rounded-full bg-slate-200 mb-3"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center mb-3">
                        <Text className="text-teal-600 text-3xl font-black">
                          {visitorData.firstName[0]}
                          {visitorData.lastName[0]}
                        </Text>
                      </View>
                    )}
                    <Text className="text-xl font-black text-slate-900 text-center">
                      {visitorData.firstName} {visitorData.lastName}
                    </Text>
                    {visitorData.company ? (
                      <Text className="text-sm text-slate-500 mt-1">{visitorData.company}</Text>
                    ) : null}
                  </View>

                  {/* Info rows */}
                  <View className="gap-3 mb-5">
                    {visitorData.phone ? (
                      <View className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                        <Ionicons name="call-outline" size={16} color="#0F766E" />
                        <Text className="text-sm text-slate-700">{visitorData.phone}</Text>
                      </View>
                    ) : null}
                    {host ? (
                      <View className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                        <Ionicons name="person-outline" size={16} color="#0F766E" />
                        <Text className="text-sm text-slate-700">
                          Host: {host.firstName} {host.lastName}
                        </Text>
                      </View>
                    ) : null}
                    {checkInAt ? (
                      <View className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                        <Ionicons name="time-outline" size={16} color="#0F766E" />
                        <Text className="text-sm text-slate-700">
                          Checked in at {formatTime(checkInAt)}
                        </Text>
                      </View>
                    ) : null}
                    {purpose ? (
                      <View className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                        <Ionicons name="document-text-outline" size={16} color="#0F766E" />
                        <Text className="text-sm text-slate-700" numberOfLines={2}>
                          {purpose}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Error */}
                  {submitError ? (
                    <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-4">
                      <Text className="text-red-700 text-sm text-center">{submitError}</Text>
                    </View>
                  ) : null}

                  {/* Checkout button — only for on-site visitors */}
                  {visitId ? (
                    <Pressable
                      onPress={handleCheckOut}
                      disabled={isCheckingOut}
                      className="bg-teal-700 rounded-2xl py-4 active:bg-teal-800 items-center"
                    >
                      {isCheckingOut ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white text-lg font-black">Check Out</Text>
                      )}
                    </Pressable>
                  ) : visitorData.isOnSite ? (
                    <View className="items-center">
                      <View className="bg-teal-100 rounded-full px-5 py-2">
                        <Text className="text-teal-700 text-sm font-bold">Currently On-Site</Text>
                      </View>
                    </View>
                  ) : (
                    <View className="items-center">
                      <View className="bg-slate-100 rounded-full px-5 py-2">
                        <Text className="text-slate-700 text-sm font-bold">Off-Site</Text>
                      </View>
                    </View>
                  )}
                </View>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
