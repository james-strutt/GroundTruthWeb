/**
 * Chat service for GroundTruthWeb.
 * Mirrors the mobile app's chat services against the same Supabase tables.
 */

import { supabase as typedSupabase } from '../supabaseClient';

// Cast to untyped client — chat tables aren't in the generated Database type yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = typedSupabase as any;

/* ---------- Types ---------- */

export type ChatRoomType = 'channel' | 'direct' | 'deal_room';
export type ChatMessageType = 'text' | 'image' | 'file' | 'system' | 'property_share' | 'assessment_share' | 'ai_review';
export type ChatMemberRole = 'owner' | 'admin' | 'member';

export interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  type: ChatRoomType;
  propertyId: string | null;
  propertyAddress: string | null;
  createdBy: string;
  isPrivate: boolean;
  isArchived: boolean;
  memberCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomWithUnread extends ChatRoom {
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  parentId: string | null;
  userId: string;
  displayName: string;
  content: string | null;
  messageType: ChatMessageType;
  metadata: Record<string, unknown>;
  isEdited: boolean;
  isDeleted: boolean;
  threadCount: number;
  reactionSummary: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomMember {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  email: string;
  role: ChatMemberRole;
  lastReadAt: string | null;
  joinedAt: string;
}

export interface ChatTypingUser {
  userId: string;
  displayName: string;
}

/* ---------- Mappers ---------- */

function mapRoom(row: Record<string, unknown>): ChatRoom {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    description: row['description'] as string | null,
    type: row['type'] as ChatRoomType,
    propertyId: row['property_id'] as string | null,
    propertyAddress: row['property_address'] as string | null,
    createdBy: row['created_by'] as string,
    isPrivate: row['is_private'] as boolean,
    isArchived: row['is_archived'] as boolean,
    memberCount: row['member_count'] as number,
    lastMessageAt: row['last_message_at'] as string | null,
    lastMessagePreview: row['last_message_preview'] as string | null,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

function mapMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row['id'] as string,
    roomId: row['room_id'] as string,
    parentId: row['parent_id'] as string | null,
    userId: row['user_id'] as string,
    displayName: row['display_name'] as string,
    content: row['content'] as string | null,
    messageType: row['message_type'] as ChatMessageType,
    metadata: (row['metadata'] as Record<string, unknown>) ?? {},
    isEdited: row['is_edited'] as boolean,
    isDeleted: row['is_deleted'] as boolean,
    threadCount: row['thread_count'] as number,
    reactionSummary: (row['reaction_summary'] as Record<string, number>) ?? {},
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

function mapMember(row: Record<string, unknown>): ChatRoomMember {
  return {
    id: row['id'] as string,
    roomId: row['room_id'] as string,
    userId: row['user_id'] as string,
    displayName: row['display_name'] as string,
    email: row['email'] as string,
    role: row['role'] as ChatMemberRole,
    lastReadAt: row['last_read_at'] as string | null,
    joinedAt: row['joined_at'] as string,
  };
}

/* ---------- Rooms ---------- */

export async function fetchUserRooms(userId: string): Promise<ChatRoomWithUnread[]> {
  if (!supabase) return [];

  const { data: memberships } = await supabase
    .from('chat_room_members')
    .select('room_id, last_read_at')
    .eq('user_id', userId);

  if (!memberships?.length) return [];

  const roomIds = memberships.map((m: Record<string, unknown>) => m['room_id'] as string);
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('*')
    .in('id', roomIds)
    .eq('is_archived', false)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (!rooms) return [];

  const readMap = new Map(
    memberships.map((m: Record<string, unknown>) => [m['room_id'] as string, m['last_read_at'] as string | null]),
  );

  const results: ChatRoomWithUnread[] = [];
  for (const row of rooms) {
    const lastReadAt = readMap.get(row['id'] as string) ?? null;
    let unreadCount = 0;

    if (lastReadAt) {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', row['id'] as string)
        .eq('is_deleted', false)
        .gt('created_at', lastReadAt)
        .neq('user_id', userId);
      unreadCount = count ?? 0;
    }

    results.push({ ...mapRoom(row), unreadCount });
  }

  return results;
}

export async function fetchRoomById(roomId: string): Promise<ChatRoom | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('chat_rooms').select('*').eq('id', roomId).single();
  return data ? mapRoom(data) : null;
}

export async function createChannel(
  name: string,
  userId: string,
  displayName: string,
  email: string,
  description?: string,
): Promise<ChatRoom | null> {
  if (!supabase) { console.error('[chat] Supabase client not configured'); return null; }

  const { data, error } = await supabase
    .from('chat_rooms')
    .insert({ name, description: description ?? null, type: 'channel', created_by: userId })
    .select()
    .single();

  if (error) { console.error('[chat] Failed to create channel:', error); return null; }
  if (!data) return null;
  const room = mapRoom(data);

  const { error: memberErr } = await supabase.from('chat_room_members').insert({
    room_id: room.id, user_id: userId, display_name: displayName, email, role: 'owner',
  });
  if (memberErr) console.error('[chat] Failed to add owner to channel:', memberErr);

  return room;
}

export async function createDirectMessage(
  participantId: string,
  userId: string,
  displayName: string,
  email: string,
): Promise<ChatRoom | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('chat_rooms')
    .insert({ name: `DM`, type: 'direct', is_private: true, created_by: userId })
    .select()
    .single();

  if (error) { console.error('[chat] Failed to create DM room:', error); return null; }
  if (!data) return null;
  const room = mapRoom(data);

  // Sequential inserts — owner first, then participant (RLS needs owner row to exist)
  const { error: ownerErr } = await supabase.from('chat_room_members').insert(
    { room_id: room.id, user_id: userId, display_name: displayName, email, role: 'owner' },
  );
  if (ownerErr) console.error('[chat] Failed to add DM owner:', ownerErr);

  const { error: memberErr } = await supabase.from('chat_room_members').insert(
    { room_id: room.id, user_id: participantId, display_name: '', email: '', role: 'member' },
  );
  if (memberErr) console.error('[chat] Failed to add DM participant:', memberErr);

  return room;
}

