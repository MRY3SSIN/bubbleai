import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type BubbleComposerProps = {
  placeholder?: string;
  onSubmit: (value: string) => void;
  onVoicePress?: () => void;
};

export const BubbleComposer = ({
  placeholder = 'Start chatting with AI...',
  onSubmit,
  onVoicePress,
}: BubbleComposerProps) => {
  const [value, setValue] = useState('');
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <View style={[styles.row, isCompact && styles.rowCompact]}>
      <Pressable style={[styles.plus, isCompact && styles.plusCompact]}>
        <Feather color={colors.inkMuted} name="plus" size={22} />
      </Pressable>
      <View style={[styles.inputWrap, isCompact && styles.inputWrapCompact]}>
        <TextInput
          onChangeText={setValue}
          onSubmitEditing={() => {
            if (value.trim()) {
              onSubmit(value.trim());
              setValue('');
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted}
          style={[styles.input, isCompact && styles.inputCompact]}
          value={value}
        />
      </View>
      <Pressable onPress={onVoicePress} style={[styles.voice, isCompact && styles.voiceCompact]}>
        <Feather color={colors.white} name="mic" size={18} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowCompact: {
    gap: spacing.xs,
  },
  plus: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  plusCompact: {
    width: 24,
  },
  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  inputWrapCompact: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.ink,
    height: 52,
    ...typography.body,
  },
  inputCompact: {
    height: 48,
  },
  voice: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  voiceCompact: {
    height: 48,
    width: 48,
  },
});
