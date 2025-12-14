import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GHL_API_VERSION = '2021-07-28';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { locationId } = req.query;

    if (!locationId || typeof locationId !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid locationId' });
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[API] Missing Supabase Config in env:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceKey });
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Fetch Access Token from DB
        const { data: interactionData, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('access_token')
            .eq('location_id', locationId)
            .single();

        if (dbError) {
            console.error('[API] DB Error looking for token:', dbError);
            return res.status(500).json({ error: 'Database error fetching token' });
        }

        if (!interactionData) {
            console.error('[API] No token found for LocationID:', locationId);
            return res.status(404).json({ error: 'Integration not found for this location' });
        }

        const token = interactionData.access_token;
        console.log(`[API] Found token for ${locationId}. Calling GHL...`);

        // 2. Call GHL API
        const ghlUrl = `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts?status=all&limit=100`;
        const response = await fetch(ghlUrl,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Version': GHL_API_VERSION,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[API] GHL Response Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] GHL Fetch Error Body:', errorText);

            // Handle 401 specifically (Token Expired) - In future, Trigger Refresh
            if (response.status === 401) {
                return res.status(401).json({ error: 'Token expired', details: errorText });
            }

            return res.status(response.status).json({ error: 'Failed to fetch posts from GHL', details: errorText });
        }

        const data = await response.json();
        console.log(`[API] Found ${data.posts?.length || 0} posts`);

        return res.status(200).json(data);

    } catch (error: any) {
        console.error('API Route Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
