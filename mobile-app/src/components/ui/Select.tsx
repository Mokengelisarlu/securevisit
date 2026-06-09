import { View, Text, Pressable, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { useState } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
}

export function Select({
  label,
  placeholder = 'Select...',
  value,
  options,
  onChange,
  error,
}: SelectProps) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-sm font-semibold text-slate-700 mb-1">{label}</Text>
      ) : null}

      <Pressable
        onPress={() => setVisible(true)}
        className={`px-4 py-3 rounded-xl border bg-white flex-row items-center justify-between ${
          error ? 'border-red-400' : 'border-teal-300'
        }`}
      >
        <Text
          className={`text-lg ${selected ? 'text-slate-900' : 'text-slate-400'}`}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text className="text-slate-400 text-lg">▼</Text>
      </Pressable>

      {error ? (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      ) : null}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View className="flex-1 bg-black/40 justify-center px-6">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-2xl max-h-96 overflow-hidden">
                <View className="px-6 py-4 border-b border-slate-200">
                  <Text className="text-lg font-bold text-teal-900">
                    {label || placeholder}
                  </Text>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        onChange(item.value);
                        setVisible(false);
                      }}
                      className={`px-6 py-4 active:bg-teal-50 ${
                        value === item.value ? 'bg-teal-50' : ''
                      }`}
                    >
                      <Text
                        className={`text-lg ${
                          value === item.value
                            ? 'font-black text-teal-800'
                            : 'font-medium text-slate-700'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
