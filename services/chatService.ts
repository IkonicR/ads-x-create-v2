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
        attachment?: { type: string; content: string };
    }>;
    lastSyncedAt: string;
}

const CACHE_KEY_PREFIX = 'chat_';

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
    attachmentUrl?: string
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


