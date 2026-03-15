import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getAppraisal } from '../../services/api';
import { colours } from '../../theme';
import type { Appraisal, ScoredComp } from '../../types/common';
import styles from '../snaps/SnapDetail.module.css';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}-${d.toLocaleDateString('en-AU', { month: 'short' })}-${String(d.getFullYear()).slice(2)}`;
}

function AdjustIcon({ dir }: { dir: string | null }) {
  if (dir === 'superior') return <TrendingUp size={14} color={colours.sage} />;
  if (dir === 'inferior') return <TrendingDown size={14} color={colours.brick} />;
  return <Minus size={14} color={colours.stone600} />;
}

export default function AppraisalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Appraisal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void getAppraisal(id).then((d) => { setRecord(d); setLoading(false); });
  }, [id]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!record) return <p className={styles.loading}>Appraisal not found.</p>;

  const est = record.priceEstimate;
  const comps = record.scoredComps.filter((c: ScoredComp) => c.isManuallySelected || !c.isManuallySelected);

  return (
    <div className={styles.page}>
      <button className={styles.backButton} onClick={() => navigate('/app/appraisals')}>
        <ArrowLeft size={18} /> Back to Appraisals
      </button>

      <div className={styles.heroInfo}>
        <h1 className={styles.address}>{record.address}</h1>
        <div className={styles.meta}>
          <MapPin size={14} /> {record.suburb}
        </div>
      </div>

      <div className={styles.grid} style={{ marginTop: '1rem' }}>
        {/* Price estimate */}
        {est && est.estimatedValue > 0 && (
          <div className={styles.card} style={{ textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Best Estimate</span>
            <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '2rem', color: colours.terracotta, margin: '0.25rem 0' }}>
              {formatCompact(est.estimatedValue)}
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Low</span>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{formatCompact(est.rangeLow)}</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>High</span>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{formatCompact(est.rangeHigh)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontFamily: 'var(--font-data)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {est.ratePerSqm > 0 && <span>{formatCompact(est.ratePerSqm)}/m2</span>}
              <span>{est.comparablesUsed} of {est.comparablesAvailable} comps</span>
              <span style={{ textTransform: 'capitalize' }}>{est.confidence}</span>
            </div>
          </div>
        )}

        {/* Comps table */}
        {comps.length > 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Comparable Sales ({comps.length})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={thStyle}>Address</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Area</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Score</th>
                    <th style={thStyle}>Adj</th>
                  </tr>
                </thead>
                <tbody>
                  {comps.map((c: ScoredComp) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={tdStyle}>{c.address}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-data)', color: colours.terracotta }}>{formatCompact(c.salePrice)}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-data)' }}>{c.areaSqm > 0 ? `${Math.round(c.areaSqm)}` : '-'}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-data)' }}>{formatDate(c.settlementDate)}</td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-data)', fontWeight: 600 }}>{c.score.overallScore}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AdjustIcon dir={c.adjustmentDirection} />
                          {c.adjustmentPercent !== null && (
                            <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.75rem' }}>
                              {c.adjustmentPercent > 0 ? '+' : ''}{c.adjustmentPercent}%
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: 'left', padding: '0.5rem 0.5rem', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.03em' };
const tdStyle: React.CSSProperties = { padding: '0.5rem 0.5rem', color: 'var(--text-secondary)', verticalAlign: 'middle' };