export async function createDealRoom(
  name: string,
  propertyAddress: string,
  userId: string,
  displayName: string,
  email: string,
  description?: string,
): Promise<ChatRoom | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('chat_rooms')
    .insert({
      name,
      description: description ?? null,
      type: 'deal_room',
      is_private: true,
      property_address: propertyAddress,
      property_id: `web-${Date.now()}`,
      created_by: userId,
    })
    .select()
    .single();

  if (error) { console.error('[chat] Failed to create deal room:', error); return null; }
  if (!data) return null;
  const room = mapRoom(data);

  const { error: memberErr } = await supabase.from('chat_room_members').insert({
    room_id: room.id, user_id: userId, display_name: displayName, email, role: 'owner',
  });
  if (memberErr) console.error('[chat] Failed to add deal room owner:', memberErr);

  return room;
}

/* ---------- Messages ---------- */

export async function fetchMessages(
  roomId: string,
  limit = 50,
  before?: string,
): Promise<{ data: ChatMessage[]; hasMore: boolean }> {
  if (!supabase) return { data: [], hasMore: false };

  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_deleted', false)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (before) query = query.lt('created_at', before);

  const { data } = await query;
  if (!data) return { data: [], hasMore: false };

  const hasMore = data.length > limit;
  const trimmed = hasMore ? data.slice(0, limit) : data;
  return {
    data: trimmed.map((r: Record<string, unknown>) => mapMessage(r)).reverse(),
    hasMore,
  };
}

export async function sendMessage(
  roomId: string,
  content: string,
  userId: string,
  displayName: string,
  messageType: ChatMessageType = 'text',
  metadata: Record<string, unknown> = {},
): Promise<ChatMessage | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      user_id: userId,
      display_name: displayName,
      content,
      message_type: messageType,
      metadata,
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapMessage(data);
}

export async function editMessage(messageId: string, content: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('chat_messages')
    .update({ content, is_edited: true, updated_at: new Date().toISOString() })
    .eq('id', messageId);
  return !error;
}

export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_deleted: true, content: '[Message deleted]', updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('user_id', userId);
  return !error;
}

/* ---------- Members ---------- */

