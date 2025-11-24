import React, { useState } from 'react';
import { useThemeStyles } from './NeuComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, LayoutTemplate, Palette, X, Crop, User, Smartphone, Monitor, Square, Box, RectangleVertical, RectangleHorizontal, Zap, Diamond } from 'lucide-react';
import { StylePreset, Preset } from '../types';

interface ControlDeckProps {
  onGenerate: (prompt: string, presetId: string, styleId: string, ratio: string, subjectId: string, modelTier: 'flash' | 'pro' | 'ultra') => void;
  presets: Preset[];
  styles: StylePreset[];
  subjects: { id: string; name: string; type: 'product' | 'person'; imageUrl?: string; price?: string; description?: string; preserveLikeness?: boolean }[];
  loading: boolean;
}

const RATIOS = [
  { id: '1:1', label: 'Square', icon: Square },
  { id: '9:16', label: 'Story/Reel', icon: Smartphone },
  { id: '16:9', label: 'HD Wide', icon: Monitor },
  { id: '4:5', label: 'IG Feed', icon: RectangleVertical },
  { id: '2:3', label: 'Classic Port.', icon: RectangleVertical },
  { id: '3:2', label: 'Classic Land.', icon: RectangleHorizontal },
  { id: '3:4', label: 'Editorial', icon: RectangleVertical },
  { id: '4:3', label: 'Broadcast', icon: RectangleHorizontal },
  { id: '5:4', label: 'Gallery', icon: RectangleHorizontal },
  { id: '21:9', label: 'Cinematic', icon: Monitor },
];

