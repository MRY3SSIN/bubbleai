import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/src/theme';
import type { ChatMessage } from '@/src/types/domain';

type MessageBubbleProps = {
  message: ChatMessage;
  pending?: boolean;
};

export const MessageBubble = ({ message, pending = false }: MessageBubbleProps) => {
  const isAssistant = message.role === 'assistant';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{isAssistant ? 'BubbleAI' : 'You'}</Text>
      <View
        style={[
          styles.base,
          isAssistant ? styles.assistant : styles.user,
          pending && styles.pending,
        ]}
      >
      <Text style={[styles.text, !isAssistant && styles.userText]}>{message.content}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    maxWidth: '86%',
  },
  label: {
    color: colors.inkMuted,
    marginBottom: spacing.xs,
    ...typography.caption,
  },
  base: {
    borderRadius: radii.lg,
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
  pending: {
    opacity: 0.72,
  },
  userText: {
    color: colors.white,
  },
});
