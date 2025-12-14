import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================================
// CREATE SHARE LINK
// ============================================================================

function generateToken(length = 24): string {
    return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { assetId, expiresInDays } = req.body;

    if (!assetId) {
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
        // Verify user token and get user
        const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid auth token' });
        }

        // Get the asset and verify ownership via business
        const { data: asset, error: assetError } = await supabase
            .from('assets')
            .select('id, business_id')
            .eq('id', assetId)
            .single();

        if (assetError || !asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Verify user owns the business
        const { data: business, error: bizError } = await supabase
            .from('businesses')
            .select('id, owner_id')
            .eq('id', asset.business_id)
            .eq('owner_id', user.id)
            .single();

        if (bizError || !business) {
            return res.status(403).json({ error: 'You do not own this asset' });
        }

        // Generate unique token
        const token = generateToken();

        // Calculate expiry
        let expiresAt: string | null = null;
        if (expiresInDays !== null && expiresInDays !== undefined) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + expiresInDays);
            expiresAt = expiry.toISOString();
        }

        // Create share record
        const { data: share, error: createError } = await supabase
            .from('shared_assets')
            .insert({
                asset_id: assetId,
                business_id: asset.business_id,
                created_by: user.id,
                token,
                expires_at: expiresAt,
            })
            .select()
            .single();

        if (createError) {
            console.error('[Share Create] DB Error:', createError);
            return res.status(500).json({ error: 'Failed to create share link', details: createError.message });
        }

        console.log('[Share Create] Success! Token:', token, 'Share ID:', share?.id);

        // Build full URL
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:5173';
        const shareUrl = `${baseUrl}/print/${token}`;

        return res.status(200).json({
            id: share.id,
            token,
            url: shareUrl,
            expiresAt: share.expires_at,
        });

    } catch (error: any) {
        console.error('[Share] Error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
}
