import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook that provides a cooldown timer for rate-limiting button clicks.
 * Returns [isCoolingDown, remainingSeconds, startCooldown].
 */
export function useCooldown(durationSeconds: number): [boolean, number, () => void] {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setRemaining(durationSeconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [durationSeconds]);

  return [remaining > 0, remaining, startCooldown];
}
