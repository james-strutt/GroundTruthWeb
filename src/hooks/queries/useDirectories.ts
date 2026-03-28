import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listDirectories,
  getDirectory,
  createDirectory,
  updateDirectory,
  deleteDirectory,
} from '../../services/directoryService';
import { useToast } from '../../contexts/ToastContext';

const DIRECTORIES_KEY = ['directories'] as const;

export function useDirectoriesQuery() {
  return useQuery({
    queryKey: DIRECTORIES_KEY,
    queryFn: () => listDirectories(),
  });
}

export function useDirectoryQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...DIRECTORIES_KEY, id],
    queryFn: () => getDirectory(id!),
    enabled: !!id,
  });
}

export function useCreateDirectory() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (fields: {
      name: string;
      description?: string;
      colour?: string;
      icon?: string;
    }) => createDirectory(fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECTORIES_KEY });
      toast.success('Directory created');
    },
    onError: () => {
      toast.error('Failed to create directory');
    },
  });
}

export function useUpdateDirectory() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (params: {
      id: string;
      updates: Partial<{
        name: string;
        description: string;
        colour: string;
        icon: string;
        isArchived: boolean;
      }>;
    }) => updateDirectory(params.id, params.updates),
    onSuccess: (_result, params) => {
      queryClient.invalidateQueries({
        queryKey: [...DIRECTORIES_KEY, params.id],
      });
      queryClient.invalidateQueries({ queryKey: DIRECTORIES_KEY });
    },
    onError: () => {
      toast.error('Failed to update directory');
    },
  });
}

export function useDeleteDirectory() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteDirectory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECTORIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success('Directory deleted');
    },
    onError: () => {
      toast.error('Failed to delete directory');
    },
  });
}
