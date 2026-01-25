import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Business, AdPreferences } from '../types';
import { NeuCard, NeuButton, NeuInput, NeuDropdown, useThemeStyles, NeuTabs } from './NeuComponents';
import { X, Sparkles, Box, User, Sliders, Mail, Phone, Globe, MapPin, Clock, Calendar, LayoutTemplate, Search, ShoppingBag, Users, Check } from 'lucide-react';

export interface CreativeContext {
    subject: {
        id: string;
        name: string;
        type: 'product' | 'person';
        imageUrl?: string;
    } | null;
    isFreedomMode: boolean;
    overrides: Partial<AdPreferences> & {
        tone?: string;
    };
}

interface CreativeControlsProps {
    business: Business;
    currentContext: CreativeContext;
    onApply: (ctx: CreativeContext) => void;
    onClose: () => void;
}

export const CreativeControls: React.FC<CreativeControlsProps> = ({
    business,
    currentContext,
    onApply,
    onClose
}) => {
    const { styles } = useThemeStyles();
    const [activeTab, setActiveTab] = useState<'subject' | 'mode' | 'prefs'>('subject');
    const [mounted, setMounted] = useState(false);

    // Subject Picker State
    const [subjectSearch, setSubjectSearch] = useState('');
    const [subjectTab, setSubjectTab] = useState<'all' | 'product' | 'person'>('all');

    // Local State for Builder
    const [localContext, setLocalContext] = useState<CreativeContext>(currentContext);

    // Initialize overrides with business defaults if empty
    useEffect(() => {
        setMounted(true);
        if (Object.keys(localContext.overrides).length === 0) {
            setLocalContext(prev => ({
                ...prev,
                overrides: {
                    ...business.adPreferences,
                    tone: business.voice.tone // Initialize tone separately as it's not in AdPreferences
                }
            }));
        }
        return () => setMounted(false);
    }, []);

    const handleUpdateOverride = (key: keyof AdPreferences | 'tone', value: any) => {
        setLocalContext(prev => ({
            ...prev,
            overrides: {
                ...prev.overrides,
                [key]: value
            }
        }));
    };

    const getSubjects = () => {
        const products = (business.offerings || []).map(o => ({
            id: o.id,
            name: o.name,
            type: 'product' as const,
            imageUrl: o.imageUrl,
            description: o.category
        }));

        const team = (business.teamMembers || []).map(t => ({
            id: t.id,
            name: t.name,
            type: 'person' as const,
            imageUrl: t.imageUrl,
            description: t.role
        }));

        let all = [...products, ...team];

        if (subjectTab !== 'all') {
            all = all.filter(item => item.type === subjectTab);
        }

        if (subjectSearch) {
            const q = subjectSearch.toLowerCase();
            all = all.filter(item =>
                item.name.toLowerCase().includes(q) ||
                (item.description && item.description.toLowerCase().includes(q))
            );
        }

        return all;
    };

    const subjects = getSubjects();

    // Don't render until mounted to avoid SSR mismatch (though not an issue here, safer)
    if (!mounted) return null;

    // PORTAL IMPLEMENTATION: Renders outside parent stacking context
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-[600px] h-[800px] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${styles.bg} border ${styles.border}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 shrink-0 flex justify-between items-center">
                    <div>
                        <h2 className={`text-2xl font-black tracking-tight ${styles.textMain}`}>Creative Controls</h2>
                        <p className={`text-sm ${styles.textSub}`}>Configure the AI for this session.</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${styles.textSub}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 py-2 shrink-0">
                    <NeuTabs
                        activeTab={activeTab}
                        onChange={(id) => setActiveTab(id as any)}
                        tabs={[
                            { id: 'subject', label: 'Subject', icon: <Box size={16} /> },
                            { id: 'mode', label: 'Mode', icon: <Sparkles size={16} /> },
                            { id: 'prefs', label: 'Ad Preferences', icon: <Sliders size={16} /> },
                        ]}
                    />
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">

                    {/* TAB 1: SUBJECT */}
                    {activeTab === 'subject' && (
                        <div className="space-y-6 animate-fade-in flex flex-col h-full">
                            <div className={`p-4 rounded-2xl ${styles.bgAccent} border mb-2 border-dashed border-gray-300 dark:border-gray-700 shrink-0`}>
                                <h3 className={`text-sm font-bold ${styles.textMain} mb-2`}>Current Attachment</h3>
                                {localContext.subject ? (
                                    <div className="flex items-center justify-between bg-white dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {localContext.subject.imageUrl ? (
                                                    <img src={localContext.subject.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    localContext.subject.type === 'person' ? <User size={20} className="text-gray-400" /> : <Box size={20} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold ${styles.textMain}`}>{localContext.subject.name}</div>
                                                <div className="text-xs text-brand uppercase font-bold">{localContext.subject.type}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setLocalContext(prev => ({ ...prev, subject: null }))}
                                            className="text-red-500 text-xs font-bold hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-sm text-gray-400">No subject attached</div>
                                )}
                            </div>

                            {/* Inline Picker */}
                            <div className="flex-1 flex flex-col min-h-0">
                                {/* Search & Tabs */}
                                <div className="space-y-3 mb-4 shrink-0">
                                    <div className="relative">
                                        <Search className={`absolute left-3 top-3 ${styles.textSub}`} size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search products or team..."
                                            value={subjectSearch}
                                            onChange={e => setSubjectSearch(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2 rounded-xl ${styles.bg} ${styles.shadowIn} ${styles.textMain} outline-none focus:ring-2 focus:ring-brand/20`}
                                            autoFocus={false}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        {[
                                            { id: 'all', label: 'All' },
                                            { id: 'product', label: 'Products', icon: ShoppingBag },
                                            { id: 'person', label: 'Team', icon: Users }
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSubjectTab(t.id as any)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${subjectTab === t.id
                                                    ? `${styles.bg} ${styles.shadowOut} text-brand`
                                                    : `${styles.textSub} hover:bg-black/5`
                                                    }`}
                                            >
                                                {t.icon && <t.icon size={12} />}
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scrollable List */}
                                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                    {subjects.length === 0 ? (
                                        <div className="text-center py-10 opacity-50">
                                            <p className="text-sm">No subjects found.</p>
                                        </div>
                                    ) : (
                                        subjects.map(subject => {
                                            const isSelected = localContext.subject?.id === subject.id;
                                            return (
                                                <button
                                                    key={subject.id}
                                                    onClick={() => setLocalContext(prev => ({
                                                        ...prev, subject: {
                                                            id: subject.id,
                                                            name: subject.name,
                                                            type: subject.type,
                                                            imageUrl: subject.imageUrl
                                                        }
                                                    }))}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border 
                                    ${isSelected
                                                            ? 'bg-brand/10 border-brand'
                                                            : `hover:bg-black/5 border-transparent hover:border-brand/10`
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 ${styles.shadowOut} bg-gray-100 flex items-center justify-center`}>
                                                        {subject.imageUrl ? (
                                                            <img src={subject.imageUrl} alt={subject.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            subject.type === 'product' ? <ShoppingBag size={16} className="text-gray-400" /> : <Users size={16} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-bold ${styles.textMain} truncate`}>{subject.name}</div>
                                                        <div className={`text-xs ${styles.textSub} truncate`}>{subject.description}</div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="text-brand">
                                                            <Check size={18} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: MODE (FREEDOM) */}
                    {activeTab === 'mode' && (
                        <div className="space-y-6 animate-fade-in relative h-full">
                            <NeuCard className="border-2 border-brand/20 overflow-hidden relative min-h-[300px] flex flex-col items-center justify-center text-center p-8">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Sparkles size={200} />
                                </div>

                                <div className={`mb-6 p-6 rounded-full transition-colors ${localContext.isFreedomMode ? 'bg-brand text-white shadow-xl shadow-brand/30' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                    <Sparkles size={48} />
                                </div>

                                <h3 className={`text-2xl font-black ${styles.textMain} mb-2`}>Freedom Mode</h3>
                                <p className={`text-sm ${styles.textSub} max-w-sm mb-8`}>
                                    Disables strict brand compliance rules. Great for clean, aesthetic shots without forced text overlays.
                                </p>

                                <div className="flex items-center gap-4">
                                    <span className={`text-sm font-bold ${localContext.isFreedomMode ? 'text-brand' : 'text-gray-400'}`}>
                                        {localContext.isFreedomMode ? 'ENABLED' : 'DISABLED'}
                                    </span>

                                    <button
                                        onClick={() => setLocalContext(prev => ({ ...prev, isFreedomMode: !prev.isFreedomMode }))}
                                        className={`w-16 h-8 rounded-full transition-colors relative ${localContext.isFreedomMode ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${localContext.isFreedomMode ? 'translate-x-8' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </NeuCard>

                            <div className="text-xs text-center text-gray-400">
                                When enabled, AI will ignore "Always Include Slogan" and "Always Include Contact" rules.
                            </div>
                        </div>
                    )}

                    {/* TAB 3: AD PREFERENCES */}
                    {activeTab === 'prefs' && (
                        <div className="space-y-8 animate-fade-in pb-10">

                            {/* Alert: Session Only */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center gap-3">
                                <div className="p-1 bg-blue-500 rounded-full text-white">
                                    <Sliders size={12} />
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                    <strong>Session Only:</strong> Changes here won't affect your main Business Profile.
                                </div>
                            </div>

                            {/* 1. Contact Visibility */}
                            <div className="space-y-4">
                                <h4 className={`text-sm font-bold ${styles.textMain} flex items-center gap-2 border-b pb-2 ${styles.border}`}>
                                    <Mail size={16} className="text-brand" /> Contact Visibility
                                </h4>
                                <div className="space-y-2">
                                    {(business.profile.contacts || []).map((contact) => {
                                        const currentIds = localContext.overrides.contactIds || business.adPreferences.contactIds || [];
                                        const isSelected = currentIds.includes(contact.id);
                                        return (
                                            <button
                                                key={contact.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        handleUpdateOverride('contactIds', currentIds.filter(id => id !== contact.id));
                                                    } else {
                                                        handleUpdateOverride('contactIds', [...currentIds, contact.id]);
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left
                          ${isSelected
                                                        ? 'border-brand bg-brand/5 dark:bg-brand/10 text-brand'
                                                        : `${styles.border} ${styles.bgAccent} text-gray-400`
                                                    }
                        `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {contact.type === 'phone' && <Phone size={14} />}
                                                    {contact.type === 'email' && <Mail size={14} />}
                                                    {contact.type === 'website' && <Globe size={14} />}
                                                    <span className="text-xs font-bold">{contact.label || contact.type}</span>
                                                    <span className="text-xs opacity-70 truncate max-w-[150px]">{contact.value}</span>
                                                </div>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-brand" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Prominence (Combines Slogan/Name/Contact/Logo) */}
                            <div className="space-y-4">
                                <h4 className={`text-sm font-bold ${styles.textMain} flex items-center gap-2 border-b pb-2 ${styles.border}`}>
                                    <LayoutTemplate size={16} className="text-brand" /> Content Prominence
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Business Name */}
                                    <div>
                                        <label className={`block text-[10px] font-bold ${styles.textSub} mb-1 uppercase`}>One-Liner / Slogan</label>
                                        <NeuDropdown
                                            value={localContext.overrides.sloganProminence || 'standard'}
                                            onChange={val => handleUpdateOverride('sloganProminence', val)}
                                            options={[
                                                { value: "hidden", label: "Hidden" },
                                                { value: "subtle", label: "Subtle" },
                                                { value: "standard", label: "Standard" },
                                                { value: "prominent", label: "Prominent" }
                                            ]}
                                        />
                                    </div>

                                    {/* Logo */}
                                    <div>
                                        <label className={`block text-[10px] font-bold ${styles.textSub} mb-1 uppercase`}>Business Name</label>
                                        <NeuDropdown
                                            value={localContext.overrides.businessNameProminence || 'standard'}
                                            onChange={val => handleUpdateOverride('businessNameProminence', val)}
                                            options={[
                                                { value: "hidden", label: "Hidden" },
                                                { value: "subtle", label: "Subtle" },
                                                { value: "standard", label: "Standard" },
                                                { value: "prominent", label: "Prominent" }
                                            ]}
                                        />
                                    </div>
                                </div>

                                {/* Legal / Compliance Text */}
                                <div>
                                    <label className={`block text-[10px] font-bold ${styles.textSub} mb-1 uppercase`}>Legal / Compliance Footer</label>
                                    <NeuInput
                                        value={localContext.overrides.complianceText || ''}
                                        onChange={e => handleUpdateOverride('complianceText', e.target.value)}
                                        placeholder="e.g. Terms & Conditions apply."
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            {/* 3. Location & Hours */}
                            <div className="space-y-4">
                                <h4 className={`text-sm font-bold ${styles.textMain} flex items-center gap-2 border-b pb-2 ${styles.border}`}>
                                    <MapPin size={16} className="text-brand" /> Location & Hours
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-[10px] font-bold ${styles.textSub} mb-1 uppercase`}>Location Display</label>
                                        <NeuDropdown
                                            value={localContext.overrides.locationDisplay || 'full_address'}
                                            onChange={val => handleUpdateOverride('locationDisplay', val)}
                                            options={[
                                                { value: 'full_address', label: 'Full Address' },
                                                { value: 'city_state', label: 'City Only' },
                                                { value: 'online_only', label: 'Online Only' },
                                                { value: 'hidden', label: 'Hidden' }
                                            ]}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-bold ${styles.textSub} mb-1 uppercase`}>Hours Display</label>
                                        <NeuDropdown
                                            value={localContext.overrides.hoursDisplay || 'all_hours'}
                                            onChange={val => handleUpdateOverride('hoursDisplay', val)}
                                            options={[
                                                { value: 'all_hours', label: 'All Hours' },
                                                { value: 'weekends_only', label: 'Weekends' },
                                                { value: 'hidden', label: 'Hidden' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Tone & Language */}
                            <div className="space-y-4">
                                <h4 className={`text-sm font-bold ${styles.textMain} flex items-center gap-2 border-b pb-2 ${styles.border}`}>
                                    <Sparkles size={16} className="text-brand" /> Tone & Language
                                </h4>

                                <div>
                                    <label className={`block text-[10px] font-bold ${styles.textSub} mb-1 uppercase`}>Chat & Copy Tone</label>
                                    <NeuInput
                                        value={localContext.overrides.tone || ''}
                                        onChange={e => handleUpdateOverride('tone', e.target.value)}
                                        placeholder="e.g. Witty, Professional, Urgent"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-[10px] font-bold ${styles.textSub} mb-1 uppercase`}>Target Language</label>
                                    <NeuDropdown
                                        value={localContext.overrides.targetLanguage || 'English'}
                                        onChange={val => handleUpdateOverride('targetLanguage', val)}
                                        options={[
                                            { value: 'English', label: 'English' },
                                            { value: 'Spanish', label: 'Spanish' },
                                            { value: 'French', label: 'French' },
                                            { value: 'German', label: 'German' },
                                            { value: 'Portuguese', label: 'Portuguese' },
                                            { value: 'Dutch', label: 'Dutch' }
                                        ]}
                                    />
                                </div>
                            </div>

                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 flex justify-end gap-3 bg-white dark:bg-black/20">
                    <NeuButton variant="secondary" onClick={onClose}>Cancel</NeuButton>
                    <NeuButton onClick={() => onApply(localContext)} className="px-8 shadow-lg shadow-brand/20">
                        Apply Configuration
                    </NeuButton>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
