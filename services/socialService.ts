/**
 * Social Media Service
 * Wrapper for GoHighLevel Social Planner API + Local Supabase Cache
 * 
 * All GHL calls require a GHL Private Integration Token (per sub-account).
 * Local methods use Supabase for instant loading.
 */

import { supabase } from './supabase';
import { SocialPost, SocialAccount } from '../types';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

// ============================================================================
// LOCAL SUPABASE CACHE LAYER (for instant loading)
// ============================================================================

// Map from DB row to SocialPost type
const mapPostFromDB = (row: any): SocialPost => ({
    id: row.id,
    ghlPostId: row.ghl_post_id,
    parentPostId: row.parent_post_id,
    businessId: row.business_id,
    locationId: row.location_id,
    summary: row.summary || '',
    mediaUrls: row.media_urls || [],
    status: row.status || 'draft',
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    platforms: row.platforms || [],
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

// Map SocialPost to DB payload
const mapPostToDB = (post: Partial<SocialPost>) => ({
    id: post.id,
    ghl_post_id: post.ghlPostId,
    parent_post_id: post.parentPostId,
    business_id: post.businessId,
    location_id: post.locationId,
    summary: post.summary,
    media_urls: post.mediaUrls,
    status: post.status,
    scheduled_at: post.scheduledAt,
    published_at: post.publishedAt,
    platforms: post.platforms,
    synced_at: post.syncedAt,
    updated_at: new Date().toISOString(),
});

// ============================================================================
// LEGACY TYPES (Keep for compatibility)
// ============================================================================

// Types
export interface ConnectedAccount {
    id: string;
    platform: 'facebook' | 'instagram' | 'linkedin' | 'google' | 'pinterest' | 'threads' | 'bluesky';
    name: string;
    avatar?: string;
    type?: string; // 'page', 'profile', 'business', etc.
}

export interface ScheduledPost {
    id: string;
    status: 'scheduled' | 'published' | 'failed' | 'draft';
    scheduledAt: string;
    publishedAt?: string;
    platforms: string[];
    caption: string;
    mediaUrls: string[];
}

export interface SchedulePostPayload {
    caption: string;
    mediaUrls: string[];
    platformAccountIds: string[]; // IDs of connected accounts to post to
    scheduledAt?: string; // ISO date, omit for immediate post
    hashtags?: string[];
}

// ============================================================================
// GHL API LAYER
// ============================================================================

// Helper for GHL API calls
const ghlFetch = async (
    endpoint: string,
    token: string,
    options: RequestInit = {}
): Promise<any> => {
    const response = await fetch(`${GHL_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[SocialService] GHL Error:', response.status, errorText);
        throw new Error(`GHL API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
};

export const SocialService = {
    /**
     * Get all connected social media accounts for a location
     */
    getConnectedAccounts: async (locationId: string, token: string): Promise<ConnectedAccount[]> => {
        try {
            const data = await ghlFetch(
                `/social-media-posting/${locationId}/accounts`,
                token,
                { method: 'GET' }
            );

            // Map GHL response to our interface
            return (data.accounts || []).map((acc: any) => ({
                id: acc.id,
                platform: acc.platform?.toLowerCase() || 'unknown',
                name: acc.name || acc.username || 'Unknown Account',
                avatar: acc.avatar || acc.profilePicture,
                type: acc.type,
            }));
        } catch (error) {
            console.error('[SocialService] Error fetching accounts:', error);
            return [];
        }
    },

    /**
     * Schedule a post to one or more platforms
     */
    schedulePost: async (
        locationId: string,
        token: string,
        payload: SchedulePostPayload
    ): Promise<{ success: boolean; postId?: string; error?: string }> => {
        try {
            const ghlPayload: any = {
                type: 'post',
                status: payload.scheduledAt ? 'scheduled' : 'published',
                accountIds: payload.platformAccountIds,
                content: payload.caption,
                mediaUrls: payload.mediaUrls,
            };

            if (payload.scheduledAt) {
                ghlPayload.scheduledAt = payload.scheduledAt;
            }

            const data = await ghlFetch(
                `/social-media-posting/${locationId}/posts`,
                token,
                {
                    method: 'POST',
                    body: JSON.stringify(ghlPayload),
                }
            );

            return { success: true, postId: data.id || data.postId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Get scheduled/published posts (for calendar view)
     */
    getScheduledPosts: async (
        locationId: string,
        token: string,
        options?: { limit?: number; startDate?: string; endDate?: string }
    ): Promise<ScheduledPost[]> => {
        try {
            const body: any = {
                limit: options?.limit || 50,
            };

            if (options?.startDate) body.startDate = options.startDate;
            if (options?.endDate) body.endDate = options.endDate;

            const data = await ghlFetch(
                `/social-media-posting/${locationId}/posts/list`,
                token,
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                }
            );

            return (data.posts || []).map((post: any) => ({
                id: post.id,
                status: post.status,
                scheduledAt: post.scheduledAt,
                publishedAt: post.publishedAt,
                platforms: post.accountIds || [],
                caption: post.content,
                mediaUrls: post.mediaUrls || [],
            }));
        } catch (error) {
            console.error('[SocialService] Error fetching posts:', error);
            return [];
        }
    },

    /**
     * Get OAuth URL to connect a new platform
     * Returns a URL to open in a popup window
     */
    getOAuthUrl: async (
        locationId: string,
        token: string,
        platform: 'facebook' | 'instagram' | 'linkedin' | 'google' | 'tiktok'
    ): Promise<string | null> => {
        try {
            // Map our platform names to GHL's expected format
            const platformMap: Record<string, string> = {
                'facebook': 'facebook',
                'instagram': 'facebook', // Instagram uses Facebook OAuth
                'linkedin': 'linkedin',
                'google': 'google',
                'tiktok': 'tiktok',
            };

            const ghlPlatform = platformMap[platform] || platform;

            const data = await ghlFetch(
                `/social-media-posting/oauth/${ghlPlatform}/start?locationId=${locationId}`,
                token,
                { method: 'GET' }
            );

            return data.url || data.authUrl || null;
        } catch (error) {
            console.error('[SocialService] Error getting OAuth URL:', error);
            return null;
        }
    },

    /**
     * Refresh connected accounts cache in our database
     */
    refreshAccountsCache: async (
        businessId: string,
        locationId: string,
        token: string,
        saveBusiness: (business: any) => Promise<void>,
        getCurrentBusiness: () => any
    ): Promise<ConnectedAccount[]> => {
        const accounts = await SocialService.getConnectedAccounts(locationId, token);

        const business = getCurrentBusiness();
        if (business && business.socialConfig) {
            const updatedBusiness = {
                ...business,
                socialConfig: {
                    ...business.socialConfig,
                    connectedAccounts: accounts.map(acc => ({
                        platform: acc.platform,
                        name: acc.name,
                        accountId: acc.id,
                        connectedAt: new Date().toISOString(),
                    })),
                },
            };
            await saveBusiness(updatedBusiness);
        }

        return accounts;
    },

    // =========================================================================
    // LOCAL SUPABASE CACHE METHODS (for instant loading)
    // =========================================================================

    /**
     * Get posts from local Supabase cache (fast - no GHL call)
     */
    getLocalPosts: async (businessId: string, limit = 100, offset = 0): Promise<SocialPost[]> => {
        const { data, error } = await supabase
            .from('social_posts')
            .select('*')
            .eq('business_id', businessId)
            .order('scheduled_at', { ascending: true, nullsFirst: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[SocialService] Error fetching local posts:', error);
            return [];
        }

        return (data || []).map(mapPostFromDB);
    },

    /**
     * Get posts by date range (for calendar view)
     */
    getLocalPostsByDateRange: async (
        businessId: string,
        startDate: string,
        endDate: string
    ): Promise<SocialPost[]> => {
        const { data, error } = await supabase
            .from('social_posts')
            .select('*')
            .eq('business_id', businessId)
            .gte('scheduled_at', startDate)
            .lte('scheduled_at', endDate)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('[SocialService] Error fetching posts by date:', error);
            return [];
        }

        return (data || []).map(mapPostFromDB);
    },

    /**
     * Save a post to local cache (upsert)
     */
    saveLocalPost: async (post: SocialPost): Promise<void> => {
        const { error } = await supabase
            .from('social_posts')
            .upsert(mapPostToDB(post), { onConflict: 'id' });

        if (error) {
            console.error('[SocialService] Error saving local post:', error);
            throw error;
        }
    },

    /**
     * Delete a post from local cache
     */
    deleteLocalPost: async (postId: string): Promise<void> => {
        const { error } = await supabase
            .from('social_posts')
            .delete()
            .eq('id', postId);

        if (error) {
            console.error('[SocialService] Error deleting local post:', error);
            throw error;
        }
    },

    /**
     * Bulk upsert posts (used by sync)
     */
    upsertLocalPosts: async (posts: SocialPost[]): Promise<void> => {
        if (posts.length === 0) return;

        const { error } = await supabase
            .from('social_posts')
            .upsert(
                posts.map(mapPostToDB),
                { onConflict: 'ghl_post_id' }
            );

        if (error) {
            console.error('[SocialService] Error bulk upserting posts:', error);
            throw error;
        }
    },

    /**
     * Get last sync timestamp for a business
     */
    getLastSyncTime: async (businessId: string): Promise<string | null> => {
        const { data, error } = await supabase
            .from('social_posts')
            .select('synced_at')
            .eq('business_id', businessId)
            .order('synced_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            return null;
        }

        return data.synced_at;
    },
};
