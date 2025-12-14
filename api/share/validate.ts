import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// VALIDATE SHARE TOKEN & GET ASSET DATA (Public endpoint)
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token is required' });
    }

    // Access env vars inside handler (after dotenv.config() runs)
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;
    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    try {
        // Get share record
        const { data: share, error: shareError } = await supabase
            .from('shared_assets')
            .select('*')
            .eq('token', token)
            .single();

        if (shareError || !share) {
            return res.status(404).json({ error: 'Share link not found' });
        }

        // Check if revoked
        if (!share.is_active) {
            return res.status(410).json({ error: 'This link has been revoked' });
        }

        // Check expiry
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ error: 'This link has expired' });
        }

        // Get asset
        const { data: asset, error: assetError } = await supabase
            .from('assets')
            .select('id, content, prompt, aspect_ratio, created_at')
            .eq('id', share.asset_id)
            .single();

        if (assetError || !asset) {
            return res.status(404).json({ error: 'Asset no longer exists' });
        }

        // Get business for branding
        const { data: business, error: bizError } = await supabase
            .from('businesses')
            .select('id, name, logo_url, voice')
            .eq('id', share.business_id)
            .single();

        if (bizError || !business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        return res.status(200).json({
            share: {
                id: share.id,
                expiresAt: share.expires_at,
                downloadCount: share.download_count,
            },
            asset: {
                id: asset.id,
                imageUrl: asset.content,
                aspectRatio: asset.aspect_ratio,
                createdAt: asset.created_at,
            },
            business: {
                name: business.name,
                logoUrl: business.logo_url,
                slogan: business.voice?.slogan || null,
            },
        });

    } catch (error: any) {
        console.error('[Share Validate] Error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
}
