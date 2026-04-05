import { useQuery } from '@tanstack/react-query';

import { dataService } from '@/src/lib/data-service';

export const useInsights = () =>
  useQuery({
    queryKey: ['insights'],
    queryFn: () => dataService.listInsights(),
  });

export const useAnalyticsDetail = (metric: string) =>
  useQuery({
    queryKey: ['analytics', metric],
    queryFn: () => dataService.getAnalytics(metric),
  });

