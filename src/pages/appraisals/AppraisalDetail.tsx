import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, TrendingUp, TrendingDown, Minus, Trash2, Check, Footprints } from 'lucide-react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getAppraisal, deleteAppraisal, updateAppraisalCompSelections } from '../../services/api';
import { computeWalkingRoute, type WalkingRouteResult } from '../../services/walkingRoute';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { ConfirmModal } from '../../components/shared/ConfirmModal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { colours } from '../../theme';
import type { Appraisal, ScoredComp } from '../../types/common';
import styles from './AppraisalDetail.module.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';

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

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
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
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectedComp, setInspectedComp] = useState<ScoredComp | null>(null);
  const [walkRoute, setWalkRoute] = useState<WalkingRouteResult | null>(null);

  const fetchAppraisal = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await getAppraisal(id);
      setRecord(d);
      if (d) {
        const preSelected: Set<string> = new Set(d.scoredComps.filter((c) => c.isManuallySelected).map((c) => c.id));
        setSelectedIds(preSelected);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load appraisal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchAppraisal();
  }, [fetchAppraisal]);

  const toggleSelection = useCallback((compId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(compId)) next.delete(compId);
      else next.add(compId);
      if (record) {
        void updateAppraisalCompSelections(record.id, [...next]);
      }
      return next;
    });
  }, [record]);

  // Compute walking route when selection changes
  useEffect(() => {
    if (!record || selectedIds.size === 0 || !record.latitude || !record.longitude) {
      setWalkRoute(null);
      return;
    }
    const subject = { latitude: record.latitude, longitude: record.longitude };
    const selected = record.scoredComps
      .filter((c) => selectedIds.has(c.id) && c.latitude != null && c.longitude != null)
      .map((c) => ({ latitude: c.latitude!, longitude: c.longitude! }));

    if (selected.length === 0) { setWalkRoute(null); return; }

    let cancelled = false;
    void computeWalkingRoute(subject, selected).then((route) => {
      if (!cancelled) setWalkRoute(route);
    });
    return () => { cancelled = true; };
  }, [record, selectedIds]);

  if (loading) return <LoadingSpinner message="Loading appraisal..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => { setError(null); void fetchAppraisal(); }} />;
  if (!record) return <ErrorMessage type="notFound" message="Appraisal not found" />;

  const est = record.priceEstimate;
  const mappableComps = record.scoredComps.filter((c) => c.latitude != null && c.longitude != null);

  const routeGeoJson: GeoJSON.FeatureCollection = walkRoute && walkRoute.polyline.length > 1
    ? {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: walkRoute.polyline.map((c) => [c.longitude, c.latitude]),
          },
        }],
      }
    : { type: 'FeatureCollection', features: [] };

  return (
    <div className={styles.page}>
      <Breadcrumb segments={[{ label: 'Dashboard', path: '/app' }, { label: 'Appraisals', path: '/app/appraisals' }, { label: record.address }]} />
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/app/appraisals')}>
          <ArrowLeft size={18} /> Back to Appraisals
        </button>
        <button className={styles.deleteButton} onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Appraisal"
          message="Delete this appraisal? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await deleteAppraisal(record.id);
            navigate('/app/appraisals');
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.address}>{record.address}</h1>
          <div className={styles.meta}><MapPin size={14} /> {record.suburb}</div>
        </div>
        {est && est.estimatedValue > 0 && (
          <div className={styles.estimateCompact}>
            <span className={styles.estimateLabel}>Est.</span>
            <span className={styles.estimateValue}>{formatCompact(est.estimatedValue)}</span>
            <span className={styles.estimateConf}>{est.confidence}</span>
          </div>
        )}
      </div>

      {/* Map + sidebar layout */}
      <div className={styles.mapLayout}>
        {/* Map */}
        <div className={styles.mapContainer}>
          {record.latitude && record.longitude ? (
            <Map
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{ longitude: record.longitude, latitude: record.latitude, zoom: 15 }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
            >
              <NavigationControl position="top-right" />

              {/* Walking route */}
              {routeGeoJson.features.length > 0 && (
                <Source id="walk-route" type="geojson" data={routeGeoJson}>
                  <Layer
                    id="walk-route-line"
                    type="line"
                    paint={{
                      'line-color': colours.terracotta,
                      'line-width': 3,
                      'line-dasharray': [2, 1.5],
                    }}
                  />
                </Source>
              )}

              {/* Subject marker */}
              <Marker longitude={record.longitude} latitude={record.latitude} anchor="center">
                <div className={styles.subjectPin} />
              </Marker>

              {/* Comp markers */}
              {mappableComps.map((comp) => {
                const isSelected = selectedIds.has(comp.id);
                return (
                  <Marker
                    key={comp.id}
                    longitude={comp.longitude!}
                    latitude={comp.latitude!}
                    anchor="center"
                    onClick={(e) => { e.originalEvent.stopPropagation(); setInspectedComp(comp); }}
                  >
                    <div className={`${styles.compPin} ${isSelected ? styles.compPinSelected : ''}`} />
                  </Marker>
                );
              })}
            </Map>
          ) : (
            <div className={styles.noMap}>No coordinates available</div>
          )}

          {/* Walk info overlay */}
          {walkRoute && selectedIds.size > 0 && (
            <div className={styles.walkInfo}>
              <Footprints size={14} />
              <span>{selectedIds.size} comp{selectedIds.size !== 1 ? 's' : ''}</span>
              <span className={styles.walkDot} />
              <span>{formatDistance(walkRoute.totalDistanceMetres)}</span>
              <span className={styles.walkDot} />
              <span>~{walkRoute.estimatedMinutes} min</span>
            </div>
          )}

          {/* Legend */}
          <div className={styles.legend}>
            <div className={styles.legendRow}><div className={styles.subjectPinSmall} /> Subject</div>
            <div className={styles.legendRow}><div className={styles.compPinSmall} /> Sale</div>
            <div className={styles.legendRow}><div className={styles.compPinSmallSelected} /> Selected</div>
          </div>
        </div>

        {/* Comp sidebar */}
        <div className={styles.compSidebar}>
          <h2 className={styles.sidebarTitle}>Comparable Sales ({mappableComps.length})</h2>

          {/* Inspected comp detail */}
          {inspectedComp && (
            <div className={styles.compDetail}>
              <div className={styles.compDetailHeader}>
                <span className={styles.compDetailAddress}>{inspectedComp.address}</span>
                <button className={styles.closeBtn} onClick={() => setInspectedComp(null)}>&times;</button>
              </div>
              <div className={styles.compDetailGrid}>
                <div><span className={styles.label}>Price</span><span className={styles.value}>{formatCompact(inspectedComp.salePrice)}</span></div>
                {inspectedComp.areaSqm > 0 && <div><span className={styles.label}>Area</span><span className={styles.value}>{Math.round(inspectedComp.areaSqm)} m&sup2;</span></div>}
                {inspectedComp.distanceMetres > 0 && <div><span className={styles.label}>Distance</span><span className={styles.value}>{formatDistance(inspectedComp.distanceMetres)}</span></div>}
                {inspectedComp.settlementDate && <div><span className={styles.label}>Sold</span><span className={styles.value}>{formatDate(inspectedComp.settlementDate)}</span></div>}
                <div><span className={styles.label}>Score</span><span className={styles.value}>{inspectedComp.score.overallScore}</span></div>
              </div>
              <button
                className={`${styles.selectBtn} ${selectedIds.has(inspectedComp.id) ? styles.selectBtnActive : ''}`}
                onClick={() => toggleSelection(inspectedComp.id)}
              >
                {selectedIds.has(inspectedComp.id) ? <><Check size={14} /> Selected</> : 'Add to shortlist'}
              </button>
            </div>
          )}

          {/* Comp list */}
          <div className={styles.compList}>
            {mappableComps.map((c) => (
              <button
                key={c.id}
                className={`${styles.compRow} ${selectedIds.has(c.id) ? styles.compRowSelected : ''}`}
                onClick={() => { toggleSelection(c.id); setInspectedComp(c); }}
              >
                <div className={`${styles.compRowDot} ${selectedIds.has(c.id) ? styles.compRowDotSelected : ''}`} />
                <div className={styles.compRowContent}>
                  <span className={styles.compRowAddress}>{c.address}</span>
                  <span className={styles.compRowMeta}>{formatCompact(c.salePrice)} &middot; {formatDate(c.settlementDate)}</span>
                </div>
                <div className={styles.compRowRight}>
                  <span className={styles.compRowScore}>{c.score.overallScore}</span>
                  <AdjustIcon dir={c.adjustmentDirection} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price estimate details */}
      {est && (
        <div className={styles.estimateSection}>
          <div className={styles.estimateCard}>
            <h2 className={styles.estimateCardTitle}>Price Estimate</h2>
            <div className={styles.estimateHero}>
              <span className={styles.estimateHeroValue}>{formatCompact(est.estimatedValue)}</span>
              {est.rangeLow > 0 && est.rangeHigh > 0 && (
                <span className={styles.estimateRange}>{formatCompact(est.rangeLow)} &ndash; {formatCompact(est.rangeHigh)}</span>
              )}
            </div>
            <div className={styles.estimateGrid}>
              {est.ratePerSqm > 0 && (
                <div className={styles.estimateItem}>
                  <span className={styles.estimateItemLabel}>Rate</span>
                  <span className={styles.estimateItemValue}>${Math.round(est.ratePerSqm)}/m&sup2;</span>
                </div>
              )}
              <div className={styles.estimateItem}>
                <span className={styles.estimateItemLabel}>Comps used</span>
                <span className={styles.estimateItemValue}>{est.comparablesUsed} of {est.comparablesAvailable}</span>
              </div>
              {est.generatedAt && (
                <div className={styles.estimateItem}>
                  <span className={styles.estimateItemLabel}>Generated</span>
                  <span className={styles.estimateItemValue}>{formatDate(est.generatedAt)}</span>
                </div>
              )}
            </div>
            <div className={styles.confidenceBar}>
              <div className={styles.confidenceFill} style={{ width: `${Math.round(est.confidenceScore * 100)}%` }} />
            </div>
            <span className={styles.confidenceLabel}>{est.confidence} confidence ({Math.round(est.confidenceScore * 100)}%)</span>
          </div>

          {est.methodology && (
            <div className={styles.estimateCard}>
              <h2 className={styles.estimateCardTitle}>Methodology</h2>
              <p className={styles.methodology}>{est.methodology}</p>
            </div>
          )}
        </div>
      )}

      {/* Selected comps detail */}
      {selectedIds.size > 0 && (
        <div className={styles.selectedSection}>
          <h2 className={styles.selectedTitle}>Shortlisted Comparables ({selectedIds.size})</h2>
          <div className={styles.selectedGrid}>
            {record.scoredComps.filter((c) => selectedIds.has(c.id)).map((c) => (
              <div key={c.id} className={styles.selectedCard}>
                <span className={styles.selectedCardAddress}>{c.address}</span>
                <div className={styles.selectedCardGrid}>
                  <div>
                    <span className={styles.selectedCardLabel}>Price</span>
                    <span className={styles.selectedCardValue}>{formatCompact(c.salePrice)}</span>
                  </div>
                  {c.adjustedPrice != null && c.adjustedPrice > 0 && (
                    <div>
                      <span className={styles.selectedCardLabel}>Adjusted</span>
                      <span className={styles.selectedCardValue}>{formatCompact(c.adjustedPrice)}</span>
                    </div>
                  )}
                  {c.areaSqm > 0 && (
                    <div>
                      <span className={styles.selectedCardLabel}>Area</span>
                      <span className={styles.selectedCardValue}>{Math.round(c.areaSqm)} m&sup2;</span>
                    </div>
                  )}
                  {c.settlementDate && (
                    <div>
                      <span className={styles.selectedCardLabel}>Sold</span>
                      <span className={styles.selectedCardValue}>{formatDate(c.settlementDate)}</span>
                    </div>
                  )}
                  {c.distanceMetres > 0 && (
                    <div>
                      <span className={styles.selectedCardLabel}>Distance</span>
                      <span className={styles.selectedCardValue}>{formatDistance(c.distanceMetres)}</span>
                    </div>
                  )}
                  <div>
                    <span className={styles.selectedCardLabel}>Score</span>
                    <span className={styles.selectedCardValue}>{c.score.overallScore}</span>
                  </div>
                </div>
                {c.adjustmentDirection && (
                  <span className={styles.adjustBadge}>
                    <AdjustIcon dir={c.adjustmentDirection} />
                    {c.adjustmentDirection}{c.adjustmentPercent != null ? ` ${c.adjustmentPercent > 0 ? '+' : ''}${c.adjustmentPercent}%` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
