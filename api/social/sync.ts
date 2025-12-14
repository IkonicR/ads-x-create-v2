/**
 * Social Sync API - Syncs GHL posts to local Supabase cache
 * 
 * Called by SocialContext to keep local cache in sync with GHL.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GHL_API_VERSION = '2021-07-28';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { businessId, locationId } = req.query;

    if (!businessId || typeof businessId !== 'string') {
        return res.status(400).json({ error: 'Missing businessId' });
    }

    if (!locationId || typeof locationId !== 'string') {
        return res.status(400).json({ error: 'Missing locationId' });
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[Sync API] Missing Supabase Config');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Get GHL access token from ghl_integrations table
        const { data: integrationData, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('access_token')
            .eq('location_id', locationId)
            .single();

        if (dbError || !integrationData) {
            console.error('[Sync API] No token found for location:', locationId);
            return res.status(404).json({ error: 'GHL integration not found' });
        }

        const token = integrationData.access_token;
        console.log(`[Sync API] Syncing posts for business ${businessId}, location ${locationId}`);

        // 2. Fetch all posts from GHL
        const ghlUrl = `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts/list`;
        const ghlResponse = await fetch(ghlUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Version': GHL_API_VERSION,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                limit: 100,
            }),
        });

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[Sync API] GHL Error:', ghlResponse.status, errorText);
            return res.status(ghlResponse.status).json({ error: 'Failed to fetch from GHL', details: errorText });
        }

        const ghlData = await ghlResponse.json();
        const ghlPosts = ghlData.posts || [];

        console.log(`[Sync API] Fetched ${ghlPosts.length} posts from GHL`);

        // 3. Map GHL posts to our local schema and upsert
        const now = new Date().toISOString();
        const postsToUpsert = ghlPosts.map((post: any) => ({
            ghl_post_id: post.id,
            business_id: businessId,
            location_id: locationId,
            summary: post.content || post.caption || '',
            media_urls: post.mediaUrls || [],
            status: post.status || 'draft',
            scheduled_at: post.scheduledAt || null,
            published_at: post.publishedAt || null,
            platforms: post.accountIds || post.socialMediaChannels || [],
            synced_at: now,
            updated_at: now,
        }));

        if (postsToUpsert.length > 0) {
            const { error: upsertError } = await supabase
                .from('social_posts')
                .upsert(postsToUpsert, {
                    onConflict: 'ghl_post_id',
                    ignoreDuplicates: false,
                });

            if (upsertError) {
                console.error('[Sync API] Upsert error:', upsertError);
                return res.status(500).json({ error: 'Failed to save posts', details: upsertError.message });
            }
        }

        console.log(`[Sync API] Synced ${postsToUpsert.length} posts successfully`);

        return res.status(200).json({
            success: true,
            synced: postsToUpsert.length,
            syncedAt: now,
        });

    } catch (error: any) {
        console.error('[Sync API] Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
