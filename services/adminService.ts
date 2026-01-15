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

    businessCount: number;
    businesses?: Business[];
}

export const AdminService = {
    /**
     * Get all users who have subscriptions
     * This includes beta testers and anyone with a subscription
     */
    async getAllSubscriptionOwners(): Promise<UserWithSubscription[]> {
        // Start from subscriptions - this is the source of truth for who pays/has access
        const { data: subscriptions, error: subsError } = await supabase
            .from('subscriptions')
            .select('*');

        if (subsError) {
            console.error('[AdminService] Error fetching subscriptions:', subsError);
            throw subsError;
        }

        if (!subscriptions || subscriptions.length === 0) return [];

        const userIds = [...new Set(subscriptions.map(s => s.user_id))];

        // Get profiles for these users
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, is_admin, updated_at')
            .in('id', userIds);

        if (profilesError) {
            console.error('[AdminService] Error fetching profiles:', profilesError);
            throw profilesError;
        }

        // Get business counts - check BOTH sources
        // 1. Via business_members
        const { data: memberBusinessData } = await supabase
            .from('business_members')
            .select('user_id, business_id')
            .eq('role', 'owner')
            .in('user_id', userIds);

        // 2. Via businesses.owner_id
        const { data: ownedBusinessData } = await supabase
            .from('businesses')
            .select('owner_id, id')
            .in('owner_id', userIds);

        // Merge and count unique businesses per user
        const countMap: Record<string, Set<string>> = {};
        (memberBusinessData || []).forEach(b => {
            if (!countMap[b.user_id]) countMap[b.user_id] = new Set();
            countMap[b.user_id].add(b.business_id);
        });
        (ownedBusinessData || []).forEach(b => {
            if (!countMap[b.owner_id]) countMap[b.owner_id] = new Set();
            countMap[b.owner_id].add(b.id);
        });

        // Build subscription map
        const subsMap: Record<string, typeof subscriptions[0]> = {};
        (subscriptions || []).forEach(s => {
            subsMap[s.user_id] = s;
        });

        return (profiles || []).map(profile => {
            const sub = subsMap[profile.id];
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
                businessCount: countMap[profile.id]?.size || 0,
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
     * Get plan info for display
     */
    getPlanInfo(planId: PlanId) {
        return PLANS[planId] || PLANS.creator;
    },

    /**
     * Delete a user and all their data (for testing purposes)
     * DESTRUCTIVE: Removes profile, subscription, businesses, assets, tasks, and memberships
     */
    async deleteUser(userId: string): Promise<void> {
        console.log('[AdminService] Deleting user:', userId);

        // 1. Get all businesses owned by this user
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', userId);

        const businessIds = (businesses || []).map(b => b.id);

        // 2. Delete assets for their businesses
        if (businessIds.length > 0) {
            await supabase.from('assets').delete().in('business_id', businessIds);
        }

        // 3. Delete tasks owned by this user
        await supabase.from('tasks').delete().eq('owner_id', userId);

        // 4. Delete business_members entries (theirs and from their businesses)
        await supabase.from('business_members').delete().eq('user_id', userId);
        if (businessIds.length > 0) {
            await supabase.from('business_members').delete().in('business_id', businessIds);
        }

        // 5. Delete their businesses
        await supabase.from('businesses').delete().eq('owner_id', userId);

        // 6. Delete subscription
        await supabase.from('subscriptions').delete().eq('user_id', userId);

        // 7. Delete profile
        const { error } = await supabase.from('profiles').delete().eq('id', userId);

        if (error) {
            console.error('[AdminService] Error deleting user:', error);
            throw error;
        }

        console.log('[AdminService] User deleted successfully');
    },
};
