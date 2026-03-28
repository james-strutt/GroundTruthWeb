import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAppraisals,
  getAppraisal,
  deleteAppraisal,
  updateAppraisalEstimateField,
  updateAppraisalCompSelections,
} from '../../services/appraisalService';
import { useToast } from '../../contexts/ToastContext';

const APPRAISALS_KEY = ['appraisals'] as const;

export function useAppraisalsQuery() {
  return useQuery({
    queryKey: APPRAISALS_KEY,
    queryFn: () => listAppraisals(),
  });
}

export function useAppraisalQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...APPRAISALS_KEY, id],
    queryFn: () => getAppraisal(id!),
    enabled: !!id,
  });
}

export function useDeleteAppraisal() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteAppraisal(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: APPRAISALS_KEY });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Appraisal ${id.slice(0, 8)} deleted`);
    },
    onError: () => {
      toast.error('Failed to delete appraisal');
    },
  });
}

export function useUpdateAppraisalEstimate() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: { id: string; field: string; value: unknown }) =>
      updateAppraisalEstimateField(params.id, params.field, params.value),
    onSuccess: (_result, params) => {
      queryClient.invalidateQueries({
        queryKey: [...APPRAISALS_KEY, params.id],
      });
    },
    onError: () => {
      toast.error('Failed to update estimate');
    },
  });
}

export function useUpdateAppraisalCompSelections() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: { id: string; selectedCompIds: string[] }) =>
      updateAppraisalCompSelections(params.id, params.selectedCompIds),
    onSuccess: (_result, params) => {
      queryClient.invalidateQueries({
        queryKey: [...APPRAISALS_KEY, params.id],
      });
    },
    onError: () => {
      toast.error('Failed to update comparables');
    },
  });
}
