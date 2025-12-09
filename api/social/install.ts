/**
 * GHL Install Endpoint
 * Returns the OAuth URL to install the GHL app on a sub-account
 * 
 * Usage: GET /api/social/install?businessId=xxx
 */


import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID || '693810a3890d023eb434ed2e-miyjrfk3';

// Scopes required for social posting
const SCOPES = [
    'socialplanner/account.readonly',
    'socialplanner/account.write',
    'socialplanner/oauth.readonly',
    'socialplanner/oauth.write',
    'socialplanner/post.readonly',
    'socialplanner/post.write',
    'locations.readonly',
    'users.readonly',
    'medias.readonly',
    'medias.write',
].join(' ');

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { businessId } = req.query;

    // Determine redirect URI based on environment
    const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    const redirectUri = `${baseUrl}/api/social/callback`;

    // Build the OAuth URL (white-labeled via leadconnectorhq.com)
    const params = new URLSearchParams({
        response_type: 'code',
        redirect_uri: redirectUri,
        client_id: GHL_CLIENT_ID,
        scope: SCOPES,
    });

    // Pass businessId as state so we can associate the token later
    if (businessId) {
        params.set('state', String(businessId));
    }

    const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?${params.toString()}`;

    return res.status(200).json({ url: authUrl });
}
