/**
 * Team Accept Endpoint
 * Accepts an invitation and adds user to business_members
 * Handles both single and 'all' access scope
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

    const { inviteToken, accessScope: requestedScope } = req.body;
    if (!inviteToken) {
        return res.status(400).json({ error: 'inviteToken is required' });
    }

    try {
        // Get all invitations with this token (for multi-business) or email match
        const { data: invitations, error: inviteError } = await supabase
            .from('invitations')
            .select('*, businesses(name)')
            .eq('token', inviteToken);

        if (inviteError || !invitations || invitations.length === 0) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        const primaryInvite = invitations[0];

        if (primaryInvite.accepted_at) {
            return res.status(400).json({ error: 'Invitation already accepted' });
        }

        if (new Date(primaryInvite.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Invitation expired' });
        }

        // Determine access scope
        // If requestedScope is 'all', create membership with access_scope='all'
        // Otherwise, create per-business memberships
        const accessScope = requestedScope || 'single';
        const businessIds = invitations.map(inv => inv.business_id);
        const addedBusinesses: string[] = [];

        if (accessScope === 'all') {
            // Check if already member of the primary business
            const { data: existing } = await supabase
                .from('business_members')
                .select('id')
                .eq('business_id', primaryInvite.business_id)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                return res.status(400).json({ error: 'Already a member' });
            }

            // Add ONE membership with access_scope = 'all'
            const { error: memberError } = await supabase
                .from('business_members')
                .insert({
                    business_id: primaryInvite.business_id,
                    user_id: user.id,
                    role: primaryInvite.role,
                    invited_by: primaryInvite.invited_by,
                    access_scope: 'all'
                });

            if (memberError) {
                console.error('[Team] Member add error:', memberError);
                return res.status(500).json({ error: 'Failed to add member' });
            }
            addedBusinesses.push(primaryInvite.business_id);
        } else {
            // Add membership for each business
            for (const inv of invitations) {
                // Check if already member
                const { data: existing } = await supabase
                    .from('business_members')
                    .select('id')
                    .eq('business_id', inv.business_id)
                    .eq('user_id', user.id)
                    .single();

                if (!existing) {
                    const { error: memberError } = await supabase
                        .from('business_members')
                        .insert({
                            business_id: inv.business_id,
                            user_id: user.id,
                            role: inv.role,
                            invited_by: inv.invited_by,
                            access_scope: 'single'
                        });

                    if (!memberError) {
                        addedBusinesses.push(inv.business_id);
                    }
                }
            }
        }

        // Mark all invitations as accepted
        await supabase
            .from('invitations')
            .update({ accepted_at: new Date().toISOString() })
            .in('id', invitations.map(inv => inv.id));

        // Notify the inviter
        if (primaryInvite.invited_by) {
            await supabase.from('notifications').insert({
                user_id: primaryInvite.invited_by,
                type: 'success',
                title: 'Invite Accepted!',
                message: `${user.email} has joined ${primaryInvite.businesses?.name || 'your business'} as ${primaryInvite.role}`,
                link: `/profile?tab=team`
            });
        }

        console.log('[Team] Invite accepted, user added to businesses:', addedBusinesses);

        return res.json({
            success: true,
            businessId: primaryInvite.business_id,
            businessName: primaryInvite.businesses?.name,
            role: primaryInvite.role,
            accessScope,
            businessCount: addedBusinesses.length
        });

    } catch (error) {
        console.error('[Team] Accept error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
