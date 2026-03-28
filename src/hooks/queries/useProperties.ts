import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProperties,
  listAllProperties,
  getProperty,
  getPropertyActivities,
  listPropertiesByDirectory,
  createProperty,
  deleteProperty,
} from '../../services/propertyService';
import { useToast } from '../../contexts/ToastContext';
import type { PropertyStatus } from '../../types/common';

const PROPERTIES_KEY = ['properties'] as const;

export function usePropertiesQuery() {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, 'grouped'],
    queryFn: () => listProperties(),
  });
}

export function useAllPropertiesQuery() {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, 'all'],
    queryFn: () => listAllProperties(),
  });
}

export function usePropertyQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, id],
    queryFn: () => getProperty(id!),
    enabled: !!id,
  });
}

export function usePropertyActivitiesQuery(propertyId: string | undefined) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, propertyId, 'activities'],
    queryFn: () => getPropertyActivities(propertyId!),
    enabled: !!propertyId,
  });
}

export function usePropertiesByDirectoryQuery(
  directoryId: string | undefined,
) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, 'directory', directoryId],
    queryFn: () => listPropertiesByDirectory(directoryId!),
    enabled: !!directoryId,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (fields: {
      directoryId: string;
      address: string;
      suburb?: string;
      latitude?: number;
      longitude?: number;
      propid?: number;
      status?: PropertyStatus;
      notes?: string;
    }) => createProperty(fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['directories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Property created');
    },
    onError: () => {
      toast.error('Failed to create property');
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROPERTIES_KEY });
      queryClient.invalidateQueries({ queryKey: ['directories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Property deleted');
    },
    onError: () => {
      toast.error('Failed to delete property');
    },
  });
}
