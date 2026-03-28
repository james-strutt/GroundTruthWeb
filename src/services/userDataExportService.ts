import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export interface UserDataExportPayload {
  exportedAt: string;
  user: { id: string; email?: string | null };
  snaps: Database['public']['Tables']['snaps']['Row'][];
  inspections: Database['public']['Tables']['inspections']['Row'][];
  appraisals: Database['public']['Tables']['appraisals']['Row'][];
  watchedProperties: Database['public']['Tables']['watched_properties']['Row'][];
  walkSessions: Database['public']['Tables']['walk_sessions']['Row'][];
  directories: Database['public']['Tables']['directories']['Row'][];
  properties: Database['public']['Tables']['properties']['Row'][];
}

/**
 * Builds a JSON export of all user-owned rows. Uses the same tables as the
 * export-data Edge Function so the file shape stays consistent when the
 * function is deployed later.
 */
export async function buildUserDataExport(
  client: SupabaseClient<Database>,
  user: { id: string; email?: string | null }
): Promise<UserDataExportPayload> {
  const userId = user.id;

  const [
    snaps,
    inspections,
    appraisals,
    watched,
    walks,
    directories,
    properties,
  ] = await Promise.all([
    client.from('snaps').select('*').eq('user_id', userId),
    client.from('inspections').select('*').eq('user_id', userId),
    client.from('appraisals').select('*').eq('user_id', userId),
    client.from('watched_properties').select('*').eq('user_id', userId),
    client.from('walk_sessions').select('*').eq('user_id', userId),
    client.from('directories').select('*').eq('user_id', userId),
    client.from('properties').select('*').eq('user_id', userId),
  ]);

  const firstError =
    snaps.error ??
    inspections.error ??
    appraisals.error ??
    watched.error ??
    walks.error ??
    directories.error ??
    properties.error;

  if (firstError) {
    throw new Error(firstError.message);
  }

  return {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email },
    snaps: snaps.data ?? [],
    inspections: inspections.data ?? [],
    appraisals: appraisals.data ?? [],
    watchedProperties: watched.data ?? [],
    walkSessions: walks.data ?? [],
    directories: directories.data ?? [],
    properties: properties.data ?? [],
  };
}
