/**
 * NSW ArcGIS spatial data service — fetches GeoJSON from
 * NSW government ArcGIS REST endpoints for hazard and
 * environmental constraint layers.
 */

interface MapBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

const FETCH_TIMEOUT = 10_000;

async function fetchArcGisGeoJson(
  endpoint: string,
  bounds: MapBounds,
): Promise<GeoJSON.FeatureCollection> {
  const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
  const params = new URLSearchParams({
    where: '1=1',
    geometry: bbox,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    outFields: '*',
    f: 'geojson',
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) return EMPTY_COLLECTION;

    const data = (await response.json()) as GeoJSON.FeatureCollection;
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      return EMPTY_COLLECTION;
    }

    return data;
  } catch {
    return EMPTY_COLLECTION;
  }
}

const BUSHFIRE_ENDPOINT =
  'https://services1.arcgis.com/cNVyNtjGVZybOQWZ/ArcGIS/rest/services/Bushfire_Prone_Land/FeatureServer/0/query';

const FLOOD_ENDPOINT =
  'https://services1.arcgis.com/cNVyNtjGVZybOQWZ/ArcGIS/rest/services/Flood_Prone_Land/FeatureServer/0/query';

const HERITAGE_ENDPOINT =
  'https://services1.arcgis.com/cNVyNtjGVZybOQWZ/ArcGIS/rest/services/Heritage_Items/FeatureServer/0/query';

const CONTAMINATED_ENDPOINT =
  'https://services1.arcgis.com/cNVyNtjGVZybOQWZ/ArcGIS/rest/services/Contaminated_Land/FeatureServer/0/query';

const ACID_SULFATE_ENDPOINT =
  'https://services1.arcgis.com/cNVyNtjGVZybOQWZ/ArcGIS/rest/services/Acid_Sulfate_Soils/FeatureServer/0/query';

export function fetchBushfireProneAreas(
  bounds: MapBounds,
): Promise<GeoJSON.FeatureCollection> {
  return fetchArcGisGeoJson(BUSHFIRE_ENDPOINT, bounds);
}

export function fetchFloodProneAreas(
  bounds: MapBounds,
): Promise<GeoJSON.FeatureCollection> {
  return fetchArcGisGeoJson(FLOOD_ENDPOINT, bounds);
}

export function fetchHeritageItems(
  bounds: MapBounds,
): Promise<GeoJSON.FeatureCollection> {
  return fetchArcGisGeoJson(HERITAGE_ENDPOINT, bounds);
}

export function fetchContaminatedLand(
  bounds: MapBounds,
): Promise<GeoJSON.FeatureCollection> {
  return fetchArcGisGeoJson(CONTAMINATED_ENDPOINT, bounds);
}

export function fetchAcidSulfateSoils(
  bounds: MapBounds,
): Promise<GeoJSON.FeatureCollection> {
  return fetchArcGisGeoJson(ACID_SULFATE_ENDPOINT, bounds);
}
