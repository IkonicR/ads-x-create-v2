/**
 * Subscription Service (v2 - Owner-Based)
 * 
 * Key change: Credits and features are determined by the BUSINESS OWNER,
 * not the current user. Team members inherit from the business owner.
 * 
 * Flow:
 * 1. What business is the user working in?
 * 2. Who owns that business?
 * 3. What is the owner's subscription?
 */

import { supabase } from './supabase';
import { PLANS, CREDITS, PlanId } from '../config/pricing';

// Subscription type matching database schema
export interface Subscription {
    id: string;
    user_id: string;
    plan_id: PlanId;
    billing_cycle: 'monthly' | 'annual';
    status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'comped';
    extra_businesses: number;
    credits_remaining: number;
    credits_rollover: number;
    period_start: string;
    period_end: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    created_at: string;
    updated_at: string;
}

// Computed subscription data with plan features
export interface SubscriptionWithFeatures extends Subscription {
    owner_id: string;  // The business owner who owns this subscription
    plan: typeof PLANS[PlanId];
    maxBusinesses: number;
    canUseSocialScheduling: boolean;
    canUseCustomStyles: boolean;
    teamSeatsLimit: number; // -1 = unlimited
    isWhiteLabelEnabled: boolean;
}

/**
 * Get subscription for a business (via its owner)
 * This is the PRIMARY method - always use this when you have a business context
 */
export async function getBusinessSubscription(businessId: string): Promise<SubscriptionWithFeatures | null> {
    if (!businessId) {
        console.error('[SubscriptionService] No businessId provided');
        return null;
    }

    // Use RPC to get owner's subscription in one call
    const { data, error } = await supabase.rpc('get_business_owner_subscription', {
        p_business_id: businessId
    });

    if (error) {
        console.error('[SubscriptionService] Error fetching business subscription:', error);
        return null;
    }

    if (!data || data.length === 0) {
        console.error('[SubscriptionService] No subscription found for business owner:', businessId);
        return null;
    }

    const sub = data[0];
    const plan = PLANS[sub.plan_id as PlanId] || PLANS.creator;
    const features = plan.features;

    // Calculate max businesses
    const baseBusinesses = features.businesses;
    const planMaxBusinesses = 'maxBusinesses' in features ? (features as { maxBusinesses: number }).maxBusinesses : baseBusinesses;
    const effectiveMax = baseBusinesses + (sub.extra_businesses || 0);

    return {
        id: sub.subscription_id,
        user_id: sub.owner_id,
        owner_id: sub.owner_id,
        plan_id: sub.plan_id as PlanId,
        billing_cycle: 'monthly', // Default, not returned by RPC
        status: sub.status as Subscription['status'],
        extra_businesses: sub.extra_businesses || 0,
        credits_remaining: sub.credits_remaining,
        credits_rollover: sub.credits_rollover || 0,
        period_start: sub.period_start,
        period_end: sub.period_end,
        created_at: '',
        updated_at: '',
        plan,
        maxBusinesses: Math.min(planMaxBusinesses, effectiveMax) || baseBusinesses,
        canUseSocialScheduling: features.socialScheduling,
        canUseCustomStyles: features.customStyles,
        teamSeatsLimit: features.teamSeats,
        isWhiteLabelEnabled: features.whiteLabel,
    };
}

/**
 * LEGACY: Get subscription for current user (only works if user is an owner)
 * @deprecated Use getBusinessSubscription instead
 */
export async function getSubscription(): Promise<Subscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        // Not an error if user is a team member (they don't have subscriptions)
        if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('[SubscriptionService] Error fetching subscription:', error);
        }
        return null;
    }

    return data;
}

/**
 * LEGACY: Get subscription with features for current user
 * @deprecated Use getBusinessSubscription instead
 */
export async function getSubscriptionWithFeatures(): Promise<SubscriptionWithFeatures | null> {
    const subscription = await getSubscription();
    if (!subscription) return null;

    const plan = PLANS[subscription.plan_id as PlanId] || PLANS.creator;
    const features = plan.features;

    const baseBusinesses = features.businesses;
    const planMaxBusinesses = 'maxBusinesses' in features ? (features as { maxBusinesses: number }).maxBusinesses : baseBusinesses;
    const effectiveMax = baseBusinesses + subscription.extra_businesses;

    return {
        ...subscription,
        owner_id: subscription.user_id,
        plan,
        maxBusinesses: Math.min(planMaxBusinesses, effectiveMax) || baseBusinesses,
        canUseSocialScheduling: features.socialScheduling,
        canUseCustomStyles: features.customStyles,
        teamSeatsLimit: features.teamSeats,
        isWhiteLabelEnabled: features.whiteLabel,
    };
}

/**
 * Deduct credits from business owner's subscription
 * Use this when generating - it finds the owner and deducts from them
 */
export async function deductCreditsForBusiness(businessId: string, amount: number): Promise<number | null> {
    const { data, error } = await supabase.rpc('deduct_credits_for_business', {
        p_business_id: businessId,
        p_amount: amount
    });

    if (error) {
        console.error('[SubscriptionService] Error deducting credits:', error);
        return null;
    }

    return data;
}

/**
 * Refund credits to business owner's subscription
 * Use this when generation fails
 */
export async function refundCreditsForBusiness(businessId: string, amount: number): Promise<number | null> {
    const { data, error } = await supabase.rpc('refund_credits_for_business', {
        p_business_id: businessId,
        p_amount: amount
    });

    if (error) {
        console.error('[SubscriptionService] Error refunding credits:', error);
        return null;
    }

    return data;
}

/**
 * LEGACY: Deduct credits from current user's subscription
 * @deprecated Use deductCreditsForBusiness instead
 */
export async function deductCredits(amount: number): Promise<number | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: amount
    });

    if (error) {
        console.error('[SubscriptionService] Error deducting credits:', error);
        return null;
    }

    return data;
}

/**
 * LEGACY: Refund credits to current user's subscription
 * @deprecated Use refundCreditsForBusiness instead
 */
export async function refundCredits(amount: number): Promise<number | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .single();

    if (!subscription) return null;

    const newBalance = subscription.credits_remaining + amount;

    const { error } = await supabase
        .from('subscriptions')
        .update({ credits_remaining: newBalance })
        .eq('user_id', user.id);

    if (error) {
        console.error('[SubscriptionService] Error refunding credits:', error);
        return null;
    }

    return newBalance;
}

/**
 * Get credit cost for an image
 */
export function getCreditCost(resolution: '2k' | '4k'): number {
    return resolution === '4k' ? CREDITS.perImage4K : CREDITS.perImage2K;
}

/**
 * Check feature access for a business
 */
export async function canUseFeatureForBusiness(
    businessId: string,
    feature: keyof typeof PLANS.creator.features
): Promise<boolean> {
    const sub = await getBusinessSubscription(businessId);
    if (!sub) return false;

    const value = sub.plan.features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    return value !== null;
}
