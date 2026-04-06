import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dataService } from '@/src/lib/data-service';

export const useVoicePreview = () =>
  useQuery({
    queryKey: ['voice-preview'],
    queryFn: () => dataService.getVoiceTranscriptPreview(),
  });

export const useCreateVoiceSession = () =>
  useMutation({
    mutationFn: () => dataService.createChatSession('voice', 'Live voice chat'),
  });

export const useSendVoiceMessage = (sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (audioUri: string) => dataService.sendVoiceMessage(sessionId, audioUri),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
};
