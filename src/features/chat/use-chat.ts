import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dataService } from '@/src/lib/data-service';
import type { ChatMessage } from '@/src/types/domain';

export const useChatSessions = () =>
  useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => dataService.listChatSessions(),
  });

export const useChatMessages = (sessionId: string) =>
  useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => dataService.getChatMessages(sessionId),
  });

export const useCreateChatSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mode, title }: { mode: 'text' | 'voice'; title?: string }) =>
      dataService.createChatSession(mode, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
};

export const useSendChatMessage = (sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => dataService.sendChatMessage(sessionId, content),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });

      const previousMessages =
        queryClient.getQueryData<ChatMessage[]>(['chat-messages', sessionId]) ?? [];
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(
        ['chat-messages', sessionId],
        [...previousMessages, optimisticMessage],
      );

      return { previousMessages, optimisticMessageId: optimisticMessage.id };
    },
    onError: (_error, _content, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', sessionId], context.previousMessages);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
};
