import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';

type BubbleComposerProps = {
  placeholder?: string;
  onSubmit: (value: string) => void;
  onVoicePress?: () => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
};

export const BubbleComposer = ({
  placeholder = 'Start chatting with AI...',
  onSubmit,
  onVoicePress,
  onTypingChange,
  disabled = false,
}: BubbleComposerProps) => {
  const [value, setValue] = useState('');
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const resolvedPlaceholder = isCompact ? 'Start chatting...' : placeholder;
  const hasValue = value.trim().length > 0;

  const submit = () => {
    if (!hasValue || disabled) {
      return;
    }

    const nextValue = value.trim();
    onSubmit(nextValue);
    setValue('');
    onTypingChange?.(false);
  };

  return (
    <View style={[styles.row, isCompact && styles.rowCompact]}>
      <Pressable style={[styles.plus, isCompact && styles.plusCompact]}>
        <Feather color={colors.inkMuted} name="plus" size={22} />
      </Pressable>
      <View style={[styles.inputWrap, isCompact && styles.inputWrapCompact]}>
        <TextInput
          editable={!disabled}
          onChangeText={(nextValue) => {
            setValue(nextValue);
            onTypingChange?.(nextValue.trim().length > 0);
          }}
          onSubmitEditing={submit}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={colors.inkMuted}
          style={[styles.input, isCompact && styles.inputCompact]}
          value={value}
        />
      </View>
      <Pressable
        disabled={disabled}
        onPress={hasValue ? submit : onVoicePress}
        style={[styles.voice, isCompact && styles.voiceCompact, disabled && styles.voiceDisabled]}
      >
        <Feather color={colors.white} name={hasValue ? 'arrow-up' : 'mic'} size={18} />
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
  voiceDisabled: {
    opacity: 0.6,
  },
});
