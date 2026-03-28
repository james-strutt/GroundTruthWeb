/**
 * SpatialRiskBadges — queries NSW ArcGIS spatial services to display
 * coloured risk pills (bushfire, flood, heritage, contaminated land)
 * for a given coordinate.
 */

import { useEffect, useState } from 'react';
import { Flame, Droplets, Landmark, Skull } from 'lucide-react';
import styles from './SpatialRiskBadges.module.css';

interface SpatialRiskBadgesProps {
  latitude: number;
  longitude: number;
}

interface RiskResult {
  bushfire: boolean;
  flood: boolean;
  heritage: boolean;
  contaminated: boolean;
}

const LAYERS = {
  bushfire: 'Planning_Bushfire_Prone_Land',
  flood: 'Planning_Flood_Planning',
  heritage: 'Heritage_Items_with_curtilages_view',
  contaminated: 'EPA_Contaminated_Land_Register',
} as const;

const BASE_URL = 'https://services1.arcgis.com/cNVyNtjGVZybOQWZ/ArcGIS/rest/services';

async function queryLayer(layer: string, lng: number, lat: number, signal: AbortSignal): Promise<boolean> {
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'OBJECTID',
    returnCountOnly: 'true',
    f: 'json',
  });

  const url = `${BASE_URL}/${layer}/FeatureServer/0/query?${params.toString()}`;

  const res = await fetch(url, { signal });
  if (!res.ok) return false;

  const json = await res.json() as { count?: number };
  return (json.count ?? 0) > 0;
}

async function fetchAllRisks(lng: number, lat: number, signal: AbortSignal): Promise<RiskResult> {
  const [bushfire, flood, heritage, contaminated] = await Promise.allSettled([
    queryLayer(LAYERS.bushfire, lng, lat, signal),
    queryLayer(LAYERS.flood, lng, lat, signal),
    queryLayer(LAYERS.heritage, lng, lat, signal),
    queryLayer(LAYERS.contaminated, lng, lat, signal),
  ]);

  return {
    bushfire: bushfire.status === 'fulfilled' && bushfire.value,
    flood: flood.status === 'fulfilled' && flood.value,
    heritage: heritage.status === 'fulfilled' && heritage.value,
    contaminated: contaminated.status === 'fulfilled' && contaminated.value,
  };
}

type FetchState =
  | { status: 'loading' }
  | { status: 'done'; risks: RiskResult }
  | { status: 'error' };

export function SpatialRiskBadges({ latitude, longitude }: SpatialRiskBadgesProps) {
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetchAllRisks(longitude, latitude, controller.signal)
      .then((result) => {
        if (!cancelled) setState({ status: 'done', risks: result });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [latitude, longitude]);

  if (state.status === 'loading') return <span className={styles.loading}>Checking spatial risks...</span>;
  if (state.status === 'error') return null;

  const { risks } = state;

  const hasAnyRisk = risks.bushfire || risks.flood || risks.heritage || risks.contaminated;
  if (!hasAnyRisk) return null;

  return (
    <div className={styles.container}>
      {risks.bushfire && (
        <span className={`${styles.badge} ${styles.bushfire}`}>
          <Flame size={11} /> Bushfire Prone
        </span>
      )}
      {risks.flood && (
        <span className={`${styles.badge} ${styles.flood}`}>
          <Droplets size={11} /> Flood Zone
        </span>
      )}
      {risks.heritage && (
        <span className={`${styles.badge} ${styles.heritage}`}>
          <Landmark size={11} /> Heritage Listed
        </span>
      )}
      {risks.contaminated && (
        <span className={`${styles.badge} ${styles.contaminated}`}>
          <Skull size={11} /> Contaminated
        </span>
      )}
    </div>
  );
}
