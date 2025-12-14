import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// REVOKE SHARE LINK
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { shareId } = req.body;

    if (!shareId) {
        return res.status(400).json({ error: 'shareId is required' });
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

        // Verify ownership and revoke
        const { data: share, error: updateError } = await supabase
            .from('shared_assets')
            .update({ is_active: false })
            .eq('id', shareId)
            .eq('created_by', user.id)
            .select()
            .single();

        if (updateError || !share) {
            return res.status(404).json({ error: 'Share not found or not authorized' });
        }

        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error('[Share Revoke] Error:', error);
        return res.status(500).json({ error: error.message || 'Server error' });
    }
}
