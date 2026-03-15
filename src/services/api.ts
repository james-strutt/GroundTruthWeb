/**
 * Supabase data API — queries for all feature tables.
 * All functions return typed results parsed from the jsonb columns.
 */

import { supabase } from '../supabaseClient';
import type {
  Snap,
  Inspection,
  Appraisal,
  WatchedProperty,
  WalkSession,
  MapPin,
  ActivityItem,
  FeatureType,
  GroupedProperty,
} from '../types/common';

/* ---------- Snaps ---------- */

export async function listSnaps(limit = 50): Promise<Snap[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('snaps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapSnap);
}

export async function getSnap(id: string): Promise<Snap | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('snaps').select('*').eq('id', id).single();
  return data ? mapSnap(data) : null;
}

/* ---------- Inspections ---------- */

export async function listInspections(limit = 50): Promise<Inspection[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('inspections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapInspection);
}

export async function getInspection(id: string): Promise<Inspection | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('inspections').select('*').eq('id', id).single();
  return data ? mapInspection(data) : null;
}

/* ---------- Appraisals ---------- */

export async function listAppraisals(limit = 50): Promise<Appraisal[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('appraisals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapAppraisal);
}

export async function getAppraisal(id: string): Promise<Appraisal | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('appraisals').select('*').eq('id', id).single();
  return data ? mapAppraisal(data) : null;
}

/* ---------- Monitor ---------- */

export async function listWatched(limit = 50): Promise<WatchedProperty[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('watched_properties')
    .select('*')
    .order('last_visited_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapWatched);
}

export async function getWatched(id: string): Promise<WatchedProperty | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('watched_properties').select('*').eq('id', id).single();
  return data ? mapWatched(data) : null;
}

/* ---------- Walks ---------- */

export async function listWalks(limit = 50): Promise<WalkSession[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('walk_sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapWalk);
}

export async function getWalk(id: string): Promise<WalkSession | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('walk_sessions').select('*').eq('id', id).single();
  return data ? mapWalk(data) : null;
}

/* ---------- Updates (inline editing) ---------- */

/** Update a jsonb field within a snap's ai_analysis */
export async function updateSnapAnalysisField(
  id: string,
  field: string,
  value: unknown,
): Promise<boolean> {
  if (!supabase) return false;
  // Fetch current, merge, write back
  const { data: row } = await supabase.from('snaps').select('ai_analysis').eq('id', id).single();
  if (!row) return false;
  const analysis = (row.ai_analysis ?? {}) as Record<string, unknown>;
  analysis[field] = value;
  const { error } = await supabase.from('snaps').update({ ai_analysis: analysis }).eq('id', id);
  return !error;
}

/** Update a snap's top-level text fields */
export async function updateSnapField(
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('snaps').update(updates).eq('id', id);
  return !error;
}

/** Update an inspection's report narrative */
export async function updateInspectionReportField(
  id: string,
  field: string,
  value: unknown,
): Promise<boolean> {
  if (!supabase) return false;
  const { data: row } = await supabase.from('inspections').select('report').eq('id', id).single();
  if (!row) return false;
  const report = (row.report ?? {}) as Record<string, unknown>;
  report[field] = value;
  const { error } = await supabase.from('inspections').update({ report }).eq('id', id);
  return !error;
}

/** Update a walk session's analysis narrative */
export async function updateWalkField(
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('walk_sessions').update(updates).eq('id', id);
  return !error;
}

/** Update an appraisal's price estimate methodology */
export async function updateAppraisalEstimateField(
  id: string,
  field: string,
  value: unknown,
): Promise<boolean> {
  if (!supabase) return false;
  const { data: row } = await supabase.from('appraisals').select('price_estimate').eq('id', id).single();
  if (!row) return false;
  const estimate = (row.price_estimate ?? {}) as Record<string, unknown>;
  estimate[field] = value;
  const { error } = await supabase.from('appraisals').update({ price_estimate: estimate }).eq('id', id);
  return !error;
}

/* ---------- Properties (grouped) ---------- */

export async function listProperties(): Promise<GroupedProperty[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('properties_grouped')
    .select('*')
    .order('last_activity_at', { ascending: false })
    .limit(200);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any): GroupedProperty => ({
    normalisedAddress: r.normalised_address ?? '',
    address: r.address ?? '',
    suburb: r.suburb ?? '',
    latitude: r.latitude,
    longitude: r.longitude,
    propid: r.propid,
    totalRecords: r.total_records ?? 0,
    snapCount: r.snap_count ?? 0,
    inspectionCount: r.inspection_count ?? 0,
    appraisalCount: r.appraisal_count ?? 0,
    monitorCount: r.monitor_count ?? 0,
    lastActivityAt: r.last_activity_at ?? '',
    thumbnailUrl: r.thumbnail_url,
  }));
}

export async function getPropertyRecords(normalisedAddress: string): Promise<{
  snaps: Snap[];
  inspections: Inspection[];
  appraisals: Appraisal[];
  watched: WatchedProperty[];
}> {
  if (!supabase) return { snaps: [], inspections: [], appraisals: [], watched: [] };

  const addr = normalisedAddress;
  const [s, i, a, w] = await Promise.all([
    supabase.from('snaps').select('*').ilike('address', addr).order('created_at', { ascending: false }),
    supabase.from('inspections').select('*').ilike('address', addr).order('created_at', { ascending: false }),
    supabase.from('appraisals').select('*').ilike('address', addr).order('created_at', { ascending: false }),
    supabase.from('watched_properties').select('*').ilike('address', addr).order('created_at', { ascending: false }),
  ]);

  return {
    snaps: (s.data ?? []).map(mapSnap),
    inspections: (i.data ?? []).map(mapInspection),
    appraisals: (a.data ?? []).map(mapAppraisal),
    watched: (w.data ?? []).map(mapWatched),
  };
}

