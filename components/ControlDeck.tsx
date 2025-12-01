import React, { useState, useRef } from 'react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { useThemeStyles } from './NeuComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, LayoutTemplate, Palette, X, Crop, User, Smartphone, Monitor, Square, Box, RectangleVertical, RectangleHorizontal, Zap, Diamond, Plus, Camera, Sun, Edit2 } from 'lucide-react';
import { StylePreset, ViewState } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { supabase } from '../services/supabase';

// Helper to format technical strings
const formatValue = (val: string) => {
  if (!val) return 'Standard';
  return val.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

interface ControlDeckProps {
  onGenerate: (prompt: string, styleId: string, ratio: string, subjectId: string, modelTier: 'flash' | 'pro' | 'ultra') => void;
  styles: StylePreset[];
  subjects: { id: string; name: string; type: 'product' | 'person'; imageUrl?: string; price?: string; description?: string; preserveLikeness?: boolean }[];
  activeCount?: number; // NEW: For concurrent generation tracking
}

const RATIOS = [
  { id: '1:1', label: 'Square', icon: Square, description: 'Instagram Feed, Carousel' },
  { id: '9:16', label: 'Story/Reel', icon: Smartphone, description: 'TikTok, Reels, Stories' },
  { id: '16:9', label: 'HD Wide', icon: Monitor, description: 'YouTube, Website Hero' },
  { id: '4:5', label: 'IG Feed', icon: RectangleVertical, description: 'Optimized Portrait' },
  { id: '2:3', label: 'Classic Port.', icon: RectangleVertical, description: 'Pinterest, Blog' },
  { id: '3:2', label: 'Classic Land.', icon: RectangleHorizontal, description: 'Blog, Article' },
  { id: '3:4', label: 'Editorial', icon: RectangleVertical, description: 'iPad, Magazine' },
  { id: '4:3', label: 'Broadcast', icon: RectangleHorizontal, description: 'TV, Presentation' },
  { id: '5:4', label: 'Gallery', icon: RectangleHorizontal, description: 'Art, Portfolio' },
  { id: '21:9', label: 'Cinematic', icon: Monitor, description: 'Ultrawide, Movie' },
];

const MODELS = [
  { id: 'pro', name: 'Gemini Pro', credits: '40 Cr', description: 'High Fidelity. Best for social assets.', icon: Diamond },
  { id: 'ultra', name: 'Ultra 4K', credits: '80 Cr', description: 'Max Resolution. Print ready.', icon: Sparkles },
];

export const ControlDeck: React.FC<ControlDeckProps> = ({
  onGenerate,
  styles: aestheticStyles,
  subjects,
  activeCount = 0
}) => {
  const { styles: themeStyles, theme } = useThemeStyles();
  const { navigate } = useNavigation();
  const isDark = theme === 'dark';

  // --- Persistence Logic ---
  const loadSetting = (key: string, fallback: string) => localStorage.getItem(`gen_${key}`) || fallback;

  const [prompt, setPrompt] = useState(() => loadSetting('prompt', ''));
  const [selectedStyle, setSelectedStyle] = useState(() => loadSetting('style', aestheticStyles[0]?.id || ''));
  const [selectedRatio, setSelectedRatio] = useState(() => loadSetting('ratio', '1:1'));
  const [selectedSubject, setSelectedSubject] = useState(() => loadSetting('subject', ''));
  const [modelTier, setModelTier] = useState<'pro' | 'ultra'>(() => loadSetting('tier', 'pro') as any);

  // Save settings on change
  React.useEffect(() => {
    localStorage.setItem('gen_prompt', prompt);
    localStorage.setItem('gen_style', selectedStyle);
    localStorage.setItem('gen_ratio', selectedRatio);
    localStorage.setItem('gen_subject', selectedSubject);
    localStorage.setItem('gen_subject', selectedSubject);
    localStorage.setItem('gen_tier', modelTier);
  }, [prompt, selectedStyle, selectedRatio, selectedSubject, modelTier]);

  const [activeMenu, setActiveMenu] = useState<'style' | 'ratio' | 'subject' | 'model' | null>(null);

  // Determine layout mode
  const isComplexMenu = activeMenu === 'style' || activeMenu === 'subject';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt, selectedStyle, selectedRatio, selectedSubject, modelTier);
  };

  const activeStyleName = aestheticStyles.find(s => s.id === selectedStyle)?.name || 'Style';
  const activeRatioLabel = RATIOS.find(r => r.id === selectedRatio)?.label || 'Ratio';
  const activeSubject = subjects.find(s => s.id === selectedSubject);
  const activeSubjectLabel = activeSubject ? activeSubject.name : 'Subject';

  // Neumorphic Tokens
  const slabBg = themeStyles.bg;
  // FIXED: Restored neumorphic shadow as requested
  const slabShadowClass = isDark ? 'shadow-neu-out-dark' : 'shadow-neu-out-light';
  const insetShadowClass = isDark ? 'shadow-neu-in-dark' : 'shadow-neu-in-light';
  const btnShadowClass = isDark ? 'shadow-neu-out-dark' : 'shadow-neu-out-light';
  const btnActiveShadowClass = isDark ? 'active:shadow-neu-in-dark' : 'active:shadow-neu-in-light';

  const getTierIcon = () => {
    if (modelTier === 'pro') return <Diamond size={14} />;
    return <Sparkles size={14} />;
  };

  const getTierLabel = () => {
    const m = MODELS.find(m => m.id === modelTier);
    return m ? m.name : 'Model';
  };

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setActiveMenu(null));

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl`}>

      {/* The Slab */}
      <div className={`rounded-[2rem] p-3 ${slabBg} ${slabShadowClass} relative flex flex-col gap-3`}>

        {/* Popover Menus */}
        <AnimatePresence>
          {activeMenu && (
            <>
              <motion.div
                ref={menuRef}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`
                  absolute bottom-full mb-4 left-1/2 -translate-x-1/2 
                  overflow-hidden rounded-3xl ${slabBg} ${slabShadowClass} border border-white/5 flex 
                  ${isComplexMenu ? 'w-[90vw] max-w-6xl h-[70vh] flex-col md:flex-row' : 'w-full max-w-xl max-h-[50vh] flex-col'}
                `}
              >
                {/* LEFT SIDE (Grid) */}
                <div className={`flex-1 flex flex-col h-full relative ${isComplexMenu ? 'w-full md:w-1/2 lg:w-7/12 border-r border-white/5' : 'w-full'}`}>
                  <div className={`p-4 border-b border-gray-100 dark:border-white/5 shrink-0 flex justify-between items-center ${isComplexMenu ? 'md:border-b-0' : ''}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSub}`}>
                      Select {activeMenu ? activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1) : ''}
                    </h4>
                    <button onClick={() => setActiveMenu(null)} className={`${isComplexMenu ? 'md:hidden' : ''} text-gray-400 hover:text-gray-600`}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {/* Complex Grids (Style / Subject) */}
                    {(activeMenu === 'style' || activeMenu === 'subject') && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {/* Add New Subject Button */}
                        {activeMenu === 'subject' && (
                          <button
                            onClick={() => navigate(ViewState.OFFERINGS)}
                            className={`group p-3 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-brand/50 text-gray-400 hover:text-brand h-full min-h-[140px]`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                              <Plus size={20} />
                            </div>
                            <span className="text-xs font-bold">Add New Offering</span>
                          </button>
                        )}

                        {/* "None" / Clear Selection Card */}
                        <button
                          onClick={() => {
                            if (activeMenu === 'style') setSelectedStyle('');
                            if (activeMenu === 'subject') setSelectedSubject('');
                          }}
                          className={`group p-3 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-red-400/50 text-gray-400 hover:text-red-400 h-full min-h-[140px]`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-red-400/10 transition-colors">
                            <X size={20} />
                          </div>
                          <span className="text-xs font-bold">None</span>
                        </button>

                        {/* Map Items */}
                        {(() => {
                          let items: any[] = [];
                          if (activeMenu === 'style') items = aestheticStyles;
                          if (activeMenu === 'subject') items = subjects;

                          return items.map((item) => (
                            <button
                              key={item.id}
                              onMouseEnter={() => setHoveredItemId(item.id)}
                              onMouseLeave={() => setHoveredItemId(null)}
                              onClick={() => {
                                if (activeMenu === 'style') setSelectedStyle(prev => prev === item.id ? '' : item.id);
                                if (activeMenu === 'subject') setSelectedSubject(prev => prev === item.id ? '' : item.id);
                              }}
                              className={`group p-3 rounded-2xl text-center transition-all flex flex-col items-center gap-3 ${(activeMenu === 'style' ? selectedStyle : selectedSubject) === item.id
                                ? `${insetShadowClass} text-brand`
                                : `${btnShadowClass} hover:translate-y-[-1px]`
                                }`}
                            >
                              <div className="w-full aspect-square rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                    {activeMenu === 'style' ? <Palette size={32} /> : <Box size={32} />}
                                  </div>
                                )}
                              </div>
                              <span className={`text-xs font-bold truncate w-full ${(activeMenu === 'style' ? selectedStyle : selectedSubject) === item.id ? 'text-brand' : themeStyles.textMain
                                }`}>
                                {item.name}
                              </span>
                            </button>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Simple Ratio Grid */}
                    {activeMenu === 'ratio' && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {RATIOS.map(r => (
                          <button
                            key={r.id}
                            onClick={() => { setSelectedRatio(r.id); setActiveMenu(null); }}
                            className={`p-3 rounded-2xl text-center transition-all flex flex-col items-center gap-2 ${selectedRatio === r.id
                              ? `${insetShadowClass} text-brand`
                              : `${btnShadowClass} ${themeStyles.textMain} hover:translate-y-[-1px]`
                              }`}
                          >
                            <r.icon size={24} />
                            <span className="text-xs font-bold leading-tight">{r.label}</span>
                            <span className="text-[9px] opacity-50 font-mono">{r.id}</span>
                            <span className={`text-[9px] leading-tight opacity-70 mt-1 ${selectedRatio === r.id ? 'text-brand' : themeStyles.textSub}`}>
                              {r.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Simple Model List */}
                    {activeMenu === 'model' && (
                      <div className="flex flex-col gap-3">
                        {MODELS.map(model => (
                          <button
                            key={model.id}
                            onClick={() => { setModelTier(model.id as any); setActiveMenu(null); }}
                            className={`p-4 rounded-2xl text-left flex items-center gap-4 transition-all group ${modelTier === model.id
                              ? `${insetShadowClass} border-l-4 border-brand`
                              : `${btnShadowClass} hover:translate-y-[-1px]`
                              }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modelTier === model.id ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                              <model.icon size={20} fill="currentColor" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className={`text-sm font-bold ${themeStyles.textMain}`}>{model.name}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${themeStyles.bg} ${themeStyles.shadowIn} opacity-70 flex items-center gap-1`}>
                                  {model.id === 'pro' ? '40' : '80'} <Sparkles size={10} fill="currentColor" className="text-brand" />
                                </span>
                              </div>
                              <span className={`text-xs ${themeStyles.textSub} block mt-1`}>{model.description}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}


                  </div>
                </div>

                {/* RIGHT SIDE: The Inspector (Desktop Only, Complex Menus Only) */}
                {isComplexMenu && (
                  <div className="hidden md:flex w-[350px] shrink-0 flex-col p-6 pl-0">
                    <div className="flex justify-end">
                      <button onClick={() => setActiveMenu(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    {(() => {
                      const isStyle = activeMenu === 'style';
                      const isSubject = activeMenu === 'subject';

                      let item: any = null;
                      if (isStyle) item = aestheticStyles.find(s => s.id === selectedStyle);
                      if (isSubject) item = subjects.find(s => s.id === selectedSubject);

                      if (!item || (!isStyle && !isSubject)) return (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                          <Sparkles size={48} className="mb-4 text-gray-400" />
                          <p className={`text-sm font-bold ${themeStyles.textMain}`}>Select an option</p>
                          <p className={`text-xs ${themeStyles.textSub}`}>to view details</p>
                        </div>
                      );

                      return (
                        <div className="flex-1 flex flex-col h-full animate-fade-in pl-6">

                          {/* Scrollable Content Area */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-4">
                            <div className={`w-full aspect-video rounded-2xl overflow-hidden mb-6 shadow-lg ${themeStyles.border} border shrink-0`}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                  {isStyle ? <Palette size={48} className="opacity-20" /> : <Box size={48} className="opacity-20" />}
                                </div>
                              )}
                            </div>

                            <h3 className={`text-2xl font-extrabold mb-2 ${themeStyles.textMain}`}>{item.name}</h3>

                            {isSubject && (
                              <div className="flex items-center gap-3 mb-2">
                                {item.price && (
                                  <span className={`text-lg font-bold text-brand`}>{item.price}</span>
                                )}
                                <button
                                  onClick={() => {
                                    localStorage.setItem('pending_edit_id', item.id);
                                    navigate(ViewState.OFFERINGS);
                                  }}
                                  className={`flex items-center gap-1 text-xs font-bold ${themeStyles.textSub} hover:text-brand transition-colors`}
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                              </div>
                            )}

                            <p className={`text-sm leading-relaxed mb-6 ${themeStyles.textSub}`}>
                              {item.description || (isSubject ? "No description provided." : "")}
                            </p>

                            {/* Inspector Panel Content */}
                            <div className="space-y-4 h-full overflow-y-auto pr-1 custom-scrollbar">
                              {/* Preset Config REMOVED */}

                              {/* Style Config */}
                              {isStyle && (
                                <>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-1">Logo Material</span>
                                    <div className={`p-2 rounded-lg text-xs font-medium ${themeStyles.bg} ${themeStyles.textMain}`}>
                                      {item.logoMaterial || 'Standard Overlay'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-1">Prompt Modifier</span>
                                    <div className={`p-2 rounded-lg text-xs font-mono ${themeStyles.bg} ${themeStyles.textMain} max-h-[150px] overflow-y-auto custom-scrollbar`}>
                                      {item.promptModifier}
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Subject Config */}
                              {isSubject && (
                                <div className="flex flex-col gap-2">
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-1">Category</span>
                                    <div className={`p-2 rounded-lg text-xs font-medium ${themeStyles.bg} ${themeStyles.textMain}`}>
                                      {formatValue(item.type)}
                                    </div>
                                  </div>
                                  {item.preserveLikeness && (
                                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                      Strict Visual Adherence
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sticky Footer Action */}
                          <div className="mt-auto pt-4 pb-2 shrink-0 border-t border-gray-100 dark:border-white/5">
                            <button
                              onClick={() => setActiveMenu(null)}
                              className="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm shadow-lg shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              {isSubject ? 'Confirm Product' : 'Confirm Selection'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Top Controls Grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 px-1">

          {/* Subject */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'subject' ? null : 'subject')}
            className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${activeMenu === 'subject' || selectedSubject
              ? `${insetShadowClass} text-brand`
              : `${btnShadowClass} ${themeStyles.textMain} ${btnActiveShadowClass}`
              }`}
          >
            {selectedSubject ? (
              subjects.find(s => s.id === selectedSubject)?.type === 'person' ? <User size={14} /> : <Box size={14} />
            ) : <Sparkles size={14} />}
            <span className="truncate hidden sm:inline">{activeSubjectLabel}</span>
          </button>

          {/* Preset - HIDDEN FOR SIMPLIFIED PIPELINE */}
          {/* <button
            onClick={() => setActiveMenu(activeMenu === 'preset' ? null : 'preset')}
            className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${activeMenu === 'preset'
              ? `${insetShadowClass} text-brand`
              : `${btnShadowClass} ${themeStyles.textMain} ${btnActiveShadowClass}`
              }`}
          >
            <LayoutTemplate size={14} />
            <span className="truncate hidden sm:inline">{activePresetName}</span>
          </button> */}

          {/* Style */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'style' ? null : 'style')}
            className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${activeMenu === 'style'
              ? `${insetShadowClass} text-brand`
              : `${btnShadowClass} ${themeStyles.textMain} ${btnActiveShadowClass}`
              }`}
          >
            <Palette size={14} />
            <span className="truncate hidden sm:inline">{activeStyleName}</span>
          </button>

          {/* Ratio */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'ratio' ? null : 'ratio')}
            className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${activeMenu === 'ratio'
              ? `${insetShadowClass} text-brand`
              : `${btnShadowClass} ${themeStyles.textMain} ${btnActiveShadowClass}`
              }`}
          >
            <Crop size={14} />
            <span className="truncate hidden sm:inline">{activeRatioLabel}</span>
          </button>

          {/* NEW: Model Tier Selector */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'model' ? null : 'model')}
            className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${activeMenu === 'model'
              ? `${insetShadowClass} text-brand`
              : `${btnShadowClass} ${themeStyles.textMain} ${btnActiveShadowClass}`
              }`}
          >
            {getTierIcon()}
            <span className="truncate hidden sm:inline">{getTierLabel()}</span>
          </button>

          {/* NEW: Model Tier Selector */}


        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
          <div className={`flex-1 relative rounded-2xl ${insetShadowClass} overflow-hidden`}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectedSubject ? `Describe the scene for ${activeSubjectLabel}...` : "Describe your vision..."}
              className={`w-full pl-5 pr-4 py-4 bg-transparent outline-none text-base font-medium ${themeStyles.textMain} placeholder-gray-400`}
              autoFocus
            />
          </div>

          <div className="relative">
            {/* Techy Glowing Border (Only when active) */}
            <AnimatePresence>
              {activeCount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -inset-[3px] rounded-2xl overflow-hidden z-0"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,#3b82f6_180deg,transparent_360deg)] opacity-80 blur-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!prompt.trim()}
              className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all text-white overflow-hidden ${!prompt.trim()
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : modelTier === 'ultra'
                  ? 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95'
                  : 'bg-[#1a1a1a] border border-white/10 shadow-lg active:scale-95'
                }`}
            >
              <AnimatePresence mode="wait">
                {activeCount > 0 ? (
                  <motion.div
                    key="count"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex flex-col items-center justify-center relative"
                  >
                    {/* HUD Ring */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-[-8px] border border-blue-400/30 rounded-full border-t-transparent border-l-transparent"
                    />
                    <span className="text-[9px] font-bold leading-none text-blue-400 mb-0.5">GEN</span>
                    <span className="text-sm font-bold leading-none text-white">{activeCount}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Send size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};