import { useQuery } from '@tanstack/react-query';

import { useAppStore } from '@/src/lib/app-store';
import { dataService } from '@/src/lib/data-service';

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: async () => useAppStore.getState().profile,
  });

export const useNotificationSettings = () =>
  useQuery({
    queryKey: ['notification-settings'],
    queryFn: () => dataService.getNotificationSettings(),
  });

