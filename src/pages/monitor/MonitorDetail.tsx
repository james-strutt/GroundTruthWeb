import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertCircle, Trash2 } from 'lucide-react';
import { useWatchedItemQuery, useDeleteWatched } from '../../hooks/queries/useMonitor';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { ClickableImage } from '../../components/shared/ClickableImage';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { SkeletonCard } from '../../components/shared/SkeletonCard';
import { UpgradePrompt } from '../../components/shared/UpgradePrompt';
import styles from '../snaps/SnapDetail.module.css';

const SEVERITY_COLOURS: Record<string, string> = { none: '#57534E', minor: '#B0A08A', moderate: '#EA580C', major: '#DC2626', demolition: '#991B1B' };

export default function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isProOrAbove, isLoading: subLoading } = useSubscription();
  const { data: record, isLoading, error, refetch } = useWatchedItemQuery(id);
  const deleteWatchedMutation = useDeleteWatched();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (subLoading || isLoading) return <SkeletonCard count={3} />;
  if (!isProOrAbove) return <UpgradePrompt feature="Monitor" />;
  if (error) return <ErrorMessage message={error.message ?? 'Failed to load property'} onRetry={() => void refetch()} />;
  if (!record) return <ErrorMessage type="notFound" message="Property not found" />;

  return (
    <div className={styles.page}>
      <Breadcrumb segments={[{ label: 'Dashboard', path: '/app' }, { label: 'Monitor', path: '/app/monitor' }, { label: record.address }]} />
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/app/monitor')}>
          <ArrowLeft size={18} /> Back to Monitor
        </button>
        <button className={styles.deleteButton} onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Monitored Property"
          message="Delete this monitored property? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            deleteWatchedMutation.mutate(record.id, { onSuccess: () => navigate('/app/monitor') });
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className={styles.heroSection}>
        {record.latestPhotoUrl && (
          <div className={styles.photoContainer}>
            <ClickableImage src={record.latestPhotoUrl} alt="" className={styles.photo} />
          </div>
        )}
        <div className={styles.heroInfo}>
          <h1 className={styles.address}>{record.address}</h1>
          <div className={styles.meta}>
            <MapPin size={14} /> {record.suburb}
            <span className={styles.dot} />
            {record.visitCount} visit{record.visitCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className={styles.grid} style={{ marginTop: '1rem' }}>
        {/* Alerts */}
        {record.alerts.filter((a) => !a.dismissed).length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}><AlertCircle size={16} /> Active Alerts</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {record.alerts.filter((a) => !a.dismissed).map((a) => (
                <div key={a.id} style={{ padding: '0.5rem 0.75rem', background: 'rgba(158,126,120,0.08)', borderRadius: '6px', borderLeft: `3px solid ${SEVERITY_COLOURS[a.severity] ?? '#57534E'}` }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{a.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change history */}
        {record.changes.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Change History ({record.changes.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {record.changes.map((c) => (
                <div key={c.id} style={{ borderLeft: `3px solid ${SEVERITY_COLOURS[c.severity] ?? '#57534E'}`, paddingLeft: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(c.comparedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', textTransform: 'capitalize', color: SEVERITY_COLOURS[c.severity] ?? 'var(--text-muted)' }}>
                      {c.severity}
                    </span>
                  </div>
                  {c.analysis && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      {c.analysis.overallAssessment}
                    </p>
                  )}
                  {c.categories.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      {c.categories.map((cat, i) => (
                        <span key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.6875rem', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cat}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
