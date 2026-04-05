import { useQuery } from '@tanstack/react-query';

import { dataService } from '@/src/lib/data-service';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dataService.getDashboard(),
  });

export const useRecommendations = () =>
  useQuery({
    queryKey: ['recommendations'],
    queryFn: () => dataService.listRecommendations(),
  });

