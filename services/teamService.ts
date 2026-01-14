import { supabase } from './supabase';

export interface TeamMember {
    id: string;
    userId: string;
    businessId: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    invitedBy?: string;
    createdAt: string;
    // Joined from profiles
    userName?: string;
    userEmail?: string;
    avatarUrl?: string;
}

export interface Invitation {
    id: string;
    businessId: string;
    email: string | null;
    role: 'admin' | 'editor' | 'viewer';
    token: string;
    invitedBy: string;
    expiresAt: string;
    acceptedAt: string | null;
    createdAt: string;
    // Joined data
    inviterName?: string;
    businessName?: string;
    accessScope?: 'all' | 'single';
}

// For unified team view (account-level)
export interface UnifiedMember {
    id: string;           // Primary membership ID
    userId: string;
    userName: string;
    userEmail: string;
    avatarUrl?: string;
    role: string;         // Role (same across all their businesses)
    accessScope: 'all' | 'single';
    businesses: { id: string; name: string }[];
    createdAt: string;
}

export const TeamService = {
    /**
     * Get all members of a business
     */
    async getBusinessMembers(businessId: string): Promise<TeamMember[]> {
        // First get members
        const { data: members, error } = await supabase
            .from('business_members')
            .select('id, user_id, business_id, role, invited_by, created_at')
            .eq('business_id', businessId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[TeamService] Error fetching members:', error);
            return [];
        }

        if (!members || members.length === 0) return [];

        // Get profile data for all members (including email)
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return members.map((row: any) => {
            const profile = profileMap.get(row.user_id);
            return {
                id: row.id,
                userId: row.user_id,
                businessId: row.business_id,
                role: row.role,
                invitedBy: row.invited_by,
                createdAt: row.created_at,
                userName: profile?.full_name || 'Unknown',
                userEmail: profile?.email,
                avatarUrl: profile?.avatar_url
            };
        });
    },

    /**
     * Get user's role in a specific business
     */
    async getMemberRole(businessId: string, userId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('business_members')
            .select('role')
            .eq('business_id', businessId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('[TeamService] Error fetching role:', error);
            return null;
        }
        return data?.role || null;
    },

    /**
     * Get pending invitations for a business
     */
    async getBusinessInvitations(businessId: string): Promise<Invitation[]> {
        // Get invitations without problematic join
        const { data, error } = await supabase
            .from('invitations')
            .select('id, business_id, email, role, token, invited_by, expires_at, accepted_at, created_at')
            .eq('business_id', businessId)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[TeamService] Error fetching invitations:', error);
            return [];
        }

        if (!data || data.length === 0) return [];

        // Get inviter names
        const inviterIds = [...new Set(data.map(d => d.invited_by))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', inviterIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        return data.map((row: any) => ({
            id: row.id,
            businessId: row.business_id,
            email: row.email,
            role: row.role,
            token: row.token,
            invitedBy: row.invited_by,
            expiresAt: row.expires_at,
            acceptedAt: row.accepted_at,
            createdAt: row.created_at,
            inviterName: profileMap.get(row.invited_by) || 'Unknown'
        }));
    },

    /**
     * Get invitation details by token (for accept page)
     * Returns all invitations with the same token (for multi-business invites)
     */
    async getInvitationByToken(token: string): Promise<Invitation | null> {
        // Fetch ALL invitations with this token (multi-business share same token)
        const { data: invitations, error } = await supabase
            .from('invitations')
            .select('id, business_id, email, role, token, invited_by, expires_at, accepted_at, created_at')
            .eq('token', token);

        if (error || !invitations || invitations.length === 0) return null;

        const primaryInv = invitations[0];

        // Fetch all business names
        const businessIds = invitations.map(inv => inv.business_id);
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name')
            .in('id', businessIds);

        const businessMap = new Map(businesses?.map(b => [b.id, b.name]) || []);
        const businessNames = invitations.map(inv => businessMap.get(inv.business_id) || 'Unknown');
        const primaryBusinessName = businessMap.get(primaryInv.business_id);

        // Fetch inviter name
        let inviterName: string | undefined;
        if (primaryInv.invited_by) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', primaryInv.invited_by)
                .maybeSingle();
            inviterName = profile?.full_name;
        }

        // Return primary invitation with all business names joined
        return {
            id: primaryInv.id,
            businessId: primaryInv.business_id,
            email: primaryInv.email,
            role: primaryInv.role,
            token: primaryInv.token,
            invitedBy: primaryInv.invited_by,
            expiresAt: primaryInv.expires_at,
            acceptedAt: primaryInv.accepted_at,
            createdAt: primaryInv.created_at,
            businessName: invitations.length > 1
                ? businessNames.join(', ')
                : primaryBusinessName,
            inviterName
        };
    },

    /**
     * Update a member's role
     */
    async updateMemberRole(memberId: string, newRole: string): Promise<boolean> {
        const { error } = await supabase
            .from('business_members')
            .update({ role: newRole })
            .eq('id', memberId);

        if (error) {
            console.error('[TeamService] Error updating role:', error);
            return false;
        }
        return true;
    },

    /**
     * Remove a member from a business
     */
    async removeMember(memberId: string): Promise<boolean> {
        const { error } = await supabase
            .from('business_members')
            .delete()
            .eq('id', memberId);

        if (error) {
            console.error('[TeamService] Error removing member:', error);
            return false;
        }
        return true;
    },

    /**
     * Leave a business (self-removal)
     */
    async leaveBusiness(businessId: string, userId: string): Promise<boolean> {
        const { error } = await supabase
            .from('business_members')
            .delete()
            .eq('business_id', businessId)
            .eq('user_id', userId);

        if (error) {
            console.error('[TeamService] Error leaving business:', error);
            return false;
        }
        return true;
    },

    /**
     * Get pending invitations for a user by email (for login notifications)
     */
    async getPendingInvitesForEmail(email: string): Promise<Invitation[]> {
        if (!email) return [];

        // Fetch invitations without FK join
        const { data, error } = await supabase
            .from('invitations')
            .select('id, business_id, email, role, token, invited_by, expires_at, accepted_at, created_at')
            .eq('email', email.toLowerCase())
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString());

        if (error) {
            console.error('[TeamService] Error fetching pending invites:', error);
            return [];
        }

        if (!data || data.length === 0) return [];

        // Fetch business names separately
        const businessIds = [...new Set(data.map(d => d.business_id))];
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name')
            .in('id', businessIds);

        const businessMap = new Map(businesses?.map(b => [b.id, b.name]) || []);

        return data.map((row: any) => ({
            id: row.id,
            businessId: row.business_id,
            email: row.email,
            role: row.role,
            token: row.token,
            invitedBy: row.invited_by,
            expiresAt: row.expires_at,
            acceptedAt: row.accepted_at,
            createdAt: row.created_at,
            businessName: businessMap.get(row.business_id)
        }));
    },

    /**
     * Get ALL team members across ALL businesses (for unified team view)
     * Groups members by user, showing which businesses each user has access to
     */
    async getAllTeamMembers(businessIds: string[], businessNames: Map<string, string>): Promise<UnifiedMember[]> {
        if (businessIds.length === 0) return [];

        // 1. Fetch all memberships (exclude owners)
        const { data: memberships, error } = await supabase
            .from('business_members')
            .select('id, user_id, business_id, role, access_scope, created_at')
            .in('business_id', businessIds)
            .neq('role', 'owner');

        if (error) {
            console.error('[TeamService] Error fetching memberships:', error);
            return [];
        }

        if (!memberships || memberships.length === 0) return [];

        // 2. Get unique user IDs
        const userIds = [...new Set(memberships.map(m => m.user_id))];

        // 3. Fetch profiles separately (no FK join available)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // 4. Group memberships by user
        const userMap = new Map<string, UnifiedMember>();

        for (const m of memberships) {
            const profile = profileMap.get(m.user_id);
            const bizName = businessNames.get(m.business_id) || 'Unknown';

            const existing = userMap.get(m.user_id);
            if (existing) {
                // Add this business to their list
                if (!existing.businesses.find(b => b.id === m.business_id)) {
                    existing.businesses.push({ id: m.business_id, name: bizName });
                }
                // If any membership has 'all' scope, use that
                if (m.access_scope === 'all') {
                    existing.accessScope = 'all';
                }
            } else {
                userMap.set(m.user_id, {
                    id: m.id,
                    userId: m.user_id,
                    userName: profile?.full_name || profile?.email || 'Unknown',
                    userEmail: profile?.email || '',
                    avatarUrl: profile?.avatar_url,
                    role: m.role,
                    accessScope: m.access_scope === 'all' ? 'all' : 'single',
                    businesses: [{ id: m.business_id, name: bizName }],
                    createdAt: m.created_at
                });
            }
        }

        return Array.from(userMap.values());
    },

    /**
     * Get ALL pending invitations across ALL businesses
     * Groups invitations by token (so multi-business invites appear as ONE row)
     */
    async getAllPendingInvitations(businessIds: string[]): Promise<Invitation[]> {
        if (businessIds.length === 0) return [];

        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .in('business_id', businessIds)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[TeamService] Error fetching invitations:', error);
            return [];
        }

        if (!data || data.length === 0) return [];

        // Get business names
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name')
            .in('id', businessIds);

        const businessMap = new Map(businesses?.map(b => [b.id, b.name]) || []);

        // Group invitations by token (multi-business invites share the same token)
        const tokenMap = new Map<string, {
            primary: any;
            businessNames: string[];
            businessIds: string[];
        }>();

        for (const row of data) {
            const existing = tokenMap.get(row.token);
            const bizName = businessMap.get(row.business_id) || 'Unknown';

            if (existing) {
                // Add this business to the existing group
                if (!existing.businessIds.includes(row.business_id)) {
                    existing.businessIds.push(row.business_id);
                    existing.businessNames.push(bizName);
                }
            } else {
                // First invitation with this token
                tokenMap.set(row.token, {
                    primary: row,
                    businessNames: [bizName],
                    businessIds: [row.business_id]
                });
            }
        }

        // Convert to Invitation[] with grouped business names
        return Array.from(tokenMap.values()).map(({ primary, businessNames, businessIds }) => ({
            id: primary.id,
            businessId: primary.business_id,
            email: primary.email,
            role: primary.role,
            token: primary.token,
            invitedBy: primary.invited_by,
            expiresAt: primary.expires_at,
            acceptedAt: primary.accepted_at,
            createdAt: primary.created_at,
            // Show all business names for multi-business invites
            businessName: businessNames.length > 1
                ? `${businessNames.length} businesses`
                : businessNames[0],
            // If there's only one business but same token, or access_scope is set
            accessScope: (businessIds.length > 1 || primary.access_scope === 'all') ? 'all' : 'single'
        }));
    },

    /**
     * Revoke (delete) an invitation by ID
     */
    async revokeInvitation(invitationId: string): Promise<boolean> {
        const { error } = await supabase
            .from('invitations')
            .delete()
            .eq('id', invitationId);

        if (error) {
            console.error('[TeamService] Error revoking invitation:', error);
            return false;
        }
        return true;
    }
};
