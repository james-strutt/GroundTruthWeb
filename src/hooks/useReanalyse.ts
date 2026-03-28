import { useState, useCallback } from 'react';
import { useCooldown } from './useCooldown';

interface ReanalyseState {
  isRunning: boolean;
  current: number;
  total: number;
  singleIndex: number | null;
}

/**
 * Hook for managing AI re-analysis state across detail pages.
 * Tracks progress when analysing one or many photos.
 * Includes a 10-second cooldown after each analysis completes.
 */
export function useReanalyse(cooldownSeconds = 10) {
  const [state, setState] = useState<ReanalyseState>({
    isRunning: false,
    current: 0,
    total: 0,
    singleIndex: null,
  });
  const [isCoolingDown, cooldownRemaining, startCooldown] = useCooldown(cooldownSeconds);

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
    startCooldown();
  }, [startCooldown]);

  return {
    isRunning: state.isRunning,
    current: state.current,
    total: state.total,
    singleIndex: state.singleIndex,
    isCoolingDown,
    cooldownRemaining,
    startBatch,
    startSingle,
    advance,
    finish,
  };
}
