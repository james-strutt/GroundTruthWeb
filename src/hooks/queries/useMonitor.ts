import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listWatched,
  getWatched,
  deleteWatched,
} from '../../services/monitorService';
import { useToast } from '../../contexts/ToastContext';

const WATCHED_KEY = ['watched'] as const;

export function useWatchedQuery() {
  return useQuery({
    queryKey: WATCHED_KEY,
    queryFn: () => listWatched(),
  });
}

export function useWatchedItemQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...WATCHED_KEY, id],
    queryFn: () => getWatched(id!),
    enabled: !!id,
  });
}

export function useDeleteWatched() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteWatched(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: WATCHED_KEY });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Watch ${id.slice(0, 8)} removed`);
    },
    onError: () => {
      toast.error('Failed to remove watched property');
    },
  });
}
