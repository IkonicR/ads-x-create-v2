import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, Business } from '../types';
import { useThemeStyles, NeuButton, NeuInput } from './NeuComponents';
import { GalaxyCanvas } from './GalaxyCanvas';
import { X, Download, Trash2, Copy, Share2, Maximize2, ZoomIn, Search, MessageCircle, History, Send, Calendar, Instagram, Facebook, Linkedin, Sparkles, Clock, Check, AlertCircle } from 'lucide-react';
import { downloadImage } from '../utils/download';
import { SocialService, ConnectedAccount, SchedulePostPayload } from '../services/socialService';

interface AssetViewerProps {
  asset: Asset | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onRefine?: (instruction: string) => void;
  onReuse?: (asset: Asset, mode: 'prompt_only' | 'all') => void;
  business?: Business; // For social config
}

export const AssetViewer: React.FC<AssetViewerProps> = ({ asset, onClose, onDelete, onRefine, onReuse, business }) => {
  const { styles, theme } = useThemeStyles();
  const isDark = theme === 'dark';

  // Tabs State
  const [activeTab, setActiveTab] = useState<'details' | 'refine' | 'social'>('details');

  // Social Tab State
  const [caption, setCaption] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPostingNow, setIsPostingNow] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

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

  // Load connected accounts when Social tab is activated
  useEffect(() => {
    if (activeTab === 'social' && hasSocialConfig && connectedAccounts.length === 0) {
      loadConnectedAccounts();
    }
  }, [activeTab]);

  const loadConnectedAccounts = async () => {
    if (!business?.socialConfig?.ghlLocationId) return;
    setIsLoadingAccounts(true);
    try {
      const response = await fetch(`/api/social/accounts?locationId=${business.socialConfig.ghlLocationId}`);
      const data = await response.json();
      setConnectedAccounts(data.accounts || []);
    } catch (e) {
      console.error('Failed to load accounts:', e);
    }
    setIsLoadingAccounts(false);
  };

  const handleDownload = () => {
    if (asset) {
      downloadImage(asset.content, `ad-asset-${asset.id}.png`);
    }
  };

  const handleSendRefinement = () => {
    if (!refineInput.trim() || !onRefine) return;
    onRefine(refineInput);
    setRefineInput('');
    // Ideally, we might want to show a toast or close the modal, or switch the UI state.
    // For now, let's trust the parent to react (e.g. by creating a new generating asset).
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
      const payload: any = {
        locationId: business.socialConfig.ghlLocationId,
        accountIds: selectedAccounts,
        caption: caption,
        mediaUrls: [asset.content],
      };

      if (!isPostingNow && scheduleDate && scheduleTime) {
        payload.scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setScheduleResult(result);
    } catch (e: any) {
      setScheduleResult({ error: e.message || 'Failed to schedule post' });
    }

    setIsScheduling(false);
  };

  if (!asset) return null;

  return ReactDOM.createPortal(
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
                      className="h-full flex flex-col space-y-4"
                    >
                      {/* Caption */}
                      <div>
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                          Caption
                        </label>
                        <div className={`relative rounded-2xl ${styles.shadowIn} overflow-hidden`}>
                          <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write your post caption..."
                            className={`w-full pl-4 pr-4 py-3 bg-transparent outline-none text-sm ${styles.textMain} placeholder-gray-400 resize-none`}
                            rows={3}
                          />
                        </div>
                        <button
                          onClick={() => setIsGeneratingCaption(true)}
                          disabled={isGeneratingCaption}
                          className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${styles.textSub} hover:text-brand transition-colors`}
                        >
                          <Sparkles size={12} /> AI Suggest (Coming Soon)
                        </button>
                      </div>

                      {/* Connected Accounts */}
                      <div>
                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                          Post To
                        </label>
                        {isLoadingAccounts ? (
                          <div className={`p-4 rounded-2xl ${styles.shadowIn} text-center ${styles.textSub} text-sm`}>
                            Loading accounts...
                          </div>
                        ) : connectedAccounts.length === 0 ? (
                          <div className={`p-4 rounded-2xl ${styles.shadowIn} text-center`}>
                            <p className={`text-sm ${styles.textSub}`}>No accounts connected yet</p>
                            <p className={`text-xs ${styles.textSub} mt-1 opacity-60`}>
                              Connect accounts in Settings → Connected Accounts
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {connectedAccounts.map((account) => (
                              <button
                                key={account.id}
                                onClick={() => toggleAccountSelection(account.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedAccounts.includes(account.id)
                                  ? 'bg-brand/10 border-2 border-brand'
                                  : `${styles.shadowIn} border-2 border-transparent`
                                  }`}
                              >
                                <div className={`p-2 rounded-full ${styles.bg} ${styles.shadowOut}`}>
                                  {getPlatformIcon(account.platform)}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className={`text-sm font-bold ${styles.textMain}`}>{account.name}</p>
                                  <p className={`text-xs ${styles.textSub} capitalize`}>{account.platform}</p>
                                </div>
                                {selectedAccounts.includes(account.id) && (
                                  <Check size={18} className="text-brand" />
                                )}
                              </button>
                            ))}
                          </div>
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

              </div>

              {/* Footer Actions (Only visible on Details tab mostly, but good to have access) */}
              {activeTab === 'details' && (
                <div className={`p-6 pt-4 border-t border-white/5 flex flex-col gap-3`}>
                  <NeuButton className="w-full py-4" variant="primary" onClick={handleDownload}>
                    <Download size={18} /> Download Asset
                  </NeuButton>

                  <div className="flex gap-3">
                    <NeuButton className="flex-1 py-3 text-xs" onClick={() => navigator.clipboard.writeText(asset.prompt)}>
                      <Copy size={16} /> Copy Prompt
                    </NeuButton>
                    {onDelete && (
                      <NeuButton
                        className="flex-1 py-3 text-xs hover:text-red-500 hover:shadow-neu-in-light dark:hover:shadow-neu-in-dark"
                        onClick={() => {
                          if (confirm('Delete this asset permanently?')) {
                            onDelete(asset.id);
                            onClose();
                          }
                        }}
                      >
                        <Trash2 size={16} /> Delete
                      </NeuButton>
                    )}
                  </div>

                  {/* Reuse Actions */}
                  {onReuse && (
                    <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => onReuse(asset, 'prompt_only')}
                        className={`py-3 rounded-xl text-xs font-bold transition-all ${styles.bg} ${styles.shadowOut} ${styles.textMain} hover:text-brand active:scale-95`}
                      >
                        Reuse Prompt
                      </button>
                      <button
                        onClick={() => onReuse(asset, 'all')}
                        className={`py-3 rounded-xl text-xs font-bold transition-all bg-brand text-white shadow-lg shadow-brand/30 hover:scale-[1.02] active:scale-95`}
                      >
                        Reuse Everything
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};