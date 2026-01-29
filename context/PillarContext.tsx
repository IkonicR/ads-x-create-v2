/**
 * PillarContext - State management for Content Pillars
 * 
 * Mirrors SocialContext pattern:
 * - Centralized state for pillars and drafts
 * - CRUD operations with optimistic updates
 * - Loading/error states
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ContentPillar, PillarDraft } from '../types';
import { PillarService } from '../services/pillarService';

// === CACHING ===
const CACHE_KEY_PREFIX = 'pillars_cache_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface PillarContextType {
    // State
    pillars: ContentPillar[];
    drafts: PillarDraft[];
    pendingDraftsCount: number;
    loading: boolean;
    error: string | null;
    currentBusinessId: string | null;
    initialLoaded: boolean;

    // Pillar Actions
    setBusinessId: (id: string) => void;
    loadPillars: (businessId: string) => Promise<void>;
    createPillar: (pillar: Omit<ContentPillar, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContentPillar>;
    updatePillar: (id: string, updates: Partial<ContentPillar>) => Promise<void>;
    deletePillar: (id: string) => Promise<void>;
    togglePillarActive: (id: string, isActive: boolean) => Promise<void>;

    // Draft Actions
    loadDrafts: (businessId: string, status?: PillarDraft['status']) => Promise<void>;
    approveDraft: (id: string) => Promise<void>;
    skipDraft: (id: string) => Promise<void>;
    updateDraftCaption: (id: string, caption: string) => Promise<void>;
    deleteDraft: (id: string) => Promise<void>;
}

const PillarContext = createContext<PillarContextType | undefined>(undefined);

export const PillarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pillars, setPillars] = useState<ContentPillar[]>([]);
    const [drafts, setDrafts] = useState<PillarDraft[]>([]);
    const [pendingDraftsCount, setPendingDraftsCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);
    const [initialLoaded, setInitialLoaded] = useState(false);

    // =========================================================================
    // CACHING (mirrors SocialContext)
    // =========================================================================

    const loadFromCache = useCallback((businessId: string): boolean => {
        try {
            const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${businessId}`);
            if (cached) {
                const { pillars: cachedPillars, pendingCount, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
                    setPillars(cachedPillars);
                    setPendingDraftsCount(pendingCount || 0);
                    return true;
                }
            }
        } catch {
            localStorage.removeItem(`${CACHE_KEY_PREFIX}${businessId}`);
        }
        return false;
    }, []);

    const saveToCache = useCallback((businessId: string, data: ContentPillar[], pendingCount: number) => {
        try {
            localStorage.setItem(`${CACHE_KEY_PREFIX}${businessId}`, JSON.stringify({
                pillars: data.slice(0, 50),
                pendingCount,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('[PillarContext] Cache save failed:', e);
        }
    }, []);

    // =========================================================================
    // PILLAR OPERATIONS
    // =========================================================================

    const loadPillars = useCallback(async (businessId: string) => {
        if (!businessId) return;

        // Try cache first for instant render
        const hadCache = loadFromCache(businessId);
        if (!hadCache) {
            setLoading(true);
        }
        setError(null);
        setCurrentBusinessId(businessId);

        try {
            const [pillarData, draftCount] = await Promise.all([
                PillarService.getPillars(businessId),
                PillarService.getPendingDraftsCount(businessId),
            ]);

            setPillars(pillarData);
            setPendingDraftsCount(draftCount);
            saveToCache(businessId, pillarData, draftCount);
        } catch (err: any) {
            console.error('[PillarContext] Load error:', err);
            setError(err.message || 'Failed to load pillars');
        } finally {
            setLoading(false);
            setInitialLoaded(true);
        }
    }, [loadFromCache, saveToCache]);

    // === PROACTIVE LOADER (called from App.tsx on boot/business switch) ===
    const setBusinessId = useCallback((id: string) => {
        if (id !== currentBusinessId) {
            setCurrentBusinessId(id);
            setInitialLoaded(false);
            loadPillars(id);
        }
    }, [currentBusinessId, loadPillars]);

    const createPillar = useCallback(async (
        pillarData: Omit<ContentPillar, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<ContentPillar> => {
        const newPillar = await PillarService.createPillar(pillarData);
        setPillars(prev => [...prev, newPillar]);
        return newPillar;
    }, []);

    const updatePillar = useCallback(async (id: string, updates: Partial<ContentPillar>) => {
        // Optimistic update
        setPillars(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

        try {
            const updated = await PillarService.updatePillar(id, updates);
            setPillars(prev => prev.map(p => p.id === id ? updated : p));
        } catch (err) {
            // Revert on error
            if (currentBusinessId) loadPillars(currentBusinessId);
            throw err;
        }
    }, [currentBusinessId, loadPillars]);

    const deletePillar = useCallback(async (id: string) => {
        // Optimistic delete
        const previousPillars = pillars;
        setPillars(prev => prev.filter(p => p.id !== id));

        try {
            await PillarService.deletePillar(id);
        } catch (err) {
            // Revert on error
            setPillars(previousPillars);
            throw err;
        }
    }, [pillars]);

    const togglePillarActive = useCallback(async (id: string, isActive: boolean) => {
        await updatePillar(id, { isActive });
    }, [updatePillar]);

    // =========================================================================
    // DRAFT OPERATIONS
    // =========================================================================

    const loadDrafts = useCallback(async (businessId: string, status?: PillarDraft['status']) => {
        if (!businessId) return;

        try {
            const draftData = await PillarService.getDrafts(businessId, status);
            setDrafts(draftData);

            // Update pending count
            const pendingCount = draftData.filter(d => d.status === 'pending').length;
            setPendingDraftsCount(pendingCount);
        } catch (err: any) {
            console.error('[PillarContext] Load drafts error:', err);
            setError(err.message || 'Failed to load drafts');
        }
    }, []);

    const approveDraft = useCallback(async (id: string) => {
        // Optimistic update
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' as const } : d));
        setPendingDraftsCount(prev => Math.max(0, prev - 1));

        try {
            await PillarService.updateDraftStatus(id, 'approved');
        } catch (err) {
            // Revert on error
            if (currentBusinessId) loadDrafts(currentBusinessId);
            throw err;
        }
    }, [currentBusinessId, loadDrafts]);

    const skipDraft = useCallback(async (id: string) => {
        // Optimistic update
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, status: 'skipped' as const } : d));
        setPendingDraftsCount(prev => Math.max(0, prev - 1));

        try {
            await PillarService.updateDraftStatus(id, 'skipped');
        } catch (err) {
            // Revert on error
            if (currentBusinessId) loadDrafts(currentBusinessId);
            throw err;
        }
    }, [currentBusinessId, loadDrafts]);

    const updateDraftCaption = useCallback(async (id: string, caption: string) => {
        // Optimistic update
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, caption } : d));

        try {
            await PillarService.updateDraftCaption(id, caption);
        } catch (err) {
            // Revert on error
            if (currentBusinessId) loadDrafts(currentBusinessId);
            throw err;
        }
    }, [currentBusinessId, loadDrafts]);

    const deleteDraft = useCallback(async (id: string) => {
        const previousDrafts = drafts;
        const wasPending = drafts.find(d => d.id === id)?.status === 'pending';

        // Optimistic delete
        setDrafts(prev => prev.filter(d => d.id !== id));
        if (wasPending) setPendingDraftsCount(prev => Math.max(0, prev - 1));

        try {
            await PillarService.deleteDraft(id);
        } catch (err) {
            // Revert on error
            setDrafts(previousDrafts);
            if (wasPending) setPendingDraftsCount(prev => prev + 1);
            throw err;
        }
    }, [drafts]);

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <PillarContext.Provider
            value={{
                pillars,
                drafts,
                pendingDraftsCount,
                loading,
                error,
                currentBusinessId,
                initialLoaded,
                setBusinessId,
                loadPillars,
                createPillar,
                updatePillar,
                deletePillar,
                togglePillarActive,
                loadDrafts,
                approveDraft,
                skipDraft,
                updateDraftCaption,
                deleteDraft,
            }}
        >
            {children}
        </PillarContext.Provider>
    );
};

export const usePillars = (): PillarContextType => {
    const context = useContext(PillarContext);
    if (!context) {
        throw new Error('usePillars must be used within a PillarProvider');
    }
    return context;
};

export default PillarContext;
