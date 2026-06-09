import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Text,
} from 'react-native';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function TextInput({
  label,
  error,
  containerClassName = '',
  className = '',
  ...props
}: TextInputProps) {
  return (
    <View className={`gap-1 ${containerClassName}`}>
      {label ? (
        <Text className="text-sm font-semibold text-slate-700 mb-1">{label}</Text>
      ) : null}
      <RNTextInput
        className={`px-4 py-3 text-lg rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 ${
          error ? 'border-red-400' : 'border-teal-300'
        } ${className}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error ? (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
