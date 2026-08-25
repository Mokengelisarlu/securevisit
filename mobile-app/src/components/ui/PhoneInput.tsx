import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { TextInput } from './TextInput';

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'CD', name: 'Rép. Dém. Congo', dial: '+243', flag: '🇨🇩' },
  { code: 'CG', name: 'Rép. Congo', dial: '+242', flag: '🇨🇬' },
  { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Ouganda', dial: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzanie', dial: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
  { code: 'ZA', name: 'Afrique du Sud', dial: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
  { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroun', dial: '+237', flag: '🇨🇲' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', dial: '+226', flag: '🇧🇫' },
  { code: 'ML', name: 'Mali', dial: '+223', flag: '🇲🇱' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', dial: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dial: '+41', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'US', name: 'États-Unis', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'Royaume-Uni', dial: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Allemagne', dial: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italie', dial: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Espagne', dial: '+34', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
  { code: 'AE', name: 'Émirats arabes unis', dial: '+971', flag: '🇦🇪' },
  { code: 'CN', name: 'Chine', dial: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'Inde', dial: '+91', flag: '🇮🇳' },
  { code: 'BR', name: 'Brésil', dial: '+55', flag: '🇧🇷' },
  { code: 'JP', name: 'Japon', dial: '+81', flag: '🇯🇵' },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // CD +243
const MAX_DIGITS = 9;

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  onCountryChange?: (dial: string) => void;
  error?: string;
}

export function PhoneInput({ label, value, onChangeText, onCountryChange, error }: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [modalVisible, setModalVisible] = useState(false);

  function handleChangeDigit(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, MAX_DIGITS);
    onChangeText(digits);
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setModalVisible(false);
    onCountryChange?.(c.dial);
  }

  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-sm font-semibold text-slate-700 mb-1">{label}</Text>
      ) : null}

      <View className={`flex-row rounded-xl border bg-white ${error ? 'border-red-400' : 'border-teal-300'}`}>
        <Pressable
          onPress={() => setModalVisible(true)}
          className="px-3 py-3 border-r border-teal-200 flex-row items-center"
        >
          <Text className="text-lg mr-1">{country.flag}</Text>
          <Text className="text-sm font-semibold text-slate-700">{country.dial}</Text>
        </Pressable>

        <TextInput
          className="flex-1 border-0"
          placeholder="000 000 000"
          value={value}
          onChangeText={handleChangeDigit}
          keyboardType="phone-pad"
          maxLength={MAX_DIGITS}
          error={undefined}
        />
      </View>

      {error ? (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-2xl max-h-[70%] overflow-hidden">
            <View className="px-6 py-4 border-b border-slate-200">
              <Text className="text-lg font-bold text-teal-900">Choisir un pays</Text>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleCountrySelect(item)}
                  className={`px-6 py-3 flex-row items-center gap-3 active:bg-teal-50 ${
                    country.code === item.code ? 'bg-teal-50' : ''
                  }`}
                >
                  <Text className="text-2xl">{item.flag}</Text>
                  <Text className="text-base font-medium text-slate-700 flex-1">{item.name}</Text>
                  <Text className="text-sm font-semibold text-slate-500">{item.dial}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export { COUNTRIES };
export type { Country };
