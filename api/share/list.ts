import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// LIST SHARES FOR AN ASSET
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { assetId } = req.query;

    if (!assetId || typeof assetId !== 'string') {
        return res.status(400).json({ error: 'assetId is required' });
    }

    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userToken = authHeader.split(' ')[1];

    // Access env vars inside handler (after dotenv.config() runs)
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;
    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    try {
        // Verify user token
        const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid auth token' });
        }

        // Get all shares for this asset created by user
        const { data: shares, error: listError } = await supabase
            .from('shared_assets')
            .select('id, token, recipient_email, expires_at, is_active, download_count, created_at')
            .eq('asset_id', assetId)
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (listError) {
            console.error('[Share List] DB Error:', listError);
            return res.status(500).json({ error: 'Failed to list shares', details: listError.message });
        }

        console.log('[Share List] Found', shares?.length || 0, 'shares for asset', assetId);

        // Build URLs and convert to camelCase for frontend
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:5173';

        const sharesWithUrls = (shares || []).map(share => ({
            id: share.id,
            token: share.token,
            url: `${baseUrl}/print/${share.token}`,
            recipientEmail: share.recipient_email,
            expiresAt: share.expires_at,
            isActive: share.is_active,
            downloadCount: share.download_count,
            createdAt: share.created_at,
        }));

        return res.status(200).json({ shares: sharesWithUrls });

    } catch (error: any) {
        console.error('[Share List] Error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
}
