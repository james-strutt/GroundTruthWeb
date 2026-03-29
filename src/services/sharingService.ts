/**
 * Directory sharing — search users and manage directory_shares.
 */

import { supabase as typedSupabase } from '../supabaseClient';
import { ensureAuthSessionLoaded } from './shared/supabaseHelpers';

// Cast to untyped client — directory_shares isn't in the generated Database type yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = typedSupabase as any;

export type SharePermission = 'read' | 'edit';

export interface DirectoryShare {
  id: string;
  directoryId: string;
  ownerId: string;
  sharedWithId: string;
  sharedWithName: string;
  sharedWithEmail: string;
  permission: SharePermission;
  createdAt: string;
}

export interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  if (!supabase || query.length < 2) return [];
  const { data } = await supabase
    .from('users')
    .select('id, display_name, email')
    .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);
  if (!data) return [];

  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  return (data as Record<string, unknown>[])
    .filter((r) => r['id'] !== currentUserId)
    .map((r) => ({
      id: r['id'] as string,
      displayName: (r['display_name'] as string) ?? '',
      email: (r['email'] as string) ?? '',
    }));
}

export async function listDirectoryShares(directoryId: string): Promise<DirectoryShare[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('directory_shares')
    .select('id, directory_id, owner_id, shared_with_id, permission, created_at')
    .eq('directory_id', directoryId)
    .order('created_at', { ascending: true });
  if (!data) return [];

  const userIds = (data as Record<string, unknown>[]).map((r) => r['shared_with_id'] as string);
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, email')
    .in('id', userIds);

  const userMap = new Map(
    ((users as Record<string, unknown>[] | null) ?? []).map((u) => [
      u['id'] as string,
      { name: (u['display_name'] as string) ?? '', email: (u['email'] as string) ?? '' },
    ]),
  );

  return (data as Record<string, unknown>[]).map((r) => {
    const sharedWithId = r['shared_with_id'] as string;
    const userInfo = userMap.get(sharedWithId);
    return {
      id: r['id'] as string,
      directoryId: r['directory_id'] as string,
      ownerId: r['owner_id'] as string,
      sharedWithId,
      sharedWithName: userInfo?.name ?? '',
      sharedWithEmail: userInfo?.email ?? '',
      permission: r['permission'] as SharePermission,
      createdAt: r['created_at'] as string,
    };
  });
}

export async function shareDirectory(
  directoryId: string,
  sharedWithId: string,
  permission: SharePermission = 'read',
): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { error } = await supabase.from('directory_shares').insert({
    directory_id: directoryId,
    owner_id: session.user.id,
    shared_with_id: sharedWithId,
    permission,
  });
  return !error;
}

export async function removeDirectoryShare(shareId: string): Promise<boolean> {
  if (!supabase) return false;
  if (!(await ensureAuthSessionLoaded())) return false;
  const { error } = await supabase
    .from('directory_shares')
    .delete()
    .eq('id', shareId);
  return !error;
}
