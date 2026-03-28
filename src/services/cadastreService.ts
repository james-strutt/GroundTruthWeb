/**
 * NSW cadastre (lot/parcel boundary) data from NSW Spatial Services.
 * Uses the NSW ePlanning Spatial Viewer ArcGIS REST endpoint.
 */

interface CadastreParcel {
  lotNumber: string;
  dpNumber: string;
  areaSqm: number | null;
  geometry: GeoJSON.Geometry;
}

const CADASTRE_URL =
  'https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer/9/query';

export async function fetchCadastreInBounds(bounds: {
  west: number;
  south: number;
  east: number;
  north: number;
}): Promise<GeoJSON.FeatureCollection> {
  const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
  const params = new URLSearchParams({
    where: '1=1',
    geometry: bbox,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    outFields: 'lotnumber,plannumber,Shape__Area',
    returnGeometry: 'true',
    f: 'geojson',
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${CADASTRE_URL}?${params}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return { type: 'FeatureCollection', features: [] };
    return await response.json() as GeoJSON.FeatureCollection;
  } catch {
    return { type: 'FeatureCollection', features: [] };
  }
}

export async function fetchParcelAtPoint(
  latitude: number,
  longitude: number,
): Promise<CadastreParcel | null> {
  const params = new URLSearchParams({
    where: '1=1',
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'lotnumber,plannumber,Shape__Area',
    returnGeometry: 'true',
    f: 'geojson',
    resultRecordCount: '1',
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${CADASTRE_URL}?${params}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json() as GeoJSON.FeatureCollection;
    const feature = data.features[0];
    if (!feature) return null;

    const props = feature.properties ?? {};
    return {
      lotNumber: String(props['lotnumber'] ?? ''),
      dpNumber: String(props['plannumber'] ?? ''),
      areaSqm: typeof props['Shape__Area'] === 'number' ? props['Shape__Area'] : null,
      geometry: feature.geometry,
    };
  } catch {
    return null;
  }
}
