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
import { Business, Asset, ExtendedAsset, StylePreset, AssetStatus, GenerationStrategy, SubjectType } from '../types';
import { DEFAULT_STRATEGY } from '../constants/campaignPresets';
import { generateImage, pollJobStatus, getPendingJobs } from '../services/geminiService';
import { StorageService } from '../services/storage';
import { useAssets } from '../context/AssetContext';

interface GeneratorProps {
  business: Business;
  deductCredit?: (amount: number) => void; // Deprecated
  updateCredits?: (newBalance: number) => void; // NEW
  // Props for lifted state (so we don't lose generation progress on tab switch)
  pendingAssets: ExtendedAsset[];
  setPendingAssets: React.Dispatch<React.SetStateAction<ExtendedAsset[]>>;
  loadMoreAssets?: () => Promise<number>;
}

const Generator: React.FC<GeneratorProps> = ({
  business,
  deductCredit,
  updateCredits,
  pendingAssets,
  setPendingAssets,
  loadMoreAssets
}) => {
  // const [loading, setLoading] = useState(false); // REMOVED for Concurrency
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { styles, theme } = useThemeStyles();

  // Strategy State (managed here, passed to ControlDeck)
  const [strategy, setStrategy] = useState<GenerationStrategy>(DEFAULT_STRATEGY);
  const { assets, addAsset, deleteAsset, loadAssets, hasMore, loading } = useAssets();

  // Load more assets via context pagination
  const handleLoadMore = useCallback(async () => {
    if (!business.id || loading || !hasMore) return;
    await loadAssets(business.id);
  }, [business.id, loading, hasMore, loadAssets]);

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

  // Load Pending Jobs on Mount (for page refresh recovery)
  useEffect(() => {
    if (!business.id) return;

    const loadPendingJobs = async () => {
      try {
        const jobs = await getPendingJobs(business.id);

        if (jobs.length > 0) {
          console.log('[Generator] Found', jobs.length, 'pending jobs to resume');

          // Convert jobs to pending assets - mark with animationPhase so they resume properly
          const pendingFromJobs: ExtendedAsset[] = jobs.map(job => ({
            id: job.id,
            type: 'image' as const,
            content: '',
            prompt: job.prompt,
            createdAt: job.created_at,
            localStatus: 'generating' as const,
            aspectRatio: job.aspect_ratio,
            styleId: job.style_id,
            subjectId: job.subject_id,
            modelTier: job.model_tier,
            animationPhase: 'cruise' as const // Resume in cruise, not warmup
          }));

          setPendingAssets(prev => {
            // Merge without duplicates - check BOTH id AND jobId
            const existingIds = new Set(prev.map(a => a.id));
            const existingJobIds = new Set(prev.map(a => a.jobId).filter(Boolean));
            const newJobs = pendingFromJobs.filter(j =>
              !existingIds.has(j.id) && !existingJobIds.has(j.id)
            );
            return [...newJobs, ...prev];
          });

          // Resume polling for each job
          jobs.forEach(job => {
            const pollInterval = setInterval(async () => {
              try {
                const status = await pollJobStatus(job.id);

                if (status.status === 'completed' && status.asset) {
                  clearInterval(pollInterval);
                  setPendingAssets(prev => prev.map(a =>
                    a.id === job.id
                      ? { ...a, localStatus: 'complete', content: status.asset.content }
                      : a
                  ));
                } else if (status.status === 'failed') {
                  clearInterval(pollInterval);
                  setPendingAssets(prev => prev.filter(a => a.id !== job.id));
                  alert(status.errorMessage || 'A background generation failed.');
                }
              } catch (err) {
                console.error('[Generator] Poll error:', err);
              }
            }, 2000);

            // Safety timeout
            setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
          });
        }
      } catch (error) {
        console.error('[Generator] Failed to load pending jobs:', error);
      }
    };

    loadPendingJobs();
  }, [business.id, setPendingAssets]);

  // State for Ultra Confirm Modal
  const [showUltraConfirm, setShowUltraConfirm] = useState(false);
  // Type definition for generate arguments
  type GenerateArgs = [string, string, string, string, 'flash' | 'pro' | 'ultra'];
  const [pendingGeneratePayload, setPendingGeneratePayload] = useState<GenerateArgs | null>(null);

  // Restore State for Control Deck
  const [restoreState, setRestoreState] = useState<{
    prompt: string;
    styleId: string;
    ratio: string;
    subjectId: string;
    modelTier: 'flash' | 'pro' | 'ultra';
    timestamp: number;
  } | null>(null);

  // Infinite Scroll State
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  // Derived Subjects from Business Data
  const subjects = useMemo(() => {
    const items: {
      id: string;
      name: string;
      type: 'product' | 'service' | 'person' | 'location';
      imageUrl?: string;
      price?: string;
      description?: string;
      preserveLikeness?: boolean;
      // Marketing Fields
      promotion?: string;
      benefits?: string[];
      targetAudience?: string;
    }[] = [];

    // Products (check category for service vs product)
    if (business.offerings) {
      business.offerings.forEach(offering => {
        const isService = offering.category?.toLowerCase().includes('service');
        items.push({
          id: offering.id,
          name: offering.name,
          type: isService ? 'service' : 'product',
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

    // Locations
    if (business.locations) {
      business.locations.forEach(location => {
        items.push({
          id: location.id,
          name: location.name,
          type: 'location',
          imageUrl: location.imageUrl,
          description: location.description
        });
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
    // Pricing Logic (Visual Check Only - Server Enforces)
    const COST_MAP = {
      flash: 10,
      pro: 40,
      ultra: 80
    };

    const cost = COST_MAP[modelTier];
    const isDebug = prompt.toLowerCase().startsWith('debug:');

    if (!isDebug && business.credits < cost) {
      alert(`Not enough credits! You need ${cost} credits for ${modelTier === 'ultra' ? 'Ultra 4K' : modelTier === 'pro' ? 'Pro' : 'Flash'} generation.`);
      return;
    }

    if (deductCredit && !isDebug) {
      deductCredit(cost);
    }

    // Look up from state
    const stylePreset = aestheticStyles.find(s => s.id === styleId);
    const subject = subjects.find(s => s.id === subjectId);

    // Create pending asset with stable ID (used as React key)
    const stableId = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newPendingAsset: ExtendedAsset = {
      id: stableId,
      type: 'image',
      content: '',
      prompt: prompt,
      createdAt: new Date().toISOString(),
      localStatus: 'generating',
      aspectRatio: ratio,
      stylePreset: stylePreset?.name,
      styleId: styleId,
      subjectId: subjectId,
      modelTier: modelTier
    };

    // Card appears INSTANTLY
    setPendingAssets(prev => [newPendingAsset, ...prev]);

    try {
      // 1. Call API - returns job ID
      const { jobId } = await generateImage(
        prompt,
        business,
        stylePreset,
        subject ? {
          ...subject,
          preserveLikeness: subject.preserveLikeness || false
        } : undefined,
        ratio,
        modelTier === 'flash' ? 'pro' : modelTier,
        strategy
      );

      // 2. Store jobId for polling (but DON'T change the id - that's the React key!)
      setPendingAssets(prev => prev.map(a =>
        a.id === stableId ? { ...a, jobId: jobId } : a
      ));

      // 3. Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await pollJobStatus(jobId);

          if (status.status === 'completed' && status.asset) {
            clearInterval(pollInterval);

            // Update pending asset with URL and set to complete
            setPendingAssets(prev => prev.map(a =>
              a.id === stableId
                ? { ...a, localStatus: 'complete', content: status.asset.content }
                : a
            ));

          } else if (status.status === 'failed') {
            clearInterval(pollInterval);

            // Remove pending and refund
            setPendingAssets(prev => prev.filter(a => a.id !== stableId));
            if (deductCredit) {
              deductCredit(-cost); // REFUND
              alert(status.errorMessage || 'Generation failed. Credits have been refunded.');
            }
          }
          // If still 'processing' or 'pending', keep polling
        } catch (pollError) {
          console.error("Poll error:", pollError);
          // Don't clear interval on temporary errors
        }
      }, 2000); // Poll every 2 seconds

      // Safety: Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error("Generation Error", error);
      setPendingAssets(prev => prev.filter(a => a.id !== stableId));
      if (deductCredit) {
        deductCredit(-cost); // REFUND
        alert("An unexpected error occurred. Credits have been refunded.");
      }
    }
  }, [business, deductCredit, updateCredits, addAsset, setPendingAssets, subjects, aestheticStyles, strategy]);

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

      currentAsset.subjectId || '',
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
      aspectRatio: pending.aspectRatio,
      styleId: pending.styleId,
      subjectId: pending.subjectId,
      modelTier: pending.modelTier
    };

    // Add to main list
    addAsset(finalAsset);

    // Remove from pending list
    setPendingAssets(prev => prev.filter(a => a.id !== id));
  }, [pendingAssets, addAsset, setPendingAssets]);

  // Handle animation phase changes from GeneratorCard
  const handlePhaseChange = useCallback((id: string, phase: 'warmup' | 'cruise' | 'deceleration' | 'revealed') => {
    setPendingAssets(prev => prev.map(a =>
      a.id === id ? { ...a, animationPhase: phase } : a
    ));
  }, [setPendingAssets]);

  const handleReuse = useCallback((asset: Asset, mode: 'prompt_only' | 'all') => {
    if (mode === 'prompt_only') {
      setRestoreState({
        prompt: asset.prompt,
        styleId: '',
        ratio: '1:1',
        subjectId: '',
        modelTier: 'pro',
        timestamp: Date.now()
      });
    } else {
      setRestoreState({
        prompt: asset.prompt,
        styleId: asset.styleId || '',
        ratio: asset.aspectRatio || '1:1',
        subjectId: asset.subjectId || '',
        modelTier: asset.modelTier || 'pro',
        timestamp: Date.now()
      });
    }
    setSelectedAsset(null); // Close viewer
  }, []);




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
                      animationPhase={(asset as ExtendedAsset).animationPhase || 'warmup'}
                      onPhaseChange={(phase) => handlePhaseChange(asset.id, phase)}
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

        {/* Infinite Scroll Sentinel - Disabled for now in Generator to avoid context conflict */}
        {/* {loadMoreAssets && ( */}
        <div
          ref={sentinelRef}
          className="h-20 flex items-center justify-center opacity-50"
        >
          {isLoadingMore && (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          )}
        </div>
        {/* )} */}
      </div>

      {/* The Control Deck */}
      <ControlDeck
        onGenerate={handleGenerate}
        styles={aestheticStyles}
        subjects={subjects}
        activeCount={pendingAssets.length}
        restoreState={restoreState}
        strategy={strategy}
        onStrategyChange={setStrategy}
        visualMotifs={business.visualMotifs || []}
      />

      {/* Asset Viewer Lightbox */}
      <AssetViewer
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onDelete={(id) => { handleDelete(id); setSelectedAsset(null); }}
        onRefine={handleRefine}
        onReuse={handleReuse}
        business={business}
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