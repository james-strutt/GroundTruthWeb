/**
 * Chat page — room sidebar + conversation view.
 * Dark-themed, consistent with GroundTruthWeb design system.
 */

import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { MessageSquare, Plus, Send, User, Building2, Paperclip, FileText, Image, Download, Sparkles, Search, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import {
  fetchUserRooms,
  fetchRoomById,
  createChannel,
  createDirectMessage,
  createDealRoom,
  updateLastRead,
  startTyping as apiStartTyping,
  stopTyping as apiStopTyping,
  toggleReaction,
  updatePresence,
  sendFileMessage,
  getSignedUrl,
  editMessage,
  deleteMessage,
  requestAIReview,
  searchMessages,
  type ChatRoom,
  type ChatRoomWithUnread,
  type ChatMessage,
  type ChatTypingUser,
  type ChatMessageType,
} from '../../services/chatService';
import { useChatMessages } from '../../hooks/useChatMessages';
import styles from './ChatPage.module.css';

/* ── Helpers ── */

const AVATAR_COLOURS = ['#D4653B', '#3F6212', '#B45309', '#44403C', '#78716C', '#A8A29E', '#B5472A', '#57534E'];

function getAvatarColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length] ?? '#D4653B';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  return (name.slice(0, 2) ?? '').toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function RoomIcon({ type }: { type: string }) {
  if (type === 'direct') return <User size={16} />;
  if (type === 'deal_room') return <Building2 size={16} />;
  return <MessageSquare size={16} />;
}

/* ── Modal types ── */

type ModalType = null | 'picker' | 'channel' | 'deal_room' | 'dm';

/* ── Component ── */

