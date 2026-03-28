import { useQueries } from '@tanstack/react-query';
import { getAllPins, getRecentActivity } from '../../services/dashboardService';
import { getWalkRoutes } from '../../services/walkService';

const DASHBOARD_KEY = ['dashboard'] as const;

export function useDashboardData() {
  const results = useQueries({
    queries: [
      {
        queryKey: [...DASHBOARD_KEY, 'pins'],
        queryFn: () => getAllPins(),
      },
      {
        queryKey: [...DASHBOARD_KEY, 'activity'],
        queryFn: () => getRecentActivity(),
      },
      {
        queryKey: [...DASHBOARD_KEY, 'walkRoutes'],
        queryFn: () => getWalkRoutes(),
      },
    ],
  });

  const [pinsQuery, activityQuery, walkRoutesQuery] = results;

  return {
    pins: pinsQuery.data ?? [],
    activity: activityQuery.data ?? [],
    walkRoutes: walkRoutesQuery.data ?? [],
    isLoading:
      pinsQuery.isLoading ||
      activityQuery.isLoading ||
      walkRoutesQuery.isLoading,
  };
}
