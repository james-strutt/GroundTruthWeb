import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Shield, Lightbulb, AlertTriangle, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { getSnap, updateSnapAnalysisField, uploadEditedImage, deleteSnap } from '../../services/api';
import { reanalyseSnap } from '../../services/aiService';
import { EditableText } from '../../components/shared/EditableText';
import { ClickableImage } from '../../components/shared/ClickableImage';
import { ImageEditModal } from '../../components/shared/ImageEditModal';
import { InlineDiff } from '../../components/shared/InlineDiff';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { colours } from '../../theme';
import type { Snap, SnapAnalysis } from '../../types/common';
import styles from './SnapDetail.module.css';

export default function SnapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [snap, setSnap] = useState<Snap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isReanalysing, setIsReanalysing] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<Record<string, unknown> | null>(null);
  const [showAIEdit, setShowAIEdit] = useState(false);
  const [aiEditedImageUrl, setAiEditedImageUrl] = useState<string | null>(null);

  const fetchSnap = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSnap(id);
      setSnap(data);
      const persisted = (data?.aiAnalysis as Record<string, unknown> | null)?.['aiEditedPhotoUrl'];
      if (typeof persisted === 'string') setAiEditedImageUrl(persisted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load snap');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchSnap();
  }, [fetchSnap]);

  async function handleReanalyse() {
    if (!snap?.photoUrl || isReanalysing) return;
    setIsReanalysing(true);
    try {
      const newAnalysis = await reanalyseSnap(snap.photoUrl, snap.address);
      setPendingAnalysis(newAnalysis);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Re-analysis failed: ${msg}`);
    } finally {
      setIsReanalysing(false);
    }
  }

  async function applyAnalysisField(key: string, value: string) {
    if (!snap) return;
    const ok = await updateSnapAnalysisField(snap.id, key, key === 'observations' || key === 'risks' || key === 'opportunities'
      ? value.split('\n').filter((v) => v.trim())
      : key === 'storeys' ? parseInt(value, 10) || null
      : key === 'confidenceScore' ? parseFloat(value) || 0
      : value);
    if (!ok) throw new Error('Could not save changes. Check you are signed in and try again.');
    // Update local state
    setSnap((prev) => prev?.aiAnalysis ? {
      ...prev,
      aiAnalysis: { ...prev.aiAnalysis, [key]: key === 'observations' || key === 'risks' || key === 'opportunities'
        ? value.split('\n').filter((v) => v.trim()) : value } as SnapAnalysis,
    } : prev);
    // Remove from pending
    setPendingAnalysis((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      delete next[key];
      return Object.keys(next).length > 0 ? next : null;
    });
  }

  function rejectField(key: string) {
    setPendingAnalysis((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      delete next[key];
      return Object.keys(next).length > 0 ? next : null;
    });
  }

  async function acceptAllChanges() {
    if (!pendingAnalysis || !snap) return;
    try {
      for (const [key, value] of Object.entries(pendingAnalysis)) {
        const strVal = Array.isArray(value) ? (value as string[]).join('\n') : String(value ?? '');
        await applyAnalysisField(key, strVal);
      }
      setPendingAnalysis(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  }

  if (loading) return <LoadingSpinner message="Loading snap..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => { setError(null); void fetchSnap(); }} />;
  if (!snap) return <ErrorMessage type="notFound" message="Snap not found" />;

  const analysis = snap.aiAnalysis;

  return (
    <div className={styles.page}>
      <Breadcrumb segments={[{ label: 'Dashboard', path: '/app' }, { label: 'Snaps', path: '/app/snaps' }, { label: snap.address }]} />
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/app/snaps')}>
          <ArrowLeft size={18} /> Back to Snaps
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
          title="Delete Snap"
          message="Delete this snap? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await deleteSnap(snap.id);
            navigate('/app/snaps');
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className={styles.heroSection}>
        {snap.photoUrl && (
          <div className={styles.photoContainer}>
            <ClickableImage src={snap.photoUrl} alt={snap.address} className={styles.photo} />
          </div>
        )}
        {aiEditedImageUrl && (
          <div className={styles.photoContainer} style={{ position: 'relative' }}>
            <ClickableImage src={aiEditedImageUrl} alt={`${snap.address} (AI edited)`} className={styles.photo} />
            <span style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: 'rgba(212,101,59,0.9)', color: '#fff', fontFamily: 'var(--font-data)', fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AI Generated
            </span>
          </div>
        )}
        <div className={styles.heroInfo}>
          <h1 className={styles.address}>{snap.address}</h1>
          <div className={styles.meta}>
            <MapPin size={14} /> {snap.suburb}
            <span className={styles.dot} />
            {new Date(snap.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {analysis && (
        <>
        {snap.photoUrl && (
          <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button
              className={styles.reanalyseBtn}
              onClick={() => void handleReanalyse()}
              disabled={isReanalysing}
            >
              <RefreshCw size={14} className={isReanalysing ? styles.spinning : ''} />
              {isReanalysing ? 'Analysing...' : 'Re-analyse'}
            </button>
            <button
              className={styles.reanalyseBtn}
              onClick={() => setShowAIEdit(true)}
            >
              <Sparkles size={14} />
              AI Edit
            </button>
          </div>
        )}

        {pendingAnalysis && (
          <div style={{ marginBottom: '1rem' }}>
            <InlineDiff
              title="AI Re-analysis Results"
              fields={buildDiffFields(analysis, pendingAnalysis)}
              onAccept={(key, value) => void applyAnalysisField(key, value)}
              onReject={rejectField}
              onAcceptAll={() => void acceptAllChanges()}
              onRejectAll={() => setPendingAnalysis(null)}
            />
          </div>
        )}

        <div className={styles.grid}>
          {/* AI Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>AI Assessment</h2>
            <EditableText
              value={analysis.summary}
              multiline
              onSave={async (v) => {
                const saved = await updateSnapAnalysisField(snap.id, 'summary', v);
                if (!saved) throw new Error('Could not save changes. Check you are signed in and try again.');
                setSnap((prev) => prev && prev.aiAnalysis ? { ...prev, aiAnalysis: { ...prev.aiAnalysis, summary: v } } : prev);
              }}
              className={styles.summary}
            />
            <div className={styles.detailGrid}>
              <DetailItem label="Property type" value={analysis.propertyType} />
              <DetailItem label="Condition" value={analysis.condition} colour={colours.terracotta} />
              <DetailItem label="Estimated age" value={analysis.estimatedAge ?? 'Unknown'} />
              <DetailItem label="Storeys" value={analysis.storeys ? String(analysis.storeys) : 'Unknown'} />
              <DetailItem label="Construction" value={analysis.constructionMaterial ?? 'Unknown'} />
              <DetailItem label="Roof" value={analysis.roofMaterial ?? 'Unknown'} />
            </div>
          </div>

          {/* Observations */}
          {analysis.observations.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><Shield size={16} /> Observations</h2>
              <ul className={styles.list}>
                {analysis.observations.map((o, i) => (
                  <li key={i}>
                    <EditableText
                      value={o}
                      onSave={async (v) => {
                        const updated = [...analysis.observations];
                        updated[i] = v;
                        const saved = await updateSnapAnalysisField(snap.id, 'observations', updated);
                        if (!saved) throw new Error('Could not save changes. Check you are signed in and try again.');
                        setSnap((prev) => prev && prev.aiAnalysis ? { ...prev, aiAnalysis: { ...prev.aiAnalysis, observations: updated } } : prev);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><AlertTriangle size={16} /> Risks</h2>
              <ul className={styles.list}>
                {analysis.risks.map((r, i) => (
                  <li key={i} className={styles.riskItem}>
                    <EditableText
                      value={r}
                      onSave={async (v) => {
                        const updated = [...analysis.risks];
                        updated[i] = v;
                        const saved = await updateSnapAnalysisField(snap.id, 'risks', updated);
                        if (!saved) throw new Error('Could not save changes. Check you are signed in and try again.');
                        setSnap((prev) => prev && prev.aiAnalysis ? { ...prev, aiAnalysis: { ...prev.aiAnalysis, risks: updated } } : prev);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities */}
          {analysis.opportunities.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}><Lightbulb size={16} /> Opportunities</h2>
              <ul className={styles.list}>
                {analysis.opportunities.map((o, i) => (
                  <li key={i}>
                    <EditableText
                      value={o}
                      onSave={async (v) => {
                        const updated = [...analysis.opportunities];
                        updated[i] = v;
                        const saved = await updateSnapAnalysisField(snap.id, 'opportunities', updated);
                        if (!saved) throw new Error('Could not save changes. Check you are signed in and try again.');
                        setSnap((prev) => prev && prev.aiAnalysis ? { ...prev, aiAnalysis: { ...prev.aiAnalysis, opportunities: updated } } : prev);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Confidence</h2>
            <div className={styles.confidenceBar}>
              <div className={styles.confidenceFill} style={{ width: `${Math.round(analysis.confidenceScore * 100)}%` }} />
            </div>
            <span className={styles.confidenceLabel}>{Math.round(analysis.confidenceScore * 100)}%</span>
          </div>
        </div>
        </>
      )}

      {snap.photoUrl && (
        <ImageEditModal
          visible={showAIEdit}
          photoUrl={snap.photoUrl}
          onClose={() => setShowAIEdit(false)}
          onSave={async (editedDataUrl) => {
            const publicUrl = await uploadEditedImage(editedDataUrl, 'snaps', snap.id);
            const saved = await updateSnapAnalysisField(snap.id, 'aiEditedPhotoUrl', publicUrl);
            if (!saved) throw new Error('Could not save edited image. Check you are signed in and try again.');
            setAiEditedImageUrl(publicUrl);
          }}
        />
      )}
    </div>
  );
}

function DetailItem({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue} style={colour ? { color: colour } : undefined}>{value}</span>
    </div>
  );
}

function stringify(val: unknown): string {
  if (Array.isArray(val)) return (val as string[]).join('\n');
  if (val === null || val === undefined) return '';
  return String(val);
}

function buildDiffFields(
  current: SnapAnalysis,
  pending: Record<string, unknown>,
): { key: string; label: string; oldValue: string; newValue: string }[] {
  const fieldLabels: Record<string, string> = {
    summary: 'Summary',
    propertyType: 'Property type',
    condition: 'Condition',
    estimatedAge: 'Estimated age',
    storeys: 'Storeys',
    constructionMaterial: 'Construction material',
    roofMaterial: 'Roof material',
    observations: 'Observations',
    risks: 'Risks',
    opportunities: 'Opportunities',
    confidenceScore: 'Confidence',
  };

  return Object.entries(pending)
    .filter(([key]) => key in fieldLabels)
    .map(([key, newVal]) => ({
      key,
      label: fieldLabels[key] ?? key,
      oldValue: stringify((current as unknown as Record<string, unknown>)[key]),
      newValue: stringify(newVal),
    }));
}
