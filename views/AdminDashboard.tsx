
import React, { useState, useEffect, useMemo } from 'react';
import { AdminNote, SystemPrompts, Business, Preset, StylePreset } from '../types';
import { StorageService } from '../services/storage';
import { PromptFactory, DEFAULT_IMAGE_PROMPT, DEFAULT_CHAT_PROMPT, DEFAULT_TASK_PROMPT } from '../services/prompts';
import { NeuCard, NeuButton, NeuInput, NeuTextArea, useThemeStyles } from '../components/NeuComponents';
import { NeuImageUploader } from '../components/NeuImageUploader';
import { Plus, Trash2, CheckSquare, Square, Lightbulb, Bug, Map, Terminal, Save, Eye, Wallet, Building2, RefreshCw, Search, ChevronLeft, ChevronRight, Filter, X, RotateCcw, MessageSquare, ListTodo, Image as ImageIcon, ArrowRight, Settings, LayoutTemplate, Palette } from 'lucide-react';

// ... CreditRow component remains unchanged ...
const CreditRow = ({ business, onUpdate }: { business: Business; onUpdate: (id: string, amount: string) => void }) => {
  const { styles } = useThemeStyles();
  const [localCredits, setLocalCredits] = useState(business.credits.toString());
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalCredits(business.credits.toString());
    setIsDirty(false);
  }, [business.credits]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCredits(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdate(business.id, localCredits);
    setIsDirty(false);
  };

  const handleReset = () => {
    setLocalCredits(business.credits.toString());
    setIsDirty(false);
  };

  const handleQuickAdd = (amount: number) => {
    const newVal = (parseInt(localCredits || '0') + amount).toString();
    setLocalCredits(newVal);
    setIsDirty(true);
  };

  return (
    <div className={`relative group p-4 rounded-2xl transition-all ${styles.bg} ${styles.shadowOut}`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="col-span-1 md:col-span-5 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-white dark:from-gray-700 dark:to-gray-800 shadow-sm text-gray-500 font-bold text-sm`}>
            {business.name.charAt(0)}
          </div>
          <div>
            <h4 className={`font-bold ${styles.textMain}`}>{business.name}</h4>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${styles.bg} ${styles.shadowIn} ${styles.textSub}`}>
                {business.type}
              </span>
              <span className={`text-[10px] ${styles.textSub} font-mono`}>
                ID: {business.id.slice(0, 6)}
              </span>
            </div>
          </div>
        </div>
        <div className="col-span-1 md:col-span-4 flex items-center gap-3">
          <div className={`w-32 flex items-center gap-2 px-3 py-2 rounded-xl ${styles.bg} ${styles.shadowIn} border-2 ${isDirty ? 'border-yellow-500/50' : 'border-transparent'} transition-colors`}>
             <Wallet size={14} className={isDirty ? "text-yellow-500" : "text-green-500"} />
             <input 
               type="number"
               value={localCredits}
               onChange={handleChange}
               className={`bg-transparent w-full font-mono font-bold text-sm focus:outline-none ${styles.textMain}`}
             />
          </div>
          <div className="flex gap-1 w-20"> 
             <button 
               onClick={handleSave}
               disabled={!isDirty}
               className={`w-9 h-9 rounded-xl shadow-md transition-all flex items-center justify-center ${
                 isDirty 
                   ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105 cursor-pointer' 
                   : `${styles.bg} ${styles.shadowOut} text-gray-300 dark:text-gray-700 cursor-not-allowed`
               }`}
               title="Save Changes"
             >
               <CheckSquare size={18} />
             </button>
             <button 
               onClick={handleReset}
               disabled={!isDirty}
               className={`w-9 h-9 rounded-xl shadow-md transition-all flex items-center justify-center ${
                  isDirty
                    ? 'bg-red-400 text-white hover:bg-red-500 hover:scale-105 cursor-pointer opacity-100'
                    : 'opacity-0 pointer-events-none'
               }`}
               title="Cancel Changes"
             >
               <RotateCcw size={18} />
             </button>
          </div>
        </div>
        <div className="col-span-1 md:col-span-3 flex justify-end gap-2">
          {[10, 50, 100].map(amount => (
            <button 
              key={amount}
              onClick={() => handleQuickAdd(amount)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:text-yellow-500 ${styles.bg} ${styles.shadowOut} hover:${styles.shadowOutHover}`}
            >
              +{amount}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'brain' | 'credits' | 'config'>('roadmap');
  const [brainTab, setBrainTab] = useState<'image' | 'chat' | 'tasks'>('image');
  const [configTab, setConfigTab] = useState<'presets' | 'styles'>('presets');

  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [category, setCategory] = useState<AdminNote['category']>('Idea');
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [prompts, setPrompts] = useState<SystemPrompts>({
    chatPersona: '',
    imageGenRules: '',
    taskGenRules: ''
  });

  // Config State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [stylesList, setStylesList] = useState<StylePreset[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const { styles } = useThemeStyles();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedNotes, savedPrompts, loadedBusinesses, loadedPresets, loadedStyles] = await Promise.all([
      StorageService.getAdminNotes(),
      StorageService.getSystemPrompts(),
      StorageService.getBusinesses(),
      StorageService.getPresets(),
      StorageService.getStyles()
    ]);

    setNotes(loadedNotes);
    if (savedPrompts) setPrompts(savedPrompts);
    setBusinesses(loadedBusinesses);
    setPresets(loadedPresets);
    setStylesList(loadedStyles);
  };

  // ... Note handlers ...
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const note: AdminNote = {
      id: Date.now().toString(),
      content: newNote,
      category,
      createdAt: new Date().toISOString(),
      isDone: false
    };
    const updated = [note, ...notes];
    setNotes(updated);
    await StorageService.saveAdminNotes(updated);
    setNewNote('');
  };

  const toggleDone = async (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, isDone: !n.isDone } : n);
    setNotes(updated);
    await StorageService.saveAdminNotes(updated);
  };

  const deleteNote = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await StorageService.saveAdminNotes(updated);
  };

  const handleSavePrompts = async () => {
    await StorageService.saveSystemPrompts(prompts);
    alert('System Prompts Updated');
  };
  
  const loadDefaultPrompt = () => {
    if (brainTab === 'image') setPrompts({...prompts, imageGenRules: DEFAULT_IMAGE_PROMPT});
    if (brainTab === 'chat') setPrompts({...prompts, chatPersona: DEFAULT_CHAT_PROMPT});
    if (brainTab === 'tasks') setPrompts({...prompts, taskGenRules: DEFAULT_TASK_PROMPT});
  };

  const getCurrentDefault = () => {
    if (brainTab === 'image') return DEFAULT_IMAGE_PROMPT;
    if (brainTab === 'chat') return DEFAULT_CHAT_PROMPT;
    return DEFAULT_TASK_PROMPT;
  };

  const getCurrentValue = () => {
    if (brainTab === 'image') return prompts.imageGenRules;
    if (brainTab === 'chat') return prompts.chatPersona;
    return prompts.taskGenRules;
  };

  const handlePromptChange = (val: string) => {
    if (brainTab === 'image') setPrompts({...prompts, imageGenRules: val});
    if (brainTab === 'chat') setPrompts({...prompts, chatPersona: val});
    if (brainTab === 'tasks') setPrompts({...prompts, taskGenRules: val});
  };

  const handleUpdateCredits = async (businessId: string, newAmount: string) => {
    const amount = parseInt(newAmount);
    if (isNaN(amount)) return;
    const updatedBusinesses = businesses.map(b => b.id === businessId ? { ...b, credits: amount } : b);
    setBusinesses(updatedBusinesses);
    const businessToSave = updatedBusinesses.find(b => b.id === businessId);
    if (businessToSave) await StorageService.saveBusiness(businessToSave);
  };

  // --- Config Handlers ---
  const handleSaveConfigItem = async () => {
    if (!editingItem) return;
    
    if (configTab === 'presets') {
       await StorageService.savePreset(editingItem);
       const updated = await StorageService.getPresets();
       setPresets(updated);
    } else {
       await StorageService.saveStyle(editingItem);
       const updated = await StorageService.getStyles();
       setStylesList(updated);
    }
    setEditingItem(null);
  };

  const handleCreateNewConfig = () => {
    const base = {
      id: Date.now().toString(),
      name: 'New Item',
      description: '',
      promptModifier: '',
      sortOrder: 0,
      isActive: true
    };
    
    if (configTab === 'presets') {
      setEditingItem({ ...base, icon: 'LayoutTemplate' });
    } else {
      setEditingItem({ ...base, imageUrl: '' });
    }
  };

  const getIcon = (cat: string) => {
    if (cat === 'Bug') return <Bug size={16} className="text-red-400" />;
    if (cat === 'Roadmap') return <Map size={16} className="text-blue-400" />;
    return <Lightbulb size={16} className="text-yellow-400" />;
  };

  // --- Filtering & Pagination Logic ---
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.industry.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [businesses, searchTerm]);

  const totalPages = Math.ceil(filteredBusinesses.length / itemsPerPage);
  
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBusinesses.slice(start, start + itemsPerPage);
  }, [filteredBusinesses, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${styles.textMain}`}>Admin HQ</h2>
          <p className={styles.textSub}>Control Center for Ads x Create</p>
        </div>
        
        <div className={`flex p-1 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
           <button 
             onClick={() => setActiveTab('roadmap')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'roadmap' ? `${styles.bg} ${styles.shadowOut} text-[#6D5DFC]` : `${styles.textSub} hover:${styles.textMain}`
             }`}
           >
             Roadmap
           </button>
           <button 
             onClick={() => setActiveTab('brain')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'brain' ? `${styles.bg} ${styles.shadowOut} text-[#6D5DFC]` : `${styles.textSub} hover:${styles.textMain}`
             }`}
           >
             Brain Logic
           </button>
           <button 
             onClick={() => setActiveTab('config')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
               activeTab === 'config' ? `${styles.bg} ${styles.shadowOut} text-[#6D5DFC]` : `${styles.textSub} hover:${styles.textMain}`
             }`}
           >
             <Settings size={14} />
             Config
           </button>
           <button 
             onClick={() => setActiveTab('credits')}
             className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
               activeTab === 'credits' ? `${styles.bg} ${styles.shadowOut} text-[#6D5DFC]` : `${styles.textSub} hover:${styles.textMain}`
             }`}
           >
             <Wallet size={14} />
             Accounts
           </button>
        </div>
      </header>

      {/* --- ROADMAP TAB --- */}
      {activeTab === 'roadmap' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-1">
            <NeuCard className="sticky top-4">
              <h3 className={`text-lg font-bold ${styles.textMain} mb-4`}>Quick Capture</h3>
              <div className="space-y-4">
                <NeuTextArea 
                  placeholder="What's the next big feature?" 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="h-32"
                />
                <div className="flex gap-2">
                  {['Idea', 'Roadmap', 'Bug'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat as any)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        category === cat 
                          ? `${styles.bg} ${styles.shadowIn} text-[#6D5DFC]` 
                          : `${styles.bg} ${styles.shadowOut} ${styles.textSub}`
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <NeuButton variant="primary" className="w-full" onClick={handleAddNote}>
                  <Plus size={18} /> Add to Hub
                </NeuButton>
              </div>
            </NeuCard>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <h3 className={`text-lg font-bold ${styles.textSub}`}>The Roadmap</h3>
            {notes.length === 0 && (
              <div className={`text-center ${styles.textSub} py-10`}>
                No ideas yet. Start brainstorming!
              </div>
            )}
            {notes.map(note => (
              <NeuCard key={note.id} className={`flex items-start gap-4 group transition-all ${note.isDone ? 'opacity-50 grayscale' : ''}`}>
                <button onClick={() => toggleDone(note.id)} className={`mt-1 ${styles.textSub} hover:text-[#6D5DFC] transition-colors`}>
                  {note.isDone ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                       {getIcon(note.category)}
                       <span className={`text-xs font-bold uppercase ${styles.textSub}`}>{note.category}</span>
                    </div>
                    <span className={`text-xs ${styles.textSub}`}>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className={`${styles.textMain} font-medium ${note.isDone ? 'line-through' : ''}`}>
                    {note.content}
                  </p>
                </div>
                <button onClick={() => deleteNote(note.id)} className={`${styles.textSub} hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all`}>
                  <Trash2 size={18} />
                </button>
              </NeuCard>
            ))}
          </div>
        </div>
      )}

      {/* --- BRAIN LOGIC TAB --- */}
      {activeTab === 'brain' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex gap-4 border-b border-gray-200/10 pb-4">
             {[
               { id: 'image', label: 'Image Generator', icon: ImageIcon },
               { id: 'chat', label: 'Chat Persona', icon: MessageSquare },
               { id: 'tasks', label: 'Task Engine', icon: ListTodo },
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setBrainTab(tab.id as any)}
                 className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all border-b-2 ${
                   brainTab === tab.id ? 'border-[#6D5DFC] text-[#6D5DFC]' : 'border-transparent text-gray-400 hover:text-gray-600'
                 }`}
               >
                 <tab.icon size={16} />
                 {tab.label}
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="opacity-60 hover:opacity-100 transition-opacity">
               <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <Terminal size={16} className={styles.textSub} />
                    <h4 className={`text-sm font-bold ${styles.textSub} uppercase`}>Factory Default</h4>
                 </div>
                 <button 
                    onClick={loadDefaultPrompt}
                    className={`text-[10px] font-bold px-2 py-1 rounded ${styles.bg} ${styles.shadowOut} hover:text-[#6D5DFC] flex items-center gap-1`}
                    title="Copy to Override"
                 >
                    Use This <ArrowRight size={10} />
                 </button>
               </div>
               <div className={`p-4 rounded-2xl ${styles.bg} ${styles.shadowIn} font-mono text-[10px] h-[400px] overflow-y-auto whitespace-pre-wrap ${styles.textSub}`}>
                 {getCurrentDefault()}
               </div>
             </div>

             <div>
               <div className="flex items-center gap-2 mb-2">
                 <Eye size={16} className="text-purple-500" />
                 <h4 className={`text-sm font-bold ${styles.textMain} uppercase`}>Admin Override (Live)</h4>
               </div>
               <NeuTextArea 
                  className="font-mono text-[10px] h-[400px] whitespace-pre-wrap"
                  placeholder={`Paste the Default Prompt here to start editing ${brainTab} logic...`}
                  value={getCurrentValue()}
                  onChange={(e) => handlePromptChange(e.target.value)}
               />
               <p className={`text-xs ${styles.textSub} mt-2`}>
                 * If this box is empty, the default prompt on the left is used. 
                 * Placeholders (e.g., <code>{'{BUSINESS_NAME}'}</code>) are dynamically replaced.
               </p>
             </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200/10">
            <NeuButton variant="primary" onClick={handleSavePrompts}>
              <Save size={18} /> Save Brain Logic
            </NeuButton>
          </div>
        </div>
      )}

      {/* --- CONFIG TAB (PRESETS & STYLES) --- */}
      {activeTab === 'config' && (
        <div className="space-y-8 animate-fade-in">
           <div className="flex gap-4 border-b border-gray-200/10 pb-4">
             {[
               { id: 'presets', label: 'Ad Presets (Archetypes)', icon: LayoutTemplate },
               { id: 'styles', label: 'Visual Styles (Vibes)', icon: Palette },
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => { setConfigTab(tab.id as any); setEditingItem(null); }}
                 className={`flex items-center gap-2 pb-2 text-sm font-bold transition-all border-b-2 ${
                   configTab === tab.id ? 'border-[#6D5DFC] text-[#6D5DFC]' : 'border-transparent text-gray-400 hover:text-gray-600'
                 }`}
               >
                 <tab.icon size={16} />
                 {tab.label}
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* List Column */}
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <h3 className={`text-lg font-bold ${styles.textMain}`}>
                   {configTab === 'presets' ? 'Available Presets' : 'Available Styles'}
                 </h3>
                 <NeuButton onClick={handleCreateNewConfig} className="px-3 py-1.5 text-xs">
                   <Plus size={14} /> Add New
                 </NeuButton>
               </div>
               
               <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 p-2 pb-4">
                 {(configTab === 'presets' ? presets : stylesList).map((item: any) => (
                   <button
                     key={item.id}
                     onClick={() => setEditingItem(item)}
                     className={`p-4 rounded-xl text-left transition-all border-l-4 flex-shrink-0 w-[98%] mx-auto ${
                       editingItem?.id === item.id 
                         ? `${styles.bg} ${styles.shadowIn} border-[#6D5DFC]` 
                         : `${styles.bg} ${styles.shadowOut} border-transparent hover:translate-y-[-2px]`
                     }`}
                   >
                      <div className="flex justify-between">
                        <span className={`font-bold text-sm ${styles.textMain}`}>{item.name}</span>
                        {item.isActive === false && <span className="text-[10px] text-red-400 bg-red-400/10 px-1 rounded">Inactive</span>}
                      </div>
                      <p className={`text-xs ${styles.textSub} mt-1 truncate`}>{item.description}</p>
                      <p className={`text-[10px] opacity-50 font-mono mt-2 truncate`}>{item.id}</p>
                   </button>
                 ))}
               </div>
             </div>

             {/* Editor Column */}
             <div className="relative">
               {editingItem ? (
                 <div className={`p-6 rounded-2xl ${styles.bg} ${styles.shadowIn} border border-white/5 sticky top-4 space-y-4`}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className={`font-bold ${styles.textMain} flex items-center gap-2`}>
                        {editingItem.id.includes(Date.now().toString().slice(0,5)) ? 'Create New' : 'Edit Item'}
                      </h4>
                      <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                    </div>

                    <div>
                      <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Internal ID</label>
                      <NeuInput value={editingItem.id} onChange={(e) => setEditingItem({...editingItem, id: e.target.value})} className="font-mono text-xs" disabled={configTab === 'presets' ? presets.some(p => p.id === editingItem.id && p !== editingItem) : stylesList.some(s => s.id === editingItem.id && s !== editingItem)} />
                    </div>

                    <div>
                      <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Name (UI Label)</label>
                      <NeuInput value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                    </div>

                    <div>
                      <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Description (UI Subtitle)</label>
                      <NeuInput value={editingItem.description} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
                    </div>

                    <div>
                      <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>
                        Prompt Modifier (Hidden Instruction)
                      </label>
                      <NeuTextArea 
                        value={editingItem.promptModifier} 
                        onChange={(e) => setEditingItem({...editingItem, promptModifier: e.target.value})} 
                        className="h-32 text-xs font-mono"
                      />
                    </div>
                    
                    {/* Type Specific Fields */}
                    {configTab === 'presets' ? (
                       <div className="space-y-4">
                         <div>
                           <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Icon Name (Lucide)</label>
                           <NeuInput value={editingItem.icon || ''} onChange={(e) => setEditingItem({...editingItem, icon: e.target.value})} placeholder="e.g. LayoutTemplate" />
                         </div>
                         <div>
                           <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Logo Placement (Composition)</label>
                           <NeuInput 
                             value={editingItem.logoPlacement || ''} 
                             onChange={(e) => setEditingItem({...editingItem, logoPlacement: e.target.value})} 
                             placeholder="e.g. On the packaging, Floating behind..." 
                           />
                           <p className="text-[10px] opacity-50 mt-1">Where does the logo go in this layout?</p>
                         </div>
                         <div>
                           <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Preview Image (Optional)</label>
                           <NeuImageUploader 
                             currentValue={editingItem.imageUrl || ''} 
                             onUpload={(url) => setEditingItem({...editingItem, imageUrl: url})}
                             folder="presets"
                           />
                         </div>
                       </div>
                    ) : (
                       <div className="space-y-4">
                         <div>
                           <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Logo Behavior (Material/Integration)</label>
                           <NeuInput 
                             value={editingItem.logoMaterial || ''} 
                             onChange={(e) => setEditingItem({...editingItem, logoMaterial: e.target.value})} 
                             placeholder="e.g. Glowing Neon, Gold Foil, Matte Print..." 
                           />
                           <p className="text-[10px] opacity-50 mt-1">How should the logo interact with the scene?</p>
                         </div>
                         <div>
                           <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>Preview Image</label>
                           <NeuImageUploader 
                             currentValue={editingItem.imageUrl || ''} 
                             onUpload={(url) => setEditingItem({...editingItem, imageUrl: url})}
                             folder="styles"
                           />
                         </div>
                       </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        checked={editingItem.isActive ?? true} 
                        onChange={(e) => setEditingItem({...editingItem, isActive: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className={`text-sm ${styles.textMain}`}>Active (Visible to Users)</span>
                    </div>

                    <NeuButton variant="primary" className="w-full mt-4" onClick={handleSaveConfigItem}>
                      <Save size={16} /> Save Changes
                    </NeuButton>

                 </div>
               ) : (
                 <div className={`h-full flex flex-col items-center justify-center opacity-30 ${styles.textSub}`}>
                    <Settings size={48} strokeWidth={1} />
                    <p className="mt-4">Select an item to edit or create new.</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* --- CREDITS TAB --- */}
      {activeTab === 'credits' && (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
           <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="flex items-center gap-3 w-full md:w-auto">
               <div className={`p-2 rounded-full ${styles.bg} ${styles.shadowIn} text-[#6D5DFC]`}>
                 <Building2 size={20} />
               </div>
               <div>
                 <h3 className={`text-lg font-bold ${styles.textMain}`}>Business Accounts</h3>
                 <p className={`text-xs ${styles.textSub}`}>{filteredBusinesses.length} businesses found</p>
               </div>
             </div>

             <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${styles.textSub}`} />
                  <input 
                    type="text" 
                    placeholder="Search name, ID, industry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm font-bold focus:outline-none ${styles.bg} ${styles.shadowIn} ${styles.textMain} placeholder-gray-400`}
                  />
                </div>
                <button onClick={loadData} className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} hover:text-[#6D5DFC] transition-colors`}>
                  <RefreshCw size={20} />
                </button>
             </div>
           </div>

           <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold uppercase opacity-50 select-none">
             <div className="col-span-5">Business Details</div>
             <div className="col-span-3">Credits</div>
             <div className="col-span-4 text-right">Quick Actions</div>
           </div>

           <div className="space-y-4">
             {paginatedBusinesses.length === 0 && (
               <div className={`text-center py-10 ${styles.textSub}`}>
                 No businesses found matching "{searchTerm}"
               </div>
             )}
             {paginatedBusinesses.map((business) => (
               <CreditRow key={business.id} business={business} onUpdate={handleUpdateCredits} />
             ))}
           </div>
           {totalPages > 1 && (
             <div className="flex justify-center gap-4 pt-4">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} disabled:opacity-30 disabled:cursor-not-allowed`}
               >
                 <ChevronLeft size={20} />
               </button>
               <span className={`flex items-center px-4 font-bold ${styles.textSub}`}>
                 Page {currentPage} of {totalPages}
               </span>
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
                 className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} disabled:opacity-30 disabled:cursor-not-allowed`}
               >
                 <ChevronRight size={20} />
               </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
