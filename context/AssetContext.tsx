import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Asset } from '../types';
import { StorageService } from '../services/storage';

interface AssetContextType {
    assets: Asset[]; // Renamed from libraryAssets
    loading: boolean;
    hasMore: boolean;
    loadAssets: (businessId: string, reset?: boolean) => Promise<void>; // Renamed
    refreshAssets: (businessId: string) => Promise<void>; // Renamed
    addAsset: (asset: Asset) => void; // Renamed from addAssetToCache
    deleteAsset: (assetId: string) => Promise<void>; // NEW
    currentBusinessId: string | null;
    setBusinessId: (id: string) => void; // NEW
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);

    const LIMIT = 12;

    const loadAssets = useCallback(async (businessId: string, reset = false) => {
        // If we are switching businesses, force a reset
        if (businessId !== currentBusinessId) {
            reset = true;
            setCurrentBusinessId(businessId);
        }

        // If not resetting and already loading, skip
        if (!reset && loading) {
            return;
        }

        // If not resetting and no more data, skip
        if (!reset && !hasMore) {
            return;
        }

        // LOCAL STORAGE CHECK (Only on reset/initial load)
        if (reset) {
            const cached = localStorage.getItem(`assets_cache_${businessId}`);
            if (cached) {
                try {
                    const { assets: cachedAssets, offset: cachedOffset, hasMore: cachedHasMore, timestamp } = JSON.parse(cached);
                    // Optional: Check timestamp for expiration (e.g. 24 hours)
                    // For now, we trust the cache.
                    setAssets(cachedAssets);
                    setOffset(cachedOffset);
                    setHasMore(cachedHasMore);
                    setLoading(false);
                    // Don't return here, continue to fetch fresh data in background if needed?
                    // Actually, for "instant load", we use cache. But we should probably fetch fresh data too?
                    // For now, let's return to avoid double render/fetch if cache is good.
                    // But if cache is stale, we might miss new items.
                    // Let's allow network fetch to proceed after cache load, but maybe debounce it?
                    // For simplicity and "instant" feel, we return. User can pull to refresh (not implemented) or we rely on background sync.
                    // Wait, if we return, we never fetch new data on page load!
                    // Let's NOT return, but just set state.
                } catch (e) {
                    localStorage.removeItem(`assets_cache_${businessId}`);
                }
            }
        }

        setLoading(true);

        try {
            const currentOffset = reset ? 0 : offset;
            const newAssets = await StorageService.getAssets(businessId, LIMIT, currentOffset);

            // AUTO-MIGRATION CHECK
            // If we detect base64 assets in the fetch, trigger a background migration
            const hasBase64 = newAssets.some(a => a.content.startsWith('data:image'));
            if (hasBase64) {
                StorageService.migrateBase64Assets(businessId).then(count => {
                    if (count > 0) {
                        loadAssets(businessId, true); // Reload to get new URLs
                    }
                });
            }

            // Fix hasMore logic: If we got fewer items than LIMIT, we are done.
            // Also if we got 0 items, we are done.
            if (newAssets.length < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setAssets(prev => {
                if (reset) return newAssets;

                // De-duplicate: Only add assets that aren't already in the list
                const existingIds = new Set(prev.map(a => a.id));
                const uniqueNewAssets = newAssets.filter(a => !existingIds.has(a.id));

                return [...prev, ...uniqueNewAssets];
            });
            setOffset(prev => reset ? LIMIT : prev + LIMIT);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    }, [currentBusinessId, offset, hasMore, loading]);

    const refreshAssets = useCallback(async (businessId: string) => {
        await loadAssets(businessId, true);
    }, [loadAssets]);

    const addAsset = useCallback((asset: Asset) => {
        setAssets(prev => [asset, ...prev]);
        // Background Save (if not already handled by caller, but usually caller handles DB save for safety)
        // For now, we assume caller handles DB save to keep context pure, OR we can add it here.
        // Let's keep it pure: Context manages STATE. Caller manages DB? 
        // Actually, to be a true "Single Source of Truth", Context should probably handle the DB save too?
        // But for now, let's stick to the interface: addAsset updates state.
    }, []);

    const deleteAsset = useCallback(async (assetId: string) => {
        // Optimistic update
        setAssets(prev => prev.filter(a => a.id !== assetId));
        try {
            await StorageService.deleteAsset(assetId);
        } catch (error) {
            console.error("Failed to delete asset", error);
            // Revert? (Complex, maybe just alert)
        }
    }, []);

    const setBusinessId = useCallback((id: string) => {
        if (id !== currentBusinessId) {
            setAssets([]); // Clear immediately
            setCurrentBusinessId(id);
            loadAssets(id, true); // Trigger load
        }
    }, [currentBusinessId, loadAssets]);

    // PERSISTENCE: Save to LocalStorage whenever assets change
    // PERSISTENCE: Save to LocalStorage whenever assets change
    // PERSISTENCE: Save to LocalStorage whenever assets change
    useEffect(() => {
        // Only save if we have a valid business ID and actual assets to save.
        if (currentBusinessId && assets.length > 0) {
            // SAFETY: Only save the first 20 items to avoid QuotaExceededError
            // We can now safely cache more items since they are URLs.
            // EXTRA SAFETY: Filter out any asset that looks like a base64 string or is huge.
            const assetsToCache = assets
                .filter(a => !a.content.startsWith('data:') && a.content.length < 2000)
                .slice(0, 20);

            if (assetsToCache.length === 0) {
                return;
            }

            const cacheData = {
                assets: assetsToCache,
                offset: assetsToCache.length,
                hasMore: true,
                timestamp: Date.now()
            };

            try {
                localStorage.setItem(`assets_cache_${currentBusinessId}`, JSON.stringify(cacheData));
            } catch (e) {
                console.warn("LocalStorage Quota Exceeded. Attempting to clear old cache...", e);
                try {
                    // Strategy: Clear ALL asset caches to make room
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('assets_cache_')) {
                            localStorage.removeItem(key);
                        }
                    });
                    // Retry once
                    localStorage.setItem(`assets_cache_${currentBusinessId}`, JSON.stringify(cacheData));
                } catch (retryError) {
                    console.warn("LocalStorage full even after cleanup. Skipping cache update.", retryError);
                }
            }
        }
    }, [assets, currentBusinessId]);

    return (
        <AssetContext.Provider value={{
            assets: assets,
            loading,
            hasMore,
            loadAssets,
            refreshAssets,
            addAsset,
            deleteAsset,
            currentBusinessId,
            setBusinessId
        }}>
            {children}
        </AssetContext.Provider>
    );
};

export const useAssets = () => {
    const context = useContext(AssetContext);
    if (context === undefined) {
        throw new Error('useAssets must be used within an AssetProvider');
    }
    return context;
};
