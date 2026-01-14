import React, { useState, useEffect } from 'react';
import { Business, TeamMember, Testimonial, BrandArchetype, VisualMotif } from '../types';
import { NeuCard, NeuInput, NeuButton, NeuTextArea, useThemeStyles, NeuTabs, NeuBadge } from '../components/NeuComponents';
import { NeuImageUploader } from '../components/NeuImageUploader';
import { Palette, Mic2, Ban, Users, Plus, Trash2, Image as ImageIcon, Star, Type, Zap, Save, UploadCloud, Loader, Globe, Heart, Brain, Target, Shield, Layout, Sparkles, X, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { StorageService } from '../services/storage';
import { BrandArchetypeSelector } from '../components/BrandArchetypeSelector';
import { TypographySelector } from '../components/TypographySelector';
import { GalaxyColorPicker, GalaxyColorPanel } from '../components/GalaxyColorPicker';

interface BrandKitProps {
  business: Business;
  updateBusiness: (b: Business) => Promise<void>;
}

const BrandKit: React.FC<BrandKitProps> = ({ business, updateBusiness }) => {
  // Valid tone pills - must match extraction service
  const VALID_TONE_PILLS = [
    'Bold', 'Premium', 'Minimal', 'Playful', 'Modern', 'Classic', 'Elegant', 'Timeless', 'Sophisticated', 'Luxurious', 'Refined', 'Curated',
    'Professional', 'Creative', 'Energetic', 'Witty', 'Urgent', 'Calm', 'Warm', 'Approachable', 'Sincere', 'Trustworthy',
    'Friendly', 'Exclusive', 'Rebellious', 'Community Focused', 'Authoritative', 'Supportive', 'Personable', 'Welcoming',
    'Educational', 'Insightful', 'Analytical', 'Geeky', 'Direct', 'Informative', 'Expert'
  ];

  // Clean legacy pills: strip emojis and filter to valid list
  const cleanTonePills = (pills: string[]): string[] => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu;
    return pills
      .map(p => {
        const cleaned = p.replace(emojiRegex, '').trim();
        return VALID_TONE_PILLS.find(v => v.toLowerCase() === cleaned.toLowerCase());
      })
      .filter((p): p is string => p !== undefined);
  };

  const [localBusiness, setLocalBusiness] = useState<Business>(() => ({
    ...business,
    voice: {
      ...business.voice,
      tonePills: cleanTonePills(business.voice.tonePills || [])
    }
  }));
  const { isDirty, setDirty, registerSaveHandler } = useNavigation();
  const { toast } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isWordmarkUploading, setIsWordmarkUploading] = useState(false);
  const [isConvertingSvg, setIsConvertingSvg] = useState(false);
  const [convertingWordIndex, setConvertingWordIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('core');
  const [activeColorTab, setActiveColorTab] = useState<string | null>(null);

  // SVG conversion rotating words
  const CONVERTING_WORDS = [
    "Detecting format...",
    "Converting to PNG...",
    "Optimizing quality...",
    "Almost there..."
  ];

  // Local input states
  const [newUSP, setNewUSP] = useState('');
  const [newCompetitor, setNewCompetitor] = useState({ name: '', website: '' });
  const [newMotif, setNewMotif] = useState<Partial<VisualMotif>>({ name: '', description: '', prominence: 'standard' });
  const [editingMotifId, setEditingMotifId] = useState<string | null>(null);

  const { styles } = useThemeStyles();
  const localBusinessRef = React.useRef(localBusiness);

  // Ref to track usage to prevent auto-wiping state on parent re-renders
  const prevBusinessRef = React.useRef(business);

  useEffect(() => {
    const prevBusiness = prevBusinessRef.current;

    // Only update local state if the business actually changed (ID or Content)
    // This prevents "silent wipes" when the parent component re-renders but data is the same
    const idChanged = business.id !== prevBusiness.id;
    const contentChanged = JSON.stringify(business) !== JSON.stringify(prevBusiness);

    if (idChanged || contentChanged) {
      setLocalBusiness(prev => ({
        ...business,
        voice: {
          ...business.voice,
          tonePills: cleanTonePills(business.voice.tonePills || [])
        }
      }));
    }

    prevBusinessRef.current = business;
  }, [business]);

  useEffect(() => {
    localBusinessRef.current = localBusiness;
  }, [localBusiness]);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      await updateBusiness(localBusinessRef.current);
      toast({ title: 'Brand Kit Saved', type: 'success', message: 'Your brand identity has been updated.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Save Failed', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [updateBusiness, toast]);

  useEffect(() => {
    const isChanged = JSON.stringify(business) !== JSON.stringify(localBusiness);
    setDirty(isChanged, 'Brand Kit');

    if (isChanged) {
      registerSaveHandler(handleSave, 'Brand Kit');
    } else {
      registerSaveHandler(null, 'Brand Kit');
    }
  }, [business, localBusiness, setDirty, registerSaveHandler, handleSave]);

  const updateLocal = (updates: Partial<Business>) => {
    setLocalBusiness(prev => ({ ...prev, ...updates }));
  };

  const updateVoice = (updates: Partial<typeof localBusiness.voice>) => {
    setLocalBusiness(prev => ({
      ...prev,
      voice: { ...prev.voice, ...updates }
    }));
  };

  // --- Voice Pills Helper ---
  const toggleTonePill = (pill: string) => {
    const current = localBusiness.voice.tonePills || [];
    const isSelected = current.includes(pill);

    if (isSelected) {
      updateVoice({ tonePills: current.filter(p => p !== pill) });
    } else {
      if (current.length >= 4) {
        toast({ title: 'Limit Reached', type: 'info', message: 'You can only select up to 4 voice attributes.' });
        return;
      }
      updateVoice({ tonePills: [...current, pill] });
    }
  };

  // --- File Upload ---
  const handleLogoUpload = async (file: File, type: 'logo' | 'wordmark' = 'logo') => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', type: 'error', message: 'Image must be under 5MB' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', type: 'error', message: 'Please upload an image (PNG, JPG, SVG)' });
      return;
    }

    if (type === 'logo') setIsLogoUploading(true);
    else setIsWordmarkUploading(true);

    try {
      let fileToUpload = file;

      // Check if file is SVG and needs conversion
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

      if (isSvg) {
        setIsConvertingSvg(true);
        setConvertingWordIndex(0);

        // Start rotating words animation
        const wordInterval = setInterval(() => {
          setConvertingWordIndex(prev => (prev + 1) % CONVERTING_WORDS.length);
        }, 800);

        try {
          // Read file as base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Extract base64 data after the data URL prefix
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Call conversion API
          const response = await fetch('/api/convert-svg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ svgData: base64 })
          });

          if (!response.ok) {
            throw new Error('SVG conversion failed');
          }

          const { pngData } = await response.json();

          // Create PNG file from base64
          const pngBytes = Uint8Array.from(atob(pngData), c => c.charCodeAt(0));
          const pngBlob = new Blob([pngBytes], { type: 'image/png' });
          fileToUpload = new File([pngBlob], file.name.replace(/\.svg$/i, '.png'), { type: 'image/png' });

          toast({ title: 'SVG Converted', type: 'success', message: 'Logo converted to PNG for compatibility' });
        } finally {
          clearInterval(wordInterval);
          setIsConvertingSvg(false);
        }
      }

      const url = await StorageService.uploadBusinessAsset(fileToUpload, localBusiness.id, type);
      if (url) {
        if (type === 'logo') {
          updateLocal({ logoUrl: url });
        } else {
          updateLocal({ logoVariants: { ...localBusiness.logoVariants, wordmark: url } });
        }
        toast({ title: 'Upload Success', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Upload Failed', type: 'error' });
    } finally {
      if (type === 'logo') setIsLogoUploading(false);
      else setIsWordmarkUploading(false);
    }
  };

  // --- SVG Conversion Callback for NeuImageUploader ---
  const convertSvgIfNeeded = async (file: File): Promise<File> => {
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (!isSvg) return file;

    setIsConvertingSvg(true);
    setConvertingWordIndex(0);

    const wordInterval = setInterval(() => {
      setConvertingWordIndex(prev => (prev + 1) % CONVERTING_WORDS.length);
    }, 800);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/convert-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svgData: base64 })
      });

      if (!response.ok) throw new Error('SVG conversion failed');

      const { pngData } = await response.json();
      const pngBytes = Uint8Array.from(atob(pngData), c => c.charCodeAt(0));
      const pngFile = new File([new Blob([pngBytes], { type: 'image/png' })],
        file.name.replace(/\.svg$/i, '.png'), { type: 'image/png' });

      toast({ title: 'SVG Converted', type: 'success', message: 'Logo converted to PNG' });
      return pngFile;
    } finally {
      clearInterval(wordInterval);
      setIsConvertingSvg(false);
    }
  };

  // --- Render Sections ---

  const renderCore = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NeuCard>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-brand`}>
              <Brain size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Brand DNA</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-6`}>Your core purpose and reason for existing. This guides all AI-generated messaging.</p>
          <div className="space-y-4">
            <div>
              <label className={`text-sm font-bold ${styles.textSub} mb-2 block`}>Mission Statement</label>
              <NeuTextArea
                placeholder="Why does your company exist? What drives you?"
                value={localBusiness.description}
                onChange={(e) => updateLocal({ description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </NeuCard>

        <NeuCard>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-yellow-500`}>
              <Zap size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Differentiators (USPs)</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-4`}>What makes you different from competitors? The AI will highlight these in your ads.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(localBusiness.usps || []).map((k, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-yellow-100 border border-yellow-200 text-xs font-bold text-yellow-700 flex items-center gap-2">
                {k}
                <button onClick={() => {
                  const newK = [...(localBusiness.usps || [])];
                  newK.splice(i, 1);
                  updateLocal({ usps: newK });
                }} className="text-yellow-500 hover:text-yellow-900">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <NeuInput
              placeholder="Add a differentiator (e.g. Free Shipping)"
              value={newUSP}
              onChange={(e) => setNewUSP(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newUSP.trim()) {
                  updateLocal({ usps: [...(localBusiness.usps || []), newUSP.trim()] });
                  setNewUSP('');
                }
              }}
              className="flex-1"
            />
            <NeuButton
              onClick={() => {
                if (newUSP.trim()) {
                  updateLocal({ usps: [...(localBusiness.usps || []), newUSP.trim()] });
                  setNewUSP('');
                }
              }}
              disabled={!newUSP.trim()}
              className="px-3"
            >
              <Plus size={18} />
            </NeuButton>
          </div>
        </NeuCard>
      </div>

      <div className="space-y-4">
        <h3 className={`text-xl font-bold ${styles.textMain} px-2`}>Brand Archetype</h3>
        <p className={`text-sm ${styles.textSub} px-2 max-w-2xl`}>
          Select the character that best represents your brand's soul. This helps the AI understand your psychological profile.
        </p>
        <BrandArchetypeSelector
          value={localBusiness.voice.archetype || 'Unset'}
          onChange={(val) => updateVoice({ archetype: val })}
        />
      </div>
    </div>
  );

  const renderVisuals = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colors */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-brand`}>
              <Palette size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Color Palette</h3>
          </div>

          {/* Color Triggers */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { key: 'primary', label: 'Primary', color: (localBusiness.colors as any).primary },
              { key: 'secondary', label: 'Secondary', color: (localBusiness.colors as any).secondary },
              { key: 'accent', label: 'Accent', color: (localBusiness.colors as any).accent }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveColorTab(activeColorTab === item.key ? null : item.key)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300
                  ${activeColorTab === item.key
                    ? 'border-brand bg-brand/5 scale-[1.02] shadow-lg'
                    : `${styles.border} ${styles.bgAccent} hover:border-brand/30 hover:scale-[1.01]`
                  }
                `}
              >
                <div
                  className="w-full h-8 rounded-lg shadow-inner border border-white/10 relative overflow-hidden"
                  style={{ backgroundColor: item.color || 'transparent' }}
                >
                  {!item.color && <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">?</div>}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${styles.textSub}`}>{item.label}</span>
                <span className={`font-mono text-[10px] ${styles.textMain}`}>{item.color || '---'}</span>
              </button>
            ))}
          </div>

          {/* Shared Expandable Panel */}
          <AnimatePresence>
            {activeColorTab && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <GalaxyColorPanel
                  className="mb-2"
                  color={(localBusiness.colors as any)[activeColorTab]}
                  onChange={(c) => setLocalBusiness(prev => ({
                    ...prev,
                    colors: { ...prev.colors, [activeColorTab]: c }
                  }))}
                  onClear={() => setLocalBusiness(prev => ({
                    ...prev,
                    colors: { ...prev.colors, [activeColorTab]: '' }
                  }))}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </NeuCard>

        {/* Logo */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-pink-500`}>
              <ImageIcon size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Logo System</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Logo */}
            <div className="flex flex-col h-full">
              <label className={`text-sm font-bold ${styles.textSub} mb-2 block`}>Primary Logo</label>
              <NeuImageUploader
                currentValue={localBusiness.logoUrl || ''}
                businessId={localBusiness.id}
                folder="logos"
                uploadMode="business"
                onUpload={(url) => {
                  if (typeof url === 'string') {
                    updateLocal({ logoUrl: url });
                  }
                }}
                onBeforeUpload={convertSvgIfNeeded}
                isConverting={isConvertingSvg}
                convertingMessage={CONVERTING_WORDS[convertingWordIndex]}
                className="flex-1"
              />
            </div>

            {/* Wordmark (Upload) */}
            <div className="flex flex-col h-full">
              <label className={`text-sm font-bold ${styles.textSub} mb-2 block`}>Wordmark (Optional)</label>
              <NeuImageUploader
                currentValue={localBusiness.logoVariants?.wordmark || ''}
                businessId={localBusiness.id}
                folder="logos"
                uploadMode="business"
                onUpload={(url) => {
                  if (typeof url === 'string') {
                    updateLocal({ logoVariants: { ...localBusiness.logoVariants, wordmark: url } });
                  }
                }}
                onBeforeUpload={convertSvgIfNeeded}
                isConverting={isConvertingSvg}
                convertingMessage={CONVERTING_WORDS[convertingWordIndex]}
                className="flex-1"
              />
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Typography */}
      <NeuCard>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-blue-500`}>
            <Type size={24} />
          </div>
          <h3 className={`text-lg font-bold ${styles.textMain}`}>Typography System</h3>
        </div>
        <TypographySelector
          value={localBusiness.typography || { headingFont: '', bodyFont: '', scale: 'medium' }}
          onChange={(val) => {
            if (val.headingFont === '' && localBusiness.typography?.headingFont !== '') {
              updateLocal({ typography: { ...val, bodyFont: '' } });
            } else {
              updateLocal({ typography: val });
            }
          }}
        />
      </NeuCard>

      {/* Visual Motifs */}
      <NeuCard>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-purple-500`}>
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Brand Signatures</h3>
            <p className={`text-xs ${styles.textSub}`}>Keywords representing your brand's unique visual elements</p>
          </div>
        </div>
        <p className={`text-sm ${styles.textSub} mb-6 p-3 rounded-lg ${styles.bgAccent} border ${styles.border}`}>
          💡 <strong>Tip:</strong> Just type a keyword like "Whale", "Beach Sunset", or "Palm Tree". The AI will creatively incorporate it into your ads.
        </p>

        {/* Existing Motifs */}
        <div className="space-y-3 mb-6">
          {(localBusiness.visualMotifs || []).map((motif, idx) => (
            <div
              key={motif.id || idx}
              className={`p-4 rounded-xl ${styles.bgAccent} border ${styles.border} flex justify-between items-start gap-4`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold ${styles.textMain}`}>{motif.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                    ${motif.prominence === 'prominent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      motif.prominence === 'standard' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        motif.prominence === 'subtle' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}
                  >
                    {motif.prominence || 'standard'}
                  </span>
                </div>
                {motif.description && <p className={`text-sm ${styles.textSub} mt-1`}>{motif.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingMotifId(motif.id);
                    setNewMotif({ name: motif.name, description: motif.description, prominence: motif.prominence });
                  }}
                  className="text-gray-400 hover:text-brand p-1"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => {
                    const updated = (localBusiness.visualMotifs || []).filter((_, i) => i !== idx);
                    updateLocal({ visualMotifs: updated });
                  }}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Motif */}
        <div className={`p-4 rounded-xl border-2 ${editingMotifId ? 'border-brand bg-brand/5' : 'border-dashed'} ${styles.border} space-y-3`}>
          {editingMotifId && (
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-bold ${styles.textMain}`}>Editing Signature</span>
              <button
                onClick={() => {
                  setEditingMotifId(null);
                  setNewMotif({ name: '', description: '', prominence: 'standard' });
                }}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <NeuInput
              placeholder="Keyword (e.g. Whale, Beach, Palm Tree)"
              value={newMotif.name || ''}
              onChange={(e) => setNewMotif({ ...newMotif, name: e.target.value })}
            />
            <div className="flex gap-2">
              {(['hidden', 'subtle', 'standard', 'prominent'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setNewMotif({ ...newMotif, prominence: level })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize
                    ${newMotif.prominence === level
                      ? 'bg-brand text-white'
                      : `${styles.bgAccent} ${styles.textSub} hover:bg-brand/10`
                    }`}
                >
                  {level === 'hidden' ? "Don't Use" : level}
                </button>
              ))}
            </div>
          </div>
          <NeuButton
            onClick={() => {
              if (newMotif.name) {
                if (editingMotifId) {
                  // Update existing
                  const updated = (localBusiness.visualMotifs || []).map(m =>
                    m.id === editingMotifId
                      ? { ...m, name: newMotif.name!, description: newMotif.description, prominence: newMotif.prominence || 'standard' }
                      : m
                  );
                  updateLocal({ visualMotifs: updated });
                  setEditingMotifId(null);
                } else {
                  // Add new
                  const motif: VisualMotif = {
                    id: `motif_${Date.now()}`,
                    name: newMotif.name,
                    prominence: newMotif.prominence || 'standard'
                  };
                  updateLocal({ visualMotifs: [...(localBusiness.visualMotifs || []), motif] });
                }
                setNewMotif({ name: '', description: '', prominence: 'standard' });
              }
            }}
            disabled={!newMotif.name}
            className="w-full"
          >
            <Plus size={16} className="mr-2" />
            {editingMotifId ? 'Save Changes' : 'Add Signature'}
          </NeuButton>
        </div>
      </NeuCard>
    </div>
  );

  const renderVoice = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-brand`}>
              <Mic2 size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Voice & Tone</h3>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className={`text-xs ${styles.textSub}`}>Select up to 4 traits that define your brand voice.</p>
              <NeuBadge variant="outline">{localBusiness.voice.tonePills?.length || 0} / 4</NeuBadge>
            </div>

            {/* Style */}
            <div>
              <label className={`text-xs font-bold ${styles.textSub} uppercase tracking-wider mb-3 block`}>Style</label>
              <div className="flex flex-wrap gap-2">
                {['Bold', 'Premium', 'Minimal', 'Playful', 'Modern', 'Classic', 'Elegant', 'Timeless', 'Sophisticated', 'Luxurious', 'Refined', 'Curated'].map(pill => (
                  <button
                    key={pill}
                    onClick={() => toggleTonePill(pill)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-2
                      ${(localBusiness.voice.tonePills || []).includes(pill)
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:border-gray-200'
                      }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className={`text-xs font-bold ${styles.textSub} uppercase tracking-wider mb-3 block`}>Tone</label>
              <div className="flex flex-wrap gap-2">
                {['Professional', 'Creative', 'Energetic', 'Witty', 'Urgent', 'Calm', 'Warm', 'Approachable', 'Sincere', 'Trustworthy'].map(pill => (
                  <button
                    key={pill}
                    onClick={() => toggleTonePill(pill)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-2
                      ${(localBusiness.voice.tonePills || []).includes(pill)
                        ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                        : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:border-gray-200'
                      }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Relation */}
            <div>
              <label className={`text-xs font-bold ${styles.textSub} uppercase tracking-wider mb-3 block`}>Relation</label>
              <div className="flex flex-wrap gap-2">
                {['Friendly', 'Exclusive', 'Rebellious', 'Community Focused', 'Authoritative', 'Supportive', 'Personable', 'Welcoming'].map(pill => (
                  <button
                    key={pill}
                    onClick={() => toggleTonePill(pill)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-2
                      ${(localBusiness.voice.tonePills || []).includes(pill)
                        ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                        : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:border-gray-200'
                      }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Intellect */}
            <div>
              <label className={`text-xs font-bold ${styles.textSub} uppercase tracking-wider mb-3 block`}>Intellect</label>
              <div className="flex flex-wrap gap-2">
                {['Educational', 'Insightful', 'Analytical', 'Geeky', 'Direct', 'Informative', 'Expert'].map(pill => (
                  <button
                    key={pill}
                    onClick={() => toggleTonePill(pill)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-2
                      ${(localBusiness.voice.tonePills || []).includes(pill)
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:border-gray-200'
                      }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </NeuCard>

        {/* Ban List */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-red-500`}>
              <Ban size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>The Ban List</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-4`}>Words the AI is <strong className="text-red-500">strictly forbidden</strong> from using.</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {(localBusiness.voice.negativeKeywords || []).map((k, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-red-100 border border-red-200 text-xs font-bold text-red-600 flex items-center gap-2">
                {k}
                <button onClick={() => {
                  const newK = [...(localBusiness.voice.negativeKeywords || [])];
                  newK.splice(i, 1);
                  updateVoice({ negativeKeywords: newK });
                }} className="text-red-400 hover:text-red-800">×</button>
              </span>
            ))}
          </div>
          <NeuInput
            placeholder="e.g. Cheap, Moist, Urgent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = e.currentTarget.value.trim();
                if (val) {
                  updateVoice({ negativeKeywords: [...(localBusiness.voice.negativeKeywords || []), val] });
                  e.currentTarget.value = '';
                }
              }
            }}
          />
        </NeuCard>
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-brand`}>
              <Target size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Core Customer Profile</h3>
          </div>

          <div className="space-y-6">
            {/* Conversational Inputs */}
            <div>
              <label className={`text-sm font-bold ${styles.textMain} mb-2 block flex items-center gap-2`}>
                <Users size={16} className="text-brand" />
                Who are they?
              </label>
              <p className={`text-xs ${styles.textSub} mb-2`}>Describe their age, location, job, and lifestyle.</p>
              <NeuTextArea
                placeholder="e.g. Urban professionals, 25-40, who value sustainability and quality coffee..."
                value={localBusiness.coreCustomerProfile?.demographics || ''}
                onChange={(e) => updateLocal({ coreCustomerProfile: { ...localBusiness.coreCustomerProfile!, demographics: e.target.value } })}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className={`text-sm font-bold ${styles.textMain} mb-2 block flex items-center gap-2`}>
                <Heart size={16} className="text-pink-500" />
                What do they care about?
              </label>
              <p className={`text-xs ${styles.textSub} mb-2`}>Their values, interests, and what drives their decisions.</p>
              <NeuTextArea
                placeholder="e.g. They care about ethical sourcing, morning rituals, and supporting local businesses..."
                value={localBusiness.coreCustomerProfile?.psychographics || ''}
                onChange={(e) => updateLocal({ coreCustomerProfile: { ...localBusiness.coreCustomerProfile!, psychographics: e.target.value } })}
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className={`text-sm font-bold ${styles.textMain} mb-2 block flex items-center gap-2`}>
                <Shield size={16} className="text-orange-500" />
                What problems do you solve?
              </label>
              <p className={`text-xs ${styles.textSub} mb-2`}>The frustrations they have that you fix.</p>
              <NeuTextArea
                placeholder="e.g. Tired of burnt, bitter coffee. Want a reliable morning boost without the crash..."
                value={(localBusiness.coreCustomerProfile?.painPoints || []).join('\n')}
                onChange={(e) => updateLocal({ coreCustomerProfile: { ...localBusiness.coreCustomerProfile!, painPoints: e.target.value.split('\n') } })}
                rows={3}
              />
            </div>
          </div>
        </NeuCard>

        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-orange-500`}>
              <Globe size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>Competitors</h3>
          </div>
          <p className={`text-sm ${styles.textSub} mb-4`}>Who are you up against? We'll analyze them for differentiation.</p>

          <div className="space-y-3 mb-4">
            {(localBusiness.competitors || []).map((comp, idx) => (
              <div key={idx} className={`p-3 rounded-xl ${styles.bgAccent} border ${styles.border} flex justify-between items-center`}>
                <div>
                  <div className={`font-bold ${styles.textMain}`}>{comp.name}</div>
                  <div className={`text-xs ${styles.textSub}`}>{comp.website}</div>
                </div>
                <button
                  onClick={() => updateLocal({ competitors: localBusiness.competitors.filter((_, i) => i !== idx) })}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <NeuInput
              placeholder="Competitor Name"
              value={newCompetitor.name}
              onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
            />
            <div className="flex gap-2">
              <NeuInput
                placeholder="Website URL"
                value={newCompetitor.website}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, website: e.target.value })}
              />
              <NeuButton
                onClick={() => {
                  if (newCompetitor.name) {
                    updateLocal({ competitors: [...(localBusiness.competitors || []), newCompetitor] });
                    setNewCompetitor({ name: '', website: '' });
                  }
                }}
                disabled={!newCompetitor.name}
              >
                Add
              </NeuButton>
            </div>
          </div>
        </NeuCard>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-10 py-4 bg-opacity-90 backdrop-blur-sm">
        <div>
          <GalaxyHeading
            text="Brand Kit"
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
          />
          <p className={styles.textSub}>Define how {localBusiness.name} looks, sounds, and behaves.</p>
        </div>
        <NeuButton
          variant={isDirty ? 'primary' : 'secondary'}
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </NeuButton>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-2xl">
        <NeuTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'core', label: 'Brand Core', icon: <Brain size={16} /> },
            { id: 'visuals', label: 'Visuals', icon: <Palette size={16} /> },
            { id: 'voice', label: 'Voice & Tone', icon: <Mic2 size={16} /> },
            { id: 'audience', label: 'Audience', icon: <Target size={16} /> },
          ]}
        />
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'core' && renderCore()}
        {activeTab === 'visuals' && renderVisuals()}
        {activeTab === 'voice' && renderVoice()}
        {activeTab === 'audience' && renderAudience()}
      </div>
    </div>
  );
};

export default BrandKit;
