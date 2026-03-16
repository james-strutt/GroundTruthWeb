/**
 * Shared types for the GroundTruth web app.
 * Maps Supabase snake_case columns to camelCase properties.
 */

/* ---------- Directory ---------- */

export interface Directory {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  colour: string | null;
  icon: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Directory summary (from view) ---------- */

export interface DirectorySummary {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  colour: string | null;
  icon: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  propertyCount: number;
  totalSnapCount: number;
  totalInspectionCount: number;
  totalAppraisalCount: number;
  totalMonitorCount: number;
  totalActivityCount: number;
  lastActivityAt: string | null;
}

/* ---------- Property ---------- */

export type PropertyStatus = 'active' | 'under_offer' | 'settled' | 'archived';

export interface Property {
  id: string;
  directoryId: string;
  userId: string;
  address: string;
  normalisedAddress: string;
  suburb: string | null;
  latitude: number | null;
  longitude: number | null;
  propid: number | null;
  status: PropertyStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ---------- Property summary (from view) ---------- */

export interface PropertySummary {
  id: string;
  directoryId: string;
  userId: string;
  address: string;
  normalisedAddress: string;
  suburb: string | null;
  latitude: number | null;
  longitude: number | null;
  propid: number | null;
  status: PropertyStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  directoryName: string;
  directoryColour: string | null;
  snapCount: number;
  inspectionCount: number;
  appraisalCount: number;
  monitorCount: number;
  totalRecords: number;
  lastActivityAt: string | null;
  thumbnailUrl: string | null;
}

/* ---------- Grouped property (legacy view) ---------- */

export interface GroupedProperty {
  normalisedAddress: string;
  address: string;
  suburb: string;
  latitude: number | null;
  longitude: number | null;
  propid: number | null;
  totalRecords: number;
  snapCount: number;
  inspectionCount: number;
  appraisalCount: number;
  monitorCount: number;
  lastActivityAt: string;
  thumbnailUrl: string | null;
}

/* ---------- Walk routes (for dashboard map) ---------- */

export interface WalkRoute {
  id: string;
  title: string;
  route: [number, number][];
}

/* ---------- Map pins ---------- */

export type FeatureType = 'snap' | 'inspect' | 'appraise' | 'monitor' | 'explore';

export interface MapPin {
  id: string;
  type: FeatureType;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
}

/* ---------- Activity feed ---------- */

export interface ActivityItem {
  id: string;
  type: FeatureType;
  address: string;
  suburb: string;
  summary: string;
  createdAt: string;
  photoUrl: string | null;
}

/* ---------- Snap ---------- */

export interface Snap {
  id: string;
  userId: string;
  propertyId: string | null;
  address: string;
  suburb: string;
  latitude: number;
  longitude: number;
  propid: number | null;
  photoUrl: string | null;
  spatialData: Record<string, unknown>;
  aiAnalysis: SnapAnalysis | null;
  confidence: number | null;
  isFavourite: boolean;
  createdAt: string;
}

export interface SnapAnalysis {
  summary: string;
  propertyType: string;
  condition: string;
  estimatedAge: string | null;
  storeys: number | null;
  constructionMaterial: string | null;
  roofMaterial: string | null;
  observations: string[];
  risks: string[];
  opportunities: string[];
  confidenceScore: number;
}

/* ---------- Inspection (AS 4349.1-2007 aligned) ---------- */

/** AS 4349.1-2007 defect type codes (Table 3.3) */
export type DefectTypeCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** AS 4349.1-2007 defect severity (s1.4.10, s1.4.11) */
export type DefectSeverity = 'major' | 'minor';

/** AS 4349.1-2007 defect nature sub-classification */
export type DefectNature = 'appearance' | 'serviceability' | 'structural';

/** AS 4349.1-2007 masonry cracking category (Table E1) */
export type CrackingCategory = 0 | 1 | 2 | 3 | 4;

/** A single defect aligned with AS 4349.1-2007 */
export interface InspectionDefect {
  defectType: DefectTypeCode;
  severity: DefectSeverity;
  nature: DefectNature[];
  description: string;
  crackingCategory: CrackingCategory | null;
}

export interface Inspection {
  id: string;
  userId: string;
  propertyId: string | null;
  address: string;
  suburb: string;
  latitude: number | null;
  longitude: number | null;
  propid: number | null;
  photos: InspectionPhoto[];
  report: InspectionReport | null;
  overallScore: number | null;
  isFavourite: boolean;
  createdAt: string;
}

export interface InspectionPhotoAnalysis {
  conditionScore: number;
  materials: string[];
  buildingElement: string;
  defects: InspectionDefect[];
  safetyHazard: boolean;
  improvements: string[];
  constructionEra: string | null;
  narrative: string;
  limitations: string[];
  furtherInspection: string | null;
}

export interface InspectionPhoto {
  id: string;
  uri: string;
  tags: { id: string; label: string }[];
  analysis: InspectionPhotoAnalysis | null;
}

export interface InspectionReport {
  conditionBreakdown: Record<string, number>;
  totalDefects: number;
  defectsBySeverity: { minor: number; major: number };
  materialsObserved: string[];
  improvementsObserved: string[];
  narrative: string;
}

/* ---------- Appraisal ---------- */

export interface Appraisal {
  id: string;
  userId: string;
  propertyId: string | null;
  address: string;
  suburb: string;
  latitude: number | null;
  longitude: number | null;
  propid: number | null;
  scoredComps: ScoredComp[];
  priceEstimate: PriceEstimate | null;
  isFavourite: boolean;
  createdAt: string;
}

export interface ScoredComp {
  id: string;
  address: string;
  salePrice: number;
  settlementDate: string;
  areaSqm: number;
  zoneCode: string;
  distanceMetres: number;
  latitude: number | null;
  longitude: number | null;
  score: { overallScore: number };
  adjustmentDirection: 'superior' | 'similar' | 'inferior' | null;
  adjustmentPercent: number | null;
  adjustedPrice: number | null;
  photoUri: string | null;
  isManuallySelected: boolean;
}

export interface PriceEstimate {
  estimatedValue: number;
  rangeLow: number;
  rangeHigh: number;
  ratePerSqm: number;
  confidence: string;
  confidenceScore: number;
  comparablesUsed: number;
  comparablesAvailable: number;
  methodology: string;
  generatedAt: string;
}

/* ---------- Monitor ---------- */

export interface WatchedProperty {
  id: string;
  userId: string;
  propertyId: string | null;
  address: string;
  suburb: string;
  latitude: number | null;
  longitude: number | null;
  baselinePhotoUrl: string | null;
  latestPhotoUrl: string | null;
  changes: ChangeRecord[];
  alerts: MonitorAlert[];
  visitCount: number;
  lastVisitedAt: string;
  isFavourite: boolean;
  createdAt: string;
}

export interface ChangeRecord {
  id: string;
  beforePhotoUri: string;
  afterPhotoUri: string;
  beforeDate: string;
  afterDate: string;
  severity: string;
  categories: string[];
  analysis: {
    changes: { type: string; description: string; confidence: string }[];
    overallAssessment: string;
  } | null;
  comparedAt: string;
}

export interface MonitorAlert {
  id: string;
  message: string;
  severity: string;
  dismissed: boolean;
  createdAt: string;
}

/* ---------- Walk ---------- */

export interface WalkSession {
  id: string;
  userId: string;
  directoryId: string | null;
  propertyId: string | null;
  title: string;
  suburb: string;
  route: [number, number][];
  photos: WalkPhoto[];
  segments: WalkSegment[];
  totalDistanceMetres: number;
  durationSeconds: number;
  streetScore: StreetScore | null;
  analysisNarrative: string | null;
  startedAt: string;
  endedAt: string | null;
  isFavourite: boolean;
}

export interface WalkPhoto {
  id: string;
  uri: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  capturedAt: string;
  distanceAlongRoute: number;
}

export interface WalkSegment {
  index: number;
  startCoord: [number, number];
  endCoord: [number, number];
  distanceMetres: number;
  streetName: string | null;
}

export interface StreetScore {
  walkability: { score: number; notes: string };
  streetscape: { score: number; notes: string };
  amenity: { score: number; notes: string };
  safety: { score: number; notes: string };
  overall: number;
}
