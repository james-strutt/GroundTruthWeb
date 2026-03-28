/**
 * Subscription context — provides the current user's subscription tier
 * and convenience booleans for gating features.
 *
 * Fetches from the Supabase `users` table using the authenticated user ID.
 * If `subscription_expires_at` has passed, the effective tier falls back to 'free'.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  isProOrAbove: boolean;
  isEnterprise: boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function isValidTier(value: unknown): value is SubscriptionTier {
  return value === 'free' || value === 'pro' || value === 'enterprise';
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !isAuthenticated || !user) {
      setTier('free');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error || !data) {
          setTier('free');
          setIsLoading(false);
          return;
        }

        const rawTier = data.subscription_tier;
        const expiresAt = (data as Record<string, unknown>)['subscription_expires_at'] as string | null | undefined;

        if (!isValidTier(rawTier) || isExpired(expiresAt)) {
          setTier('free');
        } else {
          setTier(rawTier);
        }

        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [user, isAuthenticated]);

  const value = useMemo<SubscriptionContextValue>(() => ({
    tier,
    isProOrAbove: tier === 'pro' || tier === 'enterprise',
    isEnterprise: tier === 'enterprise',
    isLoading,
  }), [tier, isLoading]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
