import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { dataService } from '@/src/lib/data-service';
import { detectRiskLevel } from '@/src/lib/risk';

export const useJournalEntries = () =>
  useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => dataService.listJournalEntries(),
  });

export const useJournalEntry = (entryId: string) =>
  useQuery({
    queryKey: ['journal-entry', entryId],
    queryFn: () => dataService.getJournalEntry(entryId),
  });

export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, text }: { title: string; text: string }) =>
      dataService.createJournalEntry({
        title,
        text,
        summary:
          'This journal reflects your recent emotional state, recurring stressors, and what seems to help you settle.',
        themes: ['stress', 'routine'],
        riskLevel: detectRiskLevel(text),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
};

