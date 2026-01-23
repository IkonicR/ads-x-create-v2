/**
 * Chat Service - Database persistence for Creative Director chat
 */
import { supabase } from './supabase';

export interface ChatSession {
    id: string;
    business_id: string;
    user_id: string;
    title: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'ai';
    content: string;
    attachment_type?: string | null;
    attachment_url?: string | null;
    created_at: string;
}

// Local cache structure
interface ChatCache {
    sessionId: string;
    messages: Array<{
        id: string;
        role: 'user' | 'ai';
        text: string;
        timestamp: string;
        attachments?: { type: string; content: string }[];
    }>;
    lastSyncedAt: string;
}

const CACHE_KEY_PREFIX = 'chat_';

// ============================================================================
// CROSS-TAB SYNCHRONIZATION
// ============================================================================

const CHAT_SYNC_CHANNEL = 'chat_sync';
let syncChannel: BroadcastChannel | null = null;

function getSyncChannel(): BroadcastChannel {
    if (!syncChannel) {
        syncChannel = new BroadcastChannel(CHAT_SYNC_CHANNEL);
    }
    return syncChannel;
}

/**
 * Notify other tabs that chat data changed
 */
export function notifyChatUpdate(businessId: string, type: 'message' | 'attachment'): void {
    try {
        getSyncChannel().postMessage({ businessId, type, timestamp: Date.now() });
    } catch {
        // BroadcastChannel not supported or failed
    }
}

/**
 * Subscribe to cross-tab chat updates
 */
export function onChatUpdate(callback: (data: { businessId: string; type: string }) => void): () => void {
    const channel = getSyncChannel();
    const handler = (event: MessageEvent) => callback(event.data);
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
}

/**
 * Get cached chat from localStorage (instant)
 */
export function getCachedChat(businessId: string): ChatCache | null {
    try {
        const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${businessId}`);
        if (!cached) return null;
        return JSON.parse(cached) as ChatCache;
    } catch {
        return null;
    }
}

/**
 * Save chat to localStorage
 */
export function setCachedChat(businessId: string, cache: ChatCache): void {
    try {
        localStorage.setItem(`${CACHE_KEY_PREFIX}${businessId}`, JSON.stringify(cache));
    } catch (e) {
        console.warn('[ChatService] Failed to cache chat:', e);
    }
}

/**
 * Clear cached chat
 */
export function clearCachedChat(businessId: string): void {
    try {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${businessId}`);
    } catch {
        // Ignore
    }
}

/**
 * Find active session for business (no auto-create)
 */
export async function findActiveSession(businessId: string): Promise<ChatSession | null> {
    const { data: existing, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existing && !fetchError) {
        return existing as ChatSession;
    }
    return null;
}

/**
 * Create a new session for business (explicit create)
 */
export async function createSession(businessId: string): Promise<ChatSession | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return null;

    const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
            business_id: businessId,
            user_id: user.user.id,
            title: 'Creative Director Chat',
            is_active: true
        })
        .select()
        .single();

    if (createError) {
        console.error('[ChatService] Failed to create session:', createError);
        return null;
    }

    return newSession as ChatSession;
}

/**
 * Get active session for business, or create new one (legacy, still works)
 */
export async function getActiveSession(businessId: string): Promise<ChatSession | null> {
    const existing = await findActiveSession(businessId);
    if (existing) return existing;
    return createSession(businessId);
}

/**
 * Load all messages for a session
 */
export async function loadMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[ChatService] Failed to load messages:', error);
        return [];
    }

    return data as ChatMessage[];
}

/**
 * Save a new message
 */
export async function saveMessage(
    sessionId: string,
    role: 'user' | 'ai',
    content: string,
    attachmentType?: string,
    attachmentUrl?: string,
    businessId?: string  // Optional: for cross-tab sync
): Promise<ChatMessage | null> {
    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            session_id: sessionId,
            role,
            content,
            attachment_type: attachmentType || null,
            attachment_url: attachmentUrl || null
        })
        .select()
        .single();

    if (error) {
        console.error('[ChatService] Failed to save message:', error);
        return null;
    }

    // Update session timestamp
    await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

    // Cross-tab sync: notify other tabs (only if businessId provided)
    if (businessId) {
        notifyChatUpdate(businessId, 'message');
    }

    return data as ChatMessage;
}

/**
 * Reset chat - archives current session and creates new one
 */
