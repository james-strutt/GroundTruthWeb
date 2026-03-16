import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertTriangle, Trash2, X, RefreshCw } from 'lucide-react';
import { getInspection, updateInspectionReportField, deleteInspection, deleteInspectionPhoto } from '../../services/api';
import { reanalyseInspectionPhoto } from '../../services/aiService';
import { EditableText } from '../../components/shared/EditableText';
import { ClickableImage } from '../../components/shared/ClickableImage';
import { InlineDiff } from '../../components/shared/InlineDiff';
import type { Inspection } from '../../types/common';
import styles from '../snaps/SnapDetail.module.css';

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReanalysing, setIsReanalysing] = useState(false);
  const [pendingNarrative, setPendingNarrative] = useState<string | null>(null);
  const [reanalysePhotoIdx, setReanalysePhotoIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    void getInspection(id).then((d) => { setRecord(d); setLoading(false); });
  }, [id]);

  async function handleReanalyse() {
    if (!record || record.photos.length === 0 || isReanalysing) return;
    // Find the first photo with a cloud URL
    const photoIdx = record.photos.findIndex((p) => p.uri.startsWith('http'));
    if (photoIdx === -1) {
      alert('Photos not synced to cloud. Re-sync from the iOS app first.');
      return;
    }
    const photo = record.photos[photoIdx]!;
    setIsReanalysing(true);
    setReanalysePhotoIdx(photoIdx);
    try {
      const tag = photo.tags?.[0]?.label ?? 'general';
      const result = await reanalyseInspectionPhoto(photo.uri, record.address, tag);

      // Build a new analysis object for this photo
      const newAnalysis = {
        conditionScore: typeof result['conditionScore'] === 'number' ? result['conditionScore'] : 5,
        materials: Array.isArray(result['materials']) ? result['materials'] as string[] : [],
        defects: Array.isArray(result['defects']) ? result['defects'] as { type: string; severity: string; description: string }[] : [],
        improvements: Array.isArray(result['improvements']) ? result['improvements'] as string[] : [],
        narrative: typeof result['narrative'] === 'string' ? result['narrative'] : '',
      };

      // Update the photo's analysis in local state
      setRecord((prev) => {
        if (!prev) return prev;
        const updatedPhotos = prev.photos.map((p, i) =>
          i === photoIdx ? { ...p, analysis: newAnalysis } : p,
        );
        return { ...prev, photos: updatedPhotos };
      });

      // Also update the report narrative if there is one
      const newNarrative = newAnalysis.narrative;
      if (newNarrative && record.report) {
        setPendingNarrative(newNarrative);
      }

      // Sync photo analysis to Supabase
      if (record.id) {
        const { data: row } = await (await import('../../supabaseClient')).supabase?.from('inspections').select('photos').eq('id', record.id).single() ?? { data: null };
        if (row) {
          const photos = (row.photos ?? []) as Record<string, unknown>[];
          if (photos[photoIdx]) {
            photos[photoIdx] = { ...photos[photoIdx], analysis: newAnalysis };
            await (await import('../../supabaseClient')).supabase?.from('inspections').update({ photos }).eq('id', record.id);
          }
        }
      }
    } catch (err: unknown) {
      alert(`Re-analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsReanalysing(false);
      setReanalysePhotoIdx(null);
    }
  }

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!record) return <p className={styles.loading}>Inspection not found.</p>;

  const report = record.report;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/app/inspections')}>
          <ArrowLeft size={18} /> Back to Inspections
        </button>
        <button
          className={styles.deleteButton}
          onClick={async () => {
            if (window.confirm('Delete this inspection? This cannot be undone.')) {
              await deleteInspection(record.id);
              navigate('/app/inspections');
            }
          }}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

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

      {/* Re-analyse button */}
      {record.photos.length > 0 && (
        <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          <button className={styles.reanalyseBtn} onClick={() => void handleReanalyse()} disabled={isReanalysing}>
            <RefreshCw size={14} className={isReanalysing ? styles.spinning : ''} />
            {isReanalysing ? `Analysing photo ${(reanalysePhotoIdx ?? 0) + 1}...` : 'Re-analyse with AI'}
          </button>
        </div>
      )}

      {/* Pending narrative diff */}
      {pendingNarrative && report && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineDiff
            title="AI Re-analysis"
            fields={[{ key: 'narrative', label: 'Report Narrative', oldValue: report.narrative, newValue: pendingNarrative }]}
            onAccept={async (_key, value) => {
              await updateInspectionReportField(record.id, 'narrative', value);
              setRecord((prev) => prev?.report ? { ...prev, report: { ...prev.report, narrative: value } } : prev);
              setPendingNarrative(null);
            }}
            onReject={() => setPendingNarrative(null)}
            onAcceptAll={async () => {
              await updateInspectionReportField(record.id, 'narrative', pendingNarrative);
              setRecord((prev) => prev?.report ? { ...prev, report: { ...prev.report, narrative: pendingNarrative } } : prev);
              setPendingNarrative(null);
            }}
            onRejectAll={() => setPendingNarrative(null)}
          />
        </div>
      )}

      {/* Photos with per-photo AI analysis */}
      {record.photos.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 className={styles.cardTitle}>Photos ({record.photos.length})</h2>
          {record.photos.map((p, i) => (
            <div key={i} className={styles.card} style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
                {/* Photo */}
                <div style={{ width: '200px', height: '150px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  <ClickableImage src={p.uri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.tags.length > 0 && (
                    <div style={{ position: 'absolute', bottom: '4px', left: '4px', display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {p.tags.map((t, ti) => (
                        <span key={ti} style={{ background: 'rgba(0,0,0,0.7)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.5625rem', fontFamily: 'var(--font-body)', color: '#fff' }}>{t.label}</span>
                      ))}
                    </div>
                  )}
                  <button
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EF4444' }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this photo?')) {
                        const ok = await deleteInspectionPhoto(record.id, i);
                        if (ok) setRecord((prev) => prev ? { ...prev, photos: prev.photos.filter((_, idx) => idx !== i) } : prev);
                      }
                    }}
                    title="Delete photo"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Analysis */}
                <div style={{ flex: 1, padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {p.analysis ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-data)', fontSize: '1.25rem', fontWeight: 700, color: p.analysis.conditionScore >= 7 ? '#65A30D' : p.analysis.conditionScore >= 4 ? '#D97706' : '#EF4444' }}>
                          {p.analysis.conditionScore}/10
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>condition</span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                        {p.analysis.narrative}
                      </p>
                      {p.analysis.materials.length > 0 && (
                        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {p.analysis.materials.map((m, mi) => (
                            <span key={mi} style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.5625rem', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>{m}</span>
                          ))}
                        </div>
                      )}
                      {p.analysis.defects.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {p.analysis.defects.map((d, di) => (
                            <div key={di} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <span style={{ fontSize: '0.5625rem', fontFamily: 'var(--font-data)', fontWeight: 600, textTransform: 'uppercase', color: d.severity === 'major' ? '#EF4444' : d.severity === 'moderate' ? '#D97706' : 'var(--text-muted)' }}>
                                {d.severity}
                              </span>
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                                {d.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No AI analysis for this photo</span>
                  )}
                </div>
              </div>
            </div>
          ))}
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
