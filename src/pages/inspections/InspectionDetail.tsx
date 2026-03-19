import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertTriangle, Trash2, X, RefreshCw, Sparkles } from 'lucide-react';
import { getInspection, updateInspectionReportField, updateInspectionPhotoAnalysis, uploadEditedImage, deleteInspection, deleteInspectionPhoto } from '../../services/api';
import { reanalyseInspectionPhoto } from '../../services/aiService';
import { EditableText } from '../../components/shared/EditableText';
import { ClickableImage } from '../../components/shared/ClickableImage';
import { ImageEditModal } from '../../components/shared/ImageEditModal';
import { InlineDiff } from '../../components/shared/InlineDiff';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import type { Inspection, InspectionPhoto } from '../../types/common';
import styles from '../snaps/SnapDetail.module.css';

interface PhotoAnalysis {
  conditionScore: number;
  narrative: string;
  materials: string[];
  buildingElement?: string;
  defects: { defectType?: string; type?: string; severity: string; nature?: string[]; description: string; crackingCategory?: number | null }[];
  safetyHazard?: boolean;
  improvements: string[];
  constructionEra?: string | null;
  limitations?: string[];
  furtherInspection?: string | null;
}

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePhotoIdx, setDeletePhotoIdx] = useState<number | null>(null);
  const [isReanalysing, setIsReanalysing] = useState(false);
  const [reanalyseProgress, setReanalyseProgress] = useState({ current: 0, total: 0 });
  const [reanalysingSingleIdx, setReanalysingSingleIdx] = useState<number | null>(null);
  const [pendingNarrative, setPendingNarrative] = useState<string | null>(null);
  const [pendingPhotoAnalysis, setPendingPhotoAnalysis] = useState<Record<number, Record<string, unknown>>>({});
  const [aiEditPhotoUri, setAiEditPhotoUri] = useState<string | null>(null);
  const [aiEditedImages, setAiEditedImages] = useState<Record<number, string>>({});

  const fetchInspection = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await getInspection(id);
      setRecord(d);
      if (d) {
        const restored: Record<number, string> = {};
        d.photos.forEach((p, i) => {
          const url = (p.analysis as Record<string, unknown> | null)?.['aiEditedPhotoUrl'];
          if (typeof url === 'string') restored[i] = url;
        });
        if (Object.keys(restored).length > 0) setAiEditedImages(restored);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inspection');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchInspection();
  }, [fetchInspection]);

  async function handleReanalyse(): Promise<void> {
    if (!record || record.photos.length === 0 || isReanalysing) return;

    const cloudPhotos = record.photos
      .map((p, i) => ({ photo: p, index: i }))
      .filter(({ photo }) => photo.uri.startsWith('http'));

    if (cloudPhotos.length === 0) {
      alert('Photos not synced to cloud. Re-sync from the iOS app first.');
      return;
    }

    setIsReanalysing(true);
    setReanalyseProgress({ current: 0, total: cloudPhotos.length });

    const results: Record<number, Record<string, unknown>> = {};

    for (const { photo, index } of cloudPhotos) {
      setReanalyseProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      try {
        const tag = photo.tags?.[0]?.label ?? 'general';
        const result = await reanalyseInspectionPhoto(photo.uri, record.address, tag);
        results[index] = result;
        setPendingPhotoAnalysis((prev) => ({ ...prev, [index]: result }));
      } catch {
        // Skip failed photos, continue with the rest
      }
    }

    // If there's a report narrative and the first photo produced a narrative, suggest it
    const firstResult = results[cloudPhotos[0]?.index ?? 0];
    if (firstResult && typeof firstResult['narrative'] === 'string' && record.report) {
      setPendingNarrative(firstResult['narrative']);
    }

    setIsReanalysing(false);
    setReanalyseProgress({ current: 0, total: 0 });
  }

  async function handleReanalyseSingle(photoIdx: number): Promise<void> {
    if (!record || isReanalysing || reanalysingSingleIdx !== null) return;
    const photo = record.photos[photoIdx];
    if (!photo?.uri?.startsWith('http')) {
      alert('This photo is not synced to cloud. Re-sync from the iOS app first.');
      return;
    }
    setReanalysingSingleIdx(photoIdx);
    try {
      const tag = photo.tags?.[0]?.label ?? 'general';
      const result = await reanalyseInspectionPhoto(photo.uri, record.address, tag);
      setPendingPhotoAnalysis((prev) => ({ ...prev, [photoIdx]: result }));
    } catch (err: unknown) {
      alert(`Re-analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setReanalysingSingleIdx(null);
    }
  }

  async function acceptPhotoField(photoIdx: number, key: string, value: string): Promise<void> {
    if (!record) return;

    const parsed = parsePhotoFieldAcceptValue(key, value);

    const saved = await updateInspectionPhotoAnalysis(record.id, photoIdx, key, parsed);
    if (!saved) {
      throw new Error('Could not save changes. Check you are signed in and try again.');
    }

    setRecord((prev) => {
      if (!prev) return prev;
      const updatedPhotos = prev.photos.map((p, i) => {
        if (i !== photoIdx) return p;
        const existing = (p.analysis ?? {}) as Record<string, unknown>;
        return { ...p, analysis: { ...existing, [key]: parsed } as unknown as InspectionPhoto['analysis'] };
      });
      return { ...prev, photos: updatedPhotos };
    });

    // Remove this field from pending
    setPendingPhotoAnalysis((prev) => {
      const photoPending = { ...prev[photoIdx] };
      delete photoPending[key];
      const next = { ...prev };
      if (Object.keys(photoPending).length === 0) {
        delete next[photoIdx];
      } else {
        next[photoIdx] = photoPending;
      }
      return next;
    });
  }

  function rejectPhotoField(photoIdx: number, key: string): void {
    setPendingPhotoAnalysis((prev) => {
      const photoPending = { ...prev[photoIdx] };
      delete photoPending[key];
      const next = { ...prev };
      if (Object.keys(photoPending).length === 0) {
        delete next[photoIdx];
      } else {
        next[photoIdx] = photoPending;
      }
      return next;
    });
  }

  async function acceptAllPhotoFields(photoIdx: number): Promise<void> {
    const pending = pendingPhotoAnalysis[photoIdx];
    if (!pending) return;
    try {
      for (const [key, val] of Object.entries(pending)) {
        const strVal = stringifyAnalysisValue(val);
        await acceptPhotoField(photoIdx, key, strVal);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  }

  function rejectAllPhotoFields(photoIdx: number): void {
    setPendingPhotoAnalysis((prev) => {
      const next = { ...prev };
      delete next[photoIdx];
      return next;
    });
  }

  if (loading) return <LoadingSpinner message="Loading inspection..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => { setError(null); void fetchInspection(); }} />;
  if (!record) return <ErrorMessage type="notFound" message="Inspection not found" />;

  const report = record.report;

  return (
    <div className={styles.page}>
      <Breadcrumb segments={[{ label: 'Dashboard', path: '/app' }, { label: 'Inspections', path: '/app/inspections' }, { label: record.address }]} />
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/app/inspections')}>
          <ArrowLeft size={18} /> Back to Inspections
        </button>
        <button
          className={styles.deleteButton}
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Inspection"
          message="Delete this inspection? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await deleteInspection(record.id);
            navigate('/app/inspections');
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {deletePhotoIdx !== null && (
        <ConfirmModal
          title="Delete Photo"
          message="Delete this photo? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            const idx = deletePhotoIdx;
            setDeletePhotoIdx(null);
            const ok = await deleteInspectionPhoto(record.id, idx);
            if (ok) setRecord((prev) => prev ? { ...prev, photos: prev.photos.filter((_, i) => i !== idx) } : prev);
          }}
          onCancel={() => setDeletePhotoIdx(null)}
        />
      )}

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
            {isReanalysing
              ? `Analysing photo ${reanalyseProgress.current} of ${reanalyseProgress.total}...`
              : 'Re-analyse all photos'}
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
              const saved = await updateInspectionReportField(record.id, 'narrative', value);
              if (!saved) {
                alert('Could not save changes. Check you are signed in and try again.');
                return;
              }
              setRecord((prev) => prev?.report ? { ...prev, report: { ...prev.report, narrative: value } } : prev);
              setPendingNarrative(null);
            }}
            onReject={() => setPendingNarrative(null)}
            onAcceptAll={async () => {
              const saved = await updateInspectionReportField(record.id, 'narrative', pendingNarrative);
              if (!saved) {
                alert('Could not save changes. Check you are signed in and try again.');
                return;
              }
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
          {record.photos.map((p, i) => {
            const pending = pendingPhotoAnalysis[i];
            const analysis = p.analysis as PhotoAnalysis | undefined;
            const safetyHazardLines =
              analysis?.safetyHazard === true ? safetyHazardExplanationLines(analysis) : [];

            return (
              <div key={p.id}>
                <div className={styles.photoCard} style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: '0', alignItems: 'stretch' }}>
                    {/* Photo */}
                    <div style={{ width: '200px', height: '150px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                      <ClickableImage src={p.uri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {p.tags.length > 0 && (
                        <div style={{ position: 'absolute', bottom: '4px', left: '4px', display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                          {p.tags.map((t) => (
                            <span key={t.id} style={{ background: 'rgba(0,0,0,0.7)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.5625rem', fontFamily: 'var(--font-body)', color: '#fff' }}>{t.label}</span>
                          ))}
                        </div>
                      )}
                      {/* Per-photo re-analyse */}
                      {p.uri.startsWith('http') && (
                        <div style={{ position: 'absolute', top: '4px', left: '4px', display: 'flex', gap: '3px' }}>
                          <button
                            style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
                            onClick={(e) => { e.stopPropagation(); void handleReanalyseSingle(i); }}
                            disabled={isReanalysing || reanalysingSingleIdx !== null}
                            title="Re-analyse this photo"
                          >
                            <RefreshCw size={10} className={reanalysingSingleIdx === i ? styles.spinning : ''} />
                          </button>
                          <button
                            style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(194,65,12,0.85)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                            onClick={(e) => { e.stopPropagation(); setAiEditPhotoUri(p.uri); }}
                            title="AI image edit"
                          >
                            <Sparkles size={10} />
                          </button>
                        </div>
                      )}
                      <button
                        style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePhotoIdx(i);
                        }}
                        title="Delete photo"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* Analysis — editable */}
                    <div style={{ flex: 1, padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {analysis ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-data)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {analysis.conditionScore}/10
                            </span>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>condition</span>
                          </div>
                          <EditableText
                            value={analysis.narrative}
                            multiline
                            onSave={async (v) => {
                              const saved = await updateInspectionPhotoAnalysis(record.id, i, 'narrative', v);
                              if (!saved) throw new Error('Could not save changes. Check you are signed in and try again.');
                              setRecord((prev) => replacePhotoNarrativeInInspection(prev, i, v));
                            }}
                            className={styles.summary}
                          />
                          {analysis.materials?.length > 0 && (
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                              {analysis.materials.map((m) => (
                                <span key={`${p.id}-mat-${m}`} style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.5625rem', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>{m}</span>
                              ))}
                            </div>
                          )}
                          {analysis.safetyHazard && (
                              <div
                                role="alert"
                                style={{
                                  background: 'rgba(239,68,68,0.15)',
                                  border: '1px solid rgba(239,68,68,0.4)',
                                  borderRadius: '4px',
                                  padding: '0.45rem 0.55rem',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '0.6875rem',
                                    fontFamily: 'var(--font-data)',
                                    fontWeight: 700,
                                    color: '#ef4444',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  Safety hazard identified
                                </div>
                                {safetyHazardLines.length > 0 ? (
                                  <ul
                                    style={{
                                      margin: '0.4rem 0 0',
                                      paddingLeft: '1.1rem',
                                      textTransform: 'none',
                                      fontFamily: 'var(--font-body)',
                                      fontWeight: 400,
                                      color: 'var(--text-primary)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.25rem',
                                    }}
                                  >
                                    {safetyHazardLines.map((line) => (
                                      <li key={`${p.id}-hazard-${line}`} style={{ fontSize: '0.75rem', lineHeight: 1.45 }}>
                                        {line}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p
                                    style={{
                                      margin: '0.35rem 0 0',
                                      textTransform: 'none',
                                      fontSize: '0.6875rem',
                                      fontFamily: 'var(--font-body)',
                                      fontWeight: 400,
                                      color: 'var(--text-muted)',
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    The model flagged a safety concern but did not return separate detail lines. Review the narrative above and the defect list below.
                                  </p>
                                )}
                              </div>
                          )}
                          {analysis.defects?.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {analysis.defects.map((d) => {
                                const severity = d.severity === 'moderate' ? 'minor' : d.severity;
                                const typeCode = d.defectType ?? '';
                                return (
                                  <div key={`${p.id}-defect-${typeCode}-${severity}-${d.description}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {typeCode && (
                                      <span style={{ fontSize: '0.5rem', fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '0 3px', borderRadius: '2px' }}>
                                        {typeCode}
                                      </span>
                                    )}
                                    <span style={{ fontSize: '0.5625rem', fontFamily: 'var(--font-data)', fontWeight: 600, textTransform: 'uppercase', color: severity === 'major' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                      {severity}
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                                      {d.description}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {analysis.limitations && (Array.isArray(analysis.limitations) ? analysis.limitations.length > 0 : !!analysis.limitations) && (
                            <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Limitations: {Array.isArray(analysis.limitations) ? analysis.limitations.join('; ') : String(analysis.limitations)}
                            </div>
                          )}
                          {analysis.furtherInspection && (
                            <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-body)', color: 'var(--accent-secondary)' }}>
                              Recommend: {analysis.furtherInspection} inspection
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No AI analysis for this photo</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Per-photo diff when pending analysis exists */}
                {pending && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <InlineDiff
                      title={`AI Suggestions — Photo ${i + 1}`}
                      fields={buildPhotoDiffFields(analysis, pending)}
                      onAccept={(key, newValue) => {
                        void acceptPhotoField(i, key, newValue).catch((err) => {
                          alert(err instanceof Error ? err.message : 'Save failed');
                        });
                      }}
                      onReject={(key) => rejectPhotoField(i, key)}
                      onAcceptAll={() => void acceptAllPhotoFields(i)}
                      onRejectAll={() => rejectAllPhotoFields(i)}
                    />
                  </div>
                )}
              </div>
            );
          })}
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
                const saved = await updateInspectionReportField(record.id, 'narrative', v);
                if (!saved) throw new Error('Could not save changes. Check you are signed in and try again.');
                setRecord((prev) => (prev?.report ? { ...prev, report: { ...prev.report, narrative: v } } : prev));
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
                <span className={styles.detailLabel}>Major</span>
                <span className={styles.detailValue}>{report.defectsBySeverity.major}</span>
              </div>
            </div>
          </div>

          {report.materialsObserved.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Materials Observed</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {report.materialsObserved.map((m) => (
                  <span key={`${record.id}-report-mat-${m}`} style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI edited images */}
      {Object.keys(aiEditedImages).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h2 className={styles.cardTitle}>AI Edited Images</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            {Object.entries(aiEditedImages).map(([idx, url]) => (
              <div key={idx} style={{ position: 'relative', width: '200px', height: '150px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(212,101,59,0.3)' }}>
                <ClickableImage src={url} alt={`AI edited photo ${Number(idx) + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(212,101,59,0.9)', color: '#fff', fontFamily: 'var(--font-data)', fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Generated
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiEditPhotoUri && (
        <ImageEditModal
          visible={aiEditPhotoUri !== null}
          photoUrl={aiEditPhotoUri}
          onClose={() => setAiEditPhotoUri(null)}
          onSave={async (editedDataUrl) => {
            const idx = record.photos.findIndex((p) => p.uri === aiEditPhotoUri);
            if (idx < 0) return;
            const publicUrl = await uploadEditedImage(editedDataUrl, 'inspections', record.id);
            const saved = await updateInspectionPhotoAnalysis(record.id, idx, 'aiEditedPhotoUrl', publicUrl);
            if (!saved) throw new Error('Could not save edited image. Check you are signed in and try again.');
            setAiEditedImages((prev) => ({ ...prev, [idx]: publicUrl }));
          }}
        />
      )}
    </div>
  );
}

/* ---- Helpers ---- */

function replacePhotoNarrativeInInspection(
  prev: Inspection | null,
  photoIndex: number,
  narrative: string,
): Inspection | null {
  if (!prev) return prev;
  const photos = prev.photos.map((ph, idx) =>
    idx === photoIndex
      ? { ...ph, analysis: { ...ph.analysis, narrative } as unknown as InspectionPhoto['analysis'] }
      : ph,
  );
  return { ...prev, photos };
}

/** Text to show when `safetyHazard` is true: major/moderate defects first, then any defects, then narrative. */
function safetyHazardExplanationLines(analysis: PhotoAnalysis): string[] {
  const defects = analysis.defects ?? [];
  const prominent = defects.filter((d) => {
    const s = String(d.severity ?? '').toLowerCase();
    return s === 'major' || s === 'moderate';
  });
  const fromProminent = prominent.map((d) => d.description?.trim()).filter((t): t is string => Boolean(t));
  if (fromProminent.length > 0) return fromProminent;

  const allDesc = defects.map((d) => d.description?.trim()).filter((t): t is string => Boolean(t));
  if (allDesc.length > 0) return allDesc;

  const narrative = analysis.narrative?.trim();
  if (narrative) return [narrative];

  return [];
}

const PHOTO_FIELD_LABELS: Record<string, string> = {
  conditionScore: 'Condition Score',
  narrative: 'Narrative',
  materials: 'Materials',
  defects: 'Defects',
  improvements: 'Improvements',
};

function stringifyAnalysisValue(val: unknown): string {
  if (Array.isArray(val)) {
    if (val.length > 0 && typeof val[0] === 'object') {
      return (val as { defectType?: string; severity: string; description: string }[])
        .map((d) => {
          const prefix = d.defectType ? `[${d.defectType}] ` : '';
          return `${prefix}${d.severity}: ${d.description}`;
        })
        .join('\n');
    }
    return (val as string[]).join('\n');
  }
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (typeof val === 'bigint') return val.toString();
  if (typeof val === 'symbol') return val.toString();
  if (typeof val === 'function') return '';
  return '';
}

const DEFECT_LINE_BRACKET_PREFIX = /^\[([A-F])\]\s*/;

function parseDefectsString(str: string): { defectType: string; severity: string; nature: string[]; description: string; crackingCategory: null }[] {
  return str.split('\n').filter((l) => l.trim()).map((line) => {
    const bracketMatch = DEFECT_LINE_BRACKET_PREFIX.exec(line);
    const defectType = bracketMatch?.[1] ?? 'A';
    const rest = bracketMatch ? line.slice(bracketMatch[0].length) : line;
    const colonIdx = rest.indexOf(':');
    if (colonIdx > 0) {
      const sevRaw = rest.slice(0, colonIdx).trim().toLowerCase();
      const severity = sevRaw === 'major' ? 'major' : 'minor';
      const description = rest.slice(colonIdx + 1).trim();
      return { defectType, severity, nature: ['appearance'], description, crackingCategory: null };
    }
    return { defectType, severity: 'minor', nature: ['appearance'], description: rest.trim(), crackingCategory: null };
  });
}

function parsePhotoFieldAcceptValue(
  key: string,
  value: string,
): string | number | boolean | string[] | ReturnType<typeof parseDefectsString> {
  if (key === 'materials' || key === 'improvements') {
    return value.split('\n').filter((v) => v.trim());
  }
  if (key === 'defects') {
    return parseDefectsString(value);
  }
  if (key === 'conditionScore') {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? 5 : n;
  }
  if (key === 'safetyHazard') {
    return value === 'true';
  }
  return value;
}

function buildPhotoDiffFields(
  current: PhotoAnalysis | undefined,
  pending: Record<string, unknown>,
): { key: string; label: string; oldValue: string; newValue: string }[] {
  return Object.entries(pending)
    .filter(([key]) => key in PHOTO_FIELD_LABELS)
    .map(([key, newVal]) => ({
      key,
      label: PHOTO_FIELD_LABELS[key] ?? key,
      oldValue: current
        ? stringifyAnalysisValue((current as unknown as Record<string, unknown>)[key])
        : '',
      newValue: stringifyAnalysisValue(newVal),
    }));
}
