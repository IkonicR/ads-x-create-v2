import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GeneratorCard } from '../components/GeneratorCard';
import { AssetCard } from '../components/AssetCard';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { AssetViewer } from '../components/AssetViewer';
import MasonryGrid from '../components/MasonryGrid';
import { ControlDeck } from '../components/ControlDeck';
import { useThemeStyles } from '../components/NeuComponents';
import { NeuConfirmModal } from '../components/NeuConfirmModal';
import { Business, Asset, ExtendedAsset, StylePreset, AssetStatus, Preset } from '../types';
import { generateImage } from '../services/geminiService';
import { StorageService } from '../services/storage';

interface GeneratorProps {
  business: Business;
  deductCredit: (amount: number) => void;
  addAsset: (asset: Asset) => void;
  deleteAsset?: (id: string) => void;
  assets: Asset[];
  // Props for lifted state (so we don't lose generation progress on tab switch)
  pendingAssets: ExtendedAsset[];
  setPendingAssets: React.Dispatch<React.SetStateAction<ExtendedAsset[]>>;
}

const Generator: React.FC<GeneratorProps> = ({
  business, 
  deductCredit, 
  addAsset, 
  deleteAsset, 
  assets,
  pendingAssets,
  setPendingAssets 
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { styles, theme } = useThemeStyles();

  // Configuration State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [aestheticStyles, setAestheticStyles] = useState<StylePreset[]>([]);

  // Load Configuration
  useEffect(() => {
    const loadConfig = async () => {
       const [loadedPresets, loadedStyles] = await Promise.all([
         StorageService.getPresets(),
         StorageService.getStyles()
       ]);
       setPresets(loadedPresets);
       setAestheticStyles(loadedStyles);
    };
    loadConfig();
  }, []);

  // State for Ultra Confirm Modal
  const [showUltraConfirm, setShowUltraConfirm] = useState(false);
  // Type definition for generate arguments
  type GenerateArgs = [string, string, string, string, string, 'flash' | 'pro' | 'ultra'];
  const [pendingGeneratePayload, setPendingGeneratePayload] = useState<GenerateArgs | null>(null);

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
          preserveLikeness: offering.preserveLikeness
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
    presetId: string, 
    styleId: string, 
    ratio: string,
    subjectId: string,
    modelTier: 'flash' | 'pro' | 'ultra'
  ) => {
    if (loading) return;

    // Pricing Logic (Aggressive 80%+ Margin Model)
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

    setLoading(true);
    deductCredit(cost);

    // 1. Create Pending Asset
    const tempId = Date.now().toString();

    // Look up from state instead of constants
    const stylePreset = aestheticStyles.find(s => s.id === styleId);
    const presetConfig = presets.find(p => p.id === presetId);
    const subject = subjects.find(s => s.id === subjectId);

    // Construct Final Prompt
    let fullPrompt = prompt;
    if (presetConfig) fullPrompt += `. ${presetConfig.promptModifier}`;
    if (stylePreset) fullPrompt += `. ${stylePreset.promptModifier}`;

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
      const imageUrl = await generateImage(
        business,
        fullPrompt, 
        business.voice.tone || 'Professional',
        business.voice.keywords,
        '', 
        modelTier, 
        ratio,
        { ...subject, logoMaterial: stylePreset?.logoMaterial, logoPlacement: presetConfig?.logoPlacement } 
      );

      if (imageUrl) {
        // 3. Success
        const finalAsset: Asset = {
          ...newPendingAsset,
          id: Date.now().toString(), 
          content: imageUrl,
          localStatus: undefined 
        };

        addAsset(finalAsset);
        setPendingAssets(prev => prev.filter(a => a.id !== tempId));
      } else {
        setPendingAssets(prev => prev.filter(a => a.id !== tempId)); 
        alert("Generation failed. Please try again.");
      }

    } catch (error) {
      console.error("Generation Error", error);
      setPendingAssets(prev => prev.filter(a => a.id !== tempId));
    } finally {
      setLoading(false);
    }
  }, [loading, business, deductCredit, addAsset, setPendingAssets, subjects, aestheticStyles, presets]);

  const handleGenerate = useCallback(async (
    prompt: string, 
    presetId: string, 
    styleId: string, 
    ratio: string,
    subjectId: string,
    modelTier: 'flash' | 'pro' | 'ultra'
  ) => {
    // If Ultra is selected, show confirmation modal first
    if (modelTier === 'ultra' && !showUltraConfirm) {
      setPendingGeneratePayload([prompt, presetId, styleId, ratio, subjectId, modelTier]);
      setShowUltraConfirm(true);
      return;
    }

    // Otherwise, proceed with generation
    await executeGenerate(prompt, presetId, styleId, ratio, subjectId, modelTier);

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
      '', 
      styleId,
      currentAsset.aspectRatio || '1:1',
      '', 
      'ultra' 
    );
  }, [selectedAsset, aestheticStyles, executeGenerate]);

  // Optimize: Memoize the children list to prevent MasonryGrid from re-rendering existing items
  const gridChildren = useMemo(() => (
    displayAssets.map(asset => {
       const isGenerating = asset.localStatus === 'generating';
       
       if (isGenerating) {
         return (
           <motion.div 
             key={asset.id}
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ type: 'spring', damping: 20, stiffness: 300 }}
           >
             <GeneratorCard 
               aspectRatio={asset.aspectRatio}
               status={asset.localStatus || 'generating'}
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
    })
  ), [displayAssets, business.colors.primary, handleDelete]);


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
          <MasonryGrid columns={3} gap={16}>
            {gridChildren}
          </MasonryGrid>
        )}
      </div>

      {/* The Control Deck */}
      <ControlDeck 
        onGenerate={handleGenerate}
        presets={presets}
        styles={aestheticStyles}
        subjects={subjects}
        loading={loading}
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
                executeGenerate(...pendingGeneratePayload).then(() => {
                    setShowUltraConfirm(false);
                    setPendingGeneratePayload(null);
                });
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