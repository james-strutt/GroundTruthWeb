import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listWalks,
  getWalk,
  deleteWalk,
  updateWalkField,
} from '../../services/walkService';
import { useToast } from '../../contexts/ToastContext';

const WALKS_KEY = ['walks'] as const;

export function useWalksQuery() {
  return useQuery({
    queryKey: WALKS_KEY,
    queryFn: () => listWalks(),
  });
}

export function useWalkQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...WALKS_KEY, id],
    queryFn: () => getWalk(id!),
    enabled: !!id,
  });
}

export function useDeleteWalk() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteWalk(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: WALKS_KEY });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Walk ${id.slice(0, 8)} deleted`);
    },
    onError: () => {
      toast.error('Failed to delete walk');
    },
  });
}

export function useUpdateWalkField() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: { id: string; updates: Record<string, unknown> }) =>
      updateWalkField(params.id, params.updates),
    onSuccess: (_result, params) => {
      queryClient.invalidateQueries({ queryKey: [...WALKS_KEY, params.id] });
    },
    onError: () => {
      toast.error('Failed to update walk');
    },
  });
}