export default function ChatPage() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const displayName = (user?.user_metadata?.['display_name'] as string | undefined) ?? user?.email?.split('@')[0] ?? 'User';
  const email = user?.email ?? '';

  const [rooms, setRooms] = useState<ChatRoomWithUnread[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [typingUsers, setTypingUsers] = useState<ChatTypingUser[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [dealName, setDealName] = useState('');
  const [dealAddress, setDealAddress] = useState('');
  const [dealDesc, setDealDesc] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [dmResults, setDmResults] = useState<{ userId: string; displayName: string }[]>([]);

  const { messages, isLoading: isLoadingMessages, sendMessage } = useChatMessages({
    roomId: currentRoomId,
    userId,
    displayName,
  });

  const [composerText, setComposerText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [aiReviewPending, setAiReviewPending] = useState<string | null>(null);
  const [aiReviewTargetMsg, setAiReviewTargetMsg] = useState<ChatMessage | null>(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Data loading ── */

  const loadRooms = useCallback(async () => {
    if (!userId) return;
    const r = await fetchUserRooms(userId);
    setRooms(r);
    setIsLoadingRooms(false);
  }, [userId]);

  useEffect(() => {
    loadRooms();
    if (!userId) return;

    updatePresence(userId, displayName, 'online');
    const interval = setInterval(() => updatePresence(userId, displayName, 'online'), 30000);
    const handleVis = () => updatePresence(userId, displayName, document.hidden ? 'away' : 'online');
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVis);
      updatePresence(userId, displayName, 'offline');
    };
  }, [userId, displayName, loadRooms]);

  useEffect(() => {
    if (!currentRoomId) { setCurrentRoom(null); return; }
    fetchRoomById(currentRoomId).then(setCurrentRoom);
  }, [currentRoomId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Typing indicator subscription
  useEffect(() => {
    if (!currentRoomId || !supabase) return;
    const ch = supabase.channel(`web:typing:${currentRoomId}`);
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_typing_status', filter: `room_id=eq.${currentRoomId}` }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const row = payload.new as Record<string, unknown>;
        const uid = row['user_id'] as string;
        if (uid === userId) return;
        setTypingUsers((prev) => [...prev.filter((t) => t.userId !== uid), { userId: uid, displayName: row['display_name'] as string }]);
      } else if (payload.eventType === 'DELETE') {
        const old = payload.old as Record<string, unknown>;
        setTypingUsers((prev) => prev.filter((t) => t.userId !== (old['user_id'] as string)));
      }
    }).subscribe();
    return () => { supabase.removeChannel(ch); setTypingUsers([]); };
  }, [currentRoomId, userId]);

  // Room list realtime
  useEffect(() => {
    if (!userId || !supabase) return;
    const ch = supabase.channel(`web:rooms:${userId}`);
    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_rooms' }, () => loadRooms())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_room_members', filter: `user_id=eq.${userId}` }, () => loadRooms())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, loadRooms]);

  /* ── Room selection ── */

  const handleSelectRoom = useCallback((roomId: string) => {
    setCurrentRoomId(roomId);
    setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, unreadCount: 0 } : r));
  }, []);

  /* ── Composer ── */

  const handleSend = useCallback(async () => {
    if (!composerText.trim() || !currentRoomId) return;
    await sendMessage(composerText.trim());
    setComposerText('');
    if (currentRoomId) apiStopTyping(currentRoomId, userId);
  }, [composerText, currentRoomId, sendMessage, userId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComposerText(e.target.value);
    if (currentRoomId && e.target.value.length > 0) {
      apiStartTyping(currentRoomId, userId, displayName);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => { if (currentRoomId) apiStopTyping(currentRoomId, userId); }, 5000);
    }
  }, [currentRoomId, userId, displayName]);

  /* ── File upload ── */

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRoomId) return;
    setIsUploading(true);
    try {
      await sendFileMessage(currentRoomId, file, userId, displayName);
    } catch (err) {
      console.error('[chat] File upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [currentRoomId, userId, displayName]);

  /* ── Edit / Delete ── */

  const handleStartEdit = useCallback((msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditText(msg.content ?? '');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMessageId || !editText.trim()) return;
    await editMessage(editingMessageId, editText.trim());
    setEditingMessageId(null);
    setEditText('');
  }, [editingMessageId, editText]);

  const handleDelete = useCallback((msgId: string) => {
    setDeleteTargetId(msgId);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;
    await deleteMessage(deleteTargetId, userId);
    setDeleteTargetId(null);
  }, [deleteTargetId, userId]);

  /* ── Search ── */

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const results = await searchMessages(query, currentRoomId ?? undefined);
    setSearchResults(results);
  }, [currentRoomId]);

  /* ── AI Review ── */

  const handleRequestAIReview = useCallback((msg: ChatMessage) => {
    setAiReviewTargetMsg(msg);
  }, []);

  const handleSubmitAIReview = useCallback(async (docType: string) => {
    if (!aiReviewTargetMsg || !currentRoomId) return;
    const storagePath = (aiReviewTargetMsg.metadata as Record<string, unknown>)?.['storagePath'] as string | undefined;
    if (!storagePath) return;

    setAiReviewPending(aiReviewTargetMsg.id);
    setAiReviewTargetMsg(null);
    try {
      await requestAIReview(storagePath, currentRoomId, aiReviewTargetMsg.id, docType, userId);
    } finally {
      setAiReviewPending(null);
    }
  }, [aiReviewTargetMsg, currentRoomId]);

  /* ── Modal helpers ── */

  const openModal = useCallback((type: ModalType) => {
    setActiveModal(type);
    setModalError('');
    setChannelName(''); setChannelDesc('');
    setDealName(''); setDealAddress(''); setDealDesc('');
    setDmSearch(''); setDmResults([]);
  }, []);

  const closeModal = useCallback(() => { setActiveModal(null); setModalError(''); }, []);

  /* ── Create channel ── */

  const handleCreateChannel = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) { setModalError('Please enter a channel name'); return; }
    setIsSubmitting(true);
    setModalError('');
    try {
      const room = await createChannel(channelName.trim(), userId, displayName, email, channelDesc.trim() || undefined);
      if (room) { await loadRooms(); setCurrentRoomId(room.id); closeModal(); }
      else setModalError('Failed to create channel');
    } catch { setModalError('Something went wrong'); }
    finally { setIsSubmitting(false); }
  }, [channelName, channelDesc, userId, displayName, email, loadRooms, closeModal]);

  /* ── Create deal room ── */

  const handleCreateDealRoom = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!dealName.trim()) { setModalError('Please enter a room name'); return; }
    if (!dealAddress.trim()) { setModalError('Please enter a property address'); return; }
    setIsSubmitting(true);
    setModalError('');
    try {
      const room = await createDealRoom(dealName.trim(), dealAddress.trim(), userId, displayName, email, dealDesc.trim() || undefined);
      if (room) { await loadRooms(); setCurrentRoomId(room.id); closeModal(); }
      else setModalError('Failed to create deal room');
    } catch { setModalError('Something went wrong'); }
    finally { setIsSubmitting(false); }
  }, [dealName, dealAddress, dealDesc, userId, displayName, email, loadRooms, closeModal]);

  /* ── Search users for DM ── */

  const handleDmSearch = useCallback(async (query: string) => {
    setDmSearch(query);
    if (!supabase || query.length < 2) { setDmResults([]); return; }
    const { data } = await supabase
      .from('chat_user_presence')
      .select('user_id, display_name')
      .ilike('display_name', `%${query}%`)
      .neq('user_id', userId)
      .limit(10);
    if (data) setDmResults(data.map((r: Record<string, unknown>) => ({ userId: r['user_id'] as string, displayName: r['display_name'] as string })));
  }, [userId]);

  const handleSelectDmUser = useCallback(async (targetUserId: string) => {
    setIsSubmitting(true);
    setModalError('');
    try {
      const room = await createDirectMessage(targetUserId, userId, displayName, email);
      if (room) { await loadRooms(); setCurrentRoomId(room.id); closeModal(); }
      else setModalError('Failed to create conversation');
    } catch { setModalError('Something went wrong'); }
    finally { setIsSubmitting(false); }
  }, [userId, displayName, email, loadRooms, closeModal]);

  /* ── Derived ── */

  const dealRooms = rooms.filter((r) => r.type === 'deal_room');
  const channels = rooms.filter((r) => r.type === 'channel');
  const dms = rooms.filter((r) => r.type === 'direct');

  const typingLabel = typingUsers.length === 0 ? '' :
    typingUsers.length === 1 ? `${typingUsers[0]?.displayName} is typing...` :
    `${typingUsers.length} people are typing...`;

  /* ── Render ── */

  return (
    <div className={styles.container}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>Chat</span>
          <button className={styles.newChatButton} onClick={() => openModal('picker')}>
            <Plus size={14} /> New
          </button>
        </div>

        <div className={styles.roomList}>
          {isLoadingRooms && <div className={styles.loading}>Loading...</div>}

          {dealRooms.length > 0 && <div className={styles.sectionLabel}>Deal Rooms</div>}
          {dealRooms.map((room) => (
            <button key={room.id} className={`${styles.roomItem} ${room.id === currentRoomId ? styles.roomItemActive : ''}`} onClick={() => handleSelectRoom(room.id)}>
              <div className={styles.roomAvatar} style={{ background: getAvatarColour(room.name) }}><Building2 size={16} /></div>
              <div className={styles.roomInfo}>
                <div className={styles.roomName}>{room.name}</div>
                <div className={styles.roomPreview}>{room.propertyAddress ?? room.lastMessagePreview ?? 'No messages'}</div>
              </div>
              {room.unreadCount > 0 && <span className={styles.unreadBadge}>{room.unreadCount > 99 ? '99+' : room.unreadCount}</span>}
              <span className={styles.roomTime}>{formatRelative(room.lastMessageAt)}</span>
            </button>
          ))}

          {channels.length > 0 && <div className={styles.sectionLabel}>Channels</div>}
          {channels.map((room) => (
            <button key={room.id} className={`${styles.roomItem} ${room.id === currentRoomId ? styles.roomItemActive : ''}`} onClick={() => handleSelectRoom(room.id)}>
              <div className={styles.roomAvatar} style={{ background: getAvatarColour(room.name) }}><MessageSquare size={16} /></div>
              <div className={styles.roomInfo}>
                <div className={styles.roomName}>{room.name}</div>
                <div className={styles.roomPreview}>{room.lastMessagePreview ?? 'No messages'}</div>
              </div>
              {room.unreadCount > 0 && <span className={styles.unreadBadge}>{room.unreadCount}</span>}
              <span className={styles.roomTime}>{formatRelative(room.lastMessageAt)}</span>
            </button>
          ))}

          {dms.length > 0 && <div className={styles.sectionLabel}>Direct Messages</div>}
          {dms.map((room) => (
            <button key={room.id} className={`${styles.roomItem} ${room.id === currentRoomId ? styles.roomItemActive : ''}`} onClick={() => handleSelectRoom(room.id)}>
              <div className={styles.roomAvatar} style={{ background: getAvatarColour(room.name) }}><User size={16} /></div>
              <div className={styles.roomInfo}>
                <div className={styles.roomName}>{room.name}</div>
                <div className={styles.roomPreview}>{room.lastMessagePreview ?? 'No messages'}</div>
              </div>
              {room.unreadCount > 0 && <span className={styles.unreadBadge}>{room.unreadCount}</span>}
            </button>
          ))}

          {!isLoadingRooms && rooms.length === 0 && (
            <div className={styles.emptyState}>
              <MessageSquare size={32} strokeWidth={1.2} />
              <p className={styles.emptyStateText}>No conversations yet</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Conversation ── */}
      <div className={styles.conversation}>
        {!currentRoom ? (
          <div className={styles.emptyState}>
            <MessageSquare size={48} strokeWidth={1} />
            <p className={styles.emptyStateTitle}>Select a conversation</p>
            <p className={styles.emptyStateText}>Choose a room from the sidebar or create a new one</p>
          </div>
        ) : (
          <>
            <div className={styles.conversationHeader}>
              <div className={styles.roomAvatar} style={{ background: getAvatarColour(currentRoom.name) }}>
                <RoomIcon type={currentRoom.type} />
              </div>
              <div>
                <div className={styles.conversationTitle}>{currentRoom.name}</div>
                <div className={styles.conversationSubtitle}>
                  {currentRoom.propertyAddress ?? `${currentRoom.memberCount} member${currentRoom.memberCount === 1 ? '' : 's'}`}
                </div>
              </div>
              <button
                className={styles.headerActionBtn}
                onClick={() => { setAttachmentsOpen((v) => !v); setSearchOpen(false); }}
                title="Attachments"
              >
                <Paperclip size={16} />
              </button>
              <button
                className={styles.headerActionBtn}
                onClick={() => { setSearchOpen((v) => !v); setSearchQuery(''); setSearchResults([]); setAttachmentsOpen(false); }}
                title="Search messages"
              >
                <Search size={16} />
              </button>
            </div>

            {/* Search panel */}
            {searchOpen && (
              <div className={styles.searchPanel}>
                <input
                  className={styles.modalInput}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search messages..."
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {searchResults.map((r) => (
                      <div key={r.id} className={styles.searchResultItem}>
                        <span className={styles.senderName}>{r.displayName}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.content?.slice(0, 80)}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>{formatTime(r.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attachments panel */}
            {attachmentsOpen && (
              <div className={styles.searchPanel}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Shared Files
                </div>
                <div className={styles.searchResults}>
                  {messages.filter((m) => m.messageType === 'file' || m.messageType === 'image').length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No files shared yet</div>
                  )}
                  {messages.filter((m) => m.messageType === 'file' || m.messageType === 'image').map((m) => {
                    const meta = m.metadata as Record<string, unknown>;
                    const fName = meta?.['fileName'] as string | undefined;
                    const fSize = meta?.['fileSize'] as number | undefined;
                    const sUrl = meta?.['storageUrl'] as string | undefined;
                    const sPath = meta?.['storagePath'] as string | undefined;
                    return (
                      <div key={m.id} className={styles.fileAttachment}>
                        {m.messageType === 'image' ? <Image size={16} /> : <FileText size={16} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className={styles.fileName}>{fName ?? 'File'}</div>
                          <div className={styles.fileSize}>
                            {fSize ? `${(fSize / 1024).toFixed(0)} KB` : ''} · {m.displayName} · {formatTime(m.createdAt)}
                          </div>
                        </div>
                        {m.messageType === 'file' && sPath && (
                          <button className={styles.fileDownloadBtn} title="AI Review" style={{ background: 'rgba(180,83,9,0.3)' }} onClick={(e) => { e.stopPropagation(); handleRequestAIReview(m); }}>
                            <Sparkles size={14} />
                          </button>
                        )}
                        <button className={styles.fileDownloadBtn} title="Download" onClick={async (e) => { e.stopPropagation(); const url = sUrl ?? (sPath ? await getSignedUrl(sPath) : ''); if (url) window.open(url, '_blank'); }}>
                          <Download size={14} />
                        </button>
                        {m.userId === userId && (
                          <button className={styles.fileDownloadBtn} title="Delete" style={{ background: 'rgba(153,27,27,0.3)' }} onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.messageArea}>
              {isLoadingMessages && <div className={styles.loading}>Loading messages...</div>}
              {messages.map((msg) => {
                if (msg.messageType === 'system') return <div key={msg.id} className={styles.systemMessage}>{msg.content}</div>;
                const isOwn = msg.userId === userId;
                const reactions = Object.entries(msg.reactionSummary);
                const meta = msg.metadata as Record<string, unknown>;
                const storageUrl = meta?.['storageUrl'] as string | undefined;
                const fileName = meta?.['fileName'] as string | undefined;
                const fileSize = meta?.['fileSize'] as number | undefined;
                const storagePath = meta?.['storagePath'] as string | undefined;
                const isImage = msg.messageType === 'image';
                const isFile = msg.messageType === 'file';
                const isAIReview = msg.messageType === 'ai_review';
                const reviewResult = meta?.['result'] as Record<string, unknown> | undefined;
                const isHovered = hoveredMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageBubble} ${isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther}`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div className={styles.avatar} style={{ background: getAvatarColour(msg.displayName) }}>{getInitials(msg.displayName)}</div>
                    <div style={{ position: 'relative' }}>
                      {/* Hover actions */}
                      {isHovered && (
                        <div className={styles.hoverActions}>
                          {['👍', '❤️', '😂'].map((emoji) => (
                            <button key={emoji} className={styles.hoverActionBtn} onClick={() => toggleReaction(msg.id, userId, emoji)}>{emoji}</button>
                          ))}
                          {isOwn && <button className={styles.hoverActionBtn} onClick={() => handleStartEdit(msg)} title="Edit"><Pencil size={12} /></button>}
                          {isOwn && <button className={styles.hoverActionBtn} onClick={() => handleDelete(msg.id)} title="Delete"><Trash2 size={12} /></button>}
                        </div>
                      )}

                      <div className={`${styles.bubbleContent} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
                        {!isOwn && <div className={styles.senderName}>{msg.displayName}</div>}

                        {/* Edit mode */}
                        {editingMessageId === msg.id ? (
                          <div className={styles.editArea}>
                            <input className={styles.modalInput} value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingMessageId(null); }} />
                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                              <button className={styles.modalSubmitButton} onClick={handleSaveEdit} style={{ padding: '3px 10px', fontSize: 11 }}>Save</button>
                              <button className={styles.modalCancelButton} onClick={() => setEditingMessageId(null)} style={{ padding: '3px 10px', fontSize: 11 }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Image message */}
                            {isImage && (
                              <div className={styles.imageAttachment}>
                                {storageUrl ? (
                                  <a href={storageUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={storageUrl} alt={fileName ?? 'Image'} className={styles.attachedImage} />
                                  </a>
                                ) : storagePath ? (
                                  <button className={styles.loadAttachmentBtn} onClick={async () => { const url = await getSignedUrl(storagePath); if (url) window.open(url, '_blank'); }}>
                                    <Image size={18} /> View image
                                  </button>
                                ) : null}
                              </div>
                            )}

                            {/* File message */}
                            {isFile && (
                              <div className={styles.fileAttachment}>
                                <FileText size={18} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div className={styles.fileName}>{fileName ?? 'File'}</div>
                                  {fileSize && <div className={styles.fileSize}>{(fileSize / 1024).toFixed(0)} KB</div>}
                                </div>
                                {storagePath && (
                                  <button
                                    className={styles.fileDownloadBtn}
                                    title="AI Review"
                                    onClick={() => handleRequestAIReview(msg)}
                                    style={{ background: 'rgba(180,83,9,0.3)' }}
                                  >
                                    <Sparkles size={14} />
                                  </button>
                                )}
                                <button
                                  className={styles.fileDownloadBtn}
                                  title="Download"
                                  onClick={async () => {
                                    const url = storageUrl ?? (storagePath ? await getSignedUrl(storagePath) : '');
                                    if (url) window.open(url, '_blank');
                                  }}
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            )}

                            {/* AI Review message */}
                            {isAIReview && reviewResult && (
                              <div className={styles.aiReviewCard}>
                                <div className={styles.aiReviewHeader}><Sparkles size={14} /> AI Document Review</div>
                                <div className={styles.aiReviewSummary}>{reviewResult['summary'] as string}</div>

                                {Array.isArray(reviewResult['keyFindings']) && (reviewResult['keyFindings'] as Array<Record<string, unknown>>).length > 0 && (
                                  <div className={styles.aiReviewSection}>
                                    <div className={styles.aiReviewSectionTitle}>Key Findings</div>
                                    <div className={styles.aiFindings}>
                                      {(reviewResult['keyFindings'] as Array<Record<string, unknown>>).map((f, i) => (
                                        <div key={i} className={styles.aiFinding}>
                                          <strong>{f['category'] as string}:</strong> {f['finding'] as string}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {Array.isArray(reviewResult['redFlags']) && (reviewResult['redFlags'] as Array<Record<string, unknown>>).length > 0 && (
                                  <div className={styles.aiRedFlags}>
                                    <div className={styles.aiRedFlagsTitle}>Red Flags</div>
                                    {(reviewResult['redFlags'] as Array<Record<string, unknown>>).map((f, i) => (
                                      <div key={i} className={styles.aiRedFlag}>
                                        <strong>{f['flag'] as string}</strong>
                                        {f['explanation'] && <> — {f['explanation'] as string}</>}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {reviewResult['extractedData'] && (() => {
                                  const ed = reviewResult['extractedData'] as Record<string, unknown>;
                                  const encumbrances = ed['encumbrances'] as string[] | undefined;
                                  const conditions = ed['conditions'] as string[] | undefined;
                                  const hasExtracted = encumbrances?.length || conditions?.length;
                                  if (!hasExtracted) return null;
                                  return (
                                    <div className={styles.aiReviewSection}>
                                      {encumbrances && encumbrances.length > 0 && (
                                        <>
                                          <div className={styles.aiReviewSectionTitle}>Encumbrances</div>
                                          <div className={styles.aiFindings}>
                                            {encumbrances.map((e, i) => <div key={i} className={styles.aiFinding}>{e}</div>)}
                                          </div>
                                        </>
                                      )}
                                      {conditions && conditions.length > 0 && (
                                        <>
                                          <div className={styles.aiReviewSectionTitle} style={{ marginTop: 8 }}>Special Conditions</div>
                                          <div className={styles.aiFindings}>
                                            {conditions.map((c, i) => <div key={i} className={styles.aiFinding}>{c}</div>)}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })()}

                                {reviewResult['confidence'] && (
                                  <div className={styles.aiConfidence}>
                                    Confidence: {Math.round(reviewResult['confidence'] as number)}%
                                    {reviewResult['processingTimeMs'] && <> · {((reviewResult['processingTimeMs'] as number) / 1000).toFixed(1)}s</>}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Text content (for text messages and as caption for files) */}
                            {!isImage && !isFile && !isAIReview && <div>{msg.content}</div>}

                            {aiReviewPending === msg.id && (
                              <div className={styles.aiPendingLabel}>
                                <span className={styles.aiSpinner} />
                                AI reviewing document...
                              </div>
                            )}
                          </>
                        )}

                        <div className={`${styles.messageTime} ${isOwn ? styles.messageTimeOwn : ''}`}>
                          {msg.isEdited && '(edited) '}{formatTime(msg.createdAt)}
                        </div>
                      </div>
                      {reactions.length > 0 && (
                        <div className={styles.reactions}>
                          {reactions.map(([emoji, count]) => (
                            <button key={emoji} className={styles.reactionChip} onClick={() => toggleReaction(msg.id, userId, emoji)}>
                              {emoji} <span className={styles.reactionCount}>{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </div>

            <div className={styles.typingIndicator}>{typingLabel}</div>

            <div className={styles.composer}>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
              <button className={styles.attachButton} onClick={() => fileInputRef.current?.click()} disabled={isUploading} title="Attach file">
                <Paperclip size={18} />
              </button>
              <textarea
                className={styles.composerInput}
                value={composerText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isUploading ? 'Uploading...' : 'Type a message...'}
                rows={1}
                disabled={isUploading}
              />
              <button className={styles.sendButton} onClick={handleSend} disabled={!composerText.trim() || isUploading} title="Send">
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}

      {/* New chat type picker */}
      {activeModal === 'picker' && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>New Conversation</h3>
            <div className={styles.newChatOptions}>
              <button className={styles.newChatOption} onClick={() => openModal('dm')}>
                <div className={styles.newChatOptionIcon} style={{ background: 'rgba(212,101,59,0.15)' }}><User size={20} color="#D4653B" /></div>
                <div>
                  <div className={styles.newChatOptionTitle}>Direct Message</div>
                  <div className={styles.newChatOptionDesc}>Private conversation with another user</div>
                </div>
              </button>
              <button className={styles.newChatOption} onClick={() => openModal('channel')}>
                <div className={styles.newChatOptionIcon} style={{ background: 'rgba(63,98,18,0.15)' }}><MessageSquare size={20} color="#3F6212" /></div>
                <div>
                  <div className={styles.newChatOptionTitle}>Channel</div>
                  <div className={styles.newChatOptionDesc}>Group discussion for your team</div>
                </div>
              </button>
              <button className={styles.newChatOption} onClick={() => openModal('deal_room')}>
                <div className={styles.newChatOptionIcon} style={{ background: 'rgba(180,83,9,0.15)' }}><Building2 size={20} color="#B45309" /></div>
                <div>
                  <div className={styles.newChatOptionTitle}>Deal Room</div>
                  <div className={styles.newChatOptionDesc}>Property-linked collaboration space</div>
                </div>
              </button>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelButton} onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create channel modal */}
      {activeModal === 'channel' && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateChannel}>
            <h3 className={styles.modalTitle}>Create Channel</h3>
            <div>
              <label className={styles.modalLabel}>Channel Name</label>
              <input className={styles.modalInput} value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="e.g. Inner West Acquisitions" autoFocus />
            </div>
            <div>
              <label className={styles.modalLabel}>Description (optional)</label>
              <textarea className={styles.modalTextarea} value={channelDesc} onChange={(e) => setChannelDesc(e.target.value)} placeholder="What is this channel about?" rows={2} />
            </div>
            {modalError && <p className={styles.modalError}>{modalError}</p>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancelButton} onClick={closeModal}>Cancel</button>
              <button type="submit" className={styles.modalSubmitButton} disabled={isSubmitting || !channelName.trim()}>
                {isSubmitting ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create deal room modal */}
      {activeModal === 'deal_room' && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateDealRoom}>
            <h3 className={styles.modalTitle}>Create Deal Room</h3>
            <div>
              <label className={styles.modalLabel}>Property Address</label>
              <input className={styles.modalInput} value={dealAddress} onChange={(e) => setDealAddress(e.target.value)} placeholder="e.g. 42 Smith Street, Parramatta" autoFocus />
            </div>
            <div>
              <label className={styles.modalLabel}>Room Name</label>
              <input className={styles.modalInput} value={dealName} onChange={(e) => setDealName(e.target.value)} placeholder="e.g. 42 Smith St Acquisition" />
            </div>
            <div>
              <label className={styles.modalLabel}>Description (optional)</label>
              <textarea className={styles.modalTextarea} value={dealDesc} onChange={(e) => setDealDesc(e.target.value)} placeholder="Notes about this deal..." rows={2} />
            </div>
            {modalError && <p className={styles.modalError}>{modalError}</p>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancelButton} onClick={closeModal}>Cancel</button>
              <button type="submit" className={styles.modalSubmitButton} disabled={isSubmitting || !dealName.trim() || !dealAddress.trim()}>
                {isSubmitting ? 'Creating...' : 'Create Deal Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DM user search modal */}
      {activeModal === 'dm' && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>New Direct Message</h3>
            <div>
              <label className={styles.modalLabel}>Search Users</label>
              <input className={styles.modalInput} value={dmSearch} onChange={(e) => handleDmSearch(e.target.value)} placeholder="Type a name to search..." autoFocus />
            </div>
            {dmResults.length > 0 && (
              <div className={styles.newChatOptions}>
                {dmResults.map((u) => (
                  <button key={u.userId} className={styles.newChatOption} onClick={() => handleSelectDmUser(u.userId)} disabled={isSubmitting}>
                    <div className={styles.roomAvatar} style={{ background: getAvatarColour(u.displayName), width: 36, height: 36, borderRadius: 18 }}>
                      {getInitials(u.displayName)}
                    </div>
                    <div>
                      <div className={styles.newChatOptionTitle}>{u.displayName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {dmSearch.length >= 2 && dmResults.length === 0 && (
              <p className={styles.emptyStateText} style={{ textAlign: 'center', padding: '12px 0' }}>No users found</p>
            )}
            {modalError && <p className={styles.modalError}>{modalError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.modalCancelButton} onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTargetId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTargetId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Message</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to delete this message? This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelButton} onClick={() => setDeleteTargetId(null)}>Cancel</button>
              <button className={styles.modalSubmitButton} onClick={handleConfirmDelete} style={{ background: '#991B1B' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Review document type picker */}
      {aiReviewTargetMsg && (
        <div className={styles.modalOverlay} onClick={() => setAiReviewTargetMsg(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>AI Document Review</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Select the document type so AI can focus its analysis:
            </p>
            <div className={styles.newChatOptions}>
              {[
                { type: 'contract', label: 'Contract', desc: 'Sale/purchase agreements, leases' },
                { type: 'valuation', label: 'Valuation', desc: 'Property valuation reports' },
                { type: 's149', label: 'S149 / 10.7 Certificate', desc: 'Planning certificates' },
                { type: 'survey', label: 'Survey / Plan', desc: 'Survey reports, strata plans' },
                { type: 'general', label: 'General', desc: 'Any other document' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  className={styles.newChatOption}
                  onClick={() => handleSubmitAIReview(opt.type)}
                >
                  <div className={styles.newChatOptionIcon} style={{ background: 'rgba(180,83,9,0.15)' }}>
                    <Sparkles size={18} color="#B45309" />
                  </div>
                  <div>
                    <div className={styles.newChatOptionTitle}>{opt.label}</div>
                    <div className={styles.newChatOptionDesc}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancelButton} onClick={() => setAiReviewTargetMsg(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
