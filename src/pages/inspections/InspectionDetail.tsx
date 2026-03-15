import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertTriangle } from 'lucide-react';
import { getInspection, updateInspectionReportField } from '../../services/api';
import { EditableText } from '../../components/shared/EditableText';
import type { Inspection } from '../../types/common';
import styles from '../snaps/SnapDetail.module.css';

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void getInspection(id).then((d) => { setRecord(d); setLoading(false); });
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!record) return <p className={styles.loading}>Inspection not found.</p>;

  const report = record.report;

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate('/app/inspections')}>
        <ArrowLeft size={18} /> Back to Inspections
      </button>

      <div className={styles.heroInfo}>
        <h1 className={styles.address}>{record.address}</h1>
        <div className={styles.meta}>
          <MapPin size={14} /> {record.suburb}
          <span className={styles.dot} />
          {new Date(record.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          {record.overallScore && (
            <>
              <span className={styles.dot} />
              Score: {record.overallScore}/10
            </>
          )}
        </div>
      </div>

      {/* Photo grid */}
      {record.photos.length > 0 && (
        <div className={styles.card} style={{ marginTop: '1rem' }}>
          <h2 className={styles.cardTitle}>Photos ({record.photos.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
            {record.photos.map((p, i) => (
              <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: 'rgba(255,255,255,0.05)' }}>
                <img src={p.uri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className={styles.grid} style={{ marginTop: '1rem' }}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Inspection Report</h2>
            <EditableText
              value={report.narrative}
              multiline
              onSave={async (v) => {
                await updateInspectionReportField(record.id, 'narrative', v);
                setRecord((prev) => prev && prev.report ? { ...prev, report: { ...prev.report, narrative: v } } : prev);
              }}
              className={styles.summary}
            />

            <h3 className={styles.cardTitle} style={{ fontSize: '0.8125rem', marginTop: '0.75rem' }}>Condition Breakdown</h3>
            <div className={styles.detailGrid}>
              {Object.entries(report.conditionBreakdown).map(([key, val]) => (
                <div key={key} className={styles.detailItem}>
                  <span className={styles.detailLabel}>{key}</span>
                  <span className={styles.detailValue}>{val}/10</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}><AlertTriangle size={16} /> Defects</h2>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Minor</span>
                <span className={styles.detailValue}>{report.defectsBySeverity.minor}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Moderate</span>
                <span className={styles.detailValue} style={{ color: '#D97706' }}>{report.defectsBySeverity.moderate}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Major</span>
                <span className={styles.detailValue} style={{ color: '#EF4444' }}>{report.defectsBySeverity.major}</span>
              </div>
            </div>
          </div>

          {report.materialsObserved.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Materials Observed</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {report.materialsObserved.map((m, i) => (
                  <span key={i} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