export async function fetchRoomMembers(roomId: string): Promise<ChatRoomMember[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('chat_room_members')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  return (data ?? []).map((r: Record<string, unknown>) => mapMember(r));
}

/* ---------- Read receipts ---------- */

export async function updateLastRead(roomId: string, userId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('chat_room_members')
    .update({ last_read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId);
}

/* ---------- Typing ---------- */

export async function startTyping(roomId: string, userId: string, displayName: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('chat_typing_status').upsert(
    { room_id: roomId, user_id: userId, display_name: displayName, started_at: new Date().toISOString() },
    { onConflict: 'room_id,user_id' },
  );
}

export async function stopTyping(roomId: string, userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('chat_typing_status').delete().eq('room_id', roomId).eq('user_id', userId);
}

/* ---------- Reactions ---------- */

export async function toggleReaction(messageId: string, userId: string, emoji: string): Promise<void> {
  if (!supabase) return;
  const { data: existing } = await supabase
    .from('chat_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from('chat_reactions').delete().eq('id', existing['id'] as string);
  } else {
    await supabase.from('chat_reactions').insert({ message_id: messageId, user_id: userId, emoji });
  }
}

/* ---------- File upload ---------- */

function sanitiseFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadChatFile(
  roomId: string,
  messageId: string,
  file: File,
): Promise<{ storagePath: string; signedUrl: string } | null> {
  if (!supabase) return null;

  const storagePath = `${roomId}/${messageId}/${sanitiseFileName(file.name)}`;
  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (error) { console.error('[chat] Upload failed:', error); return null; }

  const { data: urlData } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(storagePath, 3600);

  return { storagePath, signedUrl: urlData?.signedUrl ?? '' };
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  if (!supabase) return '';
  const { data } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? '';
}

export async function sendFileMessage(
  roomId: string,
  file: File,
  userId: string,
  displayName: string,
): Promise<ChatMessage | null> {
  if (!supabase) return null;
  const isImage = file.type.startsWith('image/');

  // Upload file first so we have the URL before inserting the message
  const placeholderId = crypto.randomUUID();
  const storagePath = `${roomId}/${placeholderId}/${sanitiseFileName(file.name)}`;

  const { error: uploadErr } = await supabase.storage
    .from('chat-attachments')
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadErr) {
    console.error('[chat] Upload failed:', uploadErr);
    return null;
  }

  const { data: urlData } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(storagePath, 3600);

  const signedUrl = urlData?.signedUrl ?? '';

  // Now send message with full metadata including storagePath
  const msg = await sendMessage(
    roomId,
    isImage ? `[Image: ${file.name}]` : `[File: ${file.name}]`,
    userId,
    displayName,
    isImage ? 'image' : 'file',
    {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      storageUrl: signedUrl,
      storagePath,
    },
  );

  if (!msg) return null;

  // Create attachment record
  await supabase.from('chat_attachments').insert({
    message_id: msg.id,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage_path: storagePath,
    is_image: isImage,
  });

  return msg;
}

/* ---------- AI Document Review ---------- */

export async function requestAIReview(
  storagePath: string,
  roomId: string,
  messageId: string,
  documentType: string,
  requestedBy?: string,
): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.functions.invoke('ai-document-review', {
    body: { storagePath, roomId, messageId, documentType, requestedBy },
  });

  if (error) { console.error('[chat] AI review failed:', error); return null; }
  return data as Record<string, unknown>;
}

/* ---------- Search ---------- */

export async function searchMessages(query: string, roomId?: string): Promise<ChatMessage[]> {
  if (!supabase || query.length < 2) return [];

  let q = supabase
    .from('chat_messages')
    .select('*')
    .ilike('content', `%${query}%`)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (roomId) q = q.eq('room_id', roomId);

  const { data } = await q;
  return (data ?? []).map((r: Record<string, unknown>) => mapMessage(r));
}

/* ---------- Presence ---------- */

export async function updatePresence(userId: string, displayName: string, status: 'online' | 'away' | 'offline'): Promise<void> {
  if (!supabase) return;
  await supabase.from('chat_user_presence').upsert(
    { user_id: userId, display_name: displayName, status, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
}
