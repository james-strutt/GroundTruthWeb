import { useState, useEffect, useCallback } from 'react';

interface DetailFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic hook for fetching a single record by ID with loading/error states.
 * Centralises the fetch-loading-error pattern used across all detail pages.
 */
export function useDetailFetch<T>(
  id: string | undefined,
  fetcher: (id: string) => Promise<T | null>,
  entityName: string,
) {
  const [state, setState] = useState<DetailFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const load = useCallback(() => {
    if (!id) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetcher(id)
      .then((result) => {
        setState({
          data: result,
          loading: false,
          error: result ? null : `${entityName} not found`,
        });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : `Failed to load ${entityName.toLowerCase()}`;
        setState({ data: null, loading: false, error: message });
      });
  }, [id, fetcher, entityName]);

  useEffect(() => {
    load();
  }, [load]);

  const setData = useCallback((updater: T | ((prev: T | null) => T | null)) => {
    setState((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? (updater as (prev: T | null) => T | null)(prev.data) : updater,
    }));
  }, []);

  return { ...state, retry: load, setData };
}
