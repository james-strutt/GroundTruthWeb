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
  WalkRoute,
  Directory,
  DirectorySummary,
  Property,
  PropertySummary,
  PropertyStatus,
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

/* ---------- Directories ---------- */

export async function listDirectories(): Promise<DirectorySummary[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('directory_summary')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapDirectorySummary);
}

export async function getDirectory(id: string): Promise<Directory | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('directories').select('*').eq('id', id).single();
  return data ? mapDirectory(data) : null;
}

export async function createDirectory(
  fields: { name: string; description?: string; colour?: string; icon?: string },
): Promise<Directory | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('directories')
    .insert({
      name: fields.name,
      description: fields.description ?? null,
      colour: fields.colour ?? null,
      icon: fields.icon ?? null,
    })
    .select()
    .single();
  return data ? mapDirectory(data) : null;
}

export async function updateDirectory(
  id: string,
  updates: Partial<{ name: string; description: string; colour: string; icon: string; isArchived: boolean }>,
): Promise<boolean> {
  if (!supabase) return false;
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.colour !== undefined) payload.colour = updates.colour;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.isArchived !== undefined) payload.is_archived = updates.isArchived;
  const { error } = await supabase.from('directories').update(payload).eq('id', id);
  return !error;
}

export async function deleteDirectory(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('directories').delete().eq('id', id);
  return !error;
}

/* ---------- Properties (new relational) ---------- */

export async function listPropertiesByDirectory(directoryId: string): Promise<PropertySummary[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('properties_summary')
    .select('*')
    .eq('directory_id', directoryId)
    .order('last_activity_at', { ascending: false });
  return (data ?? []).map(mapPropertySummary);
}

export async function listAllProperties(): Promise<PropertySummary[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('properties_summary')
    .select('*')
    .order('last_activity_at', { ascending: false })
    .limit(200);
  return (data ?? []).map(mapPropertySummary);
}

export async function getProperty(id: string): Promise<Property | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('properties').select('*').eq('id', id).single();
  return data ? mapProperty(data) : null;
}

export async function createProperty(
  fields: {
    directoryId: string;
    address: string;
    suburb?: string;
    latitude?: number;
    longitude?: number;
    propid?: number;
    status?: PropertyStatus;
    notes?: string;
  },
): Promise<Property | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('properties')
    .insert({
      directory_id: fields.directoryId,
      address: fields.address,
      normalised_address: fields.address.trim().toLowerCase(),
      suburb: fields.suburb ?? null,
      latitude: fields.latitude ?? null,
      longitude: fields.longitude ?? null,
      propid: fields.propid ?? null,
      status: fields.status ?? 'active',
      notes: fields.notes ?? null,
    })
    .select()
    .single();
  return data ? mapProperty(data) : null;
}

export async function updateProperty(
  id: string,
  updates: Partial<{ directoryId: string; address: string; suburb: string; status: PropertyStatus; notes: string }>,
): Promise<boolean> {
  if (!supabase) return false;
  const payload: Record<string, unknown> = {};
  if (updates.directoryId !== undefined) payload.directory_id = updates.directoryId;
  if (updates.address !== undefined) {
    payload.address = updates.address;
    payload.normalised_address = updates.address.trim().toLowerCase();
  }
  if (updates.suburb !== undefined) payload.suburb = updates.suburb;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  const { error } = await supabase.from('properties').update(payload).eq('id', id);
  return !error;
}

export async function deleteProperty(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('properties').delete().eq('id', id);
  return !error;
}

export async function getPropertyActivities(propertyId: string): Promise<{
  snaps: Snap[];
  inspections: Inspection[];
  appraisals: Appraisal[];
  watched: WatchedProperty[];
}> {
  if (!supabase) return { snaps: [], inspections: [], appraisals: [], watched: [] };

  const [s, i, a, w] = await Promise.all([
    supabase.from('snaps').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
    supabase.from('inspections').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
    supabase.from('appraisals').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
    supabase.from('watched_properties').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
  ]);

  return {
    snaps: (s.data ?? []).map(mapSnap),
    inspections: (i.data ?? []).map(mapInspection),
    appraisals: (a.data ?? []).map(mapAppraisal),
    watched: (w.data ?? []).map(mapWatched),
  };
}

/* ---------- Deletes ---------- */

/** Delete a snap record */
export async function deleteSnap(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('snaps').delete().eq('id', id);
  return !error;
}

/** Delete an inspection record */
export async function deleteInspection(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('inspections').delete().eq('id', id);
  return !error;
}

