import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BubbleComposer } from '@/src/components/chat/BubbleComposer';
import { MessageBubble } from '@/src/components/chat/MessageBubble';
import { RiskBanner } from '@/src/components/feedback/RiskBanner';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useChatMessages, useSendChatMessage } from '@/src/features/chat/use-chat';
import { colors, spacing, typography } from '@/src/theme';

export default function ChatSessionScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { data: messages } = useChatMessages(sessionId);
  const sendMessage = useSendChatMessage(sessionId);

  const latestRisk = useMemo(
    () => [...(messages ?? [])].reverse().find((message) => message.riskLevel)?.riskLevel,
    [messages],
  );

  return (
    <Screen>
      <BackHeader title="BubbleAI chat" />
      {latestRisk && latestRisk !== 'green' ? (
        <RiskBanner
          description="BubbleAI is focusing on safety and human support first in this conversation."
          level={latestRisk}
          title={latestRisk === 'red' ? 'Immediate safety support' : 'Extra support mode'}
        />
      ) : null}
      <View style={styles.messages}>
        {messages?.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </View>
      <BubbleComposer onSubmit={(value) => sendMessage.mutate(value)} onVoicePress={() => router.push(`/voice/${sessionId}` as never)} />
      {sendMessage.isPending ? <Text style={styles.pending}>BubbleAI is typing...</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  messages: {
    flex: 1,
    marginBottom: spacing.xl,
  },
  pending: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.caption,
  },
});

