/**
 * Map legend overlay — fetches ArcGIS legend definitions and
 * filters them to only show entries visible in the current
 * viewport using the identify endpoint.
 */

import { useEffect, useState, useRef } from 'react';
import type { SpatialLayer } from './layerConstants';
import styles from './MapLegend.module.css';

interface LegendEntry {
  label: string;
  imageData: string;
  contentType: string;
  values?: string[];
}

interface LayerLegend {
  layerId: string;
  layerLabel: string;
  allEntries: LegendEntry[];
}

interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

function parseLayerInfo(layer: SpatialLayer): { baseUrl: string; layerId: number | null } {
  const match = layer.tileUrl.match(/^(https?:\/\/.+\/MapServer)\/export\?.*layers=show:(\d+)/);
  if (match) return { baseUrl: match[1]!, layerId: parseInt(match[2]!, 10) };
  const baseMatch = layer.tileUrl.match(/^(https?:\/\/.+\/MapServer)\/export/);
  return { baseUrl: baseMatch?.[1] ?? '', layerId: null };
}

/** Fetch full legend definition (cached per layer) */
async function fetchLegend(layer: SpatialLayer): Promise<LayerLegend | null> {
  const { baseUrl, layerId } = parseLayerInfo(layer);
  if (!baseUrl) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${baseUrl}/legend?f=json`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      layers?: {
        layerId: number;
        layerName: string;
        legend: { label: string; imageData: string; contentType: string; values?: string[] }[];
      }[];
    };

    if (!data.layers?.length) return null;

    const target = layerId !== null
      ? data.layers.find((l) => l.layerId === layerId)
      : data.layers[0];

    if (!target?.legend?.length) return null;

    return {
      layerId: layer.id,
      layerLabel: layer.label,
      allEntries: target.legend.filter((e) => e.imageData?.length > 0),
    };
  } catch {
    return null;
  }
}

/** Query which feature values exist in the viewport via identify */
async function fetchVisibleValues(
  layer: SpatialLayer,
  bounds: MapBounds,
): Promise<Set<string> | null> {
  const { baseUrl, layerId } = parseLayerInfo(layer);
  if (!baseUrl || layerId === null) return null;

  try {
    const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
    const url = `${baseUrl}/identify?` +
      `geometry=${encodeURIComponent(JSON.stringify({ xmin: bounds.west, ymin: bounds.south, xmax: bounds.east, ymax: bounds.north, spatialReference: { wkid: 4326 } }))}` +
      `&geometryType=esriGeometryEnvelope` +
      `&sr=4326` +
      `&layers=visible:${layerId}` +
      `&tolerance=0` +
      `&mapExtent=${bbox}` +
      `&imageDisplay=512,512,96` +
      `&returnGeometry=false` +
      `&f=json`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) return null;

    const data = (await response.json()) as {
      results?: { attributes?: Record<string, unknown> }[];
    };

    if (!data.results?.length) return null;

    const values = new Set<string>();
    for (const result of data.results) {
      const attrs = result.attributes;
      if (!attrs) continue;
      // Collect SYM_CODE (zoning), LAY_CLASS, or any display value
      const symCode = attrs['SYM_CODE'] ?? attrs['LAY_CLASS'] ?? attrs['CATEGORY'] ?? attrs['CLASS'];
      if (typeof symCode === 'string' && symCode) values.add(symCode);
    }

    return values.size > 0 ? values : null;
  } catch {
    return null;
  }
}

interface MapLegendProps {
  activeLayers: SpatialLayer[];
  bounds?: MapBounds | null;
  daActive?: boolean;
  daZoomedIn?: boolean;
  daCount?: number;
}

const DA_STATUS_COLOURS = [
  { label: 'Approved', colour: '#8B9080' },
  { label: 'Under Assessment', colour: '#B0A08A' },
  { label: 'On Exhibition', colour: '#3B82F6' },
  { label: 'Refused', colour: '#DC2626' },
  { label: 'Other', colour: '#78716C' },
];

export function MapLegend({ activeLayers, bounds, daActive, daZoomedIn, daCount }: MapLegendProps) {
  const [legends, setLegends] = useState<Record<string, LayerLegend>>({});
  const [visibleValues, setVisibleValues] = useState<Record<string, Set<string>>>({});
  const boundsDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fetchedLayersRef = useRef<Set<string>>(new Set());

  // Fetch legend definitions for active layers
  useEffect(() => {
    const activeIds: Set<string> = new Set(activeLayers.map((l) => l.id));

    // Clean up removed layers (use callback to avoid dependency on legends)
    setLegends((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(next)) {
        if (!activeIds.has(key)) {
          delete next[key];
          fetchedLayersRef.current.delete(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    // Fetch legends for new layers
    for (const layer of activeLayers) {
      if (!fetchedLayersRef.current.has(layer.id)) {
        fetchedLayersRef.current.add(layer.id);
        void fetchLegend(layer).then((legend) => {
          if (legend) {
            setLegends((prev) => ({ ...prev, [layer.id]: legend }));
          }
        });
      }
    }
  }, [activeLayers]);

  // Fetch visible values when bounds change (debounced)
  useEffect(() => {
    if (!bounds || activeLayers.length === 0) return;

    if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current);

    boundsDebounceRef.current = setTimeout(() => {
      for (const layer of activeLayers) {
        void fetchVisibleValues(layer, bounds).then((values) => {
          if (values) {
            setVisibleValues((prev) => ({ ...prev, [layer.id]: values }));
          }
        });
      }
    }, 600);

    return () => {
      if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current);
    };
  }, [bounds, activeLayers]);

  const renderedLegends = activeLayers
    .map((l) => legends[l.id])
    .filter((l): l is LayerLegend => !!l);

  const hasAnything = renderedLegends.length > 0 || daActive;
  if (!hasAnything) return null;

  return (
    <div className={styles.container}>
      {renderedLegends.map((legend) => {
        const viewport = visibleValues[legend.layerId];

        // Filter entries to viewport if we have identify results
        const entries = viewport
          ? legend.allEntries.filter((e) => {
              if (!e.label) return false;
              // Match by label text or by values array
              if (viewport.has(e.label)) return true;
              if (e.values?.some((v) => viewport.has(v))) return true;
              // Fuzzy: check if any viewport value starts with the label code
              for (const val of viewport) {
                if (e.label.startsWith(val) || val.startsWith(e.label.split(' ')[0] ?? '')) return true;
              }
              return false;
            })
          : legend.allEntries.slice(0, 15);

        if (entries.length === 0) return null;

        return (
          <div key={legend.layerId} className={styles.legendCard}>
            <div className={styles.legendTitle}>
              {legend.layerLabel}
              {viewport && <span className={styles.viewportBadge}>viewport</span>}
            </div>
            <div className={styles.entries}>
              {entries.map((entry, i) => (
                <div key={i} className={styles.entry}>
                  <img
                    src={`data:${entry.contentType};base64,${entry.imageData}`}
                    alt=""
                    className={styles.swatch}
                  />
                  <span className={styles.entryLabel}>{entry.label || '\u00A0'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* DA status legend */}
      {daActive && (
        <div className={styles.legendCard}>
          <div className={styles.legendTitle}>Development Applications</div>
          {!daZoomedIn ? (
            <div className={styles.zoomMsg}>Zoom in to view DAs</div>
          ) : (
            <div className={styles.entries}>
              {DA_STATUS_COLOURS.map((s) => (
                <div key={s.label} className={styles.entry}>
                  <span className={styles.daDot} style={{ backgroundColor: s.colour }} />
                  <span className={styles.entryLabel}>{s.label}</span>
                </div>
              ))}
              {(daCount ?? 0) > 0 && (
                <div className={styles.daCount}>{daCount} DA{daCount !== 1 ? 's' : ''} in view</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
