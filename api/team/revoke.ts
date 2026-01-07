/**
 * Team Revoke Endpoint
 * Revokes/cancels a pending invitation
 * 
 * DELETE /api/team/revoke
 * Body: { invitationId }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Team] Revoke Request Received');

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

    const { invitationId } = req.body;
    if (!invitationId) {
        return res.status(400).json({ error: 'invitationId is required' });
    }

    try {
        // Get invitation
        const { data: invitation } = await supabase
            .from('invitations')
            .select('business_id')
            .eq('id', invitationId)
            .single();

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Verify permission
        const { data: callerMember } = await supabase
            .from('business_members')
            .select('role')
            .eq('business_id', invitation.business_id)
            .eq('user_id', user.id)
            .single();

        if (!callerMember || !['owner', 'admin'].includes(callerMember.role)) {
            return res.status(403).json({ error: 'No permission to revoke' });
        }

        // Delete
        await supabase.from('invitations').delete().eq('id', invitationId);

        console.log('[Team] Invitation revoked:', invitationId);
        return res.json({ success: true });

    } catch (error) {
        console.error('[Team] Revoke error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
