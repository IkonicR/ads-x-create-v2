/**
 * Admin Service
 * Centralizes all admin-level data operations
 * For managing subscriptions, users, and credits
 */

import { supabase } from './supabase';
import { Business } from '../types';
import { PLANS, PlanId } from '../config/pricing';

// User with subscription data (for admin view)
export interface UserWithSubscription {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    isAdmin: boolean;
    createdAt: string;

    subscription: {
        planId: PlanId;
        status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'comped';
        creditsRemaining: number;
        creditsRollover: number;
        extraBusinesses: number;
        periodStart: string;
        periodEnd: string;
    } | null;

    // Team membership (for users who inherit from owner)
    teamMembership?: {
        inheritsFromName: string;
        inheritsFromEmail: string;
        inheritsFromPlan: PlanId;
        role: 'editor' | 'viewer';
        businessCount: number;
    };

    businessCount: number;
    businesses?: Business[];
}

export const AdminService = {
    /**
     * Get ALL users from profiles table
     * Includes users with and without subscriptions
     * Team members get `teamMembership` with inheritance info
     */
    async getAllSubscriptionOwners(): Promise<UserWithSubscription[]> {
        // Start from profiles - get ALL users
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, is_admin, updated_at, onboarding_completed')
            .order('updated_at', { ascending: false });

        if (profilesError) {
            console.error('[AdminService] Error fetching profiles:', profilesError);
            throw profilesError;
        }

        if (!profiles || profiles.length === 0) return [];

        const userIds = profiles.map(p => p.id);

        // Get subscriptions for these users (LEFT JOIN equivalent)
        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('*')
            .in('user_id', userIds);

        // Get ALL business memberships (not just owner)
        const { data: allMemberships } = await supabase
            .from('business_members')
            .select('user_id, business_id, role')
            .in('user_id', userIds);

        // Get business info including owner_id
        const businessIds = [...new Set((allMemberships || []).map(m => m.business_id))];
        const { data: businessesData } = await supabase
            .from('businesses')
            .select('id, name, owner_id')
            .in('id', businessIds);

        // Build maps
        const businessMap: Record<string, { name: string; owner_id: string }> = {};
        (businessesData || []).forEach(b => {
            businessMap[b.id] = { name: b.name, owner_id: b.owner_id };
        });

        // Get profile info for owners (for display name)
        const ownerIds = [...new Set(Object.values(businessMap).map(b => b.owner_id).filter(Boolean))];
        const { data: ownerProfiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', ownerIds);

        const ownerProfileMap: Record<string, { email: string; fullName: string | null }> = {};
        (ownerProfiles || []).forEach(p => {
            ownerProfileMap[p.id] = { email: p.email, fullName: p.full_name };
        });

        // Build subscription map
        const subsMap: Record<string, typeof subscriptions extends Array<infer T> ? T : never> = {};
        (subscriptions || []).forEach(s => {
            subsMap[s.user_id] = s;
        });

        // Build membership map for counting owned businesses
        const ownedCountMap: Record<string, number> = {};
        (allMemberships || []).forEach(m => {
            if (m.role === 'owner') {
                ownedCountMap[m.user_id] = (ownedCountMap[m.user_id] || 0) + 1;
            }
        });

        // Build team membership info for non-owners
        const teamMembershipMap: Record<string, {
            inheritsFromName: string;
            inheritsFromEmail: string;
            inheritsFromPlan: PlanId;
            role: 'editor' | 'viewer';
            businessCount: number;
        }> = {};

        (allMemberships || []).forEach(m => {
            if (m.role !== 'owner') {
                const business = businessMap[m.business_id];
                if (business && business.owner_id) {
                    const ownerSub = subsMap[business.owner_id];
                    const ownerProfile = ownerProfileMap[business.owner_id];

                    // Only set if owner has a subscription and we haven't set this user yet
                    // or if this owner has a subscription (prefer owners with subscriptions)
                    if (ownerSub && (!teamMembershipMap[m.user_id] || !teamMembershipMap[m.user_id].inheritsFromPlan)) {
                        const memberBusinessCount = (allMemberships || [])
                            .filter(mem => mem.user_id === m.user_id && mem.role !== 'owner')
                            .length;

                        teamMembershipMap[m.user_id] = {
                            inheritsFromName: ownerProfile?.fullName || ownerProfile?.email || 'Unknown',
                            inheritsFromEmail: ownerProfile?.email || '',
                            inheritsFromPlan: ownerSub.plan_id as PlanId,
                            role: m.role as 'editor' | 'viewer',
                            businessCount: memberBusinessCount
                        };
                    }
                }
            }
        });

        return profiles.map(profile => {
            const sub = subsMap[profile.id];
            const teamMembership = teamMembershipMap[profile.id];

            return {
                id: profile.id,
                email: profile.email || '',
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url,
                isAdmin: profile.is_admin || false,
                createdAt: profile.updated_at || '',
                subscription: sub ? {
                    planId: sub.plan_id as PlanId,
                    status: sub.status,
                    creditsRemaining: sub.credits_remaining,
                    creditsRollover: sub.credits_rollover || 0,
                    extraBusinesses: sub.extra_businesses || 0,
                    periodStart: sub.period_start,
                    periodEnd: sub.period_end,
                } : null,
                teamMembership: !sub ? teamMembership : undefined, // Only show if no own subscription
                businessCount: ownedCountMap[profile.id] || 0,
            };
        });
    },

    /**
     * Update a user's subscription plan
     */
    async updateUserPlan(userId: string, planId: PlanId): Promise<void> {
        const { error } = await supabase
            .from('subscriptions')
            .update({ plan_id: planId })
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * Add credits to a user's subscription
     */
    async addCredits(userId: string, amount: number): Promise<number> {
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('credits_remaining')
            .eq('user_id', userId)
            .single();

        const newBalance = (sub?.credits_remaining || 0) + amount;

        const { error } = await supabase
            .from('subscriptions')
            .update({ credits_remaining: newBalance })
            .eq('user_id', userId);

        if (error) throw error;
        return newBalance;
    },

    /**
     * Set credits to a specific value
     */
    async setCredits(userId: string, amount: number): Promise<void> {
        const { error } = await supabase
            .from('subscriptions')
            .update({ credits_remaining: amount })
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * Toggle comped status
     */
    async toggleCompedStatus(userId: string, currentStatus: string): Promise<string> {
        const newStatus = currentStatus === 'comped' ? 'active' : 'comped';

        const { error } = await supabase
            .from('subscriptions')
            .update({ status: newStatus })
            .eq('user_id', userId);

        if (error) throw error;
        return newStatus;
    },

    /**
     * Get all businesses owned by a specific user
     * Checks BOTH businesses.owner_id AND business_members table
     */
    async getUserBusinesses(userId: string): Promise<Business[]> {
        // 1. Get businesses where owner_id = userId (direct ownership)
        const { data: ownedBusinesses, error: ownedError } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', userId);

        if (ownedError) {
            console.error('[AdminService] Error fetching owned businesses:', ownedError);
        }

        // 2. Get businesses where user is owner via business_members
        const { data: memberships } = await supabase
            .from('business_members')
            .select('business_id')
            .eq('user_id', userId)
            .eq('role', 'owner');

        let memberBusinesses: Business[] = [];
        if (memberships && memberships.length > 0) {
            const businessIds = memberships.map(m => m.business_id);
            const { data: businesses } = await supabase
                .from('businesses')
                .select('*')
                .in('id', businessIds);
            memberBusinesses = (businesses || []) as Business[];
        }

        // 3. Merge and deduplicate
        const allBusinesses = [...(ownedBusinesses || []), ...memberBusinesses];
        const uniqueBusinesses = allBusinesses.filter(
            (biz, index, self) => index === self.findIndex(b => b.id === biz.id)
        );

        // 4. Map DB rows to Business type (snake_case -> camelCase)
        return uniqueBusinesses.map((row: any) => ({
            id: row.id,
            name: row.name,
            industry: row.industry,
            socialConfig: row.social_config || undefined,
        })) as Business[];
    },

    /**
     * Update business social config (GHL)
     */
    async updateBusinessSocialConfig(businessId: string, locationId: string, accessToken: string): Promise<void> {
        const { error } = await supabase
            .from('businesses')
            .update({
                social_config: {
                    ghlLocationId: locationId,
                    ghlAccessToken: accessToken,
                }
            })
            .eq('id', businessId);

        if (error) throw error;
    },

    /**
     * Set extra businesses for a user's subscription
     */
    async setExtraBusinesses(userId: string, count: number): Promise<void> {
        const { error } = await supabase
            .from('subscriptions')
            .update({ extra_businesses: Math.max(0, count) })
            .eq('user_id', userId);

        if (error) throw error;
    },

    /**
     * Get plan info for display
     */
    getPlanInfo(planId: PlanId) {
        return PLANS[planId] || PLANS.creator;
    },

    /**
     * Delete a user and all their data completely
     * DESTRUCTIVE: Removes everything including auth.users (they cannot sign in again)
     * Calls server-side API that has admin privileges
     */
    async deleteUser(userId: string): Promise<void> {
        console.log('[AdminService] Requesting full user deletion:', userId);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete user');
        }

        console.log('[AdminService] User fully deleted via API');
    },
};
