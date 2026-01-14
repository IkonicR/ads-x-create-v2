/**
 * Team Invite Endpoint
 * Creates invitations for one or multiple businesses
 * 
 * POST /api/team/invite
 * Body: { 
 *   businessIds: string[],    // Array of business IDs
 *   accessScope: 'all' | 'single' | 'selected',
 *   email?: string, 
 *   role: string, 
 *   sendEmail?: boolean 
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import { generateInviteEmailHtml } from './inviteEmailTemplate';

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

    // Support both old (businessId) and new (businessIds) format
    let { businessIds, businessId, accessScope = 'single', email, role = 'viewer', sendEmail = true } = req.body;

    // Backward compatibility: convert single businessId to array
    if (!businessIds && businessId) {
        businessIds = [businessId];
    }

    if (!businessIds || businessIds.length === 0) {
        return res.status(400).json({ error: 'At least one businessId is required' });
    }

    try {
        // Verify caller has permission for ALL selected businesses
        for (const bizId of businessIds) {
            const { data: callerMember } = await supabase
                .from('business_members')
                .select('role')
                .eq('business_id', bizId)
                .eq('user_id', user.id)
                .single();

            if (!callerMember || !['owner', 'admin'].includes(callerMember.role)) {
                return res.status(403).json({ error: `No permission to invite for business: ${bizId}` });
            }
        }

        // Get business names for email
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name')
            .in('id', businessIds);

        const businessNames = businesses?.map(b => b.name).join(', ') || 'your businesses';

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Generate a shared token for all invitations in this batch
        const sharedToken = randomUUID();

        // Create invitation(s) - all share the same token
        let insertData: any[] = [];

        if (accessScope === 'all') {
            // Single invitation with 'all' access
            insertData = [{
                business_id: businessIds[0],
                email: email?.toLowerCase() || null,
                role,
                token: sharedToken,
                invited_by: user.id,
                expires_at: expiresAt.toISOString()
            }];
        } else {
            // Separate invitation for each business, same token so they're accepted together
            insertData = businessIds.map((bizId: string) => ({
                business_id: bizId,
                email: email?.toLowerCase() || null,
                role,
                token: sharedToken,
                invited_by: user.id,
                expires_at: expiresAt.toISOString()
            }));
        }

        const { data: invitations, error: inviteError } = await supabase
            .from('invitations')
            .insert(insertData)
            .select();

        if (inviteError) {
            console.error('[Team] Invite error:', inviteError);
            return res.status(500).json({ error: 'Failed to create invitation' });
        }

        const baseUrl = 'https://app.xcreate.io';
        const inviteLink = `${baseUrl}/invite/${sharedToken}`;

        // Send email if requested
        if (sendEmail && email && process.env.RESEND_API_KEY) {
            try {
                const emailHtml = generateInviteEmailHtml({
                    businessName: businessNames,
                    role,
                    inviteLink
                });

                // Smart Subject Line
                let subject = 'You\'ve been invited to join the team';
                if (businesses && businesses.length > 0) {
                    if (businesses.length === 1) {
                        subject = `You've been invited to join ${businesses[0].name}`;
                    } else if (businesses.length === 2) {
                        subject = `You've been invited to join ${businesses[0].name} and ${businesses[1].name}`;
                    } else {
                        subject = `You've been invited to join ${businesses[0].name} and ${businesses.length - 1} others`;
                    }
                }

                await resend.emails.send({
                    from: 'Ads x Create <team@mail.xcreate.io>',
                    replyTo: 'team@xcreate.io',
                    to: email,
                    subject,
                    html: emailHtml
                });
                console.log('[Team] Invite email sent to:', email);
            } catch (emailError) {
                console.error('[Team] Email send error:', emailError);
            }
        }

        return res.json({
            success: true,
            invitation: {
                id: invitations?.[0]?.id,
                token: sharedToken,
                expiresAt: expiresAt.toISOString(),
                businessCount: businessIds.length,
                accessScope
            },
            inviteLink
        });

    } catch (error) {
        console.error('[Team] Invite error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
