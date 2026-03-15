/**
 * Spatial layer constants and types — shared definitions for map layers.
 */

export interface SpatialLayer {
  id: string;
  label: string;
  group: string;
  tileUrl: string;
  visible: boolean;
  opacity: number;
}

function arcgisTileUrl(baseUrl: string, layerId?: number): string {
  const layers = layerId !== undefined ? `&layers=show:${layerId}` : "";
  return `${baseUrl}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true${layers}&f=image`;
}

const PLANNING_BASE =
  "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Principal_Planning/MapServer";
const HAZARD_BASE =
  "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/ePlanning/Planning_Portal_Hazard/MapServer";

export const DEFAULT_LAYERS: SpatialLayer[] = [
  {
    id: "zoning",
    label: "Zoning",
    group: "Planning",
    tileUrl: arcgisTileUrl(PLANNING_BASE, 19),
    visible: false,
    opacity: 0.6,
  },
  {
    id: "fsr",
    label: "FSR",
    group: "Planning",
    tileUrl: arcgisTileUrl(PLANNING_BASE, 11),
    visible: false,
    opacity: 0.5,
  },
  {
    id: "hob",
    label: "Height of Building",
    group: "Planning",
    tileUrl: arcgisTileUrl(PLANNING_BASE, 14),
    visible: false,
    opacity: 0.5,
  },
  {
    id: "bushfire",
    label: "Bushfire Prone",
    group: "Hazards",
    tileUrl: arcgisTileUrl(HAZARD_BASE, 229),
    visible: false,
    opacity: 0.5,
  },
  {
    id: "heritage",
    label: "Heritage",
    group: "Hazards",
    tileUrl: arcgisTileUrl(
      "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer",
      0,
    ),
    visible: false,
    opacity: 0.5,
  },
  {
    id: "contamination",
    label: "Contaminated Land",
    group: "Hazards",
    tileUrl: arcgisTileUrl(
      "https://mapprod2.environment.nsw.gov.au/arcgis/rest/services/EPA/Contaminated_land_notified_sites/MapServer",
      0,
    ),
    visible: false,
    opacity: 0.5,
  },
  // Sales & DAs
  {
    id: "das",
    label: "Development Applications",
    group: "Sales & DAs",
    tileUrl: "",
    visible: false,
    opacity: 0.7,
  },
  {
    id: "sales",
    label: "Property Sales",
    group: "Sales & DAs",
    tileUrl: arcgisTileUrl(
      "https://maps.six.nsw.gov.au/arcgis/rest/services/public/Valuation/MapServer",
      1,
    ),
    visible: false,
    opacity: 0.5,
  },
  // Boundaries
  {
    id: "cadastre",
    label: "Lot Boundaries",
    group: "Boundaries",
    tileUrl: arcgisTileUrl(
      "https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Cadastre/MapServer",
      9,
    ),
    visible: false,
    opacity: 0.6,
  },
  {
    id: "lga",
    label: "LGA Boundaries",
    group: "Boundaries",
    tileUrl: arcgisTileUrl(
      "https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Administrative_Boundaries/MapServer",
      1,
    ),
    visible: false,
    opacity: 0.5,
  },
  // Imagery
  {
    id: "imagery",
    label: "NSW Imagery",
    group: "Imagery",
    tileUrl:
      "https://maps.six.nsw.gov.au/arcgis/rest/services/sixmaps/LPI_Imagery_Best/MapServer/WMTS/tile/1.0.0/sixmaps_LPI_Imagery_Best/default/GoogleMapsCompatible/{z}/{y}/{x}",
    visible: false,
    opacity: 1.0,
  },
];
