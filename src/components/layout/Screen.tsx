import { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  header?: ReactNode;
  padded?: boolean;
  backgroundColor?: string;
}>;

export const Screen = ({
  children,
  scroll = true,
  header,
  padded = true,
  backgroundColor = colors.background,
}: ScreenProps) => {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? spacing.lg : spacing.xl;

  const content = (
    <View style={[styles.content, padded && { paddingHorizontal: horizontalPadding, paddingBottom: spacing.xxxl }]}>
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});
