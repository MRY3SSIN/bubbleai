import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';
import type { ChatMessage } from '@/src/types/domain';

type MessageBubbleProps = {
  message: ChatMessage;
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isAssistant = message.role === 'assistant';

  return (
    <View style={[styles.base, isAssistant ? styles.assistant : styles.user]}>
      <Text style={[styles.text, !isAssistant && styles.userText]}>{message.content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    maxWidth: '86%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardStrong,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: colors.mint,
  },
  text: {
    color: colors.ink,
    ...typography.body,
  },
  userText: {
    color: colors.white,
  },
});