export const ControlDeck: React.FC<ControlDeckProps> = ({ 
  onGenerate, 
  presets, 
  styles: aestheticStyles,
  subjects,
  loading 
}) => {
  const { styles: themeStyles, theme } = useThemeStyles();
  const isDark = theme === 'dark';
  
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(presets[0]?.id || '');
  const [selectedStyle, setSelectedStyle] = useState(aestheticStyles[0]?.id || '');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [modelTier, setModelTier] = useState<'flash' | 'pro' | 'ultra'>('flash'); 
  
  const [activeMenu, setActiveMenu] = useState<'preset' | 'style' | 'ratio' | 'subject' | 'model' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt, selectedPreset, selectedStyle, selectedRatio, selectedSubject, modelTier);
  };

  const activePresetName = presets.find(p => p.id === selectedPreset)?.name || 'Format';
  const activeStyleName = aestheticStyles.find(s => s.id === selectedStyle)?.name || 'Style';
  const activeRatioLabel = RATIOS.find(r => r.id === selectedRatio)?.label || 'Ratio';
  const activeSubject = subjects.find(s => s.id === selectedSubject);
  const activeSubjectLabel = activeSubject ? activeSubject.name : 'Subject';

  // Neumorphic Tokens
  const slabBg = themeStyles.bg;
  const slabShadowClass = isDark ? 'shadow-neu-out-dark' : 'shadow-neu-out-light';
  const insetShadowClass = isDark ? 'shadow-neu-in-dark' : 'shadow-neu-in-light';
  const btnShadowClass = isDark ? 'shadow-neu-out-dark' : 'shadow-neu-out-light';
  const btnActiveShadowClass = isDark ? 'active:shadow-neu-in-dark' : 'active:shadow-neu-in-light';

  const getTierIcon = () => {
    if (modelTier === 'flash') return <Zap size={14} />;
    if (modelTier === 'pro') return <Diamond size={14} />;
    return <Sparkles size={14} />;
  };

  const getTierLabel = () => {
    if (modelTier === 'flash') return 'Flash';
    if (modelTier === 'pro') return 'Pro';
    return 'Ultra';
  };

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl`}>
      
      {/* The Slab */}
      <div className={`rounded-[2rem] p-3 ${slabBg} ${slabShadowClass} relative flex flex-col gap-3 border border-white/5`}>
        
        {/* Popover Menus */}
        <AnimatePresence>
          {activeMenu && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setActiveMenu(null)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute bottom-full mb-4 left-0 w-full max-h-[60vh] sm:max-h-[50vh] overflow-hidden rounded-3xl ${slabBg} ${slabShadowClass} border border-white/5 flex flex-col`}
              >
                {/* Header (Dynamic Info Bar) */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-white/5 shrink-0 min-h-[60px]">
                  {(() => {
                     // Determine Active Item Context
                     const isPreset = activeMenu === 'preset';
                     const isStyle = activeMenu === 'style';
                     
                     const activeItem = isPreset 
                        ? presets.find(p => p.id === selectedPreset)
                        : isStyle 
                          ? aestheticStyles.find(s => s.id === selectedStyle)
                          : null;

                     if ((isPreset || isStyle) && activeItem) {
                        return (
                          <div className="flex flex-col animate-fade-in">
                             <div className="flex items-center gap-2">
                               <h4 className={`text-sm font-bold uppercase tracking-wider ${themeStyles.textMain}`}>
                                 {activeItem.name}
                               </h4>
                               <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${isPreset ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                  {isPreset ? 'Layout' : 'Style'}
                               </span>
                             </div>
                             <p className={`text-[10px] ${themeStyles.textSub} truncate max-w-[250px]`}>
                               {activeItem.description}
                             </p>
                          </div>
                        );
                     }

                     // Default Title
                     return (
                        <h4 className={`text-sm font-bold uppercase tracking-wider ${themeStyles.textSub}`}>
                          Select {activeMenu ? activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1) : ''}
                        </h4>
                     );
                  })()}
                  
                  <button onClick={() => setActiveMenu(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar p-4 pb-24 sm:pb-4">
                   {activeMenu === 'preset' && (
                     <div className="grid grid-cols-2 gap-3">
                       {presets.map(p => (
                         <button
                           key={p.id}
                           onClick={() => { setSelectedPreset(p.id); }}
                           className={`p-3 rounded-2xl text-center transition-all flex flex-col items-center gap-3 ${
                             selectedPreset === p.id 
                               ? `${insetShadowClass} text-brand` 
                               : `${btnShadowClass} hover:translate-y-[-1px]`
                           }`}
                         >
                            <div className="w-full aspect-square rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                  <LayoutTemplate size={32} />
                                </div>
                              )}
                              {/* Removed Overlay Divs - Relying on Inset Shadow Container */}
                            </div>
                           <div className="text-center w-full">
                             <span className={`text-xs font-bold block truncate ${selectedPreset === p.id ? 'text-brand' : themeStyles.textMain}`}>
                               {p.name}
                             </span>
                           </div>
                         </button>
                       ))}
                     </div>
                   )}

                   {activeMenu === 'style' && (
                     <div className="grid grid-cols-2 gap-3">
                       {aestheticStyles.map(s => (
                         <button
                           key={s.id}
                           onClick={() => { setSelectedStyle(s.id); }}
                           className={`p-3 rounded-2xl text-center transition-all flex flex-col items-center gap-3 ${
                             selectedStyle === s.id 
                               ? `${insetShadowClass} text-brand` 
                               : `${btnShadowClass} hover:translate-y-[-1px]`
                           }`}
                         >
                            <div className="w-full aspect-square rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                              {s.imageUrl ? (
                                <img src={s.imageUrl} className="w-full h-full object-cover" alt={s.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                  <Palette size={32} />
                                </div>
                              )}
                              {/* Removed Overlay Divs - Relying on Inset Shadow Container */}
                            </div>
                           <div className="text-center w-full">
                             <span className={`text-xs font-bold block truncate ${selectedStyle === s.id ? 'text-brand' : themeStyles.textMain}`}>
                               {s.name}
                             </span>
                           </div>
                         </button>
                       ))}
                     </div>
                   )}

                   {activeMenu === 'ratio' && (
                     <div className="grid grid-cols-3 gap-3">
                       {RATIOS.map(r => (
                         <button
                           key={r.id}
                           onClick={() => { setSelectedRatio(r.id); setActiveMenu(null); }}
                           className={`p-4 rounded-2xl text-center transition-all flex flex-col items-center gap-2 ${
                             selectedRatio === r.id 
                               ? `${insetShadowClass} text-brand` 
                               : `${btnShadowClass} ${themeStyles.textMain} hover:translate-y-[-1px]`
                           }`}
                         >
                           <r.icon size={24} />
                           <span className="text-xs font-bold">{r.label}</span>
                           <span className="text-[10px] opacity-50">{r.id}</span>
                         </button>
                       ))}
                     </div>
                   )}

                   {activeMenu === 'subject' && (
                     <div className="flex flex-col gap-3">
                       <button
                         onClick={() => { setSelectedSubject(''); setActiveMenu(null); }}
                         className={`p-4 rounded-2xl text-left transition-all border border-dashed border-gray-400/30 hover:bg-gray-50 dark:hover:bg-white/5 ${
                           selectedSubject === '' ? 'bg-gray-50 dark:bg-white/5' : ''
                         }`}
                       >
                         <span className={`text-sm font-bold block ${themeStyles.textMain}`}>No Specific Subject</span>
                         <span className={`text-xs ${themeStyles.textSub}`}>The AI will generate the subject based on your prompt.</span>
                       </button>
                       
                       {subjects.length > 0 && <div className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSub} mt-2 mb-1 px-1`}>Your Library</div>}
                       
                       {subjects.map(s => (
                         <button
                           key={s.id}
                           onClick={() => { setSelectedSubject(s.id); setActiveMenu(null); }}
                           className={`p-3 rounded-2xl text-left transition-all flex items-center gap-4 ${
                             selectedSubject === s.id 
                               ? `${insetShadowClass} border-l-4 border-brand` 
                               : `${btnShadowClass} ${themeStyles.textMain} hover:translate-y-[-1px]`
                           }`}
                         >
                           {s.imageUrl ? (
                             <img src={s.imageUrl} className="w-12 h-12 rounded-xl object-cover bg-gray-200" />
                           ) : (
                             <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                               {s.type === 'product' ? <Box size={20}/> : <User size={20}/>}
                             </div>
                           )}
                           <div>
                             <span className="text-sm font-bold block">{s.name}</span>
                             <span className="text-xs opacity-60 capitalize">{s.type}</span>
                           </div>
                         </button>
                       ))}
                     </div>
                   )}

                   {activeMenu === 'model' && (
                      <div className="col-span-2 sm:col-span-3 flex flex-col gap-3">
                         
                         {/* Flash Tier */}
                         <button
                           onClick={() => { setModelTier('flash'); setActiveMenu(null); }}
                           className={`p-4 rounded-2xl flex items-center gap-4 transition-all group ${
                             modelTier === 'flash' 
                               ? `${insetShadowClass} border-l-4 border-blue-400` 
                               : `${btnShadowClass} hover:translate-y-[-1px]`
                           }`}
                         >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modelTier === 'flash' ? 'bg-blue-400 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                             <Zap size={20} fill="currentColor" />
                           </div>
                           <div className="text-left flex-1 flex justify-between items-center">
                             <div>
                               <span className={`text-sm font-bold block ${themeStyles.textMain}`}>Flash 2.5</span>
                               <span className={`text-xs ${themeStyles.textSub}`}>Lightning fast, standard resolution.</span>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${themeStyles.textSub} ${themeStyles.shadowIn} ${modelTier === 'flash' ? 'text-brand' : ''}`}>
                               10 Credits
                             </span>
                           </div>
                         </button>

                         {/* Pro Tier */}
                         <button
                           onClick={() => { setModelTier('pro'); setActiveMenu(null); }}
                           className={`p-4 rounded-2xl flex items-center gap-4 transition-all group ${
                             modelTier === 'pro' 
                               ? `${insetShadowClass} border-l-4 border-brand` 
                               : `${btnShadowClass} hover:translate-y-[-1px]`
                           }`}
                         >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modelTier === 'pro' ? 'bg-brand text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                             <Diamond size={20} fill="currentColor" />
                           </div>
                           <div className="text-left flex-1 flex justify-between items-center">
                             <div>
                               <span className={`text-sm font-bold block ${themeStyles.textMain}`}>Gemini Pro</span>
                               <span className={`text-xs ${themeStyles.textSub}`}>High fidelity, enhanced lighting.</span>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${themeStyles.textSub} ${themeStyles.shadowIn} ${modelTier === 'pro' ? 'text-brand' : ''}`}>
                               40 Credits
                             </span>
                           </div>
                         </button>

                         {/* Ultra Tier */}
                         <button
                           onClick={() => { setModelTier('ultra'); setActiveMenu(null); }}
                           className={`p-4 rounded-2xl flex items-center gap-4 transition-all group overflow-hidden relative ${
                             modelTier === 'ultra' 
                               ? `${insetShadowClass} border-l-4 border-purple-500` 
                               : `${btnShadowClass} hover:translate-y-[-1px]`
                           }`}
                         >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${modelTier === 'ultra' ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                             <Sparkles size={20} fill="currentColor" />
                           </div>
                           <div className="text-left flex-1 flex justify-between items-center relative z-10">
                             <div>
                               <span className={`text-sm font-bold block bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text ${modelTier === 'ultra' ? 'text-transparent' : themeStyles.textMain}`}>
                                 Ultra 4K
                               </span>
                               <span className={`text-xs ${themeStyles.textSub}`}>Maximum resolution & detail.</span>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${themeStyles.textSub} ${themeStyles.shadowIn} ${modelTier === 'ultra' ? 'text-transparent bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text' : ''}`}>
                               80 Credits
                             </span>
                           </div>
                           
                           {/* Subtle Glow BG for Ultra */}
                           {modelTier === 'ultra' && (
                             <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
                           )}
                         </button>

                      </div>
                   )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Top Controls Grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 px-1">
           
           {/* Subject */}
           <button 
             onClick={() => setActiveMenu(activeMenu === 'subject' ? null : 'subject')}
             className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${
               activeMenu === 'subject' || selectedSubject 
                 ? `${insetShadowClass} text-brand` 
                 : `${btnShadowClass} ${themeStyles.textMain} ${btnActiveShadowClass}`
             }`}
           >
             {selectedSubject ? (
                subjects.find(s => s.id === selectedSubject)?.type === 'person' ? <User size={14} /> : <Box size={14} />
             ) : <Sparkles size={14} />}
             <span className="truncate hidden sm:inline">{activeSubjectLabel}</span>
           </button>

           {/* Preset */}
           <button 
             onClick={() => setActiveMenu(activeMenu === 'preset' ? null : 'preset')}
             className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${
               activeMenu === 'preset' 
                 ? `${insetShadowClass} text-brand` 
                 : `${btnShadowClass} ${themeStyles.textMain} ${btnActiveShadowClass}`
             }`}
           >
             <LayoutTemplate size={14} />
             <span className="truncate hidden sm:inline">{activePresetName}</span>
           </button>

           {/* Style */}
           <button 
             onClick={() => setActiveMenu(activeMenu === 'style' ? null : 'style')}
             className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${
               activeMenu === 'style' 
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
             className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${
               activeMenu === 'ratio' 
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
             className={`flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all truncate ${
               activeMenu === 'model' || modelTier !== 'flash'
                 ? `${insetShadowClass} text-brand` 
                 : `${btnShadowClass} ${themeStyles.textMain} ${btnActiveShadowClass}`
             }`}
           >
             {getTierIcon()}
             <span className="truncate hidden sm:inline">{getTierLabel()}</span>
           </button>

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
           
           <button
             type="submit"
             disabled={!prompt.trim() || loading}
             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all text-white ${
               loading 
                 ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                 : modelTier === 'ultra'
                   ? 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 hover:scale-105 active:scale-95'
                   : 'bg-brand hover:bg-brand-hover shadow-lg shadow-brand/30 active:scale-95'
             }`}
           >
             {loading ? <Sparkles size={24} className="animate-spin" /> : <Send size={24} />}
           </button>
        </form>

      </div>
    </div>
  );
};