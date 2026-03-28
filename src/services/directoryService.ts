/**
 * Supabase CRUD for directories.
 */

import { supabase } from "../supabaseClient";
import { ensureAuthSessionLoaded, updateRowById, deleteRowById } from "./shared/supabaseHelpers";
import type { Directory, DirectorySummary } from "../types/common";

export async function listDirectories(): Promise<DirectorySummary[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("directory_summary")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapDirectorySummary);
}

export async function getDirectory(id: string): Promise<Directory | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("directories")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapDirectory(data) : null;
}

export async function createDirectory(fields: {
  name: string;
  description?: string;
  colour?: string;
  icon?: string;
}): Promise<Directory | null> {
  if (!supabase) return null;
  if (!(await ensureAuthSessionLoaded())) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase
    .from("directories")
    .insert({
      name: fields.name,
      description: fields.description ?? null,
      colour: fields.colour ?? null,
      icon: fields.icon ?? null,
      user_id: session.user.id,
    })
    .select()
    .single();
  return data ? mapDirectory(data) : null;
}

export async function updateDirectory(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    colour: string;
    icon: string;
    isArchived: boolean;
  }>,
): Promise<boolean> {
  if (!supabase) return false;
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined)
    payload.description = updates.description;
  if (updates.colour !== undefined) payload.colour = updates.colour;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.isArchived !== undefined)
    payload.is_archived = updates.isArchived;
  return updateRowById("directories", id, payload);
}

export async function deleteDirectory(id: string): Promise<boolean> {
  return deleteRowById("directories", id);
}

export function mapDirectory(row: Record<string, unknown>): Directory {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: (row.name as string) ?? "",
    description: (row.description as string | null) ?? null,
    colour: (row.colour as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    isArchived: (row.is_archived as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapDirectorySummary(row: Record<string, unknown>): DirectorySummary {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: (row.name as string) ?? "",
    description: (row.description as string | null) ?? null,
    colour: (row.colour as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
    isArchived: (row.is_archived as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    propertyCount: (row.property_count as number) ?? 0,
    totalSnapCount: (row.total_snap_count as number) ?? 0,
    totalInspectionCount: (row.total_inspection_count as number) ?? 0,
    totalAppraisalCount: (row.total_appraisal_count as number) ?? 0,
    totalMonitorCount: (row.total_monitor_count as number) ?? 0,
    totalActivityCount: (row.total_activity_count as number) ?? 0,
    lastActivityAt: (row.last_activity_at as string | null) ?? null,
  };
}
