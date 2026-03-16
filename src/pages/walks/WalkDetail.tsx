import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Ruler, Trash2, RefreshCw } from 'lucide-react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getWalk, updateWalkField, deleteWalk } from '../../services/api';
import { reanalyseWalkPhoto } from '../../services/aiService';
import { EditableText } from '../../components/shared/EditableText';
import { InlineDiff } from '../../components/shared/InlineDiff';
import { colours } from '../../theme';
import type { WalkSession } from '../../types/common';
import styles from '../snaps/SnapDetail.module.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

function scoreColour(score: number): string {
  if (score >= 75) return colours.sageBright;
  if (score >= 55) return colours.amber;
  if (score >= 35) return colours.copper;
  return colours.brick;
}

export default function WalkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<WalkSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReanalysing, setIsReanalysing] = useState(false);
  const [pendingNarrative, setPendingNarrative] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void getWalk(id).then((d) => { setRecord(d); setLoading(false); });
  }, [id]);

  async function handleReanalyse() {
    if (!record || record.photos.length === 0 || isReanalysing) return;
    const photoUrl = record.photos[0]?.uri;
    if (!photoUrl || !photoUrl.startsWith('http')) {
      alert('Photos not synced to cloud. Re-sync from the iOS app first.');
      return;
    }
    setIsReanalysing(true);
    try {
      const result = await reanalyseWalkPhoto(photoUrl, record.title || record.suburb);
      const narrative = (result['notableFeatures'] as string[] ?? []).join('. ') +
        '. ' + (result['concerns'] as string[] ?? []).join('. ');
      if (narrative.trim().length > 2) setPendingNarrative(narrative);
    } catch (err: unknown) {
      alert(`Re-analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsReanalysing(false);
    }
  }

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!record) return <p className={styles.loading}>Walk session not found.</p>;

  const routeGeoJson: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: record.route,
    },
  };

  const startCoord = record.route[0];
  const midIdx = Math.floor(record.route.length / 2);
  const midCoord = record.route[midIdx] ?? startCoord;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/app/walks')}>
          <ArrowLeft size={18} /> Back to Walks
        </button>
        <button className={styles.deleteButton} onClick={async () => { if (window.confirm('Delete this walk session?')) { await deleteWalk(record.id); navigate('/app/walks'); } }}>
          <Trash2 size={14} /> Delete
        </button>
      </div>

      <div className={styles.heroInfo}>
        <h1 className={styles.address}>{record.title || record.suburb}</h1>
        <div className={styles.meta}>
          <MapPin size={14} /> {record.suburb}
          <span className={styles.dot} />
          {new Date(record.startedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Re-analyse button */}
      {record.photos.length > 0 && (
        <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          <button className={styles.reanalyseBtn} onClick={() => void handleReanalyse()} disabled={isReanalysing}>
            <RefreshCw size={14} className={isReanalysing ? styles.spinning : ''} />
            {isReanalysing ? 'Analysing...' : 'Re-analyse with AI'}
          </button>
        </div>
      )}

      {/* Pending narrative diff */}
      {pendingNarrative && (
        <div style={{ marginBottom: '1rem' }}>
          <InlineDiff
            title="AI Re-analysis"
            fields={[{ key: 'narrative', label: 'Analysis Narrative', oldValue: record.analysisNarrative ?? '', newValue: pendingNarrative }]}
            onAccept={async (_key, value) => {
              await updateWalkField(record.id, { analysis_narrative: value });
              setRecord((prev) => prev ? { ...prev, analysisNarrative: value } : prev);
              setPendingNarrative(null);
            }}
            onReject={() => setPendingNarrative(null)}
            onAcceptAll={async () => {
              await updateWalkField(record.id, { analysis_narrative: pendingNarrative });
              setRecord((prev) => prev ? { ...prev, analysisNarrative: pendingNarrative } : prev);
              setPendingNarrative(null);
            }}
            onRejectAll={() => setPendingNarrative(null)}
          />
        </div>
      )}

      {/* Walk metrics */}
      <div className={styles.card} style={{ marginTop: '1rem' }}>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}><Ruler size={12} /> Distance</span>
            <span className={styles.detailValue}>{formatDistance(record.totalDistanceMetres)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}><Clock size={12} /> Duration</span>
            <span className={styles.detailValue}>{formatDuration(record.durationSeconds)}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Photos</span>
            <span className={styles.detailValue}>{record.photos.length}</span>
          </div>
        </div>
      </div>

      {/* Route map */}
      {record.route.length > 1 && midCoord && (
        <div style={{ height: '300px', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: midCoord[0],
              latitude: midCoord[1],
              zoom: 15,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
          >
            <Source id="walk-route" type="geojson" data={routeGeoJson}>
              <Layer
                id="walk-route-line"
                type="line"
                paint={{
                  'line-color': colours.sageBright,
                  'line-width': 4,
                  'line-dasharray': [2, 1.5],
                }}
              />
            </Source>
          </Map>
        </div>
      )}

      {/* Street scores */}
      {record.streetScore && (
        <div className={styles.card} style={{ marginTop: '1rem' }}>
          <h2 className={styles.cardTitle}>Street Score</h2>
          <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-brand)', fontSize: '2rem', color: scoreColour(record.streetScore.overall) }}>
              {record.streetScore.overall}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div className={styles.detailGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {(['walkability', 'streetscape', 'amenity', 'safety'] as const).map((dim) => {
              const d = record.streetScore![dim];
              return (
                <div key={dim} className={styles.detailItem}>
                  <span className={styles.detailLabel} style={{ textTransform: 'capitalize' }}>{dim}</span>
                  <span className={styles.detailValue} style={{ color: scoreColour(d.score) }}>{d.score}/100</span>
                  {d.notes && <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{d.notes}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI narrative */}
      {record.analysisNarrative && (
        <div className={styles.card} style={{ marginTop: '1rem' }}>
          <h2 className={styles.cardTitle}>AI Analysis</h2>
          <EditableText
            value={record.analysisNarrative ?? ''}
            multiline
            onSave={async (v) => {
              await updateWalkField(record.id, { analysis_narrative: v });
              setRecord((prev) => prev ? { ...prev, analysisNarrative: v } : prev);
            }}
            className={styles.summary}
          />
        </div>
      )}
    </div>
  );
}
