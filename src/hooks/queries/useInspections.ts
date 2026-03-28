import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listInspections,
  getInspection,
  deleteInspection,
  updateInspectionPhotoAnalysis,
  updateInspectionReportField,
  deleteInspectionPhoto,
} from '../../services/inspectionService';
import { useToast } from '../../contexts/ToastContext';

const INSPECTIONS_KEY = ['inspections'] as const;

export function useInspectionsQuery() {
  return useQuery({
    queryKey: INSPECTIONS_KEY,
    queryFn: () => listInspections(),
  });
}

export function useInspectionQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...INSPECTIONS_KEY, id],
    queryFn: () => getInspection(id!),
    enabled: !!id,
  });
}

export function useDeleteInspection() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteInspection(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: INSPECTIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Inspection ${id.slice(0, 8)} deleted`);
    },
    onError: () => {
      toast.error('Failed to delete inspection');
    },
  });
}

export function useUpdateInspectionPhotoAnalysis() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: {
      inspectionId: string;
      photoIndex: number;
      field: string;
      value: unknown;
    }) =>
      updateInspectionPhotoAnalysis(
        params.inspectionId,
        params.photoIndex,
        params.field,
        params.value,
      ),
    onSuccess: (_result, params) => {
      queryClient.invalidateQueries({
        queryKey: [...INSPECTIONS_KEY, params.inspectionId],
      });
    },
    onError: () => {
      toast.error('Failed to update photo analysis');
    },
  });
}

export function useUpdateInspectionReportField() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: { id: string; field: string; value: unknown }) =>
      updateInspectionReportField(params.id, params.field, params.value),
    onSuccess: (_result, params) => {
      queryClient.invalidateQueries({
        queryKey: [...INSPECTIONS_KEY, params.id],
      });
    },
    onError: () => {
      toast.error('Failed to update report');
    },
  });
}

export function useDeleteInspectionPhoto() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: { inspectionId: string; photoIndex: number }) =>
      deleteInspectionPhoto(params.inspectionId, params.photoIndex),
    onSuccess: (_result, params) => {
      queryClient.invalidateQueries({
        queryKey: [...INSPECTIONS_KEY, params.inspectionId],
      });
      toast.success('Photo removed');
    },
    onError: () => {
      toast.error('Failed to remove photo');
    },
  });
}
