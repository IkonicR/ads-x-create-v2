/**
 * GHL Accounts Endpoint
 * Lists connected social media accounts for a location
 * 
 * Usage: GET /api/ghl/accounts?locationId=xxx
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { locationId } = req.query;

    if (!locationId) {
        return res.status(400).json({ error: 'Missing locationId' });
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
            return res.status(404).json({ error: 'No GHL integration found', accounts: [] });
        }

        // Call GHL to get connected accounts
        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/oauth/accounts?locationId=${locationId}`,
            {
                headers: {
                    'Authorization': `Bearer ${integration.access_token}`,
                    'Version': '2021-07-28',
                },
            }
        );

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[GHL Accounts] Failed:', errorText);
            return res.status(500).json({ error: 'Failed to fetch accounts', accounts: [] });
        }

        const data = await ghlResponse.json();

        // Map to a cleaner format
        const accounts = (data.accounts || []).map((acc: any) => ({
            id: acc.id,
            platform: acc.platform?.toLowerCase() || 'unknown',
            name: acc.name || acc.username || 'Unknown Account',
            avatar: acc.avatar || acc.profilePicture,
            type: acc.type,
        }));

        return res.status(200).json({ accounts });

    } catch (error: any) {
        console.error('[GHL Accounts] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch accounts', details: error.message });
    }
}
