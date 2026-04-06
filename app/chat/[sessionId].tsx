import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BubbleComposer } from '@/src/components/chat/BubbleComposer';
import { MessageBubble } from '@/src/components/chat/MessageBubble';
import { TypingBubble } from '@/src/components/chat/TypingBubble';
import { RiskBanner } from '@/src/components/feedback/RiskBanner';
import { BackHeader } from '@/src/components/layout/BackHeader';
import { Screen } from '@/src/components/layout/Screen';
import { useChatMessages, useSendChatMessage } from '@/src/features/chat/use-chat';
import { colors, spacing, typography } from '@/src/theme';

export default function ChatSessionScreen() {
  const router = useRouter();
  const { sessionId, initialMessage } = useLocalSearchParams<{
    sessionId: string;
    initialMessage?: string;
  }>();
  const { data: messages } = useChatMessages(sessionId);
  const sendMessage = useSendChatMessage(sessionId);
  const [isTyping, setIsTyping] = useState(false);
  const initialMessageHandled = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const latestRisk = useMemo(
    () => [...(messages ?? [])].reverse().find((message) => message.riskLevel)?.riskLevel,
    [messages],
  );

  useEffect(() => {
    if (initialMessageHandled.current) {
      return;
    }

    const nextInitialMessage = typeof initialMessage === 'string' ? initialMessage : '';

    if (nextInitialMessage.trim()) {
      initialMessageHandled.current = true;
      sendMessage.mutate(nextInitialMessage.trim());
    }
  }, [initialMessage, sendMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timer);
  }, [messages, sendMessage.isPending]);

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
      <ScrollView
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        {messages?.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {sendMessage.isPending ? <TypingBubble /> : null}
      </ScrollView>
      <BubbleComposer
        onSubmit={(value) => sendMessage.mutate(value)}
        onTypingChange={setIsTyping}
        onVoicePress={() => router.push(`/voice/${sessionId}` as never)}
      />
      {isTyping && !sendMessage.isPending ? <Text style={styles.pending}>You’re typing…</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  messages: {
    flexGrow: 1,
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
  },
  pending: {
    color: colors.inkMuted,
    marginTop: spacing.sm,
    ...typography.caption,
  },
});
