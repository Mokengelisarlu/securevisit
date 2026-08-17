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
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/src/contexts/ApiContext';
import type { OnSiteVisitor } from '@/src/types/api';

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

interface VisitorBottomSheetProps {
  visible: boolean;
  visitor: OnSiteVisitor | null;
  onClose: () => void;
}

export default function VisitorBottomSheet({ visible, visitor, onClose }: VisitorBottomSheetProps) {
  const { apiBaseUrl } = useApi();
  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableWithoutFeedback>
            <View
              className="bg-white rounded-t-3xl"
              style={{ maxHeight: screenHeight * 0.6 }}
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

              {visitor ? (
                <View className="px-6 pb-8">
                  {/* Visitor photo / avatar */}
                  <View className="items-center mb-5">
                    {visitor.visitor.photoUrl ? (
                      <Image
                        source={{ uri: photoSrc(visitor.visitor.photoUrl, apiBaseUrl) }}
                        className="w-20 h-20 rounded-full bg-slate-200 mb-3"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center mb-3">
                        <Text className="text-teal-600 text-3xl font-black">
                          {visitor.visitor.firstName[0]}
                          {visitor.visitor.lastName[0]}
                        </Text>
                      </View>
                    )}
                    <Text className="text-xl font-black text-slate-900 text-center">
                      {visitor.visitor.firstName} {visitor.visitor.lastName}
                    </Text>
                    {visitor.visitor.company ? (
                      <Text className="text-sm text-slate-500 mt-1">{visitor.visitor.company}</Text>
                    ) : null}
                  </View>

                  {/* Info rows */}
                  <View className="gap-3 mb-5">
                    {visitor.visitor.phone ? (
                      <View className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                        <Ionicons name="call-outline" size={16} color="#0F766E" />
                        <Text className="text-sm text-slate-700">{visitor.visitor.phone}</Text>
                      </View>
                    ) : null}
                    <View className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                      <Ionicons name="time-outline" size={16} color="#0F766E" />
                      <Text className="text-sm text-slate-700">
                        Checked in at {formatTime(visitor.checkInAt)}
                      </Text>
                    </View>
                    {visitor.purpose ? (
                      <View className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                        <Ionicons name="document-text-outline" size={16} color="#0F766E" />
                        <Text className="text-sm text-slate-700" numberOfLines={2}>
                          {visitor.purpose}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Status badge */}
                  <View className="items-center">
                    <View className="bg-teal-100 rounded-full px-5 py-2">
                      <Text className="text-teal-700 text-sm font-bold">Currently On-Site</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
