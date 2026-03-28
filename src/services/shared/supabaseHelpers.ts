/**
 * Shared Supabase helpers used by all feature service modules.
 */

import { supabase } from "../../supabaseClient";
import type { Database } from "../../types/database";

type TableName = keyof Database['public']['Tables'];

/**
 * Wait for the JWT to be read from storage before the first write after load.
 * Without this, mutations can run with no Authorization header while the client
 * is still hydrating the session (updates then affect 0 rows, often with no error).
 */
export async function ensureAuthSessionLoaded(): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session !== null;
}

/**
 * RLS-blocked updates often return HTTP 204 with 0 rows and no `error` field.
 * Selecting the updated row verifies one row was written.
 */
export async function updateRowById(
  table: TableName,
  id: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  if (Object.keys(payload).length === 0) return true;
  const { data, error } = await supabase
    .from(table as "snaps")
    .update(payload as Database['public']['Tables']['snaps']['Update'])
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return false;
  return data !== null;
}

export async function deleteRowById(table: TableName, id: string): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { data, error } = await supabase
    .from(table as "snaps")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return false;
  return data !== null;
}
