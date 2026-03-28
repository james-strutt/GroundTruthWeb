/**
 * Supabase CRUD for the appraisals feature table.
 */

import { supabase } from "../supabaseClient";
import { ensureAuthSessionLoaded, updateRowById, deleteRowById } from "./shared/supabaseHelpers";
import type { Appraisal } from "../types/common";

export async function listAppraisals(limit = 50): Promise<Appraisal[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("appraisals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapAppraisal);
}

export async function getAppraisal(id: string): Promise<Appraisal | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("appraisals")
    .select("*")
    .eq("id", id)
    .single();
  return data ? mapAppraisal(data) : null;
}

export async function deleteAppraisal(id: string): Promise<boolean> {
  return deleteRowById("appraisals", id);
}

/** Update an appraisal's price estimate methodology */
export async function updateAppraisalEstimateField(
  id: string,
  field: string,
  value: unknown,
): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { data: row } = await supabase
    .from("appraisals")
    .select("price_estimate")
    .eq("id", id)
    .maybeSingle();
  if (!row) return false;
  const estimate = (row.price_estimate ?? {}) as Record<string, unknown>;
  estimate[field] = value;
  return updateRowById("appraisals", id, { price_estimate: estimate });
}

/** Persist comparable-sale selection toggles back to the scored_comps jsonb */
export async function updateAppraisalCompSelections(
  id: string,
  selectedCompIds: string[],
): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { data: row } = await supabase
    .from("appraisals")
    .select("scored_comps")
    .eq("id", id)
    .maybeSingle();
  if (!row) return false;
  const comps = (row.scored_comps ?? []) as Record<string, unknown>[];
  const selectedSet = new Set(selectedCompIds);
  for (const comp of comps) {
    comp["is_manually_selected"] = selectedSet.has(comp["id"] as string);
  }
  return updateRowById("appraisals", id, { scored_comps: comps });
}

export function mapAppraisal(row: Record<string, unknown>): Appraisal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    propertyId: (row.property_id as string | null) ?? null,
    address: (row.address as string) ?? "",
    suburb: (row.suburb as string) ?? "",
    latitude: (row.latitude as number | null) ?? null,
    longitude: (row.longitude as number | null) ?? null,
    propid: (row.propid as number | null) ?? null,
    scoredComps: (row.scored_comps as Appraisal['scoredComps']) ?? [],
    priceEstimate: (row.price_estimate as Appraisal['priceEstimate']) ?? null,
    isFavourite: (row.is_favourite as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}