/** Delete an appraisal record */
export async function deleteAppraisal(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('appraisals').delete().eq('id', id);
  return !error;
}

/** Delete a watched property record */
export async function deleteWatched(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('watched_properties').delete().eq('id', id);
  return !error;
}

/** Delete a walk session record */
export async function deleteWalk(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('walk_sessions').delete().eq('id', id);
  return !error;
}

/** Remove a specific photo from an inspection's photos array */
export async function deleteInspectionPhoto(
  inspectionId: string,
  photoIndex: number,
): Promise<boolean> {
  if (!supabase) return false;
  const { data: row } = await supabase.from('inspections').select('photos').eq('id', inspectionId).single();
  if (!row) return false;
  const photos = (row.photos ?? []) as unknown[];
  photos.splice(photoIndex, 1);
  const { error } = await supabase.from('inspections').update({ photos, photo_count: photos.length }).eq('id', inspectionId);
  return !error;
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

/** Update a specific field within a photo's analysis in an inspection */
export async function updateInspectionPhotoAnalysis(
  inspectionId: string,
  photoIndex: number,
  field: string,
  value: unknown,
): Promise<boolean> {
  if (!supabase) return false;
  const { data: row } = await supabase.from('inspections').select('photos').eq('id', inspectionId).single();
  if (!row) return false;
  const photos = (row.photos ?? []) as Record<string, unknown>[];
  const photo = photos[photoIndex];
  if (!photo) return false;
  const analysis = ((photo['analysis'] ?? {}) as Record<string, unknown>);
  analysis[field] = value;
  photo['analysis'] = analysis;
  const { error } = await supabase.from('inspections').update({ photos }).eq('id', inspectionId);
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

export async function getWalkRoutes(): Promise<WalkRoute[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('walk_sessions')
    .select('id, title, route')
    .order('started_at', { ascending: false })
    .limit(50);
  return (data ?? [])
    .filter((r) => {
      const route = r['route'] as [number, number][] | null;
      return route && route.length > 1;
    })
    .map((r) => ({
      id: r['id'] as string,
      title: (r['title'] as string) ?? '',
      route: r['route'] as [number, number][],
    }));
}

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
    propertyId: row.property_id ?? null,
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
    propertyId: row.property_id ?? null,
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
    propertyId: row.property_id ?? null,
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
    propertyId: row.property_id ?? null,
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
    directoryId: row.directory_id ?? null,
    propertyId: row.property_id ?? null,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDirectory(row: any): Directory {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name ?? '',
    description: row.description ?? null,
    colour: row.colour ?? null,
    icon: row.icon ?? null,
    isArchived: row.is_archived ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDirectorySummary(row: any): DirectorySummary {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name ?? '',
    description: row.description ?? null,
    colour: row.colour ?? null,
    icon: row.icon ?? null,
    isArchived: row.is_archived ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    propertyCount: row.property_count ?? 0,
    totalSnapCount: row.total_snap_count ?? 0,
    totalInspectionCount: row.total_inspection_count ?? 0,
    totalAppraisalCount: row.total_appraisal_count ?? 0,
    totalMonitorCount: row.total_monitor_count ?? 0,
    totalActivityCount: row.total_activity_count ?? 0,
    lastActivityAt: row.last_activity_at ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProperty(row: any): Property {
  return {
    id: row.id,
    directoryId: row.directory_id,
    userId: row.user_id,
    address: row.address ?? '',
    normalisedAddress: row.normalised_address ?? '',
    suburb: row.suburb ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    propid: row.propid ?? null,
    status: row.status ?? 'active',
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPropertySummary(row: any): PropertySummary {
  return {
    id: row.id,
    directoryId: row.directory_id,
    userId: row.user_id,
    address: row.address ?? '',
    normalisedAddress: row.normalised_address ?? '',
    suburb: row.suburb ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    propid: row.propid ?? null,
    status: row.status ?? 'active',
    notes: row.notes ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    directoryName: row.directory_name ?? '',
    directoryColour: row.directory_colour ?? null,
    snapCount: row.snap_count ?? 0,
    inspectionCount: row.inspection_count ?? 0,
    appraisalCount: row.appraisal_count ?? 0,
    monitorCount: row.monitor_count ?? 0,
    totalRecords: row.total_records ?? 0,
    lastActivityAt: row.last_activity_at ?? null,
    thumbnailUrl: row.thumbnail_url ?? null,
  };
}
