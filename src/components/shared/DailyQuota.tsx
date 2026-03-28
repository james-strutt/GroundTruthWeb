/**
 * Daily quota indicator — shows remaining AI analysis quota.
 * Free tier: 5 snaps/day. Pro and above: unlimited.
 * Fetches today's snap count from Supabase.
 */

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../supabaseClient';
import styles from './DailyQuota.module.css';

const FREE_DAILY_LIMIT = 5;

function todayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function DailyQuota() {
  const { user } = useAuth();
  const { isProOrAbove, isLoading: subLoading } = useSubscription();
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user || subLoading) {
      setIsLoading(false);
      return;
    }

    if (isProOrAbove) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const { start, end } = todayRange();

    supabase
      .from('snaps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', start)
      .lt('created_at', end)
      .then(({ count, error }) => {
        if (cancelled) return;
        if (!error && count != null) setTodayCount(count);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [user, isProOrAbove, subLoading]);

  if (isLoading || subLoading) return null;

  if (isProOrAbove) {
    return (
      <div className={styles.wrapper}>
        <span className={styles.icon}><Zap size={12} /></span>
        <span className={styles.unlimited}>Unlimited</span>
      </div>
    );
  }

  const remaining = Math.max(0, FREE_DAILY_LIMIT - todayCount);
  const isExhausted = remaining === 0;

  return (
    <div className={styles.wrapper}>
      <span className={styles.icon}><Zap size={12} /></span>
      <span className={isExhausted ? styles.exhausted : styles.count}>
        {todayCount}/{FREE_DAILY_LIMIT} snaps today
      </span>
    </div>
  );
}
