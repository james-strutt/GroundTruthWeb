import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Ruler, Trash2, RefreshCw } from 'lucide-react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getWalk, updateWalkField, deleteWalk } from '../../services/api';
import { reanalyseWalkPhoto } from '../../services/aiService';
import { EditableText } from '../../components/shared/EditableText';
import { InlineDiff } from '../../components/shared/InlineDiff';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
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
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isReanalysing, setIsReanalysing] = useState(false);
  const [pendingNarrative, setPendingNarrative] = useState<string | null>(null);
  const [pendingStreetScore, setPendingStreetScore] = useState<Record<string, unknown> | null>(null);

  const fetchWalk = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await getWalk(id);
      setRecord(d);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load walk');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchWalk();
  }, [fetchWalk]);

  async function handleReanalyse(): Promise<void> {
    if (!record || record.photos.length === 0 || isReanalysing) return;

    const cloudPhotos = record.photos.filter((p) => p.uri.startsWith('http'));
    if (cloudPhotos.length === 0) {
      alert('Photos not synced to cloud. Re-sync from the iOS app first.');
      return;
    }

    setIsReanalysing(true);
    try {
      const scores = { walkability: [] as number[], streetscape: [] as number[], amenity: [] as number[], safety: [] as number[] };
      const notes = { walkability: [] as string[], streetscape: [] as string[], amenity: [] as string[], safety: [] as string[] };
      const allFeatures: string[] = [];
      const allConcerns: string[] = [];

      for (const photo of cloudPhotos) {
        try {
          const result = await reanalyseWalkPhoto(photo.uri, record.title || record.suburb);
          for (const dim of ['walkability', 'streetscape', 'amenity', 'safety'] as const) {
            const d = result[dim] as { score?: number; notes?: string } | undefined;
            if (d?.score) scores[dim].push(d.score);
            if (d?.notes) notes[dim].push(d.notes);
          }
          const features = result['notableFeatures'] as string[] ?? [];
          const concerns = result['concerns'] as string[] ?? [];
          allFeatures.push(...features);
          allConcerns.push(...concerns);
        } catch {
          // Skip failed photos
        }
      }

      const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 50;
      const dedupe = (arr: string[]) => [...new Set(arr)].join('. ');

      const newScore = {
        walkability: { score: avg(scores.walkability), notes: dedupe(notes.walkability) },
        streetscape: { score: avg(scores.streetscape), notes: dedupe(notes.streetscape) },
        amenity: { score: avg(scores.amenity), notes: dedupe(notes.amenity) },
        safety: { score: avg(scores.safety), notes: dedupe(notes.safety) },
        overall: avg([avg(scores.walkability), avg(scores.streetscape), avg(scores.amenity), avg(scores.safety)]),
      };

      setPendingStreetScore(newScore);

      const narrative = dedupe(allFeatures) + '. ' + dedupe(allConcerns);
      if (narrative.trim().length > 2) setPendingNarrative(narrative);
    } catch (err: unknown) {
      alert(`Re-analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsReanalysing(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading walk..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => { setError(null); void fetchWalk(); }} />;
  if (!record) return <ErrorMessage type="notFound" message="Walk session not found" />;

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
      <Breadcrumb segments={[{ label: 'Dashboard', path: '/app' }, { label: 'Walks', path: '/app/walks' }, { label: record.title || record.suburb }]} />
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/app/walks')}>
          <ArrowLeft size={18} /> Back to Walks
        </button>
        <button className={styles.deleteButton} onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Walk"
          message="Delete this walk session? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await deleteWalk(record.id);
            navigate('/app/walks');
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

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
            {isReanalysing ? `Analysing ${record.photos.filter((p) => p.uri.startsWith('http')).length} photos...` : 'Re-analyse'}
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
                  'line-color': '#66ff66',
                  'line-width': 5,
                  'line-opacity': 0.9,
                  'line-dasharray': [2, 1],
                }}
              />
            </Source>
          </Map>
        </div>
      )}

      {/* Street score diff from re-analysis */}
      {pendingStreetScore && record.streetScore && (
        <div style={{ marginTop: '1rem' }}>
          <InlineDiff
            title="AI Street Score Update"
            fields={(['walkability', 'streetscape', 'amenity', 'safety'] as const).map((dim) => ({
              key: `${dim}_notes`,
              label: `${dim.charAt(0).toUpperCase()}${dim.slice(1)} (${(pendingStreetScore[dim] as { score: number })?.score ?? '?'}/100)`,
              oldValue: record.streetScore![dim].notes,
              newValue: (pendingStreetScore[dim] as { notes: string })?.notes ?? '',
            }))}
            onAccept={async (key, value) => {
              const dim = key.replace('_notes', '') as 'walkability' | 'streetscape' | 'amenity' | 'safety';
              const newScoreObj = pendingStreetScore[dim] as { score: number; notes: string };
              const updated = {
                ...record.streetScore!,
                [dim]: { score: newScoreObj.score, notes: value },
                overall: pendingStreetScore['overall'] as number,
              };
              await updateWalkField(record.id, { street_score: updated });
              setRecord((prev) => prev ? { ...prev, streetScore: updated } : prev);
              const remaining = (['walkability', 'streetscape', 'amenity', 'safety'] as const)
                .filter((d) => d !== dim && (pendingStreetScore[d] as { notes: string })?.notes !== record.streetScore![d].notes);
              if (remaining.length === 0) setPendingStreetScore(null);
            }}
            onReject={(key) => {
              const dim = key.replace('_notes', '') as 'walkability' | 'streetscape' | 'amenity' | 'safety';
              const remaining = (['walkability', 'streetscape', 'amenity', 'safety'] as const)
                .filter((d) => d !== dim && (pendingStreetScore[d] as { notes: string })?.notes !== record.streetScore![d].notes);
              if (remaining.length === 0) setPendingStreetScore(null);
            }}
            onAcceptAll={async () => {
              await updateWalkField(record.id, { street_score: pendingStreetScore });
              setRecord((prev) => prev ? { ...prev, streetScore: pendingStreetScore as WalkSession['streetScore'] } : prev);
              setPendingStreetScore(null);
            }}
            onRejectAll={() => setPendingStreetScore(null)}
          />
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
                  <EditableText
                    value={d.notes}
                    multiline
                    onSave={async (v) => {
                      const updated = { ...record.streetScore!, [dim]: { ...d, notes: v } };
                      await updateWalkField(record.id, { street_score: updated });
                      setRecord((prev) => prev ? { ...prev, streetScore: updated } : prev);
                    }}
                    className={styles.summary}
                  />
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
