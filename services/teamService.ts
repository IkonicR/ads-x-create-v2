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
     */
    async getInvitationByToken(token: string): Promise<Invitation | null> {
        // First fetch invitation without FK joins
        const { data: inv, error } = await supabase
            .from('invitations')
            .select('id, business_id, email, role, token, invited_by, expires_at, accepted_at, created_at')
            .eq('token', token)
            .maybeSingle();

        if (error || !inv) return null;

        // Fetch business name separately
        let businessName: string | undefined;
        if (inv.business_id) {
            const { data: business } = await supabase
                .from('businesses')
                .select('name')
                .eq('id', inv.business_id)
                .maybeSingle();
            businessName = business?.name;
        }

        // Fetch inviter name separately
        let inviterName: string | undefined;
        if (inv.invited_by) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', inv.invited_by)
                .maybeSingle();
            inviterName = profile?.full_name;
        }

        return {
            id: inv.id,
            businessId: inv.business_id,
            email: inv.email,
            role: inv.role,
            token: inv.token,
            invitedBy: inv.invited_by,
            expiresAt: inv.expires_at,
            acceptedAt: inv.accepted_at,
            createdAt: inv.created_at,
            businessName,
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
    }
};
