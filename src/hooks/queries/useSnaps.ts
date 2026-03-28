import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listSnaps,
  getSnap,
  deleteSnap,
  updateSnapAnalysisField,
} from '../../services/snapService';
import { useToast } from '../../contexts/ToastContext';

const SNAPS_KEY = ['snaps'] as const;

export function useSnapsQuery() {
  return useQuery({
    queryKey: SNAPS_KEY,
    queryFn: () => listSnaps(),
  });
}

export function useSnapQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...SNAPS_KEY, id],
    queryFn: () => getSnap(id!),
    enabled: !!id,
  });
}

export function useDeleteSnap() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteSnap(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: SNAPS_KEY });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Snap ${id.slice(0, 8)} deleted`);
    },
    onError: () => {
      toast.error('Failed to delete snap');
    },
  });
}

export function useUpdateSnapAnalysis() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: { id: string; field: string; value: unknown }) =>
      updateSnapAnalysisField(params.id, params.field, params.value),
    onSuccess: (_result, params) => {
      queryClient.invalidateQueries({ queryKey: [...SNAPS_KEY, params.id] });
    },
    onError: () => {
      toast.error('Failed to update analysis');
    },
  });
}
