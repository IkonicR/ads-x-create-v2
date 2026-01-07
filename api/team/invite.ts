/**
 * Team Invite Endpoint
 * Creates an invitation and optionally sends email
 * 
 * POST /api/team/invite
 * Body: { businessId, email, role, sendEmail? }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import React from 'react';
import { render } from '@react-email/render';
import { InviteEmail } from '../../emails/InviteEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Team] Invite Request Received');

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

    const { businessId, email, role = 'viewer', sendEmail = true } = req.body;

    if (!businessId) {
        return res.status(400).json({ error: 'businessId is required' });
    }

    try {
        // Verify caller has permission
        const { data: callerMember } = await supabase
            .from('business_members')
            .select('role')
            .eq('business_id', businessId)
            .eq('user_id', user.id)
            .single();

        if (!callerMember || !['owner', 'admin'].includes(callerMember.role)) {
            return res.status(403).json({ error: 'No permission to invite' });
        }

        // Get business name
        const { data: business } = await supabase
            .from('businesses')
            .select('name')
            .eq('id', businessId)
            .single();

        // Generate token
        const inviteToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create invitation
        const { data: invitation, error: inviteError } = await supabase
            .from('invitations')
            .insert({
                business_id: businessId,
                email: email?.toLowerCase() || null,
                role,
                token: inviteToken,
                invited_by: user.id,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (inviteError) {
            console.error('[Team] Invite error:', inviteError);
            return res.status(500).json({ error: 'Failed to create invitation' });
        }

        const baseUrl = 'https://app.xcreate.io';
        const inviteLink = `${baseUrl}/invite/${invitation.token}`;

        // Send email if requested
        if (sendEmail && email && process.env.RESEND_API_KEY) {
            try {
                const emailHtml = await render(
                    React.createElement(InviteEmail, {
                        businessName: business?.name || 'a business',
                        role,
                        inviteLink
                    })
                );

                await resend.emails.send({
                    from: 'Ads x Create <team@xcreate.io>',
                    to: email,
                    subject: `You've been invited to ${business?.name || 'a business'}`,
                    html: emailHtml
                });
                console.log('[Team] Invite email sent to:', email);
            } catch (emailError) {
                console.error('[Team] Email send error:', emailError);
            }
        }

        return res.json({
            success: true,
            invitation: { id: invitation.id, token: invitation.token, expiresAt: invitation.expires_at },
            inviteLink
        });

    } catch (error) {
        console.error('[Team] Invite error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
