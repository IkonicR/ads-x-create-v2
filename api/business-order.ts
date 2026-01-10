/**
 * PUT /api/business-order
 * Updates the sort order of businesses for the current user
 */
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Initialize Supabase inside handler (after dotenv.config has run)
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseSecretKey);

    // Verify user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { businessIds } = req.body as { businessIds: string[] };
    if (!businessIds || !Array.isArray(businessIds)) {
        return res.status(400).json({ error: 'businessIds array required' });
    }

    try {
        // Update sort_order for each business membership
        const updates = businessIds.map((businessId, index) =>
            supabase
                .from('business_members')
                .update({ sort_order: index })
                .eq('user_id', user.id)
                .eq('business_id', businessId)
        );

        await Promise.all(updates);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('[business-order] Error:', error);
        return res.status(500).json({ error: 'Failed to update order' });
    }
}
