import { Pressable, Text, ActivityIndicator } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  children: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-teal-600 active:bg-teal-700',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-teal-100 active:bg-teal-200',
    text: 'text-teal-900',
  },
  ghost: {
    container: 'bg-transparent border border-teal-600 active:bg-teal-50',
    text: 'text-teal-700',
  },
  danger: {
    container: 'bg-red-500 active:bg-red-600',
    text: 'text-white',
  },
};

const sizeClasses: Record<Size, { container: string; text: string }> = {
  sm: { container: 'py-2 px-4 rounded-lg', text: 'text-sm font-semibold' },
  md: { container: 'py-3 px-6 rounded-xl', text: 'text-base font-bold' },
  lg: { container: 'py-4 px-8 rounded-2xl', text: 'text-lg font-black' },
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const { container: variantContainer, text: variantText } = variantClasses[variant];
  const { container: sizeContainer, text: sizeText } = sizeClasses[size];
  const disabledClass = disabled || loading ? 'opacity-50' : '';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`items-center justify-center ${variantContainer} ${sizeContainer} ${disabledClass} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#0F766E'}
        />
      ) : (
        <Text className={`${variantText} ${sizeText}`}>{children}</Text>
      )}
    </Pressable>
  );
}