/* ---------- Dashboard aggregates ---------- */

export async function getAllPins(): Promise<MapPin[]> {
  if (!supabase) return [];
  const pins: MapPin[] = [];

  const [snaps, inspections, appraisals, watched, walks] = await Promise.all([
    supabase.from('snaps').select('id, latitude, longitude, address, created_at').limit(100),
    supabase.from('inspections').select('id, latitude, longitude, address, created_at').limit(100),
    supabase.from('appraisals').select('id, latitude, longitude, address, created_at').limit(100),
    supabase.from('watched_properties').select('id, latitude, longitude, address, created_at').limit(100),
    supabase.from('walk_sessions').select('id, route, title, started_at').limit(50),
  ]);

  const addPins = (rows: Record<string, unknown>[] | null, type: FeatureType): void => {
    for (const r of rows ?? []) {
      const lat = r['latitude'] as number | null;
      const lng = r['longitude'] as number | null;
      if (lat && lng && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        pins.push({
          id: r['id'] as string,
          type,
          latitude: lat,
          longitude: lng,
          address: (r['address'] as string) ?? '',
          createdAt: (r['created_at'] as string) ?? (r['started_at'] as string) ?? '',
        });
      }
    }
  };

  addPins(snaps.data, 'snap');
  addPins(inspections.data, 'inspect');
  addPins(appraisals.data, 'appraise');
  addPins(watched.data, 'monitor');

  // Walks use the first route coordinate
  for (const w of walks.data ?? []) {
    const route = w['route'] as [number, number][] | null;
    if (route?.length) {
      const [lng, lat] = route[0]!;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
      pins.push({
        id: w['id'] as string,
        type: 'explore',
        latitude: lat,
        longitude: lng,
        address: (w['title'] as string) ?? '',
        createdAt: (w['started_at'] as string) ?? '',
      });
    }
  }

  return pins;
}

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  if (!supabase) return [];
  const items: ActivityItem[] = [];

  const [snaps, inspections, appraisals] = await Promise.all([
    supabase.from('snaps').select('id, address, suburb, photo_url, ai_analysis, created_at').order('created_at', { ascending: false }).limit(limit),
    supabase.from('inspections').select('id, address, suburb, overall_score, created_at').order('created_at', { ascending: false }).limit(limit),
    supabase.from('appraisals').select('id, address, suburb, price_estimate, created_at').order('created_at', { ascending: false }).limit(limit),
  ]);

  for (const s of snaps.data ?? []) {
    const analysis = s['ai_analysis'] as Record<string, unknown> | null;
    items.push({
      id: s['id'] as string,
      type: 'snap',
      address: s['address'] as string,
      suburb: s['suburb'] as string,
      summary: (analysis?.['summary'] as string) ?? 'Property snap',
      createdAt: s['created_at'] as string,
      photoUrl: s['photo_url'] as string | null,
    });
  }

  for (const i of inspections.data ?? []) {
    const score = i['overall_score'] as number | null;
    items.push({
      id: i['id'] as string,
      type: 'inspect',
      address: i['address'] as string,
      suburb: i['suburb'] as string,
      summary: score ? `Condition: ${score}/10` : 'Inspection',
      createdAt: i['created_at'] as string,
      photoUrl: null,
    });
  }

  for (const a of appraisals.data ?? []) {
    const est = a['price_estimate'] as Record<string, unknown> | null;
    const value = est?.['estimatedValue'] as number | null;
    items.push({
      id: a['id'] as string,
      type: 'appraise',
      address: a['address'] as string,
      suburb: a['suburb'] as string,
      summary: value ? `Est. $${(value / 1_000_000).toFixed(2)}M` : 'Appraisal',
      createdAt: a['created_at'] as string,
      photoUrl: null,
    });
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

/* ---------- Row mappers (snake_case → camelCase) ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSnap(row: any): Snap {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address ?? '',
    suburb: row.suburb ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    propid: row.propid,
    photoUrl: row.photo_url,
    spatialData: row.spatial_data ?? {},
    aiAnalysis: row.ai_analysis,
    confidence: row.confidence,
    isFavourite: row.is_favourite ?? false,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInspection(row: any): Inspection {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address ?? '',
    suburb: row.suburb ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    propid: row.propid,
    photos: row.photos ?? [],
    report: row.report,
    overallScore: row.overall_score,
    isFavourite: row.is_favourite ?? false,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAppraisal(row: any): Appraisal {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address ?? '',
    suburb: row.suburb ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    propid: row.propid,
    scoredComps: row.scored_comps ?? [],
    priceEstimate: row.price_estimate,
    isFavourite: row.is_favourite ?? false,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWatched(row: any): WatchedProperty {
  return {
    id: row.id,
    userId: row.user_id,
    address: row.address ?? '',
    suburb: row.suburb ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    baselinePhotoUrl: row.baseline_photo_url,
    latestPhotoUrl: row.latest_photo_url,
    changes: row.changes ?? [],
    alerts: row.alerts ?? [],
    visitCount: row.visit_count ?? 0,
    lastVisitedAt: row.last_visited_at,
    isFavourite: row.is_favourite ?? false,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWalk(row: any): WalkSession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? '',
    suburb: row.suburb ?? '',
    route: row.route ?? [],
    photos: row.photos ?? [],
    segments: row.segments ?? [],
    totalDistanceMetres: row.total_distance_metres ?? 0,
    durationSeconds: row.duration_seconds ?? 0,
    streetScore: row.street_score,
    analysisNarrative: row.analysis_narrative,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    isFavourite: row.is_favourite ?? false,
  };
}
