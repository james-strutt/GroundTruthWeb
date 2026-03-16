/**
 * Fetch train stations from NSW FOI Transport Facilities FeatureServer.
 */

export interface TrainStation {
  name: string;
  latitude: number;
  longitude: number;
}

const STATION_ENDPOINT = 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_FOI_Transport_Facilities/FeatureServer/1/query';
const RAILWAY_ENDPOINT = 'https://portal.spatial.nsw.gov.au/server/rest/services/NSW_Transport_Theme/FeatureServer/7/query';

export interface RailwayLine {
  paths: number[][][];
}

let railwayCachePromise: Promise<GeoJSON.FeatureCollection> | null = null;

/**
 * Fetch ALL railway lines for NSW (cached — only fetches once).
 * The railway dataset is small enough to load entirely.
 */
export function fetchAllRailwayLines(): Promise<GeoJSON.FeatureCollection> {
  if (railwayCachePromise) return railwayCachePromise;

  railwayCachePromise = (async (): Promise<GeoJSON.FeatureCollection> => {
    const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
    let allFeatures: GeoJSON.Feature[] = [];
    let offset = 0;
    const batchSize = 1000;

    // Paginate through all railway features
    while (true) {
      const params = new URLSearchParams({
        f: 'json',
        where: '1=1',
        outSR: '4326',
        outFields: 'classsubtype',
        returnGeometry: 'true',
        resultRecordCount: String(batchSize),
        resultOffset: String(offset),
      });

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20_000);
        const response = await fetch(`${RAILWAY_ENDPOINT}?${params.toString()}`, { signal: controller.signal });
        clearTimeout(timer);
        if (!response.ok) break;

        const data = (await response.json()) as {
          features?: { geometry?: { paths?: number[][][] } }[];
          exceededTransferLimit?: boolean;
        };

        const batch = (data.features ?? [])
          .filter((f) => f.geometry?.paths?.length)
          .map((f, i) => ({
            type: 'Feature' as const,
            properties: { id: `rail-${offset + i}` },
            geometry: {
              type: 'MultiLineString' as const,
              coordinates: f.geometry!.paths!,
            },
          }));

        allFeatures = allFeatures.concat(batch);

        if (!data.exceededTransferLimit || batch.length < batchSize) break;
        offset += batchSize;
      } catch {
        break;
      }
    }

    return allFeatures.length > 0 ? { type: 'FeatureCollection', features: allFeatures } : empty;
  })();

  return railwayCachePromise;
}

export async function fetchTrainStationsInBounds(
  west: number,
  south: number,
  east: number,
  north: number,
): Promise<TrainStation[]> {
  const geometry = JSON.stringify({
    xmin: west, ymin: south, xmax: east, ymax: north,
    spatialReference: { wkid: 4326 },
  });

  const params = new URLSearchParams({
    f: 'json',
    geometry,
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    inSR: '4326',
    outSR: '4326',
    outFields: 'generalname',
    returnGeometry: 'true',
    resultRecordCount: '200',
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(`${STATION_ENDPOINT}?${params.toString()}`, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) return [];

    const data = (await response.json()) as {
      features?: {
        attributes?: { generalname?: string };
        geometry?: { x?: number; y?: number };
      }[];
    };

    return (data.features ?? [])
      .filter((f) => f.geometry?.x != null && f.geometry?.y != null)
      .map((f) => ({
        name: f.attributes?.generalname ?? 'Station',
        latitude: f.geometry!.y!,
        longitude: f.geometry!.x!,
      }));
  } catch {
    return [];
  }
}
