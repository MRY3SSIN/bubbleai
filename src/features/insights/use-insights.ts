import { useQuery } from '@tanstack/react-query';

import { dataService } from '@/src/lib/data-service';

export const useInsights = () =>
  useQuery({
    queryKey: ['insights'],
    queryFn: () => dataService.listInsights(),
  });

export const useAnalyticsDetail = (
  metric: string,
  period: 'week' | 'month' | '6_month' | 'year',
) =>
  useQuery({
    queryKey: ['analytics', metric, period],
    queryFn: () => dataService.getAnalytics(metric, period),
  });
