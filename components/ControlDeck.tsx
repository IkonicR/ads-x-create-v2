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
                className={`absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-[90vw] max-w-4xl h-[60vh] overflow-hidden rounded-3xl ${slabBg} ${slabShadowClass} border border-white/5 flex flex-col md:flex-row`}
              >
                {/* LEFT SIDE: The Grid (Mobile: Top, Desktop: Left 60%) */}
                <div className="flex-1 flex flex-col h-full border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 relative">
                   <div className="p-4 border-b border-gray-100 dark:border-white/5 shrink-0 flex justify-between items-center">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSub}`}>
                        Select {activeMenu ? activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1) : ''}
                      </h4>
                      <button onClick={() => setActiveMenu(null)} className="md:hidden text-gray-400">
                        <X size={18} />
                      </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                      {/* Grid Content */}
                      {(activeMenu === 'preset' || activeMenu === 'style') && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {(activeMenu === 'preset' ? presets : aestheticStyles).map((item: any) => (
                            <button
                              key={item.id}
                              onClick={() => activeMenu === 'preset' ? setSelectedPreset(item.id) : setSelectedStyle(item.id)}
                              className={`group p-3 rounded-2xl text-center transition-all flex flex-col items-center gap-3 ${
                                (activeMenu === 'preset' ? selectedPreset : selectedStyle) === item.id
                                  ? `${insetShadowClass} text-brand` 
                                  : `${btnShadowClass} hover:translate-y-[-1px]`
                              }`}
                            >
                               <div className="w-full aspect-square rounded-xl overflow-hidden relative bg-gray-100 dark:bg-gray-800">
                                 {item.imageUrl ? (
                                   <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                     {activeMenu === 'preset' ? <LayoutTemplate size={32}/> : <Palette size={32}/>}
                                   </div>
                                 )}
                               </div>
                               <span className={`text-xs font-bold truncate w-full ${
                                 (activeMenu === 'preset' ? selectedPreset : selectedStyle) === item.id ? 'text-brand' : themeStyles.textMain
                               }`}>
                                 {item.name}
                               </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Keep Ratio/Subject/Model Logic as simplistic grids for now to save space */}
                      {activeMenu === 'ratio' && (
                         <div className="grid grid-cols-3 gap-3">
                           {RATIOS.map(r => (
                             <button key={r.id} onClick={() => setSelectedRatio(r.id)} className={`p-4 rounded-2xl flex flex-col items-center gap-2 ${selectedRatio === r.id ? `${insetShadowClass} text-brand` : `${btnShadowClass} ${themeStyles.textMain}`}`}>
                               <r.icon size={24} />
                               <span className="text-xs font-bold">{r.label}</span>
                             </button>
                           ))}
                         </div>
                      )}
                      {(activeMenu === 'subject' || activeMenu === 'model') && (
                         <div className="flex flex-col gap-3">
                            {/* Placeholder for Subject/Model - Ideally refactor to use this layout too if needed */}
                            <p className={`text-center p-10 ${themeStyles.textSub}`}>
                               {activeMenu === 'subject' ? 'Select a subject from the list below.' : 'Select a model tier.'}
                            </p>
                            {/* Re-injecting simple subject list for functionality */}
                            {activeMenu === 'subject' && subjects.map(s => (
                               <button key={s.id} onClick={() => setSelectedSubject(s.id)} className={`p-3 rounded-2xl text-left transition-all ${selectedSubject === s.id ? `${insetShadowClass} text-brand` : btnShadowClass}`}>
                                  {s.name}
                               </button>
                            ))}
                            {activeMenu === 'model' && (
                               <div className="flex flex-col gap-2">
                                  {['flash', 'pro', 'ultra'].map(tier => (
                                     <button key={tier} onClick={() => setModelTier(tier as any)} className={`p-3 rounded-2xl text-left capitalize ${modelTier === tier ? `${insetShadowClass} text-brand` : btnShadowClass}`}>
                                        {tier}
                                     </button>
                                  ))}
                               </div>
                            )}
                         </div>
                      )}
                   </div>
                </div>

                {/* RIGHT SIDE: The Inspector (Desktop: Right 40%) */}
                <div className="hidden md:flex w-[350px] shrink-0 flex-col bg-gray-50/50 dark:bg-black/20 backdrop-blur-sm p-6">
                   <div className="flex justify-end">
                      <button onClick={() => setActiveMenu(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <X size={20} />
                      </button>
                   </div>
                   
                   {(() => {
                      const isPreset = activeMenu === 'preset';
                      const isStyle = activeMenu === 'style';
                      const item = isPreset 
                        ? presets.find(p => p.id === selectedPreset) 
                        : isStyle 
                          ? aestheticStyles.find(s => s.id === selectedStyle) 
                          : null;

                      if (!item || (!isPreset && !isStyle)) return (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                           <Sparkles size={48} className="mb-4 text-gray-400" />
                           <p className={`text-sm font-bold ${themeStyles.textMain}`}>Select an option</p>
                           <p className={`text-xs ${themeStyles.textSub}`}>to view details</p>
                        </div>
                      );

                      return (
                        <div className="flex-1 flex flex-col animate-fade-in">
                           <div className={`w-full aspect-video rounded-2xl overflow-hidden mb-6 shadow-lg ${themeStyles.border} border`}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                   {isPreset ? <LayoutTemplate size={48} className="opacity-20"/> : <Palette size={48} className="opacity-20"/>}
                                </div>
                              )}
                           </div>
                           
                           <h3 className={`text-2xl font-extrabold mb-2 ${themeStyles.textMain}`}>{item.name}</h3>
                           <p className={`text-sm leading-relaxed mb-6 ${themeStyles.textSub}`}>{item.description}</p>
                           
                           <div className="space-y-4 mt-auto">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-1">
                                  {isPreset ? 'Composition Logic' : 'Logo Treatment'}
                                </span>
                                <div className={`p-3 rounded-xl text-xs font-mono ${themeStyles.bg} ${themeStyles.shadowIn} ${themeStyles.textMain}`}>
                                  {/* @ts-ignore */}
                                  {isPreset ? item.logoPlacement : item.logoMaterial || 'Standard'}
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => setActiveMenu(null)}
                                className="w-full py-3 rounded-xl bg-brand text-white font-bold text-sm shadow-lg shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all"
                              >
                                Confirm Selection
                              </button>
                           </div>
                        </div>
                      );
                   })()}
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