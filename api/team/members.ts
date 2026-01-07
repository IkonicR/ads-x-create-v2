/**
 * Team Members Endpoint
 * Lists team members with enriched data (email from auth.users)
 * 
 * GET /api/team/members?businessId=xxx
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { businessId } = req.query;
    if (!businessId || typeof businessId !== 'string') {
        return res.status(400).json({ error: 'businessId is required' });
    }

    try {
        // Verify caller is a member
        const { data: callerMember } = await supabase
            .from('business_members')
            .select('role')
            .eq('business_id', businessId)
            .eq('user_id', user.id)
            .single();

        if (!callerMember) {
            return res.status(403).json({ error: 'Not a member of this business' });
        }

        // Get members with profile data
        const { data: members, error: membersError } = await supabase
            .from('business_members')
            .select(`
                id,
                user_id,
                role,
                created_at,
                profiles (
                    username,
                    full_name,
                    avatar_url
                )
            `)
            .eq('business_id', businessId);

        if (membersError) {
            console.error('[Team] Members fetch error:', membersError);
            return res.status(500).json({ error: 'Failed to fetch members' });
        }

        // Get emails from auth.users (requires service role key)
        const userIds = members?.map(m => m.user_id) || [];

        // Query auth.users for emails
        const { data: authUsers } = await supabase
            .from('auth.users')
            .select('id, email')
            .in('id', userIds);

        // Build email map (fallback: might not work without admin API)
        const emailMap = new Map();
        if (authUsers) {
            authUsers.forEach((u: any) => emailMap.set(u.id, u.email));
        }

        // Enrich members with email
        const enrichedMembers = members?.map(m => ({
            id: m.id,
            userId: m.user_id,
            role: m.role,
            createdAt: m.created_at,
            userName: (m.profiles as any)?.full_name || (m.profiles as any)?.username || 'Unknown',
            avatarUrl: (m.profiles as any)?.avatar_url,
            email: emailMap.get(m.user_id) || null
        })) || [];

        return res.json({ members: enrichedMembers });

    } catch (error) {
        console.error('[Team] Members error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
