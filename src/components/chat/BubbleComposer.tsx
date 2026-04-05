import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

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

  return (
    <View style={styles.row}>
      <Pressable style={styles.plus}>
        <Feather color={colors.inkMuted} name="plus" size={22} />
      </Pressable>
      <View style={styles.inputWrap}>
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
          style={styles.input}
          value={value}
        />
      </View>
      <Pressable onPress={onVoicePress} style={styles.voice}>
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
  plus: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  inputWrap: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  input: {
    color: colors.ink,
    height: 52,
    ...typography.body,
  },
  voice: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
});

