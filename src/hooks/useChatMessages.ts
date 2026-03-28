/**
 * Hook for chat messages with Supabase Realtime subscription.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase as typedSupabase } from '../supabaseClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = typedSupabase as any;
import {
  fetchMessages,
  sendMessage,
  updateLastRead,
  type ChatMessage,
  type ChatMessageType,
} from '../services/chatService';

interface UseChatMessagesOptions {
  roomId: string | null;
  userId: string;
  displayName: string;
}

export function useChatMessages({ roomId, userId, displayName }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const previousRoomRef = useRef<string | null>(null);

  const loadMessages = useCallback(async (before?: string) => {
    if (!roomId) return;
    if (!before) setIsLoading(true);

    const result = await fetchMessages(roomId, 50, before);

    if (before) {
      setMessages((prev) => [...result.data, ...prev]);
    } else {
      setMessages(result.data);
    }
    setHasMore(result.hasMore);
    setIsLoading(false);
  }, [roomId]);

  const handleSend = useCallback(async (
    content: string,
    messageType: ChatMessageType = 'text',
    metadata: Record<string, unknown> = {},
  ) => {
    if (!roomId || !content.trim()) return null;
    const msg = await sendMessage(roomId, content.trim(), userId, displayName, messageType, metadata);
    if (msg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      await updateLastRead(roomId, userId);
    }
    return msg;
  }, [roomId, userId, displayName]);

  const loadMore = useCallback(async () => {
    if (!hasMore || messages.length === 0) return;
    const oldest = messages[0];
    if (oldest) await loadMessages(oldest.createdAt);
  }, [hasMore, messages, loadMessages]);

  // Clear + reload on room change
  useEffect(() => {
    if (previousRoomRef.current !== roomId) {
      setMessages([]);
      setIsLoading(true);
    }
    previousRoomRef.current = roomId;

    if (!roomId) {
      setIsLoading(false);
      return;
    }

    loadMessages();
    updateLastRead(roomId, userId);
  }, [roomId, loadMessages, userId]);

  // Realtime subscription
  useEffect(() => {
    if (!roomId || !supabase) return;

    const channel = supabase.channel(`web:chat:room:${roomId}`);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as Record<string, unknown>;
            if (row['parent_id']) return; // skip thread messages in main view

            const newMsg: ChatMessage = {
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

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (newMsg.userId !== userId) {
              updateLastRead(roomId, userId);
            }
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as Record<string, unknown>;
            const updatedId = row['id'] as string;
            setMessages((prev) =>
              prev.map((m) => m.id === updatedId ? {
                ...m,
                content: row['content'] as string | null,
                isEdited: row['is_edited'] as boolean,
                isDeleted: row['is_deleted'] as boolean,
                reactionSummary: (row['reaction_summary'] as Record<string, number>) ?? m.reactionSummary,
                updatedAt: row['updated_at'] as string,
              } : m),
            );
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as Record<string, unknown>;
            setMessages((prev) => prev.filter((m) => m.id !== (old['id'] as string)));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  return { messages, isLoading, hasMore, loadMore, sendMessage: handleSend, refresh: loadMessages };
}