export async function resetSession(businessId: string): Promise<ChatSession | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) return null;

    // Archive all active sessions for this business
    await supabase
        .from('chat_sessions')
        .update({ is_active: false })
        .eq('business_id', businessId)
        .eq('is_active', true);

    // Create new session
    const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert({
            business_id: businessId,
            user_id: user.user.id,
            title: 'Creative Director Chat',
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error('[ChatService] Failed to create new session:', error);
        return null;
    }

    return newSession as ChatSession;
}

/**
 * Get all sessions for a business (for history dropdown)
 */
export async function getAllSessions(businessId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('business_id', businessId)
        .order('updated_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('[ChatService] Failed to load sessions:', error);
        return [];
    }
    return data as ChatSession[];
}

/**
 * Update session title
 */
export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
    await supabase
        .from('chat_sessions')
        .update({ title: title.slice(0, 60) })
        .eq('id', sessionId);
}

/**
 * Update a message's attachment (for persisting generated images)
 */
export async function updateMessageAttachment(
    messageId: string,
    attachmentType: string,
    attachmentUrl: string
): Promise<void> {
    const { error } = await supabase
        .from('chat_messages')
        .update({
            attachment_type: attachmentType,
            attachment_url: attachmentUrl
        })
        .eq('id', messageId);

    if (error) {
        console.error('[ChatService] Failed to update message attachment:', error);
    }
}

// ============================================================================
// NEW ATTACHMENT SYSTEM (Phase 1 - Persistent Attachments)
// ============================================================================

export interface AttachmentMetadata {
    prompt?: string;
    aspectRatio?: string;
    styleName?: string;
    styleId?: string;
    modelTier?: 'flash' | 'pro' | 'ultra';
    subjectId?: string;
    subjectType?: string;
    subjectName?: string;
    thinkingMode?: 'LOW' | 'HIGH';
    freedomMode?: boolean;
    generationTimeMs?: number;
    width?: number;
    height?: number;
}

export interface ChatAttachment {
    id: string;
    messageId: string;
    businessId: string;
    type: string;
    url: string;
    metadata: AttachmentMetadata;
    createdAt: string;
}

/**
 * Save a single attachment with full metadata
 */
export async function saveAttachment(
    messageId: string,
    businessId: string,
    url: string,
    metadata: AttachmentMetadata = {}
): Promise<ChatAttachment | null> {
    const { data, error } = await supabase
        .from('chat_attachments')
        .insert({
            message_id: messageId,
            business_id: businessId,
            type: 'image',
            url,
            metadata
        })
        .select()
        .single();

    if (error) {
        // Ignore unique constraint violation (duplicate) - this is expected with multi-tab sync
        if (error.code === '23505') {
            console.log('[ChatService] Attachment already exists (duplicate ignored)');
            return null;
        }
        console.error('[ChatService] Failed to save attachment:', error);
        return null;
    }

    // Notify other tabs about the new attachment
    notifyChatUpdate(businessId, 'attachment');

    return {
        id: data.id,
        messageId: data.message_id,
        businessId: data.business_id,
        type: data.type,
        url: data.url,
        metadata: data.metadata,
        createdAt: data.created_at
    };
}

/**
 * Load all attachments for a message
 */
export async function getAttachments(messageId: string): Promise<ChatAttachment[]> {
    const { data, error } = await supabase
        .from('chat_attachments')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[ChatService] Failed to load attachments:', error);
        return [];
    }

    return (data || []).map(a => ({
        id: a.id,
        messageId: a.message_id,
        businessId: a.business_id,
        type: a.type,
        url: a.url,
        metadata: a.metadata || {},
        createdAt: a.created_at
    }));
}

/**
 * Load all attachments for a business (for gallery view)
 */
export async function getBusinessAttachments(
    businessId: string,
    limit: number = 50
): Promise<ChatAttachment[]> {
    const { data, error } = await supabase
        .from('chat_attachments')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[ChatService] Failed to load business attachments:', error);
        return [];
    }

    return (data || []).map(a => ({
        id: a.id,
        messageId: a.message_id,
        businessId: a.business_id,
        type: a.type,
        url: a.url,
        metadata: a.metadata || {},
        createdAt: a.created_at
    }));
}

/**
 * Delete a chat session and all its messages/attachments
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
    try {
        // Delete attachments first (they reference messages)
        const { data: messages } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('session_id', sessionId);

        if (messages && messages.length > 0) {
            const messageIds = messages.map(m => m.id);
            await supabase
                .from('chat_attachments')
                .delete()
                .in('message_id', messageIds);
        }

        // Delete messages
        await supabase
            .from('chat_messages')
            .delete()
            .eq('session_id', sessionId);

        // Delete session
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            console.error('[ChatService] Failed to delete session:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[ChatService] Delete session error:', error);
        return false;
    }
}
