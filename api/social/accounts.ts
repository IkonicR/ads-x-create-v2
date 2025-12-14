/**
 * GHL Accounts Endpoint
 * Lists connected social media accounts for a location
 * 
 * Usage: GET /api/social/accounts?locationId=xxx
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Compatible with both Vercel and Express
export default async function handler(req: any, res: any) {
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

        let accessToken = integration.access_token;

        // Helper: Refresh Token (Inline for serverless)
        async function refreshGHLToken(refreshToken: string) {
            try {
                const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: process.env.GHL_CLIENT_ID!,
                        client_secret: process.env.GHL_CLIENT_SECRET!,
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken,
                    }),
                });
                if (!response.ok) return null;
                return await response.json();
            } catch { return null; }
        }

        // Check Expiry
        if (new Date(integration.expires_at) < new Date()) {
            console.log('[GHL Accounts] Token expired. Refreshing...');
            const refreshed = await refreshGHLToken(integration.refresh_token);

            if (refreshed) {
                // Update DB
                await supabase.from('ghl_integrations').update({
                    access_token: refreshed.access_token,
                    refresh_token: refreshed.refresh_token,
                    expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                }).eq('location_id', locationId);

                accessToken = refreshed.access_token;
                console.log('[GHL Accounts] Token refreshed.');
            } else {
                console.error('[GHL Accounts] Refresh failed.');
                return res.status(401).json({ error: 'Token expired. Please reconnect account.' });
            }
        }

        // Call GHL to get connected accounts
        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/accounts`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
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
        const accounts = (data.results?.accounts || []).map((acc: any) => ({
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
