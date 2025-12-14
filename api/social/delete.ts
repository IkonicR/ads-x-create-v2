/**
 * Delete Social Post API
 * Deletes a post from GHL and the local Supabase cache
 * 
 * Usage: DELETE /api/social/delete?locationId=xxx&postId=xxx
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<void> {
    if (req.method !== 'DELETE') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { locationId, postId, ghlPostId } = req.query;

    if (!locationId || !postId) {
        res.status(400).json({ error: 'Missing required params: locationId, postId' });
        return;
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
        console.error('[Delete API] Missing Supabase config');
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

    try {
        // 1. Get GHL access token
        const { data: integration, error: intError } = await supabase
            .from('ghl_integrations')
            .select('access_token')
            .eq('location_id', locationId)
            .maybeSingle();

        if (intError || !integration?.access_token) {
            console.error('[Delete API] No integration found:', intError);
            res.status(401).json({ error: 'GHL integration not found' });
            return;
        }

        // 2. Delete from GHL (if we have a GHL post ID)
        if (ghlPostId) {
            console.log('[Delete API] Deleting from GHL:', ghlPostId);
            const ghlResponse = await fetch(
                `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts/${ghlPostId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${integration.access_token}`,
                        'Version': '2021-07-28',
                        'Content-Type': 'application/json',
                    },
                    signal: AbortSignal.timeout(10000)
                }
            );

            if (!ghlResponse.ok) {
                const errorText = await ghlResponse.text();
                console.error('[Delete API] GHL delete failed:', ghlResponse.status, errorText);
                // Don't fail entirely - still delete local cache
                // Some posts may only exist locally (e.g., if sync failed)
            } else {
                console.log('[Delete API] Deleted from GHL successfully');
            }
        }

        // 3. Delete from local Supabase cache
        const { error: deleteError } = await supabase
            .from('social_posts')
            .delete()
            .eq('id', postId);

        if (deleteError) {
            console.error('[Delete API] Supabase delete failed:', deleteError);
            res.status(500).json({ error: 'Failed to delete from local cache' });
            return;
        }

        console.log('[Delete API] Post deleted successfully:', postId);
        res.status(200).json({ success: true, deletedId: postId });

    } catch (error: any) {
        console.error('[Delete API] Error:', error);
        res.status(500).json({ error: 'Failed to delete post', details: error.message });
    }
}
