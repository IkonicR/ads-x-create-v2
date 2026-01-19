/**
 * Subscription Context (v2 - Owner-Based)
 * 
 * Key change: Subscription is now based on the CURRENT BUSINESS'S OWNER,
 * not the current user. Team members inherit from the business owner.
 * 
 * Usage:
 * 1. App.tsx calls setBusinessId(activeBusinessId) when business changes
 * 2. All other components just use useSubscription() to get credits/features
 * 3. Credits are always from the business owner's subscription
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
    getBusinessSubscription,
    getSubscriptionWithFeatures,
    deductCreditsForBusiness,
    refundCreditsForBusiness,
    SubscriptionWithFeatures
} from '../services/subscriptionService';
import { PLANS, PlanId } from '../config/pricing';

interface SubscriptionContextType {
    subscription: SubscriptionWithFeatures | null;
    loading: boolean;
    error: string | null;

    // Credit operations
    creditsRemaining: number;
    deductCredits: (amount: number) => Promise<boolean>;
    refundCredits: (amount: number) => Promise<boolean>;

    // Feature checks
    canUseSocialScheduling: boolean;
    canUseCustomStyles: boolean;
    canAddBusiness: (currentCount: number) => boolean;
    canAddTeamMember: (currentCount: number) => boolean;
    isWhiteLabelEnabled: boolean;

    // Plan info
    planId: PlanId;
    planName: string;
    isAgency: boolean;
    isGrowth: boolean;
    isCreator: boolean;

    // Business context
    currentBusinessId: string | null;
    setBusinessId: (id: string) => void;

    // Refresh
    refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionWithFeatures | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);

    // Load subscription when business changes
    const loadSubscription = useCallback(async () => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        if (!currentBusinessId) {
            // FALLBACK: No business selected - load user's OWN subscription
            // This happens during first-business onboarding for new users
            try {
                const userSub = await getSubscriptionWithFeatures();
                setSubscription(userSub);
            } catch (err) {
                console.warn('[SubscriptionContext] Could not load user subscription fallback:', err);
                setSubscription(null);
            }
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get the business OWNER's subscription
            const sub = await getBusinessSubscription(currentBusinessId);
            setSubscription(sub);

            if (!sub) {
                console.warn('[SubscriptionContext] No subscription found for business:', currentBusinessId);
            }
        } catch (err) {
            console.error('[SubscriptionContext] Error loading subscription:', err);
            setError('Failed to load subscription');
        } finally {
            setLoading(false);
        }
    }, [user, currentBusinessId]);

    useEffect(() => {
        loadSubscription();
    }, [loadSubscription]);

    // Set business ID (called by App.tsx when business changes)
    const setBusinessId = useCallback((id: string) => {
        if (id !== currentBusinessId) {
            setCurrentBusinessId(id);
        }
    }, [currentBusinessId]);

    // Deduct credits from business owner's subscription
    const deductCredits = useCallback(async (amount: number): Promise<boolean> => {
        if (!currentBusinessId) {
            console.error('[SubscriptionContext] Cannot deduct credits: No business selected');
            return false;
        }
        if (!subscription) {
            console.error('[SubscriptionContext] Cannot deduct credits: No subscription');
            return false;
        }
        if (subscription.credits_remaining < amount) {
            console.error('[SubscriptionContext] Insufficient credits');
            return false;
        }

        const newBalance = await deductCreditsForBusiness(currentBusinessId, amount);
        if (newBalance === null || newBalance < 0) return false;

        // Update local state
        setSubscription(prev => prev ? {
            ...prev,
            credits_remaining: newBalance
        } : null);

        return true;
    }, [currentBusinessId, subscription]);

    // Refund credits to business owner
    const refundCredits = useCallback(async (amount: number): Promise<boolean> => {
        if (!currentBusinessId) return false;

        const newBalance = await refundCreditsForBusiness(currentBusinessId, amount);
        if (newBalance === null) return false;

        setSubscription(prev => prev ? {
            ...prev,
            credits_remaining: newBalance
        } : null);

        return true;
    }, [currentBusinessId]);

    // Feature checks
    const canAddBusiness = useCallback((currentCount: number): boolean => {
        if (!subscription) return false;
        return currentCount < subscription.maxBusinesses;
    }, [subscription]);

    const canAddTeamMember = useCallback((currentCount: number): boolean => {
        if (!subscription) return false;
        const limit = subscription.teamSeatsLimit;
        if (limit === -1) return true; // Unlimited
        return currentCount < limit;
    }, [subscription]);

    // Computed values
    const planId = subscription?.plan_id || 'creator';
    const plan = PLANS[planId as PlanId] || PLANS.creator;

    const value: SubscriptionContextType = {
        subscription,
        loading,
        error,

        creditsRemaining: subscription?.credits_remaining || 0,
        deductCredits,
        refundCredits,

        canUseSocialScheduling: subscription?.canUseSocialScheduling || false,
        canUseCustomStyles: subscription?.canUseCustomStyles || false,
        canAddBusiness,
        canAddTeamMember,
        isWhiteLabelEnabled: subscription?.isWhiteLabelEnabled || false,

        planId: planId as PlanId,
        planName: plan.name,
        isAgency: planId === 'agency',
        isGrowth: planId === 'growth',
        isCreator: planId === 'creator',

        currentBusinessId,
        setBusinessId,

        refresh: loadSubscription,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
}
