/**
 * Supabase CRUD for the inspections feature table.
 */

import { supabase } from "../supabaseClient";
import { ensureAuthSessionLoaded, updateRowById, deleteRowById } from "./shared/supabaseHelpers";
import type { Inspection } from "../types/common";

export async function listInspections(limit = 50): Promise<Inspection[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("inspections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapInspection);
}

export async function getInspection(id: string): Promise<Inspection | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("inspections")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapInspection(data) : null;
}

export async function deleteInspection(id: string): Promise<boolean> {
  return deleteRowById("inspections", id);
}

/** Update a specific field within a photo's analysis in an inspection */
export async function updateInspectionPhotoAnalysis(
  inspectionId: string,
  photoIndex: number,
  field: string,
  value: unknown,
): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { data: row } = await supabase
    .from("inspections")
    .select("photos")
    .eq("id", inspectionId)
    .maybeSingle();
  if (!row) return false;
  const photos = [...((row.photos ?? []) as Record<string, unknown>[])];
  const photo = photos[photoIndex];
  if (!photo) return false;
  const analysis = (photo["analysis"] ?? {}) as Record<string, unknown>;
  analysis[field] = value;
  photo["analysis"] = analysis;
  return updateRowById("inspections", inspectionId, { photos });
}

/** Update an inspection's report narrative */
export async function updateInspectionReportField(
  id: string,
  field: string,
  value: unknown,
): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { data: row } = await supabase
    .from("inspections")
    .select("report")
    .eq("id", id)
    .maybeSingle();
  if (!row) return false;
  const report = (row.report ?? {}) as Record<string, unknown>;
  report[field] = value;
  return updateRowById("inspections", id, { report });
}

/** Remove a specific photo from an inspection's photos array */
export async function deleteInspectionPhoto(
  inspectionId: string,
  photoIndex: number,
): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { data: row } = await supabase
    .from("inspections")
    .select("photos")
    .eq("id", inspectionId)
    .maybeSingle();
  if (!row) return false;
  const photos = [...((row.photos ?? []) as unknown[])];
  photos.splice(photoIndex, 1);
  return updateRowById("inspections", inspectionId, {
    photos,
    photo_count: photos.length,
  });
}

export function mapInspection(row: Record<string, unknown>): Inspection {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    propertyId: (row.property_id as string | null) ?? null,
    address: (row.address as string) ?? "",
    suburb: (row.suburb as string) ?? "",
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    propid: (row.propid as number | null) ?? null,
    photos: (row.photos as Inspection['photos']) ?? [],
    report: (row.report as Inspection['report']) ?? null,
    overallScore: (row.overall_score as number | null) ?? null,
    isFavourite: (row.is_favourite as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}
