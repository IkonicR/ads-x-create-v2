/**
 * GHL Social OAuth Proxy
 * 
 * CRITICAL: This is the proxy that captures the 302 redirect from GHL's
 * social OAuth start endpoint and returns the URL to the frontend.
 * 
 * The frontend cannot call GHL directly because:
 * 1. It requires Authorization headers
 * 2. window.open() cannot set headers
 * 
 * Usage: POST /api/social/social-oauth
 * Body: { locationId: string, platform: 'instagram' | 'facebook' | 'linkedin' }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { locationId, platform } = req.body;

    if (!locationId || !platform) {
        return res.status(400).json({ error: 'Missing locationId or platform' });
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
            return res.status(404).json({ error: 'No GHL integration found for this location' });
        }

        let accessToken = integration.access_token;

        // Check if token is expired and refresh if needed
        if (new Date(integration.expires_at) < new Date()) {
            const refreshed = await refreshToken(integration.refresh_token);
            if (!refreshed) {
                return res.status(401).json({ error: 'Token expired and refresh failed' });
            }

            // Update token in database
            await supabase
                .from('ghl_integrations')
                .update({
                    access_token: refreshed.access_token,
                    refresh_token: refreshed.refresh_token,
                    expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('location_id', locationId);

            accessToken = refreshed.access_token;
        }

        // Get a valid userId for the location (required by GHL)
        const usersResponse = await fetch(
            `https://services.leadconnectorhq.com/users/?locationId=${locationId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                },
            }
        );

        if (!usersResponse.ok) {
            const errorText = await usersResponse.text();
            console.error('[GHL Social OAuth] Failed to get users:', errorText);
            return res.status(500).json({ error: 'Failed to get users for location' });
        }

        const usersData = await usersResponse.json();
        const userId = usersData.users?.[0]?.id || integration.user_id;

        if (!userId) {
            return res.status(400).json({ error: 'No user found in location' });
        }

        // Call GHL's social OAuth start endpoint
        // CRITICAL: redirect: 'manual' prevents following the 302, allowing us to capture the Location header
        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/oauth/${platform}/start?locationId=${locationId}&userId=${userId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                },
                redirect: 'manual', // CRITICAL: Do not follow redirect
            }
        );

        // Extract the redirect URL from the Location header
        const redirectUrl = ghlResponse.headers.get('location');

        if (!redirectUrl) {
            console.error('[GHL Social OAuth] No redirect URL in response. Status:', ghlResponse.status);
            const responseText = await ghlResponse.text();
            console.error('[GHL Social OAuth] Response body:', responseText);
            return res.status(500).json({ error: 'No OAuth URL returned from GHL' });
        }

        return res.status(200).json({ url: redirectUrl });

    } catch (error: any) {
        console.error('[GHL Social OAuth] Error:', error);
        return res.status(500).json({ error: 'Social OAuth proxy failed', details: error.message });
    }
}

// Helper: Refresh expired token
async function refreshToken(refreshTokenValue: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
} | null> {
    const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
    const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

    try {
        const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GHL_CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshTokenValue,
            }),
        });

        if (!response.ok) {
            console.error('[GHL Refresh] Failed:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('[GHL Refresh] Error:', error);
        return null;
    }
}
