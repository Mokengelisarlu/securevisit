import { View, Text } from 'react-native';
import { useState } from 'react';
import { ScreenWrapper, TextInput } from '@/src/components/ui';

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  return (
    <ScreenWrapper padX={false}>
      <View className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-black text-teal-900 mb-4">Search</Text>
        <TextInput
          placeholder="Search visitors..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
        />
      </View>
    </ScreenWrapper>
  );
}
