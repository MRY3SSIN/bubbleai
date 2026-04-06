import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BubbleLogo } from '@/src/components/brand/BubbleLogo';
import { BubbleComposer } from '@/src/components/chat/BubbleComposer';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useCreateChatSession } from '@/src/features/chat/use-chat';
import { colors, radii, spacing, typography } from '@/src/theme';

const suggestions = ['I feel overwhelmed', 'Help me settle tonight', 'Give me a tiny routine'];

export default function NewChatScreen() {
  const router = useRouter();
  const createSession = useCreateChatSession();
  const [sending, setSending] = useState(false);

  const startChat = async (content: string) => {
    try {
      setSending(true);
      const session = await createSession.mutateAsync({ mode: 'text', title: content.slice(0, 28) });
      router.replace(
        {
          pathname: '/chat/[sessionId]',
          params: { sessionId: session.id, initialMessage: content },
        } as never,
      );
    } catch (error) {
      Alert.alert('Unable to start chat', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <BackHeader title="New Chat" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>BubbleAI</Text>
        <Text style={styles.title}>Break the Bubble. How can I assist you?</Text>
        <BubbleLogo size={160} />
      </View>
      <View style={styles.suggestionRow}>
        {suggestions.map((suggestion) => (
          <Text key={suggestion} onPress={() => startChat(suggestion)} style={styles.chip}>
            {suggestion}
          </Text>
        ))}
      </View>
      <BubbleComposer
        disabled={sending}
        onSubmit={startChat}
        onVoicePress={async () => {
          try {
            const session = await createSession.mutateAsync({ mode: 'voice', title: 'Live voice chat' });
            router.push(`/voice/${session.id}` as never);
          } catch (error) {
            Alert.alert('Unable to start voice', error instanceof Error ? error.message : 'Try again.');
          }
        }}
      />
      {sending ? <Text style={styles.sending}>BubbleAI is warming up your conversation...</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    backgroundColor: colors.cardStrong,
    borderRadius: radii.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
    padding: spacing.xl,
  },
  eyebrow: {
    color: colors.mint,
    ...typography.label,
  },
  title: {
    color: colors.ink,
    textAlign: 'center',
    ...typography.h2,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    backgroundColor: colors.cardStrong,
    borderRadius: radii.pill,
    color: colors.ink,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.caption,
  },
  sending: {
    color: colors.inkMuted,
    marginTop: spacing.md,
    ...typography.caption,
  },
});
