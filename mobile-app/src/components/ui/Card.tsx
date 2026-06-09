import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`bg-white rounded-2xl p-6 shadow-sm ${className}`}>
      {children}
    </View>
  );
}
