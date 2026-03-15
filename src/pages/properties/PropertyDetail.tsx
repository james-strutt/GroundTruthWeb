/**
 * Property detail — unified view of all activity for a single
 * property address, grouped by feature type.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Camera, ClipboardCheck, BarChart3, Eye } from 'lucide-react';
import { getPropertyRecords } from '../../services/api';
import { FeatureCard } from '../../components/shared/FeatureCard';
import { colours } from '../../theme';
import type { Snap, Inspection, Appraisal, WatchedProperty } from '../../types/common';
import styles from '../snaps/SnapDetail.module.css';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export default function PropertyDetailPage() {
  const { address: encodedAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const normalisedAddress = decodeURIComponent(encodedAddress ?? '');

  const [data, setData] = useState<{
    snaps: Snap[];
    inspections: Inspection[];
    appraisals: Appraisal[];
    watched: WatchedProperty[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!normalisedAddress) return;
    void getPropertyRecords(normalisedAddress).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [normalisedAddress]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!data) return <p className={styles.loading}>Property not found.</p>;

  const displayAddress = data.snaps[0]?.address
    ?? data.inspections[0]?.address
    ?? data.appraisals[0]?.address
    ?? data.watched[0]?.address
    ?? normalisedAddress;

  const displaySuburb = data.snaps[0]?.suburb
    ?? data.inspections[0]?.suburb
    ?? data.appraisals[0]?.suburb
    ?? data.watched[0]?.suburb
    ?? '';

  const totalRecords = data.snaps.length + data.inspections.length + data.appraisals.length + data.watched.length;

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate('/app/properties')}>
        <ArrowLeft size={18} /> Back to Properties
      </button>

      <div className={styles.heroInfo}>
        <h1 className={styles.address}>{displayAddress}</h1>
        <div className={styles.meta}>
          <MapPin size={14} /> {displaySuburb}
          <span className={styles.dot} />
          {totalRecords} record{totalRecords !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
        {/* Snaps */}
        {data.snaps.length > 0 && (
          <section>
            <h2 style={{ ...sectionTitle, color: colours.terracotta }}>
              <Camera size={18} /> Snaps ({data.snaps.length})
            </h2>
            <div style={gridStyle}>
              {data.snaps.map((s) => (
                <FeatureCard
                  key={s.id}
                  to={`/app/snaps/${s.id}`}
                  address={s.address}
                  suburb={s.suburb}
                  date={s.createdAt}
                  photoUrl={s.photoUrl}
                  metric={s.aiAnalysis?.condition ?? undefined}
                  metricLabel="Condition"
                />
              ))}
            </div>
          </section>
        )}

        {/* Inspections */}
        {data.inspections.length > 0 && (
          <section>
            <h2 style={{ ...sectionTitle, color: '#3B82F6' }}>
              <ClipboardCheck size={18} /> Inspections ({data.inspections.length})
            </h2>
            <div style={gridStyle}>
              {data.inspections.map((i) => (
                <FeatureCard
                  key={i.id}
                  to={`/app/inspections/${i.id}`}
                  address={i.address}
                  suburb={i.suburb}
                  date={i.createdAt}
                  metric={i.overallScore ? `${i.overallScore}/10` : undefined}
                  metricLabel="Score"
                />
              ))}
            </div>
          </section>
        )}

        {/* Appraisals */}
        {data.appraisals.length > 0 && (
          <section>
            <h2 style={{ ...sectionTitle, color: colours.amber }}>
              <BarChart3 size={18} /> Appraisals ({data.appraisals.length})
            </h2>
            <div style={gridStyle}>
              {data.appraisals.map((a) => (
                <FeatureCard
                  key={a.id}
                  to={`/app/appraisals/${a.id}`}
                  address={a.address}
                  suburb={a.suburb}
                  date={a.createdAt}
                  metric={a.priceEstimate ? formatCompact(a.priceEstimate.estimatedValue) : undefined}
                  metricLabel="Estimate"
                  metricColour={colours.terracotta}
                />
              ))}
            </div>
          </section>
        )}

        {/* Monitor */}
        {data.watched.length > 0 && (
          <section>
            <h2 style={{ ...sectionTitle, color: colours.copper }}>
              <Eye size={18} /> Monitor ({data.watched.length})
            </h2>
            <div style={gridStyle}>
              {data.watched.map((w) => (
                <FeatureCard
                  key={w.id}
                  to={`/app/monitor/${w.id}`}
                  address={w.address}
                  suburb={w.suburb}
                  date={w.lastVisitedAt}
                  metric={`${w.changes.length} change${w.changes.length !== 1 ? 's' : ''}`}
                  metricLabel={`${w.visitCount} visit${w.visitCount !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.9375rem',
  fontWeight: 600,
  margin: '0 0 0.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: '0.5rem',
};
