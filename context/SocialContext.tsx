/**
 * SocialContext - Mirrors AssetContext pattern for social posts
 * 
 * Features:
 * - localStorage caching for instant loads
 * - Background sync with GHL via /api/social/sync
 * - Optimistic updates
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SocialPost, SocialAccount } from '../types';
import { SocialService } from '../services/socialService';

interface SocialContextType {
    posts: SocialPost[];
    accounts: SocialAccount[];
    accountsLoading: boolean;
    loading: boolean;
    syncing: boolean;
    error: string | null;
    lastSyncTime: string | null;
    loadPosts: (businessId: string, reset?: boolean) => Promise<void>;
    refreshPosts: (businessId: string) => Promise<void>;
    loadAccounts: (locationId: string) => Promise<void>;
    refreshAccounts: (locationId: string) => Promise<void>;
    syncWithGHL: (businessId: string, locationId: string) => Promise<void>;
    addPost: (post: SocialPost) => void;
    deletePost: (postId: string) => Promise<void>;
    deletePostFromGHL: (postId: string, locationId: string, ghlPostId?: string) => Promise<void>;
    currentBusinessId: string | null;
    currentLocationId: string | null;
    setBusinessId: (id: string) => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

const CACHE_KEY_PREFIX = 'social_posts_cache_';
const ACCOUNTS_CACHE_KEY_PREFIX = 'social_accounts_cache_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const ACCOUNTS_CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes - accounts change less often

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [accountsLoaded, setAccountsLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
    const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);
    const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);

    // Load from localStorage cache first (instant)
    const loadFromCache = useCallback((businessId: string): boolean => {
        try {
            const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${businessId}`);
            if (cached) {
                const { posts: cachedPosts, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;

                // Use cache if fresh enough
                if (age < CACHE_EXPIRY_MS) {
                    setPosts(cachedPosts);
                    return true;
                }
            }
        } catch (e) {
            localStorage.removeItem(`${CACHE_KEY_PREFIX}${businessId}`);
        }
        return false;
    }, []);

    // Save to localStorage cache
    const saveToCache = useCallback((businessId: string, postsToCache: SocialPost[]) => {
        try {
            localStorage.setItem(`${CACHE_KEY_PREFIX}${businessId}`, JSON.stringify({
                posts: postsToCache.slice(0, 50), // Limit to prevent quota issues
                timestamp: Date.now(),
            }));
        } catch (e) {
            console.warn('[SocialContext] Failed to cache posts:', e);
        }
    }, []);

    // Load posts from Supabase (fast, local cache)
    const loadPosts = useCallback(async (businessId: string, reset = false) => {
        if (businessId !== currentBusinessId) {
            reset = true;
            setCurrentBusinessId(businessId);
        }

        // Try localStorage first for instant load
        let hadCache = false;
        if (reset) {
            hadCache = loadFromCache(businessId);
            // If we have cache, don't show loading state - render instantly!
        }

        // Only show loading spinner if we don't have cached data
        // Use functional setState to avoid stale closure
        if (!hadCache) {
            setPosts(prev => {
                if (prev.length === 0) setLoading(true);
                return prev;
            });
        }
        setError(null);

        try {
            const fetchedPosts = await SocialService.getLocalPosts(businessId);
            setPosts(fetchedPosts);
            saveToCache(businessId, fetchedPosts);

            // Get last sync time
            const syncTime = await SocialService.getLastSyncTime(businessId);
            setLastSyncTime(syncTime);
        } catch (err: any) {
            console.error('[SocialContext] Error loading posts:', err);
            setError('Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [currentBusinessId, loadFromCache, saveToCache]);

    // Refresh posts (force reload)
    const refreshPosts = useCallback(async (businessId: string) => {
        await loadPosts(businessId, true);
    }, [loadPosts]);

    // Load accounts from cache first (instant)
    const loadAccountsFromCache = useCallback((locationId: string): boolean => {
        try {
            const cached = localStorage.getItem(`${ACCOUNTS_CACHE_KEY_PREFIX}${locationId}`);
            if (cached) {
                const { accounts: cachedAccounts, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;

                if (age < ACCOUNTS_CACHE_EXPIRY_MS) {
                    setAccounts(cachedAccounts);
                    setAccountsLoaded(true);
                    return true;
                }
            }
        } catch (e) {
            localStorage.removeItem(`${ACCOUNTS_CACHE_KEY_PREFIX}${locationId}`);
        }
        return false;
    }, []);

    // Save accounts to cache
    const saveAccountsToCache = useCallback((locationId: string, accountsToCache: SocialAccount[]) => {
        try {
            localStorage.setItem(`${ACCOUNTS_CACHE_KEY_PREFIX}${locationId}`, JSON.stringify({
                accounts: accountsToCache,
                timestamp: Date.now(),
            }));
        } catch (e) {
            console.warn('[SocialContext] Failed to cache accounts:', e);
        }
    }, []);

    // Load accounts (with caching - only fetches if not already loaded)
    const loadAccounts = useCallback(async (locationId: string) => {
        // If same location and already loaded, skip
        if (locationId === currentLocationId && accountsLoaded && accounts.length > 0) {
            return;
        }

        // New location? Reset accountsLoaded
        if (locationId !== currentLocationId) {
            setCurrentLocationId(locationId);
            setAccountsLoaded(false);
        }

        // Try cache first
        const hadCache = loadAccountsFromCache(locationId);
        if (hadCache) {
            return; // We have fresh cached accounts
        }

        // Fetch from API
        setAccountsLoading(true);
        try {
            const response = await fetch(`/api/social/accounts?locationId=${locationId}`);

            // Check for error response before trying to parse JSON
            if (!response.ok) {
                console.error('[SocialContext] API error:', response.status);
                setAccountsLoaded(true); // Mark as "loaded" to prevent infinite retries
                return;
            }

            const data = await response.json();
            const fetchedAccounts = data.accounts || [];

            setAccounts(fetchedAccounts);
            setAccountsLoaded(true);
            saveAccountsToCache(locationId, fetchedAccounts);
        } catch (err) {
            console.error('[SocialContext] Error loading accounts:', err);
            setAccountsLoaded(true); // Mark as "loaded" to prevent infinite retries
        } finally {
            setAccountsLoading(false);
        }
    }, [currentLocationId, accountsLoaded, accounts.length, loadAccountsFromCache, saveAccountsToCache]);

    // Force refresh accounts (clears cache)
    const refreshAccounts = useCallback(async (locationId: string) => {
        setAccountsLoaded(false);
        localStorage.removeItem(`${ACCOUNTS_CACHE_KEY_PREFIX}${locationId}`);

        setAccountsLoading(true);
        try {
            const response = await fetch(`/api/social/accounts?locationId=${locationId}`);

            // Check for error response before trying to parse JSON
            if (!response.ok) {
                console.error('[SocialContext] Refresh API error:', response.status);
                setAccountsLoaded(true); // Mark as "loaded" to prevent infinite retries
                return;
            }

            const data = await response.json();
            const fetchedAccounts = data.accounts || [];

            setAccounts(fetchedAccounts);
            setAccountsLoaded(true);
            saveAccountsToCache(locationId, fetchedAccounts);
        } catch (err) {
            console.error('[SocialContext] Error refreshing accounts:', err);
            setAccountsLoaded(true); // Mark as "loaded" to prevent infinite retries
        } finally {
            setAccountsLoading(false);
        }
    }, [saveAccountsToCache]);

    // Sync with GHL (fetch from GHL and update local cache)
    const syncWithGHL = useCallback(async (businessId: string, locationId: string) => {
        setSyncing(true);
        setError(null);

        try {
            // Call the sync API endpoint
            const response = await fetch(`/api/social/sync?businessId=${businessId}&locationId=${locationId}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Sync failed');
            }

            const data = await response.json();

            // Reload posts from local cache (now updated by sync)
            await loadPosts(businessId, true);

            setLastSyncTime(new Date().toISOString());
        } catch (err: any) {
            console.error('[SocialContext] Sync error:', err);
            setError('Failed to sync with social platforms');
        } finally {
            setSyncing(false);
        }
    }, [loadPosts]);

    // Add a post (optimistic update)
    const addPost = useCallback((post: SocialPost) => {
        setPosts(prev => [post, ...prev]);

        // Save to Supabase in background
        SocialService.saveLocalPost(post).catch(err => {
            console.error('[SocialContext] Failed to save post:', err);
        });
    }, []);

    // Delete a post (optimistic update - local only)
    const deletePost = useCallback(async (postId: string) => {
        // Optimistic update
        setPosts(prev => prev.filter(p => p.id !== postId));

        try {
            await SocialService.deleteLocalPost(postId);
        } catch (err) {
            console.error('[SocialContext] Failed to delete post:', err);
            // Could revert here, but for now just log
        }
    }, []);

    // Delete a post via GHL API (then local)
    const deletePostFromGHL = useCallback(async (postId: string, locationId: string, ghlPostId?: string) => {
        // Optimistic update
        setPosts(prev => prev.filter(p => p.id !== postId));

        try {
            const queryParams = new URLSearchParams({ locationId, postId });
            if (ghlPostId) queryParams.append('ghlPostId', ghlPostId);

            const response = await fetch(`/api/social/delete?${queryParams}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Delete failed');
            }
        } catch (err) {
            console.error('[SocialContext] Failed to delete post from GHL:', err);
            // Could revert here, but for now just log
            throw err; // Re-throw so modal can show error
        }
    }, []);

    // Set business ID (triggers reload)
    const setBusinessId = useCallback((id: string) => {
        if (id !== currentBusinessId) {
            setPosts([]);
            setCurrentBusinessId(id);
            loadPosts(id, true);
        }
    }, [currentBusinessId, loadPosts]);

    // Persist to localStorage when posts change
    useEffect(() => {
        if (currentBusinessId && posts.length > 0) {
            saveToCache(currentBusinessId, posts);
        }
    }, [posts, currentBusinessId, saveToCache]);

    const value: SocialContextType = {
        posts,
        accounts,
        accountsLoading,
        loading,
        syncing,
        error,
        lastSyncTime,
        loadPosts,
        refreshPosts,
        loadAccounts,
        refreshAccounts,
        syncWithGHL,
        addPost,
        deletePost,
        deletePostFromGHL,
        currentBusinessId,
        currentLocationId,
        setBusinessId,
    };

    return (
        <SocialContext.Provider value={value}>
            {children}
        </SocialContext.Provider>
    );
};

export const useSocial = (): SocialContextType => {
    const context = useContext(SocialContext);
    if (!context) {
        throw new Error('useSocial must be used within a SocialProvider');
    }
    return context;
};

export default SocialContext;
