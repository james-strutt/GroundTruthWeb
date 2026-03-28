import { useState, useMemo, useCallback } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { ScoredComp } from '../../types/common';
import styles from './CompsMap.module.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';

interface CompsMapProps {
  subject: { latitude: number; longitude: number; address: string };
  comps: ScoredComp[];
}

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

function adjustmentColourClass(dir: string | null): string {
  if (dir === 'inferior') return styles.compDotInferior;
  if (dir === 'superior') return styles.compDotSuperior;
  return styles.compDotSimilar;
}

function adjustmentLabel(dir: string | null, pct: number | null): string {
  if (!dir) return 'Similar';
  const prefix = dir === 'inferior' ? 'Upward' : dir === 'superior' ? 'Downward' : 'None';
  if (pct != null) return `${prefix} ${pct > 0 ? '+' : ''}${pct}%`;
  return prefix;
}

/** Generates a GeoJSON circle polygon for radius rings. */
function circleGeoJson(
  center: [number, number],
  radiusMetres: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const earthRadius = 6_371_000;
  const lat = (center[1] * Math.PI) / 180;
  const lng = (center[0] * Math.PI) / 180;
  const d = radiusMetres / earthRadius;
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const bearing = (2 * Math.PI * i) / points;
    const pLat = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(bearing));
    const pLng = lng + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(pLat));
    coords.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI]);
  }
  return { type: 'Feature', properties: { radius: radiusMetres }, geometry: { type: 'Polygon', coordinates: [coords] } };
}

export function CompsMap({ subject, comps }: CompsMapProps) {
  const [popupComp, setPopupComp] = useState<ScoredComp | null>(null);

  const mappableComps = useMemo(
    () => comps.filter((c) => c.latitude != null && c.longitude != null),
    [comps],
  );

  const radiusRings = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: [500, 1000, 2000].map((r) =>
      circleGeoJson([subject.longitude, subject.latitude], r),
    ),
  }), [subject.latitude, subject.longitude]);

  const handleCompClick = useCallback((comp: ScoredComp) => {
    setPopupComp((prev) => (prev?.id === comp.id ? null : comp));
  }, []);

  if (!MAPBOX_TOKEN) return null;

  return (
    <>
      <h2 className={styles.sectionTitle}>Comparable Sales Map</h2>
      <div className={styles.container}>
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: subject.longitude,
            latitude: subject.latitude,
            zoom: 14.5,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          <NavigationControl position="top-right" />

          {/* Radius rings */}
          <Source id="radius-rings" type="geojson" data={radiusRings}>
            <Layer
              id="radius-rings-stroke"
              type="line"
              paint={{
                'line-color': '#D4653B',
                'line-width': 1,
                'line-opacity': 0.35,
                'line-dasharray': [4, 3],
              }}
            />
          </Source>

          {/* Subject marker */}
          <Marker
            longitude={subject.longitude}
            latitude={subject.latitude}
            anchor="center"
          >
            <div className={styles.subjectPin} />
          </Marker>

          {/* Comp markers */}
          {mappableComps.map((comp) => (
            <Marker
              key={comp.id}
              longitude={comp.longitude!}
              latitude={comp.latitude!}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleCompClick(comp);
              }}
            >
              <div className={styles.compPin}>
                <div className={`${styles.compDot} ${adjustmentColourClass(comp.adjustmentDirection)}`} />
                <span className={styles.compLabel}>{formatCompact(comp.salePrice)}</span>
              </div>
            </Marker>
          ))}

          {/* Popup */}
          {popupComp && popupComp.latitude != null && popupComp.longitude != null && (
            <Popup
              longitude={popupComp.longitude!}
              latitude={popupComp.latitude!}
              anchor="bottom"
              offset={20}
              closeOnClick={false}
              onClose={() => setPopupComp(null)}
              className={styles.popup}
            >
              <div className={styles.popupContent}>
                <div className={styles.popupAddress}>{popupComp.address}</div>
                <div className={styles.popupGrid}>
                  <div className={styles.popupItem}>
                    <span className={styles.popupLabel}>Sale price</span>
                    <span className={styles.popupValue}>{formatCompact(popupComp.salePrice)}</span>
                  </div>
                  {popupComp.settlementDate && (
                    <div className={styles.popupItem}>
                      <span className={styles.popupLabel}>Settled</span>
                      <span className={styles.popupValue}>{formatDate(popupComp.settlementDate)}</span>
                    </div>
                  )}
                  <div className={styles.popupItem}>
                    <span className={styles.popupLabel}>Adjustment</span>
                    <span className={styles.popupValue}>
                      {adjustmentLabel(popupComp.adjustmentDirection, popupComp.adjustmentPercent)}
                    </span>
                  </div>
                  {popupComp.distanceMetres > 0 && (
                    <div className={styles.popupItem}>
                      <span className={styles.popupLabel}>Distance</span>
                      <span className={styles.popupValue}>{formatDistance(popupComp.distanceMetres)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Colour legend */}
        <div className={styles.colourLegend}>
          <div className={styles.colourLegendRow}>
            <div className={`${styles.legendDot} ${styles.legendDotSubject}`} />
            Subject
          </div>
          <div className={styles.colourLegendRow}>
            <div className={`${styles.legendDot} ${styles.legendDotInferior}`} />
            Inferior (upward adj.)
          </div>
          <div className={styles.colourLegendRow}>
            <div className={`${styles.legendDot} ${styles.legendDotSimilar}`} />
            Similar
          </div>
          <div className={styles.colourLegendRow}>
            <div className={`${styles.legendDot} ${styles.legendDotSuperior}`} />
            Superior (downward adj.)
          </div>
        </div>

        {/* Radius legend */}
        <div className={styles.radiusLegend}>
          <div className={styles.radiusLegendRow}>
            <span className={styles.radiusLegendSwatch} />
            500 m / 1 km / 2 km
          </div>
        </div>
      </div>
    </>
  );
}
