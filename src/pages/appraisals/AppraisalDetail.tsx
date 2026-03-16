import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, TrendingUp, TrendingDown, Minus, Trash2, Check, Footprints } from 'lucide-react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getAppraisal, deleteAppraisal } from '../../services/api';
import { computeWalkingRoute, type WalkingRouteResult } from '../../services/walkingRoute';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectedComp, setInspectedComp] = useState<ScoredComp | null>(null);
  const [walkRoute, setWalkRoute] = useState<WalkingRouteResult | null>(null);

  useEffect(() => {
    if (!id) return;
    void getAppraisal(id).then((d) => {
      setRecord(d);
      setLoading(false);
      // Pre-select manually selected comps
      if (d) {
        const preSelected: Set<string> = new Set(d.scoredComps.filter((c) => c.isManuallySelected).map((c) => c.id));
        setSelectedIds(preSelected);
      }
    });
  }, [id]);

  const toggleSelection = useCallback((compId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(compId)) next.delete(compId);
      else next.add(compId);
      return next;
    });
  }, []);

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

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!record) return <p className={styles.loading}>Appraisal not found.</p>;

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
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/app/appraisals')}>
          <ArrowLeft size={18} /> Back to Appraisals
        </button>
        <button className={styles.deleteButton} onClick={async () => { if (window.confirm('Delete this appraisal?')) { await deleteAppraisal(record.id); navigate('/app/appraisals'); } }}>
          <Trash2 size={14} /> Delete
        </button>
      </div>

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
    </div>
  );
}
