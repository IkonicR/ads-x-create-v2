
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Asset } from '../types';
import { StorageService } from '../services/storage';
import { NeuCard, NeuButton, useThemeStyles } from '../components/NeuComponents';
import MasonryGrid from '../components/MasonryGrid';
import { Download, Search, Filter, ExternalLink, Copy } from 'lucide-react';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { useAssets } from '../context/AssetContext';

interface LibraryProps {
  businessId: string;
}

const Library: React.FC<LibraryProps> = ({ businessId }) => {
  const { styles } = useThemeStyles();
  const { assets, loading, hasMore, loadAssets, currentBusinessId } = useAssets();

  // Infinite Scroll State
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial Load - Only if empty or business changed
  useEffect(() => {
    // If we have assets and the business ID hasn't changed, don't reload.
    if (assets.length > 0 && currentBusinessId === businessId) {
      return;
    }
    loadAssets(businessId);
  }, [businessId, loadAssets, assets.length, currentBusinessId]);

  // Infinite Scroll Handler
  const handleLoadMore = useCallback(async () => {
    if (!businessId || loading || !hasMore) return;
    await loadAssets(businessId);
  }, [businessId, loading, hasMore, loadAssets]);

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !isLoadingMore && hasMore && !loading) {
        setIsLoadingMore(true);
        try {
          await handleLoadMore();
        } catch (error) {
          console.error("Error loading more assets:", error);
        } finally {
          setIsLoadingMore(false);
        }
      }
    }, { rootMargin: '200px' });

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [handleLoadMore, isLoadingMore, hasMore, loading]);

  return (
    <div className="space-y-8 pb-10">
      <header>
        <GalaxyHeading
          text="Asset Library"
          className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
        />
        <p className={styles.textSub}>All your generated creative history in one place.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {assets.map(asset => (
          <NeuCard key={asset.id} className="flex flex-col group">
            <div className={`flex-1 mb-4 overflow-hidden rounded-xl ${styles.bg} ${styles.shadowIn} relative`}>
              {asset.type === 'text' ? (
                <div className="p-6 h-full flex items-center justify-center text-center">
                  <p className={`italic ${styles.textMain} text-sm`}>"{asset.content}"</p>
                </div>
              ) : (
                <img src={asset.content} alt="Asset" className="w-full h-48 object-cover" />
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform"><Download size={16} /></button>
                <button className="p-2 bg-white rounded-full text-gray-800 hover:scale-110 transition-transform"><Copy size={16} /></button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${styles.bgAccent} ${asset.type === 'image' ? 'text-purple-500' : 'text-blue-500'}`}>
                  {asset.type.toUpperCase()}
                </span>
                <span className={`text-xs ${styles.textSub}`}>{new Date(asset.createdAt).toLocaleDateString()}</span>
              </div>
              <p className={`text-xs font-bold ${styles.textSub} truncate`}>{asset.prompt}</p>
              {asset.stylePreset && (
                <p className={`text-[10px] ${styles.textSub} mt-1`}>Style: {asset.stylePreset}</p>
              )}
            </div>
          </NeuCard>
        ))}
      </div>

      {assets.length === 0 && !loading && (
        <div className={`text-center py-20 ${styles.textSub}`}>
          <p>No assets yet. Go to the Creator to start building.</p>
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div
        ref={sentinelRef}
        className="h-20 flex items-center justify-center opacity-50"
      >
        {(isLoadingMore || loading) && hasMore && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        )}
      </div>

      {/* Load More Button - Fallback (hidden when infinite scroll works) */}
      {hasMore && !isLoadingMore && !loading && (
        <noscript>
          <div className="flex justify-center pt-8">
            <NeuButton
              onClick={() => loadAssets(businessId)}
              disabled={loading}
              className="min-w-[200px]"
            >
              Load More
            </NeuButton>
          </div>
        </noscript>
      )}
    </div>
  );
};

export default Library;
