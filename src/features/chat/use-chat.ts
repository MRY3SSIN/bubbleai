import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dataService } from '@/src/lib/data-service';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
};

