import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Shield, Lightbulb, AlertTriangle } from 'lucide-react';
import { getSnap, updateSnapAnalysisField } from '../../services/api';
import { EditableText } from '../../components/shared/EditableText';
import { colours } from '../../theme';
import type { Snap } from '../../types/common';
import styles from './SnapDetail.module.css';

export default function SnapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [snap, setSnap] = useState<Snap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void getSnap(id).then((data) => { setSnap(data); setLoading(false); });
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!snap) return <p className={styles.loading}>Snap not found.</p>;

  const analysis = snap.aiAnalysis;

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate('/app/snaps')}>
        <ArrowLeft size={18} /> Back to Snaps
      </button>

      <div className={styles.heroSection}>
        {snap.photoUrl && (
          <div className={styles.photoContainer}>
            <img src={snap.photoUrl} alt={snap.address} className={styles.photo} />
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
        <div className={styles.grid}>
          {/* AI Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>AI Assessment</h2>
            <EditableText
              value={analysis.summary}
              multiline
              onSave={async (v) => {
                await updateSnapAnalysisField(snap.id, 'summary', v);
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
                        await updateSnapAnalysisField(snap.id, 'observations', updated);
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
                        await updateSnapAnalysisField(snap.id, 'risks', updated);
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
                        await updateSnapAnalysisField(snap.id, 'opportunities', updated);
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
