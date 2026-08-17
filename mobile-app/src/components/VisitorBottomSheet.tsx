import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  Pressable,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { useApi } from '@/src/contexts/ApiContext';
import {
  useGetPublicVisitorDetail,
  useGetPublicVisitHistory,
} from '@/src/hooks/usePublicData';
import type { VisitHistoryEntry } from '@/src/types/api';

function photoSrc(url: string | undefined | null, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('blob.vercel-storage.com')) {
    return `${baseUrl}/api/blob?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'IN':
      return 'bg-teal-100';
    case 'OUT':
      return 'bg-slate-100';
    case 'SCHEDULED':
      return 'bg-blue-100';
    case 'CANCELLED':
      return 'bg-red-100';
    default:
      return 'bg-slate-100';
  }
}

function getStatusTextClasses(status: string) {
  switch (status) {
    case 'IN':
      return 'text-teal-700';
    case 'OUT':
      return 'text-slate-700';
    case 'SCHEDULED':
      return 'text-blue-700';
    case 'CANCELLED':
      return 'text-red-700';
    default:
      return 'text-slate-700';
  }
}

interface VisitorBottomSheetProps {
  visible: boolean;
  visitorId: string | null;
  onClose: () => void;
}

export default function VisitorBottomSheet({ visible, visitorId, onClose }: VisitorBottomSheetProps) {
  const { deviceToken } = useAuth();
  const { apiBaseUrl } = useApi();

  const {
    data: visitor,
    isLoading: isLoadingVisitor,
    error: visitorError,
    fetchVisitor,
  } = useGetPublicVisitorDetail(deviceToken);

  const {
    data: history,
    isLoading: isLoadingHistory,
    fetchHistory,
  } = useGetPublicVisitHistory(deviceToken);

  useEffect(() => {
    if (visible && visitorId) {
      fetchVisitor(visitorId);
      fetchHistory(visitorId);
    }
  }, [visible, visitorId]);

  const screenHeight = Dimensions.get('window').height;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableWithoutFeedback>
            <View
              className="bg-white rounded-t-3xl"
              style={{ maxHeight: screenHeight * 0.75 }}
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

              {isLoadingVisitor && !visitor ? (
                <View className="items-center py-12">
                  <ActivityIndicator color="#0F766E" size="large" />
                </View>
              ) : visitorError && !visitor ? (
                <View className="px-6 pb-8 items-center">
                  <Text className="text-red-500 text-center mb-3">{visitorError}</Text>
                  <Pressable
                    onPress={() => {
                      if (visitorId) {
                        fetchVisitor(visitorId);
                        fetchHistory(visitorId);
                      }
                    }}
                    className="bg-teal-600 rounded-xl px-6 py-2 active:bg-teal-700"
                  >
                    <Text className="text-white font-bold text-sm">Retry</Text>
                  </Pressable>
                </View>
              ) : visitor ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 24 }}
                >
                  {/* Visitor info */}
                  <View className="items-center mb-6">
                    {visitor.photoUrl ? (
                      <Image
                        source={{ uri: photoSrc(visitor.photoUrl, apiBaseUrl) }}
                        className="w-20 h-20 rounded-full bg-slate-200 mb-3"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center mb-3">
                        <Text className="text-teal-600 text-3xl font-black">
                          {visitor.firstName[0]}
                          {visitor.lastName[0]}
                        </Text>
                      </View>
                    )}
                    <Text className="text-xl font-black text-slate-900 text-center">
                      {visitor.firstName} {visitor.lastName}
                    </Text>
                    {visitor.company ? (
                      <Text className="text-sm text-slate-500 mt-1">{visitor.company}</Text>
                    ) : null}
                    <View className="flex-row items-center gap-3 mt-2">
                      {visitor.visitorTypeName ? (
                        <View className="bg-slate-100 rounded-full px-3 py-1">
                          <Text className="text-xs font-bold text-slate-700">
                            {visitor.visitorTypeName}
                          </Text>
                        </View>
                      ) : null}
                      <View
                        className={`rounded-full px-3 py-1 ${
                          visitor.isOnSite ? 'bg-teal-100' : 'bg-slate-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            visitor.isOnSite ? 'text-teal-700' : 'text-slate-700'
                          }`}
                        >
                          {visitor.isOnSite ? 'On-Site' : 'Off-Site'}
                        </Text>
                      </View>
                    </View>
                    {visitor.phone ? (
                      <View className="flex-row items-center gap-1.5 mt-2">
                        <Ionicons name="call-outline" size={13} color="#64748b" />
                        <Text className="text-sm text-slate-600">{visitor.phone}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Visit History */}
                  <Text className="text-base font-black text-teal-900 mb-3">
                    Visit History ({history.length})
                  </Text>
                  {isLoadingHistory ? (
                    <View className="items-center py-6">
                      <ActivityIndicator color="#0F766E" size="small" />
                    </View>
                  ) : history.length === 0 ? (
                    <View className="bg-slate-50 rounded-2xl p-5 items-center">
                      <Text className="text-slate-400 text-center">No visit history yet</Text>
                    </View>
                  ) : (
                    history.map((entry: VisitHistoryEntry) => (
                      <View
                        key={entry.id}
                        className="bg-slate-50 rounded-2xl p-4 mb-2 border border-slate-100"
                      >
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-sm font-bold text-slate-900">
                            {entry.visitNumber || entry.id.slice(0, 12)}
                          </Text>
                          <View className={`rounded-full px-2.5 py-0.5 ${getStatusBadgeClasses(entry.status)}`}>
                            <Text className={`text-xs font-bold ${getStatusTextClasses(entry.status)}`}>
                              {entry.status}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                          <Ionicons name="calendar-outline" size={11} color="#64748b" />
                          <Text className="text-xs text-slate-500">
                            {formatDate(entry.visitDate)}
                            {entry.host
                              ? ` • ${entry.host.firstName} ${entry.host.lastName}`
                              : ''}
                          </Text>
                        </View>
                        {entry.purpose ? (
                          <Text className="text-xs text-slate-400 mt-1" numberOfLines={1}>
                            {entry.purpose}
                          </Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </ScrollView>
              ) : null}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
