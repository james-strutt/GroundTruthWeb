/**
 * NearbyDAs — fetches and displays development applications within
 * 200m of a given coordinate using the DA Supabase service.
 */

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { fetchDAsNearPoint } from '../../services/daService';
import type { DA } from '../../services/daService';
import styles from './NearbyDAs.module.css';

interface NearbyDAsProps {
  latitude: number;
  longitude: number;
}

function statusClassName(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes('determined') || lower.includes('approved') || lower.includes('consent')) {
    return styles.statusDetermined;
  }
  if (lower.includes('pending') || lower.includes('lodged') || lower.includes('under')) {
    return styles.statusPending;
  }
  return styles.statusOther;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCost(cost: number | null): string {
  if (cost === null) return '';
  if (cost >= 1_000_000) return `$${(cost / 1_000_000).toFixed(1)}M`;
  if (cost >= 1_000) return `$${Math.round(cost / 1_000)}K`;
  return `$${cost}`;
}

function DACard({ da }: { da: DA }) {
  return (
    <div className={styles.daCard}>
      <div className={styles.daHeader}>
        <span className={styles.daType}>
          <FileText size={11} style={{ verticalAlign: '-1px', marginRight: '0.25rem' }} />
          {da.type || 'Development Application'}
        </span>
        <span className={`${styles.daStatus} ${statusClassName(da.status)}`}>
          {da.status}
        </span>
      </div>

      {da.description && (
        <p className={styles.daDescription}>{da.description}</p>
      )}

      <div className={styles.daMeta}>
        {da.lodgementDate && (
          <>
            <span>Lodged {formatDate(da.lodgementDate)}</span>
            <span className={styles.dot} />
          </>
        )}
        {da.cost !== null && (
          <>
            <span>{formatCost(da.cost)}</span>
            <span className={styles.dot} />
          </>
        )}
        <span>{da.council}</span>
      </div>
    </div>
  );
}

type DAFetchState =
  | { status: 'loading' }
  | { status: 'done'; das: DA[] }
  | { status: 'error' };

export function NearbyDAs({ latitude, longitude }: NearbyDAsProps) {
  const [state, setState] = useState<DAFetchState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    fetchDAsNearPoint(longitude, latitude, 200, 20)
      .then((result) => {
        if (!cancelled) setState({ status: 'done', das: result });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => { cancelled = true; };
  }, [latitude, longitude]);

  if (state.status === 'loading') return <p className={styles.loading}>Loading nearby DAs...</p>;
  if (state.status === 'error') return <p className={styles.error}>Could not load nearby development applications.</p>;

  const { das } = state;

  return (
    <div className={styles.container}>
      <div className={styles.title}>Nearby Development Applications</div>
      {das.length === 0 ? (
        <p className={styles.empty}>No development applications within 200m.</p>
      ) : (
        <div className={styles.list}>
          {das.map((da) => (
            <DACard key={da.id} da={da} />
          ))}
        </div>
      )}
    </div>
  );
}
