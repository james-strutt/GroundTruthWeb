/**
 * Supabase CRUD for the walk_sessions feature table.
 */

import { supabase } from "../supabaseClient";
import { updateRowById, deleteRowById } from "./shared/supabaseHelpers";
import type { WalkSession, WalkRoute } from "../types/common";

export async function listWalks(limit = 50): Promise<WalkSession[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("walk_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapWalk);
}

export async function getWalk(id: string): Promise<WalkSession | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("walk_sessions")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapWalk(data) : null;
}

export async function deleteWalk(id: string): Promise<boolean> {
  return deleteRowById("walk_sessions", id);
}

/** Update a walk session's analysis narrative */
export async function updateWalkField(
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  return updateRowById("walk_sessions", id, updates);
}

export async function getWalkRoutes(): Promise<WalkRoute[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("walk_sessions")
    .select("id, title, route")
    .order("started_at", { ascending: false })
    .limit(50);
  return (data ?? [])
    .filter((r) => {
      const route = r["route"] as [number, number][] | null;
      return route && route.length > 1;
    })
    .map((r) => ({
      id: r["id"] as string,
      title: (r["title"] as string) ?? "",
      route: r["route"] as [number, number][],
    }));
}

export function mapWalk(row: Record<string, unknown>): WalkSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    directoryId: (row.directory_id as string | null) ?? null,
    propertyId: (row.property_id as string | null) ?? null,
    title: (row.title as string) ?? "",
    suburb: (row.suburb as string) ?? "",
    route: (row.route as [number, number][]) ?? [],
    photos: (row.photos as WalkSession['photos']) ?? [],
    segments: (row.segments as WalkSession['segments']) ?? [],
    totalDistanceMetres: (row.total_distance_metres as number) ?? 0,
    durationSeconds: (row.duration_seconds as number) ?? 0,
    streetScore: (row.street_score as WalkSession['streetScore']) ?? null,
    analysisNarrative: (row.analysis_narrative as string | null) ?? null,
    startedAt: row.started_at as string,
    endedAt: (row.ended_at as string | null) ?? null,
    isFavourite: (row.is_favourite as boolean) ?? false,
  };
}
