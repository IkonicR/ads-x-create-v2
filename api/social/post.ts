/**
 * GHL Post Endpoint
 * Schedules a social media post via GHL
 * 
 * Usage: POST /api/social/post
 * Body: { locationId, accountIds, caption, mediaUrls, scheduledAt? }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { locationId, accountIds, caption, mediaUrls, scheduledAt, firstComment } = req.body;

    if (!locationId || !accountIds || !caption) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Get token from database
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        );

        const { data: integration, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('*')
            .eq('location_id', locationId)
            .single();

        if (dbError || !integration) {
            return res.status(404).json({ error: 'No GHL integration found' });
        }

        // Build the post payload per GHL API requirements
        // - locationId is in URL path, NOT in body
        // - userId is required
        // - media must always be an array (even if empty)
        const postPayload: any = {
            accountIds,
            type: 'post',
            status: scheduledAt ? 'scheduled' : 'published',
            userId: integration.user_id,
            summary: caption,
            media: mediaUrls && mediaUrls.length > 0
                ? mediaUrls.map((url: string) => ({ url, type: 'image/jpeg' }))
                : [],
        };

        if (scheduledAt) {
            postPayload.scheduleDate = scheduledAt;
        }

        // If firstComment is enabled, extract hashtags from caption and put them in followUpComment
        if (firstComment && caption) {
            const hashtagRegex = /#[\w]+/g;
            const hashtags = caption.match(hashtagRegex);
            if (hashtags && hashtags.length > 0) {
                postPayload.followUpComment = hashtags.join(' ');
                // Remove hashtags from the main caption
                postPayload.summary = caption.replace(hashtagRegex, '').trim().replace(/\s+/g, ' ');
            }
        }

        // Call GHL to create post
        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${integration.access_token}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postPayload),
            }
        );

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[GHL Post] Failed:', errorText);
            return res.status(500).json({ error: 'Failed to create post', details: errorText });
        }

        const data = await ghlResponse.json();

        return res.status(200).json({
            success: true,
            postId: data.id || data.postId,
            status: data.status,
        });

    } catch (error: any) {
        console.error('[GHL Post] Error:', error);
        return res.status(500).json({ error: 'Failed to create post', details: error.message });
    }
}
