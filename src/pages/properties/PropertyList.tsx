/**
 * Properties page — shows all properties grouped by address
 * with activity counts per feature type.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Camera, ClipboardCheck, BarChart3, Eye, MapPin, Calendar } from 'lucide-react';
import { listProperties } from '../../services/api';
import { PageHeader } from '../../components/shared/PageHeader';
import type { GroupedProperty } from '../../types/common';
import styles from './PropertyList.module.css';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleDateString('en-AU', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`;
}

export default function PropertyListPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<GroupedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listProperties().then((d) => { setProperties(d); setLoading(false); });
  }, []);

  return (
    <div>
      <PageHeader icon={<Building size={22} />} title="Properties" count={properties.length} />
      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : properties.length === 0 ? (
        <p className={styles.empty}>No properties yet. Capture data on the iOS app and sync to cloud.</p>
      ) : (
        <div className={styles.grid}>
          {properties.map((p) => (
            <button
              key={p.normalisedAddress}
              className={styles.card}
              onClick={() => navigate(`/app/properties/${encodeURIComponent(p.normalisedAddress)}`)}
            >
              {p.thumbnailUrl && (
                <div className={styles.thumbnail}>
                  <img src={p.thumbnailUrl} alt="" className={styles.thumbnailImg} />
                </div>
              )}
              <div className={styles.content}>
                <div className={styles.addressRow}>
                  <MapPin size={14} className={styles.icon} />
                  <span className={styles.address}>{p.address}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.suburb}>{p.suburb}</span>
                  <span className={styles.sep}>-</span>
                  <Calendar size={11} className={styles.icon} />
                  <span className={styles.date}>{formatDate(p.lastActivityAt)}</span>
                </div>
                <div className={styles.badges}>
                  {p.snapCount > 0 && (
                    <span className={styles.badge} style={{ color: '#C2410C' }}>
                      <Camera size={12} /> {p.snapCount}
                    </span>
                  )}
                  {p.inspectionCount > 0 && (
                    <span className={styles.badge} style={{ color: '#3B82F6' }}>
                      <ClipboardCheck size={12} /> {p.inspectionCount}
                    </span>
                  )}
                  {p.appraisalCount > 0 && (
                    <span className={styles.badge} style={{ color: '#D97706' }}>
                      <BarChart3 size={12} /> {p.appraisalCount}
                    </span>
                  )}
                  {p.monitorCount > 0 && (
                    <span className={styles.badge} style={{ color: '#B45309' }}>
                      <Eye size={12} /> {p.monitorCount}
                    </span>
                  )}
                </div>
              </div>
              <span className={styles.totalBadge}>{p.totalRecords}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
