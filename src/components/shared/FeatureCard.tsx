/**
 * Reusable card for feature list views — shows address,
 * date, metric, and optional thumbnail.
 */

import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import styles from './FeatureCard.module.css';

interface FeatureCardProps {
  to: string;
  address: string;
  suburb: string;
  date: string;
  metric?: string;
  metricLabel?: string;
  metricColour?: string;
  photoUrl?: string | null;
  isFavourite?: boolean;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleDateString('en-AU', { month: 'short' });
  const year = String(d.getFullYear()).slice(2);
  return `${day} ${month} ${year}`;
}

export function FeatureCard({
  to,
  address,
  suburb,
  date,
  metric,
  metricLabel,
  metricColour,
  photoUrl,
  isFavourite,
}: FeatureCardProps) {
  const navigate = useNavigate();

  return (
    <button className={styles.card} onClick={() => navigate(to)}>
      {photoUrl && (
        <div className={styles.thumbnail}>
          <img src={photoUrl} alt="" className={styles.thumbnailImg} loading="lazy" width={80} height={80} />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.addressRow}>
          <MapPin size={14} className={styles.addressIcon} />
          <span className={styles.address}>{address}</span>
          {isFavourite && <span className={styles.star}>*</span>}
        </div>
        <div className={styles.metaRow}>
          <span className={styles.suburb}>{suburb}</span>
          <span className={styles.separator}>-</span>
          <Calendar size={12} className={styles.dateIcon} />
          <span className={styles.date}>{formatDate(date)}</span>
        </div>
      </div>

      {metric && (
        <div className={styles.metricBox}>
          {metricLabel && <span className={styles.metricLabel}>{metricLabel}</span>}
          <span className={styles.metricValue} style={metricColour ? { color: metricColour } : undefined}>
            {metric}
          </span>
        </div>
      )}

      <ChevronRight size={16} className={styles.chevron} />
    </button>
  );
}
