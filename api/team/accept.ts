/**
 * Team Accept Endpoint
 * Accepts an invitation and adds user to business_members
 * 
 * POST /api/team/accept
 * Body: { inviteToken }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Team] Accept Request Received');

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

    const { inviteToken } = req.body;
    if (!inviteToken) {
        return res.status(400).json({ error: 'inviteToken is required' });
    }

    try {
        // Get invitation
        const { data: invitation, error: inviteError } = await supabase
            .from('invitations')
            .select('*, businesses(name)')
            .eq('token', inviteToken)
            .single();

        if (inviteError || !invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        if (invitation.accepted_at) {
            return res.status(400).json({ error: 'Invitation already accepted' });
        }

        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invitation expired' });
        }

        // Check if already member
        const { data: existing } = await supabase
            .from('business_members')
            .select('id')
            .eq('business_id', invitation.business_id)
            .eq('user_id', user.id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Already a member' });
        }

        // Add to members
        const { error: memberError } = await supabase
            .from('business_members')
            .insert({
                business_id: invitation.business_id,
                user_id: user.id,
                role: invitation.role,
                invited_by: invitation.invited_by
            });

        if (memberError) {
            console.error('[Team] Member add error:', memberError);
            return res.status(500).json({ error: 'Failed to add member' });
        }

        // Mark accepted
        await supabase
            .from('invitations')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invitation.id);

        // Notify the inviter
        if (invitation.invited_by) {
            await supabase.from('notifications').insert({
                user_id: invitation.invited_by,
                type: 'success',
                title: 'Invite Accepted!',
                message: `${user.email} has joined ${invitation.businesses?.name || 'your business'} as ${invitation.role}`,
                link: `/profile?tab=team`
            });
        }

        console.log('[Team] Invite accepted, user added to:', invitation.business_id);

        return res.json({
            success: true,
            businessId: invitation.business_id,
            businessName: invitation.businesses?.name,
            role: invitation.role
        });

    } catch (error) {
        console.error('[Team] Accept error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
