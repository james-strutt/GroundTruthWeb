/**
 * Supabase CRUD for the snaps feature table.
 */

import { supabase } from "../supabaseClient";
import { ensureAuthSessionLoaded, updateRowById, deleteRowById } from "./shared/supabaseHelpers";
import type { Database } from "../types/database";
import type { Snap } from "../types/common";

type SnapRow = Database['public']['Tables']['snaps']['Row'];

export async function listSnaps(limit = 50): Promise<Snap[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("snaps")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapSnap);
}

export async function getSnap(id: string): Promise<Snap | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("snaps")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapSnap(data) : null;
}

export async function deleteSnap(id: string): Promise<boolean> {
  return deleteRowById("snaps", id);
}

/** Update a jsonb field within a snap's ai_analysis */
export async function updateSnapAnalysisField(
  id: string,
  field: string,
  value: unknown,
): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { data: row } = await supabase
    .from("snaps")
    .select("ai_analysis")
    .eq("id", id)
    .maybeSingle();
  if (!row) return false;
  const analysis = (row.ai_analysis ?? {}) as Record<string, unknown>;
  analysis[field] = value;
  return updateRowById("snaps", id, { ai_analysis: analysis });
}

/** Update a snap's top-level text fields */
export async function updateSnapField(
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  return updateRowById("snaps", id, updates);
}

export function mapSnap(row: SnapRow | Record<string, unknown>): Snap {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    propertyId: (row.property_id as string | null) ?? null,
    address: (row.address as string) ?? "",
    suburb: (row.suburb as string) ?? "",
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    propid: (row.propid as number | null) ?? null,
    photoUrl: (row.photo_url as string | null) ?? null,
    spatialData: (row.spatial_data as Record<string, unknown>) ?? {},
    aiAnalysis: (row.ai_analysis as Snap['aiAnalysis']) ?? null,
    confidence: (row.confidence as number | null) ?? null,
    isFavourite: (row.is_favourite as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}
