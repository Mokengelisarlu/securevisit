import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { ScreenWrapper, Card, Button, TextInput } from '@/src/components/ui';
import { useAuth } from '@/src/contexts/AuthContext';
import { useGetPublicOnSiteVisitors } from '@/src/hooks/usePublicData';
import { useCheckoutPublicVisit } from '@/src/hooks/useVisits';
import type { OnSiteVisitor } from '@/src/types/api';

export default function CheckOutScreen() {
  const { deviceToken } = useAuth();
  const {
    data: onSiteVisitors,
    isLoading,
    error,
  } = useGetPublicOnSiteVisitors(deviceToken);
  const { checkoutVisit, isLoading: isCheckingOut } =
    useCheckoutPublicVisit(deviceToken);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<OnSiteVisitor | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  const filtered = query.trim()
    ? onSiteVisitors.filter((v) => {
        const name =
          `${v.visitor.firstName} ${v.visitor.lastName}`.toLowerCase();
        const company = (v.visitor.company ?? '').toLowerCase();
        const q = query.toLowerCase();
        return name.includes(q) || company.includes(q);
      })
    : onSiteVisitors;

  async function handleCheckOut() {
    if (!selected) return;
    setSubmitError('');
    try {
      await checkoutVisit(selected.id);
      setSuccess(true);
      setTimeout(() => {
        router.replace('/(kiosk)');
      }, 1800);
    } catch (err: any) {
      setSubmitError(err?.message || 'Check-out failed. Please try again.');
    }
  }

  if (success) {
    return (
      <ScreenWrapper className="justify-center items-center">
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center">
            <Text className="text-teal-700 text-4xl font-black">OK</Text>
          </View>
          <Text className="text-3xl font-black text-teal-900 text-center">
            Checked Out
          </Text>
          <Text className="text-lg text-teal-600 text-center">
            {selected?.visitor.firstName} {selected?.visitor.lastName} has been
            checked out successfully.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padX={false}>
      <View className="px-6 pt-8 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="mb-4 self-start"
          hitSlop={12}
        >
          <Text className="text-teal-700 text-base font-semibold">← Back</Text>
        </Pressable>
        <Text className="text-3xl font-black text-teal-900">Check Out</Text>
        <Text className="text-base text-teal-600 mt-1">
          {onSiteVisitors.length > 0
            ? `${onSiteVisitors.length} visitor${onSiteVisitors.length !== 1 ? 's' : ''} currently on-site`
            : 'Find a visitor to check out'}
        </Text>
      </View>

      <View className="px-6 pb-4">
        <TextInput
          placeholder="Search by name or company..."
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setSelected(null);
          }}
          autoCapitalize="words"
        />
      </View>

      {selected ? (
        <View className="px-6 pb-4 gap-4">
          <Card className="bg-teal-50 border-2 border-teal-400">
            <View className="items-center gap-2">
              <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center mb-1">
                <Text className="text-teal-600 text-2xl font-black">
                  {selected.visitor.firstName[0]}
                  {selected.visitor.lastName[0]}
                </Text>
              </View>
              <Text className="text-xl font-black text-slate-900">
                {selected.visitor.firstName} {selected.visitor.lastName}
              </Text>
              {selected.visitor.company ? (
                <Text className="text-sm text-slate-600">
                  {selected.visitor.company}
                </Text>
              ) : null}
              <Text className="text-xs text-teal-700 font-semibold mt-1">
                Checked in: {new Date(selected.checkInAt).toLocaleTimeString()}
              </Text>
            </View>
          </Card>

          {submitError ? (
            <View className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
              <Text className="text-red-700 text-sm text-center">{submitError}</Text>
            </View>
          ) : null}

          <View className="gap-3">
            <Button
              onPress={handleCheckOut}
              loading={isCheckingOut}
              disabled={isCheckingOut}
              size="lg"
              variant="primary"
            >
              Confirm Check-Out
            </Button>
            <Button
              onPress={() => setSelected(null)}
              variant="ghost"
              size="md"
            >
              Cancel
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-1 px-6">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#0F766E" size="large" />
              <Text className="text-teal-700 mt-3">Loading on-site visitors...</Text>
            </View>
          ) : error ? (
            <Card className="items-center py-6">
              <Text className="text-red-500 text-center">{error}</Text>
            </Card>
          ) : filtered.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl font-black text-teal-400 mb-3">0</Text>
              <Text className="text-slate-600 text-center text-base">
                {query
                  ? `No on-site visitors matching "${query}"`
                  : 'No visitors currently on-site'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelected(item)}
                  className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 active:bg-teal-50 active:border-teal-400"
                >
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-full bg-teal-100 items-center justify-center">
                      <Text className="text-teal-600 text-lg font-black">
                        {item.visitor.firstName[0]}
                        {item.visitor.lastName[0]}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-900">
                        {item.visitor.firstName} {item.visitor.lastName}
                      </Text>
                      {item.visitor.company ? (
                        <Text className="text-sm text-slate-500">
                          {item.visitor.company}
                        </Text>
                      ) : null}
                      <Text className="text-xs text-teal-600 mt-0.5">
                        In since{' '}
                        {new Date(item.checkInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View className="bg-teal-100 rounded-full px-3 py-1">
                      <Text className="text-teal-700 text-xs font-bold">
                        Check Out
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}
