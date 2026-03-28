/**
 * Supabase CRUD for the watched_properties (monitor) feature table.
 */

import { supabase } from "../supabaseClient";
import { deleteRowById } from "./shared/supabaseHelpers";
import type { WatchedProperty } from "../types/common";

export async function listWatched(limit = 50): Promise<WatchedProperty[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("watched_properties")
    .select("*")
    .order("last_visited_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapWatched);
}

export async function getWatched(id: string): Promise<WatchedProperty | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("watched_properties")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapWatched(data) : null;
}

export async function deleteWatched(id: string): Promise<boolean> {
  return deleteRowById("watched_properties", id);
}

export function mapWatched(row: Record<string, unknown>): WatchedProperty {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    propertyId: (row.property_id as string | null) ?? null,
    address: (row.address as string) ?? "",
    suburb: (row.suburb as string) ?? "",
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    baselinePhotoUrl: (row.baseline_photo_url as string | null) ?? null,
    latestPhotoUrl: (row.latest_photo_url as string | null) ?? null,
    changes: (row.changes as WatchedProperty['changes']) ?? [],
    alerts: (row.alerts as WatchedProperty['alerts']) ?? [],
    visitCount: (row.visit_count as number) ?? 0,
    lastVisitedAt: row.last_visited_at as string,
    isFavourite: (row.is_favourite as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}
