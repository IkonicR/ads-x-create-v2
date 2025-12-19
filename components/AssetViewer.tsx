import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, Business } from '../types';
import { useThemeStyles, NeuButton, NeuInput } from './NeuComponents';
import { GalaxyCanvas } from './GalaxyCanvas';
import { X, Download, Trash2, Copy, Share2, Maximize2, ZoomIn, Search, MessageCircle, History, Send, Calendar, Instagram, Facebook, Linkedin, Sparkles, Clock, Check, AlertCircle, FileOutput, RotateCcw, Info, CheckSquare, Square, Plus } from 'lucide-react';
import { ExportPanel, ExportPreset } from './ExportPanel';
import { ShareModal } from './ShareModal';
import { downloadImage, getAssetFilename } from '../utils/download';
import { useSocial } from '../context/SocialContext';
import { supabase } from '../services/supabase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AssetViewerProps {
  asset: Asset | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onRefine?: (instruction: string) => void;
  onReuse?: (asset: Asset, mode: 'prompt_only' | 'all') => void;
  business?: Business; // For social config
}

// Sortable Carousel Item Component
interface SortableItemProps {
  id: string;
  url: string;
  index: number;
  onRemove: () => void;
}

const SortableCarouselItem: React.FC<SortableItemProps> = ({ id, url, index, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative aspect-video rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
      whileHover={{ scale: 1.02 }}
      layout
    >
      <img src={url} alt="" className="w-full h-full object-cover" />
      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        #{index + 2}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
};

export const AssetViewer: React.FC<AssetViewerProps> = ({ asset, onClose, onDelete, onRefine, onReuse, business }) => {
  const { styles, theme } = useThemeStyles();
  const isDark = theme === 'dark';

  // Tabs State
  const [activeTab, setActiveTab] = useState<'details' | 'refine' | 'social'>('details');

  // Use SocialContext for accounts (centralized caching)
  const { accounts: connectedAccounts, accountsLoading: isLoadingAccounts, loadAccounts } = useSocial();

  // Social Tab State
  const [captions, setCaptions] = useState<{ [platform: string]: string }>({});  // Per-platform captions
  const [activeCaptionPlatform, setActiveCaptionPlatform] = useState<string>('general');  // Which platform caption is being edited
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPostingNow, setIsPostingNow] = useState(true);
  // Recurring post state
  const [repeatMode, setRepeatMode] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'custom'>('none');
  const [repeatInterval, setRepeatInterval] = useState(1); // For custom: every X days
  const [repeatEndDate, setRepeatEndDate] = useState(''); // When to stop recurring
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [firstComment, setFirstComment] = useState(false);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  // Platform character limits
  const PLATFORM_LIMITS: { [key: string]: number } = {
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000,
    google: 1500,
    general: 5000,
  };

  // Carousel images state (additional images beyond the main asset)
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);

  // DnD Kit sensors for carousel reordering (must be at top level)
  const dndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Export Panel State
  const [showExportPanel, setShowExportPanel] = useState(false);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);

  // Auto-resize caption textarea (matches SmartPromptInput pattern)
  // Also depends on asset.id and activeTab to trigger resize after loading/tab switch
  useLayoutEffect(() => {
    if (captionRef.current) {
      captionRef.current.style.height = 'auto';
      captionRef.current.style.height = `${Math.max(72, Math.min(captionRef.current.scrollHeight, 200))}px`;
    }
  }, [captions, activeCaptionPlatform, asset?.id, activeTab]);

  // Helper to get current caption for active platform
  const currentCaption = captions[activeCaptionPlatform] || captions['general'] || '';
  const setCurrentCaption = (value: string) => {
    setCaptions(prev => ({ ...prev, [activeCaptionPlatform]: value }));
  };

  // Caption persistence - load from localStorage
  useEffect(() => {
    if (asset?.id) {
      const savedCaptions = localStorage.getItem(`captions_${asset.id}`);
      if (savedCaptions) {
        try {
          setCaptions(JSON.parse(savedCaptions));
        } catch {
          setCaptions({});
        }
      } else {
        setCaptions({}); // Reset if switching assets
      }
    }
  }, [asset?.id]);

  // Caption persistence - save to localStorage
  useEffect(() => {
    if (asset?.id && Object.keys(captions).length > 0) {
      localStorage.setItem(`captions_${asset.id}`, JSON.stringify(captions));
    }
  }, [captions, asset?.id]);

  // Zoom State
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Refine Chat State
  const [refineInput, setRefineInput] = useState('');

  // Galaxy Colors - Deep Space Portal
  const galaxyBg = '#050505';
  const galaxyStars = ['#ffffff', '#A5B4FC', '#60a5fa', '#F472B6'];

  // Social feature availability
  const hasSocialConfig = !!business?.socialConfig?.ghlLocationId;

  // Initialize firstComment from business default when tab opens or business changes
  useEffect(() => {
    if (business?.socialSettings?.firstCommentDefault !== undefined) {
      setFirstComment(business.socialSettings.firstCommentDefault);
    }
  }, [business?.socialSettings?.firstCommentDefault]);

  // Pre-select default platforms when connected accounts load
  useEffect(() => {
    if (connectedAccounts.length > 0 && selectedAccounts.length === 0) {
      const defaultIds = business?.socialSettings?.defaultPlatformIds || [];
      // Filter to only select IDs that exist in connected accounts
      const validDefaultIds = defaultIds.filter(id =>
        connectedAccounts.some(acc => acc.id === id)
      );
      if (validDefaultIds.length > 0) {
        setSelectedAccounts(validDefaultIds);
      }
    }
  }, [connectedAccounts, business?.socialSettings?.defaultPlatformIds]);

  // Load connected accounts when Social tab is activated (uses context caching)
  useEffect(() => {
    if (activeTab === 'social' && hasSocialConfig && business?.socialConfig?.ghlLocationId) {
      loadAccounts(business.socialConfig.ghlLocationId);
    }
  }, [activeTab, hasSocialConfig, business?.socialConfig?.ghlLocationId, loadAccounts]);

  const handleDownload = () => {
    if (asset) {
      const filename = getAssetFilename(asset, business?.name);
      downloadImage(asset.content, filename);
    }
  };

  const handleSendRefinement = () => {
    if (!refineInput.trim() || !onRefine) return;
    onRefine(refineInput);
    setRefineInput('');
  };

  // Export Preset Handlers
  const handleSaveExportPreset = async (preset: ExportPreset) => {
    if (!business?.id) return;
    try {
      const currentPresets = business.exportPresets || [];
      const updatedPresets = [...currentPresets, preset];

      const { error } = await supabase
        .from('businesses')
        .update({ export_presets: updatedPresets })
        .eq('id', business.id);

      if (error) throw error;
      console.log('[Export] Preset saved:', preset.name);
    } catch (e) {
      console.error('[Export] Failed to save preset:', e);
    }
  };

  const handleDeleteExportPreset = async (presetId: string) => {
    if (!business?.id) return;
    try {
      const currentPresets = business.exportPresets || [];
      const updatedPresets = currentPresets.filter(p => p.id !== presetId);

      const { error } = await supabase
        .from('businesses')
        .update({ export_presets: updatedPresets })
        .eq('id', business.id);

      if (error) throw error;
      console.log('[Export] Preset deleted:', presetId);
    } catch (e) {
      console.error('[Export] Failed to delete preset:', e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageContainerRef.current) return;

    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;

    setMousePos({ x, y });
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  // Platform icon helper
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram size={16} />;
      case 'facebook': return <Facebook size={16} />;
      case 'linkedin': return <Linkedin size={16} />;
      default: return <Share2 size={16} />;
    }
  };

  // Toggle account selection
  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  // Schedule/Post handler
  const handleSchedulePost = async () => {
    if (!business?.socialConfig?.ghlLocationId) return;
    if (selectedAccounts.length === 0) {
      setScheduleResult({ error: 'Please select at least one platform' });
      return;
    }
    if (!asset?.content) return;

    setIsScheduling(true);
    setScheduleResult(null);

    try {
      // Calculate all schedule dates based on recurring options
      const scheduleDates: Date[] = [];

      if (isPostingNow) {
        // Post now - no scheduling
        scheduleDates.push(new Date());
      } else if (scheduleDate && scheduleTime) {
        const baseDate = new Date(`${scheduleDate}T${scheduleTime}`);
        scheduleDates.push(baseDate);

        // If recurring, calculate additional dates
        if (repeatMode !== 'none' && repeatEndDate) {
          const endDate = new Date(repeatEndDate);
          endDate.setHours(23, 59, 59, 999); // End of day

          let nextDate = new Date(baseDate);

          while (true) {
            // Add interval based on mode
            switch (repeatMode) {
              case 'daily':
                nextDate = new Date(nextDate);
                nextDate.setDate(nextDate.getDate() + 1);
                break;
              case 'weekly':
                nextDate = new Date(nextDate);
                nextDate.setDate(nextDate.getDate() + 7);
                break;
              case 'monthly':
                nextDate = new Date(nextDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
              case 'custom':
                nextDate = new Date(nextDate);
                nextDate.setDate(nextDate.getDate() + repeatInterval);
                break;
            }

            if (nextDate > endDate) break;
            if (scheduleDates.length >= 30) break; // Safety limit

            scheduleDates.push(new Date(nextDate));
          }
        }
      }

      // Post for each scheduled date
      let successCount = 0;
      let lastError = '';

      for (const date of scheduleDates) {
        // Build media URLs: main asset + any carousel images
        const allMediaUrls = [asset.content, ...carouselImages];

        const payload: any = {
          locationId: business.socialConfig.ghlLocationId,
          accountIds: selectedAccounts,
          caption: currentCaption,  // Use the active platform caption
          mediaUrls: allMediaUrls,
          firstComment: firstComment,
        };

        if (!isPostingNow) {
          payload.scheduledAt = date.toISOString();
        }

        const response = await fetch('/api/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (result.success) {
          successCount++;
        } else {
          lastError = result.error || 'Failed';
        }
      }

      if (successCount === scheduleDates.length) {
        setScheduleResult({
          success: true,
          error: scheduleDates.length > 1
            ? `${successCount} posts scheduled successfully!`
            : undefined
        });
      } else if (successCount > 0) {
        setScheduleResult({
          error: `Scheduled ${successCount}/${scheduleDates.length} posts. Error: ${lastError}`
        });
      } else {
        setScheduleResult({ error: lastError || 'Failed to schedule post' });
      }
    } catch (e: any) {
      setScheduleResult({ error: e.message || 'Failed to schedule post' });
    }

    setIsScheduling(false);
  };

  if (!asset) return null;

  const mainContent = ReactDOM.createPortal(
    <AnimatePresence>
      {asset && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          onClick={onClose}
        >
          {/* 1. The Portal Background (Galaxy) */}
          <div className="absolute inset-0 z-0">
            <GalaxyCanvas
              backgroundColor={galaxyBg}
              starColors={galaxyStars}
            />
            {/* Subtle vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80 pointer-events-none" />
          </div>

          {/* 2. The Floating Neumorphic Slab */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className={`relative z-10 w-[95%] max-w-6xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/10 ${styles.bg}`}
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px -12px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Close Button (Floating) */}
            {/* Close Button (Floating) */}
            <button
              onClick={onClose}
              className={`absolute top-4 right-4 z-50 p-2 rounded-full transition-transform active:scale-95 group ${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-red-500`}
            >
              <X size={20} className="transition-transform duration-300 group-hover:rotate-90" />
            </button>

            {/* Left: The Asset (The "View") */}
            <div className={`flex-1 relative flex items-center justify-center p-6 md:p-10 ${isDark ? 'bg-black/20' : 'bg-gray-100/50'} overflow-hidden`}>

              {/* Zoom Tooltip/Icon */}
              <div className="absolute top-6 left-6 z-20 pointer-events-none opacity-50">
                <div className={`px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold ${styles.bg} ${styles.shadowOut} ${styles.textSub}`}>
                  <ZoomIn size={12} /> {isZoomed ? 'Click to Reset' : 'Click to Zoom'}
                </div>
              </div>

              <motion.div
                layoutId={`asset-${asset.id}`}
                ref={imageContainerRef}
                onClick={toggleZoom}
                onMouseMove={handleMouseMove}
                className={`relative w-full h-full max-h-[70vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-lg cursor-zoom-in transition-transform duration-200`}
              >
                <img
                  src={asset.content}
                  alt={asset.prompt}
                  className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-100 ease-out"
                  style={{
                    transformOrigin: `${mousePos.x * 100}% ${mousePos.y * 100}%`,
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                  }}
                />
              </motion.div>
            </div>

            {/* Right: Control Deck / Info */}
            <div className={`w-full md:w-[400px] flex-shrink-0 flex flex-col border-l border-white/5 ${styles.bg}`}>

              {/* Tab Navigation */}
              <div className="px-6 pt-6 pb-2 flex gap-4 border-b border-white/5">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'details' ? `text-brand` : `${styles.textSub} hover:${styles.textMain}`
                    }`}
                >
                  Details
                  {activeTab === 'details' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('refine')}
                  className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'refine' ? `text-brand` : `${styles.textSub} hover:${styles.textMain}`
                    }`}
                >
                  Refine & Edit
                  {activeTab === 'refine' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('social')}
                  className={`pb-3 text-sm font-bold transition-colors relative flex items-center gap-1.5 ${activeTab === 'social' ? `text-brand` : `${styles.textSub} hover:${styles.textMain}`
                    } ${!hasSocialConfig ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={!hasSocialConfig}
                  title={!hasSocialConfig ? 'Social not configured for this business' : 'Schedule to social media'}
                >
                  <Share2 size={14} />
                  Social
                  {activeTab === 'social' && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              </div>

              {/* Scrollable Info Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar relative">

                <AnimatePresence mode="wait">
                  {activeTab === 'details' ? (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles.shadowIn} ${styles.textSub}`}>
                          {asset.type}
                        </span>
                        {asset.aspectRatio && (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles.shadowIn} ${styles.textSub}`}>
                            {asset.aspectRatio}
                          </span>
                        )}
                      </div>

                      {/* Prompt Section */}
                      <div>
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                          Prompt
                        </label>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${styles.shadowIn} ${styles.textMain} italic opacity-90`}>
                          "{asset.prompt}"
                        </div>
                      </div>

                      {/* Style Section */}
                      {asset.stylePreset && (
                        <div>
                          <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                            Aesthetic
                          </label>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-brand shadow-[0_0_10px_rgba(109,93,252,0.5)]`} />
                            <span className={`font-bold ${styles.textMain}`}>{asset.stylePreset}</span>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${styles.textSub}`}>Created</label>
                          <span className={`text-sm font-medium ${styles.textMain}`}>{new Date(asset.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${styles.textSub}`}>Model</label>
                          <span className={`text-sm font-medium ${styles.textMain} uppercase`}>{asset.modelTier || 'Pro'}</span>
                        </div>
                        {asset.subjectId && (
                          <div className="col-span-2">
                            <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${styles.textSub}`}>Subject ID</label>
                            <span className={`text-xs font-mono ${styles.textMain} opacity-70`}>{asset.subjectId}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : activeTab === 'refine' ? (
                    <motion.div
                      key="refine"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full flex flex-col"
                    >
                      {/* History / Version Stack Placeholder */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 min-h-[200px]">
                        <History size={32} className="mb-3" />
                        <p className={`text-sm font-bold ${styles.textMain}`}>No other versions yet</p>
                        <p className={`text-xs ${styles.textSub} max-w-[200px]`}>
                          Ask the AI to refine this asset below to create variations.
                        </p>
                      </div>

                      {/* Input Area */}
                      <div className="mt-auto pt-4">
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                          Instructions
                        </label>
                        <div className={`relative rounded-2xl ${styles.shadowIn} overflow-hidden`}>
                          <textarea
                            value={refineInput}
                            onChange={(e) => setRefineInput(e.target.value)}
                            placeholder="e.g. Make it brighter, change background to..."
                            className={`w-full pl-4 pr-12 py-3 bg-transparent outline-none text-sm ${styles.textMain} placeholder-gray-400 resize-none`}
                            rows={3}
                          />
                          <button
                            onClick={handleSendRefinement}
                            disabled={!refineInput.trim()}
                            className={`absolute bottom-2 right-2 p-2 rounded-xl transition-all ${refineInput.trim() ? 'bg-brand text-white hover:bg-brand-hover' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                              }`}
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : activeTab === 'social' ? (
                    <motion.div
                      key="social"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full flex flex-col space-y-4 overflow-y-auto custom-scrollbar pr-1"
                    >
                      {/* 1. Platform Selector (Animated Pills) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSub}`}>
                            Post To
                          </label>
                          {connectedAccounts.length > 0 && (
                            <button
                              onClick={() => {
                                if (selectedAccounts.length === connectedAccounts.length) {
                                  setSelectedAccounts([]);
                                } else {
                                  setSelectedAccounts(connectedAccounts.map(a => a.id));
                                }
                              }}
                              className={`text-xs font-bold ${styles.textSub} hover:text-brand transition-colors`}
                            >
                              {selectedAccounts.length === connectedAccounts.length ? 'Deselect All' : 'Select All'}
                            </button>
                          )}
                        </div>
                        {isLoadingAccounts ? (
                          <div className={`text-xs ${styles.textSub}`}>Loading accounts...</div>
                        ) : connectedAccounts.length === 0 ? (
                          <div className={`p-3 rounded-xl ${styles.shadowIn} text-center`}>
                            <p className={`text-xs ${styles.textSub}`}>No accounts connected</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {connectedAccounts.map((account) => {
                              const isSelected = selectedAccounts.includes(account.id);
                              const isDefault = business?.socialSettings?.defaultPlatformIds?.includes(account.id);
                              return (
                                <motion.button
                                  key={account.id}
                                  onClick={() => toggleAccountSelection(account.id)}
                                  whileTap={{ scale: 0.95 }}
                                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isSelected
                                    ? `bg-brand text-white ${styles.shadowIn}`
                                    : `${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-brand`
                                    }`}
                                  title={account.name}
                                >
                                  {getPlatformIcon(account.platform)}
                                  <span className="text-xs font-bold">{account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</span>
                                  {isDefault && !isSelected && (
                                    <span className="text-[10px] opacity-50">(default)</span>
                                  )}
                                  {isSelected && (
                                    <Check size={14} className="ml-1" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 2. Caption Section with Platform Tabs */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSub}`}>
                            Caption
                          </label>
                          <div className={`text-xs ${(currentCaption?.length || 0) > (PLATFORM_LIMITS[activeCaptionPlatform] || 5000)
                            ? 'text-red-500 font-bold'
                            : styles.textSub
                            }`}>
                            {currentCaption?.length || 0} / {PLATFORM_LIMITS[activeCaptionPlatform] || 5000}
                          </div>
                        </div>

                        {/* Platform Tabs (only if 2+ platforms selected) */}
                        {selectedAccounts.length > 1 && (
                          <div className={`relative flex gap-1 mb-3 p-1 rounded-xl ${styles.shadowIn}`}>
                            {Array.from(new Set(selectedAccounts.map(id =>
                              connectedAccounts.find(a => a.id === id)?.platform || 'general'
                            ))).map((platform: string) => (
                              <button
                                key={platform}
                                onClick={() => setActiveCaptionPlatform(platform)}
                                className={`relative flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors z-10 ${activeCaptionPlatform === platform ? 'text-brand' : styles.textSub
                                  }`}
                              >
                                {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                {activeCaptionPlatform === platform && (
                                  <motion.div
                                    layoutId="activeTabIndicator"
                                    className={`absolute inset-0 rounded-lg -z-10 ${styles.bg} ${styles.shadowOut}`}
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Caption Textarea */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeCaptionPlatform}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className={`relative rounded-2xl ${styles.shadowIn} overflow-hidden`}>
                              <textarea
                                value={currentCaption}
                                onChange={(e) => setCurrentCaption(e.target.value)}
                                placeholder={`Write your ${activeCaptionPlatform === 'general' ? '' : activeCaptionPlatform + ' '}caption...`}
                                className={`w-full p-4 bg-transparent outline-none text-sm ${styles.textMain} placeholder-gray-400 resize-none custom-scrollbar`}
                                rows={4}
                                style={{ minHeight: '100px' }}
                              />
                            </div>
                          </motion.div>
                        </AnimatePresence>

                        {/* Caption Footer Row */}
                        <div className="flex items-center justify-between mt-3">
                          {/* Left: First Comment Toggle */}
                          <motion.button
                            onClick={() => setFirstComment(!firstComment)}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 text-xs font-medium transition-colors ${firstComment ? 'text-brand' : styles.textSub
                              }`}
                          >
                            <motion.div
                              animate={{ scale: firstComment ? 1 : 0.9 }}
                              transition={{ type: 'spring', stiffness: 500 }}
                            >
                              {firstComment ? <CheckSquare size={16} /> : <Square size={16} />}
                            </motion.div>
                            Hashtags in first comment
                          </motion.button>

                          {/* Right: AI Suggest Button */}
                          <motion.button
                            onClick={async () => {
                              if (!business) return;
                              setIsGeneratingCaption(true);
                              try {
                                const response = await fetch('/api/social/generate-caption', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    assetPrompt: asset?.prompt,
                                    business: {
                                      name: business.name,
                                      industry: business.industry,
                                      voice: business.voice,
                                      targetAudience: business.adPreferences?.targetAudience,
                                    },
                                    platform: activeCaptionPlatform,
                                    hashtagMode: business.socialSettings?.hashtagMode || 'ai_plus_brand',
                                    brandHashtags: business.socialSettings?.brandHashtags || [],
                                  }),
                                });
                                const data = await response.json();
                                if (data.caption) {
                                  setCurrentCaption(data.caption);
                                }
                              } catch (e) {
                                console.error('Caption generation failed:', e);
                              }
                              setIsGeneratingCaption(false);
                            }}
                            disabled={isGeneratingCaption}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isGeneratingCaption
                              ? 'opacity-50 cursor-wait'
                              : `${styles.bg} ${styles.shadowOut} ${styles.textSub} hover:text-brand`
                              }`}
                          >
                            <Sparkles size={12} className={isGeneratingCaption ? 'animate-spin' : ''} />
                            {isGeneratingCaption ? 'Generating...' : 'AI Suggest'}
                          </motion.button>
                        </div>
                      </div>



                      {/* Brand Hashtags Preview */}
                      {business?.socialSettings?.brandHashtags && business.socialSettings.brandHashtags.length > 0 && (
                        <div className={`p-3 rounded-xl ${styles.shadowIn}`}>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${styles.textSub}`}>
                            Your Brand Hashtags ({business.socialSettings.hashtagMode || 'ai_plus_brand'})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {business.socialSettings.brandHashtags.map((tag) => (
                              <span key={tag} className="text-xs text-brand font-medium">
                                #{tag.replace(/^#/, '')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Carousel Images with Drag-to-Reorder */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSub}`}>
                            Carousel Images
                          </label>
                          <span className={`text-xs ${carouselImages.length + 1 >= 10 ? 'text-red-500 font-bold' : styles.textSub}`}>
                            {carouselImages.length + 1} / 10
                          </span>
                        </div>

                        <div className="flex gap-2 flex-wrap items-center">
                          {/* Main Image (always first, not draggable) */}
                          <motion.div
                            className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-brand"
                            whileHover={{ scale: 1.05 }}
                          >
                            <img
                              src={asset?.content}
                              alt="Main"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-brand text-white text-[10px] text-center py-0.5 font-bold">
                              Cover
                            </div>
                          </motion.div>

                          {/* Sortable Carousel Images */}
                          <DndContext
                            sensors={dndSensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event: DragEndEvent) => {
                              const { active, over } = event;
                              if (over && active.id !== over.id) {
                                setCarouselImages((items) => {
                                  const oldIndex = items.indexOf(active.id as string);
                                  const newIndex = items.indexOf(over.id as string);
                                  return arrayMove(items, oldIndex, newIndex);
                                });
                              }
                            }}
                          >
                            <SortableContext items={carouselImages} strategy={verticalListSortingStrategy}>
                              <div className="flex gap-2 flex-wrap">
                                <AnimatePresence>
                                  {carouselImages.map((url, idx) => (
                                    <motion.div
                                      key={url}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      className="relative w-16 h-16 rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing"
                                      whileHover={{ scale: 1.05 }}
                                      layout
                                    >
                                      <img
                                        src={url}
                                        alt={`Carousel ${idx + 2}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center py-0.5">
                                        {idx + 2}
                                      </div>
                                      <motion.button
                                        onClick={() => setCarouselImages(prev => prev.filter(u => u !== url))}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                      >
                                        <X size={10} />
                                      </motion.button>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            </SortableContext>
                          </DndContext>

                          {/* Add Image Button */}
                          {carouselImages.length < 9 && (
                            <motion.button
                              onClick={async () => {
                                if (business?.id) {
                                  const { data } = await supabase
                                    .from('assets')
                                    .select('*')
                                    .eq('business_id', business.id)
                                    .neq('id', asset?.id)
                                    .not('content', 'is', null)
                                    .order('created_at', { ascending: false })
                                    .limit(50);
                                  setAvailableAssets(data || []);
                                  setShowAssetPicker(true);
                                }
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-16 h-16 rounded-lg ${styles.shadowIn} flex items-center justify-center ${styles.textSub} hover:text-brand transition-colors`}
                            >
                              <Plus size={20} />
                            </motion.button>
                          )}
                        </div>

                        {carouselImages.length > 0 && (
                          <p className={`text-xs ${styles.textSub} mt-2`}>
                            <span className="text-brand">Tip:</span> Drag to reorder • Up to 10 images
                          </p>
                        )}

                        {/* Asset Picker Modal - Split View Portal */}
                        {showAssetPicker && ReactDOM.createPortal(
                          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                              onClick={() => setShowAssetPicker(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`relative w-full max-w-5xl h-[80vh] rounded-2xl ${styles.bg} ${styles.border} border shadow-2xl overflow-hidden flex flex-col`}
                            >
                              <div className="p-4 border-b border-gray-200/10 flex justify-between items-center">
                                <div>
                                  <h3 className={`text-lg font-bold ${styles.textMain}`}>Manage Carousel</h3>
                                  <p className={`text-xs ${styles.textSub}`}>Select up to 10 images for your post</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className={`text-xs font-bold ${carouselImages.length + 1 >= 10 ? 'text-red-500' : styles.textSub}`}>
                                    {carouselImages.length + 1} / 10 selected
                                  </div>
                                  <button onClick={() => setShowAssetPicker(false)} className={`px-4 py-2 bg-brand text-white font-bold rounded-lg hover:opacity-90 transition-opacity`}>
                                    Done
                                  </button>
                                </div>
                              </div>

                              <div className="flex-1 flex overflow-hidden">
                                {/* LEFT: Selected Images (Reorderable) */}
                                <div className="w-1/3 border-r border-gray-200/10 p-4 flex flex-col bg-black/10">
                                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${styles.textSub}`}>Selected Order</h4>
                                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                    {/* Main Asset (Formatted like the rest) */}
                                    <div className={`relative aspect-video rounded-xl overflow-hidden ring-2 ring-brand shadow-lg`}>
                                      <img src={asset?.content} alt="Main" className="w-full h-full object-cover" />
                                      <div className="absolute top-2 left-2 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10">
                                        Cover #1
                                      </div>
                                    </div>

                                    {/* Carousel Items */}
                                    {carouselImages.map((url, idx) => (
                                      <div key={url} className="group relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-brand/50 transition-all">
                                        <img src={url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
                                          #{idx + 2}
                                        </div>
                                        <button
                                          onClick={() => setCarouselImages(prev => prev.filter(u => u !== url))}
                                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ))}

                                    {carouselImages.length === 0 && (
                                      <div className={`p-4 rounded-xl border-2 border-dashed ${styles.border} text-center opacity-50`}>
                                        <p className={`text-xs ${styles.textSub}`}>No additional images</p>
                                        <p className={`text-[10px] ${styles.textSub} mt-1`}>Select from right →</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* RIGHT: Library */}
                                <div className="flex-1 p-4 bg-black/5 flex flex-col">
                                  <div className="flex justify-between items-center mb-3">
                                    <h4 className={`text-xs font-bold uppercase tracking-wider ${styles.textSub}`}>Your Library</h4>
                                  </div>
                                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                                      {availableAssets.map(a => {
                                        const isSelected = carouselImages.includes(a.content);
                                        const isMain = a.content === asset?.content;

                                        if (isMain) return null; // Don't show main asset in library

                                        return (
                                          <button
                                            key={a.id}
                                            onClick={() => {
                                              if (isSelected) {
                                                setCarouselImages(prev => prev.filter(u => u !== a.content));
                                              } else {
                                                if (carouselImages.length + 1 < 10) {
                                                  setCarouselImages(prev => [...prev, a.content]);
                                                }
                                              }
                                            }}
                                            className={`relative aspect-square rounded-xl overflow-hidden transition-all ${isSelected
                                              ? 'ring-4 ring-brand scale-95 opacity-50'
                                              : 'hover:scale-105 hover:shadow-xl'
                                              }`}
                                          >
                                            <img src={a.content} alt="" className="w-full h-full object-cover" />
                                            {isSelected && (
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                <Check size={32} className="text-white drop-shadow-lg" strokeWidth={3} />
                                              </div>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>,
                          document.body
                        )}
                      </div>


                      {/* Timing */}
                      <div>
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                          When
                        </label>
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => setIsPostingNow(true)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${isPostingNow ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                              }`}
                          >
                            Post Now
                          </button>
                          <button
                            onClick={() => setIsPostingNow(false)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${!isPostingNow ? 'bg-brand text-white' : `${styles.shadowOut} ${styles.textSub}`
                              }`}
                          >
                            <Clock size={12} /> Schedule
                          </button>
                        </div>
                        {!isPostingNow && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className={`px-3 py-2 rounded-xl text-sm ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                              />
                              <input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className={`px-3 py-2 rounded-xl text-sm ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                              />
                            </div>

                            {/* Recurring Options */}
                            <div className="mt-3">
                              <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                                Repeat
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {(['none', 'daily', 'weekly', 'monthly', 'custom'] as const).map((mode) => (
                                  <button
                                    key={mode}
                                    onClick={() => setRepeatMode(mode)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${repeatMode === mode
                                      ? 'bg-brand text-white'
                                      : `${styles.shadowOut} ${styles.textSub} hover:text-brand`
                                      }`}
                                  >
                                    {mode === 'none' ? 'Once' : mode}
                                  </button>
                                ))}
                              </div>

                              {/* Custom interval input */}
                              {repeatMode === 'custom' && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className={`text-xs ${styles.textSub}`}>Every</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={repeatInterval}
                                    onChange={(e) => setRepeatInterval(Math.max(1, parseInt(e.target.value) || 1))}
                                    className={`w-16 px-2 py-1 rounded-lg text-sm text-center ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                                  />
                                  <span className={`text-xs ${styles.textSub}`}>days</span>
                                </div>
                              )}

                              {/* End date for recurring */}
                              {repeatMode !== 'none' && (
                                <div className="mt-2">
                                  <label className={`text-xs ${styles.textSub}`}>Until:</label>
                                  <input
                                    type="date"
                                    value={repeatEndDate}
                                    onChange={(e) => setRepeatEndDate(e.target.value)}
                                    className={`ml-2 px-2 py-1 rounded-lg text-sm ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                                  />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Result Message */}
                      {scheduleResult && (
                        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${scheduleResult.success
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                          }`}>
                          {scheduleResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                          {scheduleResult.success ? 'Post scheduled successfully!' : scheduleResult.error}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="mt-auto pt-4">
                        <NeuButton
                          className="w-full py-4"
                          variant="primary"
                          onClick={handleSchedulePost}
                          disabled={isScheduling || selectedAccounts.length === 0}
                        >
                          {isScheduling ? 'Scheduling...' : isPostingNow ? 'Post Now' : 'Schedule Post'}
                        </NeuButton>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {/* Footer Actions (Only visible on Details tab) - Inside Scrollable Area */}
                {activeTab === 'details' && (
                  <div className={`border-t border-white/5 mt-6`}>
                    {/* Primary Actions Row */}
                    <div className="p-4 flex gap-3">
                      <NeuButton className="flex-1 py-3" onClick={handleDownload}>
                        <Download size={16} /> Quick Download
                      </NeuButton>
                      <NeuButton
                        className="flex-1 py-3"
                        variant={showExportPanel ? 'primary' : undefined}
                        onClick={() => setShowExportPanel(!showExportPanel)}
                      >
                        <FileOutput size={16} /> Export...
                      </NeuButton>
                      <NeuButton
                        className="py-3 px-4"
                        variant={showShareModal ? 'primary' : undefined}
                        onClick={() => setShowShareModal(true)}
                        title="Share to Printer"
                      >
                        <Share2 size={16} />
                      </NeuButton>
                    </div>

                    {/* Export Panel (Slides Down) */}
                    <AnimatePresence>
                      {showExportPanel && (
                        <ExportPanel
                          imageUrl={asset.content}
                          onClose={() => setShowExportPanel(false)}
                          businessName={business?.name}
                          savedPresets={business?.exportPresets || []}
                          onSavePreset={handleSaveExportPreset}
                          onDeletePreset={handleDeleteExportPreset}
                        />
                      )}
                    </AnimatePresence>

                    {/* Reuse Everything - Primary CTA (Hidden when Export Panel open) */}
                    <AnimatePresence>
                      {!showExportPanel && onReuse && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-3 overflow-hidden"
                        >
                          <button
                            onClick={() => onReuse(asset, 'all')}
                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-brand to-purple-500 text-white shadow-lg shadow-brand/30 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2`}
                          >
                            <Sparkles size={16} /> Reuse Everything
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Secondary Actions (Hidden when Export Panel open) */}
                    <AnimatePresence>
                      {!showExportPanel && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 flex justify-center gap-2 overflow-hidden"
                        >
                          <button
                            onClick={() => navigator.clipboard.writeText(asset.prompt)}
                            title="Copy Prompt"
                            className={`p-2.5 rounded-xl transition-all ${styles.shadowOut} ${styles.textSub} hover:${styles.textMain} hover:scale-105 active:scale-95`}
                          >
                            <Copy size={16} />
                          </button>
                          {onReuse && (
                            <button
                              onClick={() => onReuse(asset, 'prompt_only')}
                              title="Reuse Prompt Only"
                              className={`p-2.5 rounded-xl transition-all ${styles.shadowOut} ${styles.textSub} hover:${styles.textMain} hover:scale-105 active:scale-95`}
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => {
                                if (confirm('Delete this asset permanently?')) {
                                  onDelete(asset.id);
                                  onClose();
                                }
                              }}
                              title="Delete Asset"
                              className={`p-2.5 rounded-xl transition-all ${styles.shadowOut} ${styles.textSub} hover:text-red-500 hover:scale-105 active:scale-95`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

              </div> {/* End Scrollable Info Body */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      {mainContent}
      {/* Share Modal (separate portal) */}
      {showShareModal && asset && business && (
        <ShareModal
          assetId={asset.id}
          businessId={business.id}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};