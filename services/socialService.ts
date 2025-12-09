/**
 * Social Media Service
 * Wrapper for GoHighLevel Social Planner API
 * 
 * All calls require a GHL Private Integration Token (per sub-account).
 */

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

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
};
