import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GeneratorCard } from '../components/GeneratorCard';
import { AssetCard } from '../components/AssetCard';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { AssetViewer } from '../components/AssetViewer';
import MasonryGrid from '../components/MasonryGrid';
import { ControlDeck } from '../components/ControlDeck';
import { useThemeStyles, NeuButton } from '../components/NeuComponents';
import { NeuConfirmModal } from '../components/NeuConfirmModal';
import { Business, Asset, ExtendedAsset, StylePreset, AssetStatus } from '../types';
import { generateImage } from '../services/geminiService';
import { StorageService } from '../services/storage';

interface GeneratorProps {
  business: Business;
  deductCredit?: (amount: number) => void; // Deprecated
  updateCredits?: (newBalance: number) => void; // NEW
  addAsset: (asset: Asset) => void;
  deleteAsset?: (id: string) => void;
  assets: Asset[];
  // Props for lifted state (so we don't lose generation progress on tab switch)
  pendingAssets: ExtendedAsset[];
  setPendingAssets: React.Dispatch<React.SetStateAction<ExtendedAsset[]>>;
  loadMoreAssets?: () => Promise<number>;
}

const Generator: React.FC<GeneratorProps> = ({
  business,
  deductCredit,
  updateCredits,
  addAsset,
  deleteAsset,
  assets,
  pendingAssets,
  setPendingAssets,
  loadMoreAssets
}) => {
  // const [loading, setLoading] = useState(false); // REMOVED for Concurrency
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { styles, theme } = useThemeStyles();

  // Configuration State
  const [aestheticStyles, setAestheticStyles] = useState<StylePreset[]>([]);

  // Load Configuration
  useEffect(() => {
    const loadConfig = async () => {
      const loadedStyles = await StorageService.getStyles();
      setAestheticStyles(loadedStyles);
    };
    loadConfig();
  }, []);

  // State for Ultra Confirm Modal
  const [showUltraConfirm, setShowUltraConfirm] = useState(false);
  // Type definition for generate arguments
  type GenerateArgs = [string, string, string, string, 'flash' | 'pro' | 'ultra'];
  const [pendingGeneratePayload, setPendingGeneratePayload] = useState<GenerateArgs | null>(null);

  // Infinite Scroll State
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreAssets || !sentinelRef.current) return;

    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !isLoadingMore) {
        setIsLoadingMore(true);
        try {
          await loadMoreAssets();
        } catch (error) {
          console.error("Error loading more assets:", error);
        } finally {
          setIsLoadingMore(false);
        }
      }
    }, { rootMargin: '200px' });

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [loadMoreAssets, isLoadingMore]);

  // Derived Subjects from Business Data
  const subjects = useMemo(() => {
    const items: {
      id: string;
      name: string;
      type: 'product' | 'person';
      imageUrl?: string;
      price?: string;
      description?: string;
      preserveLikeness?: boolean;
      // Marketing Fields
      promotion?: string;
      benefits?: string[];
      targetAudience?: string;
    }[] = [];

    // Products
    if (business.offerings) {
      business.offerings.forEach(offering => {
        items.push({
          id: offering.id,
          name: offering.name,
          type: 'product',
          imageUrl: offering.imageUrl,
          price: offering.price,
          description: offering.description,
          preserveLikeness: offering.preserveLikeness,
          promotion: offering.promotion,
          benefits: offering.benefits,
          targetAudience: offering.targetAudience
        });
      });
    }

    // Team
    if (business.teamMembers) {
      business.teamMembers.forEach(member => {
        items.push({ id: member.id, name: member.name, type: 'person', imageUrl: member.imageUrl });
      });
    }

    return items;
  }, [business]);

  // Self-healing: Ensure pending assets are removed if they exist in the main assets list
  useEffect(() => {
    const assetIds = new Set(assets.map(a => a.id));
    const toRemove = pendingAssets.filter(p => assetIds.has(p.id));

    if (toRemove.length > 0) {
      setPendingAssets(prev => prev.filter(p => !assetIds.has(p.id)));
    }
  }, [assets, pendingAssets, setPendingAssets]);

  // Combine pending and completed assets for display
  // Pending assets go first
  const displayAssets = useMemo(() => {
    return [...pendingAssets, ...assets];
  }, [pendingAssets, assets]);

  const handleDelete = useCallback((id: string) => {
    if (deleteAsset) {
      deleteAsset(id);
    }
  }, [deleteAsset]);

  const executeGenerate = useCallback(async (
    prompt: string,
    styleId: string,
    ratio: string,
    subjectId: string,
    modelTier: 'flash' | 'pro' | 'ultra'
  ) => {
    // if (loading) return; // REMOVED for Concurrency

    // Pricing Logic (Visual Check Only - Server Enforces)
    const COST_MAP = {
      flash: 10,
      pro: 40,
      ultra: 80
    };

    const cost = COST_MAP[modelTier];

    if (business.credits < cost) {
      alert(`Not enough credits! You need ${cost} credits for ${modelTier === 'ultra' ? 'Ultra 4K' : modelTier === 'pro' ? 'Pro' : 'Flash'} generation.`);
      return;
    }

    // setLoading(true); // REMOVED for Concurrency
    if (deductCredit) {
      deductCredit(cost); // <--- DEDUCT CREDITS NOW
    }

    // 1. Create Pending Asset
    const tempId = Date.now().toString();

    // Look up from state instead of constants
    const stylePreset = aestheticStyles.find(s => s.id === styleId);
    const subject = subjects.find(s => s.id === subjectId);

    // Construct Final Prompt
    let fullPrompt = prompt;
    // Removed manual style appending to avoid duplication with PromptFactory

    const newPendingAsset: ExtendedAsset = {
      id: tempId,
      type: 'image',
      content: '', // Placeholder
      prompt: prompt,
      createdAt: new Date().toISOString(),
      localStatus: 'generating',
      aspectRatio: ratio,
      stylePreset: stylePreset?.name
    };

    setPendingAssets(prev => [newPendingAsset, ...prev]);

    try {
      // 2. Call API
      const result = await generateImage(
        fullPrompt,
        business,
        stylePreset, // stylePreset
        subject ? {
          ...subject,
          preserveLikeness: subject.preserveLikeness || false
        } : undefined, // subjectContext
        ratio, // Pass Aspect Ratio
        modelTier === 'flash' ? 'pro' : modelTier // Ensure 'flash' is mapped to 'pro' if it somehow slips through
      );

      // Fix: Check if result is a valid data URL string
      if (result && typeof result === 'string' && result.startsWith('data:image')) {
        // 3. Success
        // Strip localStatus to ensure it renders as a completed AssetCard
        const { localStatus, ...rest } = newPendingAsset;

        const finalAsset: Asset = {
          ...rest,
          id: tempId, // REUSE ID for seamless transition
          content: result, // Use result directly
        };

        // CRITICAL FIX: Save to DB immediately to prevent data loss on refresh
        // We do this in the background. The UI update happens later in handleReveal.
        StorageService.saveAsset({ ...finalAsset, businessId: business.id }).catch(err => {
          console.error("Failed to save asset immediately:", err);
        });

        // Optimistic Update: Add to parent state immediately (DO NOT AWAIT DB SAVE)
        // addAsset(finalAsset); // MOVED TO REVEAL

        // Update pending asset to complete, but keep it in pending list for animation
        setPendingAssets(prev => prev.map(a =>
          a.id === tempId
            ? { ...a, localStatus: 'complete', content: result }
            : a
        ));

        // Remove pending asset immediately // REMOVED - Wait for reveal
        // setPendingAssets(prev => prev.filter(a => a.id !== tempId));

        // Note: Credit update from server response is lost in Direct Mode.
        // We rely on the client or separate logic for credit sync if needed.

      } else {
        // Failure - Remove pending asset AND REFUND
        setPendingAssets(prev => prev.filter(a => a.id !== tempId));
        if (deductCredit) {
          deductCredit(-cost); // REFUND
          alert("Generation failed. Credits have been refunded.");
        }
      }

    } catch (error) {
      console.error("Generation Error", error);
      setPendingAssets(prev => prev.filter(a => a.id !== tempId));
      if (deductCredit) {
        deductCredit(-cost); // REFUND
        alert("An unexpected error occurred. Credits have been refunded.");
      }
    }
    // Finally block removed as it was empty
  }, [business, deductCredit, updateCredits, addAsset, setPendingAssets, subjects, aestheticStyles]);

  const handleGenerate = useCallback(async (
    prompt: string,
    styleId: string,
    ratio: string,
    subjectId: string,
    modelTier: 'flash' | 'pro' | 'ultra'
  ) => {
    // If Ultra is selected, show confirmation modal first
    if (modelTier === 'ultra' && !showUltraConfirm) {
      setPendingGeneratePayload([prompt, styleId, ratio, subjectId, modelTier]);
      setShowUltraConfirm(true);
      return;
    }

    // Otherwise, proceed with generation
    await executeGenerate(prompt, styleId, ratio, subjectId, modelTier);

    // After execution (if it was confirmed Ultra), reset modal state
    if (modelTier === 'ultra') {
      setShowUltraConfirm(false);
      setPendingGeneratePayload(null);
    }
  }, [showUltraConfirm, executeGenerate]);

  const handleRefine = useCallback(async (instruction: string) => {
    if (!selectedAsset) return;

    const currentAsset = selectedAsset;
    setSelectedAsset(null);

    const newPrompt = `${currentAsset.prompt}. Refinement: ${instruction}`;

    // Look up style ID by name (best effort)
    const styleId = aestheticStyles.find(s => s.name === currentAsset.stylePreset)?.id || '';

    // Bypass Modal for Refinement - Call executeGenerate directly
    await executeGenerate(
      newPrompt,
      styleId,
      currentAsset.aspectRatio || '1:1',
      '',
      'ultra'
    );
  }, [selectedAsset, aestheticStyles, executeGenerate]);

  const handleReveal = useCallback((id: string) => {
    // Find the pending asset
    const pending = pendingAssets.find(a => a.id === id);
    if (!pending || !pending.content) return;

    // Create final asset
    const finalAsset: Asset = {
      id: pending.id,
      type: pending.type,
      content: pending.content,
      prompt: pending.prompt,
      createdAt: pending.createdAt,
      stylePreset: pending.stylePreset,
      aspectRatio: pending.aspectRatio
    };

    // Add to main list
    addAsset(finalAsset);

    // Remove from pending list
    setPendingAssets(prev => prev.filter(a => a.id !== id));
  }, [pendingAssets, addAsset, setPendingAssets]);




  return (
    <div className="min-h-screen pb-64">

      {/* Header */}
      <div className="mb-8 px-4">
        <GalaxyHeading
          text="Visual Ad Studio"
          className="text-5xl md:text-6xl font-extrabold tracking-tight animate-fade-in pb-2 leading-tight"
        />
        <p className={styles.textSub}>Create high-fidelity marketing assets with precision control.</p>
      </div>

      {/* The Masonry Feed */}
      <div className="px-4">
        {displayAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 mb-4 flex items-center justify-center">
              <span className="text-4xl">🎨</span>
            </div>
            <p className={`text-lg font-bold ${styles.textMain}`}>Your canvas is empty.</p>
            <p className={styles.textSub}>Use the controls below to generate your first masterpiece.</p>
          </div>
        ) : (
          <MasonryGrid<Asset | ExtendedAsset>
            items={displayAssets}
            columns={3}
            gap={24}
            getItemAspectRatio={(asset: Asset | ExtendedAsset) => {
              if (!asset.aspectRatio) return 1;
              const [w, h] = asset.aspectRatio.split(':').map(Number);
              return w / h;
            }}
            renderItem={(asset: Asset | ExtendedAsset) => {
              // Fix: Keep rendering GeneratorCard even if status is 'complete', until it is removed from pendingAssets
              const isPending = 'localStatus' in asset;

              if (isPending) {
                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  >
                    <GeneratorCard
                      aspectRatio={asset.aspectRatio}
                      status={(asset as ExtendedAsset).localStatus || 'generating'}
                      onReveal={() => handleReveal(asset.id)}
                      resultContent={(asset as ExtendedAsset).content}
                    />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AssetCard
                    asset={asset}
                    aspectRatio={asset.aspectRatio || '1:1'}
                    onDelete={() => handleDelete(asset.id)}
                    onClick={() => setSelectedAsset(asset)}
                  />
                </motion.div>
              );
            }}
          />
        )}

        {/* Infinite Scroll Sentinel */}
        {loadMoreAssets && (
          <div
            ref={sentinelRef}
            className="h-20 flex items-center justify-center opacity-50"
          >
            {isLoadingMore && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
            )}
          </div>
        )}
      </div>

      {/* The Control Deck */}
      <ControlDeck
        onGenerate={handleGenerate}
        styles={aestheticStyles}
        subjects={subjects}
        activeCount={pendingAssets.length}
      />

      {/* Asset Viewer Lightbox */}
      <AssetViewer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onDelete={(id) => { handleDelete(id); setSelectedAsset(null); }}
        onRefine={handleRefine}
      />

      {/* Ultra Generation Confirmation Modal */}
      <NeuConfirmModal
        isOpen={showUltraConfirm}
        title="Initialize Ultra 4K Generation?"
        message={
          <>
            You are about to generate a **4096x4096px** high-fidelity asset using our most advanced model.
            This will consume **80 Credits**.
            <br /><br />
            Are you sure you want to proceed?
          </>
        }
        confirmText="Confirm & Generate"
        cancelText="Cancel"
        onConfirm={() => {
          if (pendingGeneratePayload) {
            setShowUltraConfirm(false);
            executeGenerate(...pendingGeneratePayload);
            setPendingGeneratePayload(null);
          }
        }}
        onCancel={() => {
          setShowUltraConfirm(false);
          setPendingGeneratePayload(null);
        }}
        confirmVariant="primary"
      />

    </div>
  );
};

export default Generator;