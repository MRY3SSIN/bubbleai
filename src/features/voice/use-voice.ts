import { useMutation, useQuery } from '@tanstack/react-query';

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

