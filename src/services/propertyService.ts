/**
 * Supabase CRUD for properties (relational model and legacy grouped view).
 */

import { supabase } from "../supabaseClient";
import { ensureAuthSessionLoaded, updateRowById, deleteRowById } from "./shared/supabaseHelpers";
import { mapSnap } from "./snapService";
import { mapInspection } from "./inspectionService";
import { mapAppraisal } from "./appraisalService";
import { mapWatched } from "./monitorService";
import type {
  Property,
  PropertySummary,
  PropertyStatus,
  GroupedProperty,
  Snap,
  Inspection,
  Appraisal,
  WatchedProperty,
} from "../types/common";

export async function createProperty(fields: {
  directoryId: string;
  address: string;
  suburb?: string;
  latitude?: number;
  longitude?: number;
  propid?: number;
  status?: PropertyStatus;
  notes?: string;
}): Promise<Property | null> {
  if (!supabase) return null;
  if (!(await ensureAuthSessionLoaded())) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase
    .from("properties")
    .insert({
      directory_id: fields.directoryId,
      address: fields.address,
      normalised_address: fields.address.trim().toLowerCase(),
      suburb: fields.suburb ?? null,
      latitude: fields.latitude ?? null,
      longitude: fields.longitude ?? null,
      propid: fields.propid ?? null,
      status: fields.status ?? "active",
      notes: fields.notes ?? null,
      user_id: session.user.id,
    })
    .select()
    .single();
  return data ? mapProperty(data) : null;
}

export async function getProperty(id: string): Promise<Property | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapProperty(data) : null;
}

export async function updateProperty(
  id: string,
  updates: Partial<{
    directoryId: string;
    address: string;
    suburb: string;
    status: PropertyStatus;
    notes: string;
  }>,
): Promise<boolean> {
  if (!supabase) return false;
  const payload: Record<string, unknown> = {};
  if (updates.directoryId !== undefined)
    payload.directory_id = updates.directoryId;
  if (updates.address !== undefined) {
    payload.address = updates.address;
    payload.normalised_address = updates.address.trim().toLowerCase();
  }
  if (updates.suburb !== undefined) payload.suburb = updates.suburb;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  return updateRowById("properties", id, payload);
}

export async function deleteProperty(id: string): Promise<boolean> {
  return deleteRowById("properties", id);
}

/** Look up a property by its normalised address, returning the first match */
export async function findPropertyByAddress(address: string): Promise<Property | null> {
  if (!supabase) return null;
  const normalised = address.trim().toLowerCase();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("normalised_address", normalised)
    .limit(1)
    .maybeSingle();
  return data ? mapProperty(data) : null;
}

export async function listAllProperties(): Promise<PropertySummary[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("properties_summary")
    .select("*")
    .order("last_activity_at", { ascending: false })
    .limit(200);
  return (data ?? []).map(mapPropertySummary);
}

export async function listProperties(): Promise<GroupedProperty[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("properties_grouped")
    .select("*")
    .order("last_activity_at", { ascending: false })
    .limit(200);
  return (data ?? []).map(
    (r: Record<string, unknown>): GroupedProperty => ({
      normalisedAddress: (r.normalised_address as string) ?? "",
      address: (r.address as string) ?? "",
      suburb: (r.suburb as string) ?? "",
      latitude: (r.latitude as number | null) ?? null,
      longitude: (r.longitude as number | null) ?? null,
      propid: (r.propid as number | null) ?? null,
      totalRecords: (r.total_records as number) ?? 0,
      snapCount: (r.snap_count as number) ?? 0,
      inspectionCount: (r.inspection_count as number) ?? 0,
      appraisalCount: (r.appraisal_count as number) ?? 0,
      monitorCount: (r.monitor_count as number) ?? 0,
      lastActivityAt: (r.last_activity_at as string) ?? "",
      thumbnailUrl: (r.thumbnail_url as string | null) ?? null,
    }),
  );
}

export async function listPropertiesByDirectory(
  directoryId: string,
): Promise<PropertySummary[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("properties_summary")
    .select("*")
    .eq("directory_id", directoryId)
    .order("last_activity_at", { ascending: false });
  return (data ?? []).map(mapPropertySummary);
}

export async function getPropertyActivities(propertyId: string): Promise<{
  snaps: Snap[];
  inspections: Inspection[];
  appraisals: Appraisal[];
  watched: WatchedProperty[];
}> {
  if (!supabase)
    return { snaps: [], inspections: [], appraisals: [], watched: [] };

  const [s, i, a, w] = await Promise.all([
    supabase
      .from("snaps")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("inspections")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("appraisals")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("watched_properties")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    snaps: (s.data ?? []).map(mapSnap),
    inspections: (i.data ?? []).map(mapInspection),
    appraisals: (a.data ?? []).map(mapAppraisal),
    watched: (w.data ?? []).map(mapWatched),
  };
}

export async function getPropertyRecords(normalisedAddress: string): Promise<{
  snaps: Snap[];
  inspections: Inspection[];
  appraisals: Appraisal[];
  watched: WatchedProperty[];
}> {
  if (!supabase)
    return { snaps: [], inspections: [], appraisals: [], watched: [] };

  const addr = normalisedAddress;
  const [s, i, a, w] = await Promise.all([
    supabase
      .from("snaps")
      .select("*")
      .ilike("address", addr)
      .order("created_at", { ascending: false }),
    supabase
      .from("inspections")
      .select("*")
      .ilike("address", addr)
      .order("created_at", { ascending: false }),
    supabase
      .from("appraisals")
      .select("*")
      .ilike("address", addr)
      .order("created_at", { ascending: false }),
    supabase
      .from("watched_properties")
      .select("*")
      .ilike("address", addr)
      .order("created_at", { ascending: false }),
  ]);

  return {
    snaps: (s.data ?? []).map(mapSnap),
    inspections: (i.data ?? []).map(mapInspection),
    appraisals: (a.data ?? []).map(mapAppraisal),
    watched: (w.data ?? []).map(mapWatched),
  };
}

export function mapProperty(row: Record<string, unknown>): Property {
  return {
    id: row.id as string,
    directoryId: row.directory_id as string,
    userId: row.user_id as string,
    address: (row.address as string) ?? "",
    normalisedAddress: (row.normalised_address as string) ?? "",
    suburb: (row.suburb as string | null) ?? null,
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    propid: (row.propid as number | null) ?? null,
    status: (row.status as PropertyStatus) ?? "active",
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapPropertySummary(row: Record<string, unknown>): PropertySummary {
  return {
    id: row.id as string,
    directoryId: row.directory_id as string,
    userId: row.user_id as string,
    address: (row.address as string) ?? "",
    normalisedAddress: (row.normalised_address as string) ?? "",
    suburb: (row.suburb as string | null) ?? null,
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    propid: (row.propid as number | null) ?? null,
    status: (row.status as PropertyStatus) ?? "active",
    notes: (row.notes as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    directoryName: (row.directory_name as string) ?? "",
    directoryColour: (row.directory_colour as string | null) ?? null,
    snapCount: (row.snap_count as number) ?? 0,
    inspectionCount: (row.inspection_count as number) ?? 0,
    appraisalCount: (row.appraisal_count as number) ?? 0,
    monitorCount: (row.monitor_count as number) ?? 0,
    totalRecords: (row.total_records as number) ?? 0,
    lastActivityAt: (row.last_activity_at as string | null) ?? null,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
  };
}
