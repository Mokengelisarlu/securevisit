import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Extra horizontal padding (default px-6) */
  padX?: boolean;
  /** If true, wrap children in a ScrollView. Defaults to false to avoid nesting VirtualizedLists. */
  scrollable?: boolean;
}

export function ScreenWrapper({
  children,
  className = '',
  padX = true,
  scrollable = false,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View
        className={`flex-1 bg-teal-50 ${padX ? 'px-6' : ''} ${className}`}
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {scrollable ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <>{children}</>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
