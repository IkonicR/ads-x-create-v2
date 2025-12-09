/**
 * GHL Post Endpoint
 * Schedules a social media post via GHL
 * 
 * Usage: POST /api/ghl/post
 * Body: { locationId, accountIds, caption, mediaUrls, scheduledAt? }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { locationId, accountIds, caption, mediaUrls, scheduledAt } = req.body;

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

        // Build the post payload
        const postPayload: any = {
            locationId,
            accountIds,
            type: 'post',
            status: scheduledAt ? 'scheduled' : 'published',
        };

        // Add platform-specific details based on first account
        // GHL requires different fields for different platforms
        if (mediaUrls && mediaUrls.length > 0) {
            postPayload.summary = caption;
            postPayload.media = mediaUrls.map((url: string) => ({
                url,
                type: 'image',
            }));
        } else {
            postPayload.summary = caption;
        }

        if (scheduledAt) {
            postPayload.scheduleDate = scheduledAt;
        }

        // Call GHL to create post
        const ghlResponse = await fetch(
            'https://services.leadconnectorhq.com/social-media-posting/posts',
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
