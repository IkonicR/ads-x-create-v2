/**
 * GHL OAuth Callback Endpoint
 * Exchanges authorization code for access/refresh tokens
 * Stores tokens in Supabase ghl_integrations table
 * 
 * Called by GHL after user authorizes the app
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID || '693810a3890d023eb434ed2e-miyjrfk3';
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET || 'bc77b6d9-4564-409b-a4bc-5aec3c0f19f9';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { code, state: businessId } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Determine redirect URI (must match what was used in install)
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/social/callback`;

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GHL_CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: String(code),
                redirect_uri: redirectUri,
                user_type: 'Location', // CRITICAL: Must be Location for sub-account tokens
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('[GHL Callback] Token exchange failed:', errorText);
            return res.status(500).json({ error: 'Token exchange failed', details: errorText });
        }

        const tokenData = await tokenResponse.json();

        // tokenData contains: access_token, refresh_token, expires_in, locationId, userId
        const { access_token, refresh_token, expires_in, locationId, userId } = tokenData;

        if (!locationId) {
            return res.status(400).json({ error: 'No locationId in token response' });
        }

        // Calculate expiration time
        const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString();

        // Store in Supabase
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        );

        // Upsert the integration (update if exists, insert if new)
        const { error: dbError } = await supabase
            .from('ghl_integrations')
            .upsert({
                location_id: locationId,
                business_id: businessId || null,
                access_token,
                refresh_token,
                user_id: userId,
                expires_at: expiresAt,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'location_id',
            });

        if (dbError) {
            console.error('[GHL Callback] DB Error:', dbError);
            return res.status(500).json({ error: 'Failed to store tokens', details: dbError.message });
        }

        // Also update the business's socialConfig with the locationId
        if (businessId) {
            const { error: businessError } = await supabase
                .from('businesses')
                .update({
                    social_config: {
                        ghlLocationId: locationId,
                    },
                })
                .eq('id', businessId);

            if (businessError) {
                console.error('[GHL Callback] Business update error:', businessError);
                // Non-fatal: continue anyway since tokens are stored
            }
        }

        // Redirect to success page in the app
        const successUrl = businessId
            ? `${baseUrl}/business/${businessId}?ghl_connected=true`
            : `${baseUrl}?ghl_connected=true`;

        return res.redirect(302, successUrl);

    } catch (error: any) {
        console.error('[GHL Callback] Error:', error);
        return res.status(500).json({ error: 'OAuth callback failed', details: error.message });
    }
}
