import { useState, useCallback } from 'react';

interface ReanalyseState {
  isRunning: boolean;
  current: number;
  total: number;
  singleIndex: number | null;
}

/**
 * Hook for managing AI re-analysis state across detail pages.
 * Tracks progress when analysing one or many photos.
 */
export function useReanalyse() {
  const [state, setState] = useState<ReanalyseState>({
    isRunning: false,
    current: 0,
    total: 0,
    singleIndex: null,
  });

  const startBatch = useCallback((total: number) => {
    setState({ isRunning: true, current: 0, total, singleIndex: null });
  }, []);

  const startSingle = useCallback((index: number) => {
    setState({ isRunning: true, current: 0, total: 1, singleIndex: index });
  }, []);

  const advance = useCallback(() => {
    setState((prev) => ({ ...prev, current: prev.current + 1 }));
  }, []);

  const finish = useCallback(() => {
    setState({ isRunning: false, current: 0, total: 0, singleIndex: null });
  }, []);

  return {
    isRunning: state.isRunning,
    current: state.current,
    total: state.total,
    singleIndex: state.singleIndex,
    startBatch,
    startSingle,
    advance,
    finish,
  };
}
