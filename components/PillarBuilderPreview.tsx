/**
 * PillarBuilderPreview - Right panel live preview of pillar being built
 * 
 * Shows the pillar configuration as it's being created via chat
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PillarDraft } from './PillarBuilder';
import { Business } from '../types';
import { useThemeStyles, NeuButton, NeuCard } from './NeuComponents';
import {
    Calendar, Repeat, Sparkles, Target, Users,
    MessageSquare, BookOpen, Image, Check, Pencil,
    Clock, Hash, Type, Square, Phone, Package, ChevronDown, ChevronUp
} from 'lucide-react';

interface PillarBuilderPreviewProps {
    draft: PillarDraft;
    business?: Business; // For context-aware options
    canSave: boolean;
    isSaving: boolean;
    onSave: () => void;
    onEdit: (field: string) => void;
    onFieldChange?: (field: keyof PillarDraft, value: unknown) => void;
}

// Day names
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Theme config
const THEME_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    motivation: { icon: <Sparkles size={18} />, color: 'text-yellow-500', label: 'Motivation' },
    product: { icon: <Target size={18} />, color: 'text-blue-500', label: 'Product Spotlight' },
    team: { icon: <Users size={18} />, color: 'text-green-500', label: 'Meet the Team' },
    testimonial: { icon: <MessageSquare size={18} />, color: 'text-pink-500', label: 'Testimonial' },
    educational: { icon: <BookOpen size={18} />, color: 'text-purple-500', label: 'Educational' },
    custom: { icon: <Calendar size={18} />, color: 'text-gray-500', label: 'Custom' },
};

// Subject mode labels
const SUBJECT_MODE_LABELS: Record<string, string> = {
    static: 'Same subject each time',
    rotate_offerings: 'Rotating through products',
    rotate_team: 'Rotating through team',
    rotate_locations: 'Rotating through locations',
};

// Platform display names - static image platforms only (no video/stories)
const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'linkedin': 'LinkedIn',
    'pinterest': 'Pinterest',
    'twitter': 'Twitter / X',
    'google_business': 'Google Business',
};

const formatPlatform = (id: string): string =>
    PLATFORM_DISPLAY_NAMES[id] || id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Aspect ratio display names
const ASPECT_RATIO_LABELS: Record<string, string> = {
    '1:1': 'Square (1:1)',
    '9:16': 'Vertical Story (9:16)',
    '16:9': 'Landscape (16:9)',
    '4:5': 'Portrait (4:5)',
    '2:3': 'Vertical (2:3)',
    '3:2': 'Horizontal (3:2)',
    '3:4': 'Vertical (3:4)',
    '4:3': 'Standard (4:3)',
    '5:4': 'Photo (5:4)',
    '21:9': 'Cinematic (21:9)',
};

// Slogan prominence labels
const SLOGAN_LABELS: Record<string, string> = {
    hidden: 'Hidden',
    subtle: 'Subtle',
    standard: 'Standard',
    prominent: 'Prominent',
};

// Logo variant labels
const LOGO_LABELS: Record<string, string> = {
    main: 'Main Logo',
    wordmark: 'Wordmark',
    dark: 'Dark Version',
    light: 'Light Version',
};

// Caption mode labels
const CAPTION_MODE_LABELS: Record<string, string> = {
    same: 'Same for all',
    tailored: 'Tailored per platform',
};

// Hashtag mode labels
const HASHTAG_MODE_LABELS: Record<string, string> = {
    inherit: 'Inherit from defaults',
    ai_only: 'AI Generated Only',
    brand_only: 'Brand Tags Only',
    ai_plus_brand: 'AI + Brand Tags',
};

// Contact prominence labels
const CONTACT_PROMINENCE_LABELS: Record<string, string> = {
    prominent: 'Prominent',
    subtle: 'Subtle',
    none: 'Not Included',
};

// Generate time options (00:00 to 23:00)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return [`${hour}:00`, `${hour}:00`];
}).map(([v, l]) => ({ value: v, label: l }));


// Offering rotation labels
const OFFERING_ROTATION_LABELS: Record<string, string> = {
    never: 'Not included',
    every_post: 'Every post',
    every_2nd: 'Every 2nd post',
    every_3rd: 'Every 3rd post',
    every_4th: 'Every 4th post',
    occasionally: 'Occasionally (AI decides)',
};

export const PillarBuilderPreview: React.FC<PillarBuilderPreviewProps> = ({
    draft,
    business,
    canSave,
    isSaving,
    onSave,
    onEdit,
    onFieldChange,
}) => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

    const themeConfig = THEME_CONFIG[draft.theme || 'custom'] || THEME_CONFIG.custom;
    const isInteractive = !!onFieldChange;
    const hasAnyContent = !!(draft.name || draft.theme || draft.dayOfWeek !== undefined);
    const showPreview = isInteractive || hasAnyContent;

    // Compute available logo options based on what the business actually has
    const availableLogoOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        
        // Main logo is always available if exists
        if (business?.logoUrl) {
            options.push({ value: 'main', label: 'Main Logo' });
        }
        
        // Check logo variants
        if (business?.logoVariants?.wordmark) {
            options.push({ value: 'wordmark', label: 'Wordmark' });
        }
        if (business?.logoVariants?.dark) {
            options.push({ value: 'dark', label: 'Dark Version' });
        }
        if (business?.logoVariants?.light) {
            options.push({ value: 'light', label: 'Light Version' });
        }
        
        // If no logos at all, show "None available"
        if (options.length === 0) {
            options.push({ value: 'main', label: 'No logo uploaded' });
        }
        
        return options;
    }, [business?.logoUrl, business?.logoVariants]);

    return (
        <div className={`flex flex-col h-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            {/* Header */}
            <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <h2 className={`text-lg font-bold ${styles.textMain}`}>Preview</h2>
                <p className={`text-sm ${styles.textSub}`}>
                    {showPreview ? 'Live Preview' : 'Start chatting to configure'}
                </p>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {showPreview ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Main Pillar Card */}
                        <NeuCard className="relative">
                            {/* Active indicator */}
                            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-brand" />

                            <div className="pt-2 space-y-3">
                                {/* ═══════════════════ IDENTITY ═══════════════════ */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${styles.bgAccent} ${themeConfig.color}`}>
                                            {themeConfig.icon}
                                        </div>
                                        <div>
                                            <h3 className={`text-lg font-bold ${styles.textMain}`}>
                                                {draft.name || 'Untitled Pillar'}
                                            </h3>
                                            <span className={`text-sm ${styles.textSub}`}>{themeConfig.label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule */}
                                {(draft.dayOfWeek !== undefined || isInteractive) && (
                                    <div className="space-y-1 pt-2">
                                        {isInteractive && onFieldChange ? (
                                            <>
                                                <EditableDropdown
                                                    icon={<Calendar size={16} />}
                                                    label="Day"
                                                    value={draft.dayOfWeek?.toString() || '0'}
                                                    options={DAYS.map((d, i) => ({ value: i.toString(), label: d }))}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('dayOfWeek', parseInt(v))}
                                                />
                                                <EditableDropdown
                                                    icon={<Clock size={16} />}
                                                    label="Time"
                                                    value={draft.preferredTime || '12:00'}
                                                    options={TIME_OPTIONS}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('preferredTime', v)}
                                                />
                                            </>
                                        ) : (
                                            <PreviewRow
                                                icon={<Calendar size={16} />}
                                                label="Schedule"
                                                value={`Every ${draft.dayOfWeek !== undefined ? DAYS[draft.dayOfWeek] : 'Day'}${draft.preferredTime ? ` @ ${draft.preferredTime}` : ''}`}
                                                isDark={isDark}
                                                styles={styles}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* ═══════════════════ VISUAL STYLE ═══════════════════ */}
                                {(isInteractive || draft.aspectRatio || draft.sloganProminence || draft.logoVariant) && (
                                    <>
                                        <SectionDivider label="Visual Style" isDark={isDark} styles={styles} />
                                        
                                        {onFieldChange ? (
                                            <>
                                                <EditableDropdown
                                                    icon={<Square size={16} />}
                                                    label="Aspect Ratio"
                                                    value={draft.aspectRatio || '1:1'}
                                                    options={Object.entries(ASPECT_RATIO_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('aspectRatio', v)}
                                                />
                                                <EditableDropdown
                                                    icon={<Type size={16} />}
                                                    label="Slogan"
                                                    value={draft.sloganProminence || 'standard'}
                                                    options={Object.entries(SLOGAN_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('sloganProminence', v)}
                                                />
                                                <EditableDropdown
                                                    icon={<Image size={16} />}
                                                    label="Logo"
                                                    value={draft.logoVariant || 'main'}
                                                    options={availableLogoOptions}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('logoVariant', v)}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {draft.aspectRatio && (
                                                    <PreviewRow
                                                        icon={<Square size={16} />}
                                                        label="Aspect Ratio"
                                                        value={ASPECT_RATIO_LABELS[draft.aspectRatio] || draft.aspectRatio}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                                {draft.sloganProminence && (
                                                    <PreviewRow
                                                        icon={<Type size={16} />}
                                                        label="Slogan"
                                                        value={SLOGAN_LABELS[draft.sloganProminence] || draft.sloganProminence}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                                {draft.logoVariant && (
                                                    <PreviewRow
                                                        icon={<Image size={16} />}
                                                        label="Logo"
                                                        value={LOGO_LABELS[draft.logoVariant] || draft.logoVariant}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                {/* ═══════════════════ DISTRIBUTION ═══════════════════ */}
                                {(isInteractive || draft.platforms?.length || draft.captionMode || draft.hashtagMode) && (
                                    <>
                                        <SectionDivider label="Distribution" isDark={isDark} styles={styles} />
                                        
                                        {onFieldChange ? (
                                            <>
                                                <EditableMultiSelect
                                                    icon={<Target size={16} />}
                                                    label="Platforms"
                                                    values={draft.platforms || []}
                                                    options={Object.entries(PLATFORM_DISPLAY_NAMES).map(([v, l]) => ({ value: v, label: l }))}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('platforms', v)}
                                                />
                                                <EditableDropdown
                                                    icon={<MessageSquare size={16} />}
                                                    label="Captions"
                                                    value={draft.captionMode || 'same'}
                                                    options={Object.entries(CAPTION_MODE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('captionMode', v)}
                                                />
                                                <EditableDropdown
                                                    icon={<Hash size={16} />}
                                                    label="Hashtags"
                                                    value={draft.hashtagMode || 'inherit'}
                                                    options={Object.entries(HASHTAG_MODE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('hashtagMode', v)}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {draft.platforms && draft.platforms.length > 0 && (
                                                    <PreviewRow
                                                        icon={<Target size={16} />}
                                                        label="Platforms"
                                                        value={draft.platforms.map(formatPlatform).join(', ')}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                                {draft.captionMode && (
                                                    <PreviewRow
                                                        icon={<MessageSquare size={16} />}
                                                        label="Captions"
                                                        value={CAPTION_MODE_LABELS[draft.captionMode] || draft.captionMode}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                                {draft.hashtagMode && (
                                                    <PreviewRow
                                                        icon={<Hash size={16} />}
                                                        label="Hashtags"
                                                        value={HASHTAG_MODE_LABELS[draft.hashtagMode] || draft.hashtagMode}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}


                                {/* ═══════════════════ CONTENT STRATEGY ═══════════════════ */}
                                {/* ═══════════════════ CONTENT STRATEGY ═══════════════════ */}
                                {(isInteractive || draft.offeringRotationFrequency || draft.contactProminence || 
                                  draft.generateImage !== undefined || draft.subjectMode) && (
                                    <>
                                        <SectionDivider label="Content Strategy" isDark={isDark} styles={styles} />
                                        
                                        {onFieldChange ? (
                                            <>
                                                <EditableDropdown
                                                    icon={<Package size={16} />}
                                                    label="Offering Rotation"
                                                    value={draft.offeringRotationFrequency || 'never'}
                                                    options={Object.entries(OFFERING_ROTATION_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('offeringRotationFrequency', v)}
                                                />
                                                <EditableDropdown
                                                    icon={<Phone size={16} />}
                                                    label="Contact Info"
                                                    value={draft.contactProminence || 'none'}
                                                    options={Object.entries(CONTACT_PROMINENCE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('contactProminence', v)}
                                                />
                                                <EditableToggle
                                                    icon={<Image size={16} />}
                                                    label="Auto-generate Images"
                                                    value={draft.generateImage ?? true}
                                                    isDark={isDark}
                                                    styles={styles}
                                                    onChange={(v) => onFieldChange('generateImage', v)}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {draft.offeringRotationFrequency && (
                                                    <PreviewRow
                                                        icon={<Package size={16} />}
                                                        label="Offering Rotation"
                                                        value={OFFERING_ROTATION_LABELS[draft.offeringRotationFrequency] || draft.offeringRotationFrequency}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}

                                                {draft.subjectMode && draft.subjectMode !== 'static' && (
                                                    <PreviewRow
                                                        icon={<Repeat size={16} />}
                                                        label="Content Source"
                                                        value={SUBJECT_MODE_LABELS[draft.subjectMode] || draft.subjectMode}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                                
                                                {draft.contactProminence && (
                                                    <PreviewRow
                                                        icon={<Phone size={16} />}
                                                        label="Contact Info"
                                                        value={CONTACT_PROMINENCE_LABELS[draft.contactProminence] || draft.contactProminence}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                                
                                                {draft.generateImage !== undefined && (
                                                    <PreviewRow
                                                        icon={<Image size={16} />}
                                                        label="Auto-generate Images"
                                                        value={draft.generateImage ? 'Yes' : 'No'}
                                                        isDark={isDark}
                                                        styles={styles}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}

                                {/* ═══════════════════ INSTRUCTIONS ═══════════════════ */}
                                {draft.instructions && (
                                    <CollapsibleInstructions 
                                        instructions={draft.instructions} 
                                        isDark={isDark} 
                                        styles={styles} 
                                    />
                                )}
                            </div>
                        </NeuCard>

                        {/* What's Next */}
                        {!canSave && (
                            <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-white/20' : 'border-black/20'
                                }`}>
                                <p className={`text-sm ${styles.textSub} text-center`}>
                                    {!draft.name && 'Tell me what you want to call this pillar...'}
                                    {draft.name && draft.dayOfWeek === undefined && 'Which day should this post?'}
                                    {draft.name && draft.dayOfWeek !== undefined && !draft.platforms?.length && 'Which platforms?'}
                                </p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    /* Empty State */
                    <div className="h-full flex flex-col items-center justify-center text-center px-8">
                        <div className={`w-16 h-16 rounded-full ${styles.bgAccent} flex items-center justify-center mb-4`}>
                            <Sparkles size={28} className="text-brand" />
                        </div>
                        <h3 className={`font-bold ${styles.textMain} mb-2`}>Your pillar will appear here</h3>
                        <p className={`text-sm ${styles.textSub}`}>
                            Start chatting on the left to build your recurring content pillar
                        </p>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <NeuButton
                    variant="primary"
                    onClick={onSave}
                    disabled={!canSave || isSaving}
                    className="w-full"
                >
                    {isSaving ? (
                        <>Saving...</>
                    ) : canSave ? (
                        <>
                            <Check size={18} className="mr-2" />
                            Save Pillar
                        </>
                    ) : (
                        'Complete the chat to save'
                    )}
                </NeuButton>
            </div>
        </div>
    );
};

// Helper component for preview rows
const PreviewRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    isDark: boolean;
    styles: any;
}> = ({ icon, label, value, isDark, styles }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className={styles.textSub}>{icon}</span>
            <span className={`text-sm ${styles.textSub}`}>{label}</span>
        </div>
        <span className={`text-sm font-medium ${styles.textMain} text-right max-w-[50%]`}>{value}</span>
    </div>
);

// Section divider for organizing preview fields
const SectionDivider: React.FC<{
    label: string;
    isDark: boolean;
    styles: any;
}> = ({ label, isDark, styles }) => (
    <div className="flex items-center gap-2 pt-2">
        <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${styles.textSub}`}>{label}</span>
        <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
    </div>
);

// Collapsible instructions block
const CollapsibleInstructions: React.FC<{
    instructions: string;
    isDark: boolean;
    styles: any;
}> = ({ instructions, isDark, styles }) => {
    const [expanded, setExpanded] = useState(false);
    const isLong = instructions.length > 100;
    
    return (
        <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            <button 
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between cursor-pointer"
            >
                <p className={`text-xs font-bold ${styles.textSub}`}>Instructions</p>
                {isLong && (
                    expanded ? <ChevronUp size={14} className={styles.textSub} /> : <ChevronDown size={14} className={styles.textSub} />
                )}
            </button>
            <p className={`text-sm ${styles.textMain} mt-1 ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
                "{instructions}"
            </p>
        </div>
    );
};

// Editable dropdown for inline field editing
const EditableDropdown: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    options: { value: string; label: string }[];
    isDark: boolean;
    styles: any;
    onChange: (value: string) => void;
}> = ({ icon, label, value, options, isDark, styles, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentLabel = options.find(o => o.value === value)?.label || value;
    
    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between py-1 cursor-pointer hover:opacity-80 transition-opacity`}
            >
                <div className="flex items-center gap-2">
                    <span className={styles.textSub}>{icon}</span>
                    <span className={`text-sm ${styles.textSub}`}>{label}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${styles.textMain}`}>{currentLabel}</span>
                    <Pencil size={12} className={`${styles.textSub} opacity-50`} />
                </div>
            </button>
            
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg shadow-xl border ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'}`}
                >
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`w-full px-3 py-2 text-left text-sm ${styles.textMain} hover:bg-brand/10 first:rounded-t-lg last:rounded-b-lg ${opt.value === value ? 'bg-brand/20 font-medium' : ''}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

// Editable toggle for boolean fields
const EditableToggle: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: boolean;
    isDark: boolean;
    styles: any;
    onChange: (value: boolean) => void;
}> = ({ icon, label, value, isDark, styles, onChange }) => (
    <button 
        onClick={() => onChange(!value)}
        className="w-full flex items-center justify-between py-1 cursor-pointer hover:opacity-80 transition-opacity"
    >
        <div className="flex items-center gap-2">
            <span className={styles.textSub}>{icon}</span>
            <span className={`text-sm ${styles.textSub}`}>{label}</span>
        </div>
        <div className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-brand' : isDark ? 'bg-white/20' : 'bg-black/20'} relative`}>
            <motion.div 
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                animate={{ left: value ? '22px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </div>
    </button>
);



// Editable multi-select for platforms
const EditableMultiSelect: React.FC<{
    icon: React.ReactNode;
    label: string;
    values: string[];
    options: { value: string; label: string }[];
    isDark: boolean;
    styles: any;
    onChange: (values: string[]) => void;
}> = ({ icon, label, values = [], options, isDark, styles, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Toggle value
    const handleToggle = (val: string) => {
        const newValues = values.includes(val)
            ? values.filter(v => v !== val)
            : [...values, val];
        onChange(newValues);
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between py-1 cursor-pointer hover:opacity-80 transition-opacity`}
            >
                <div className="flex items-center gap-2">
                    <span className={styles.textSub}>{icon}</span>
                    <span className={`text-sm ${styles.textSub}`}>{label}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${styles.textMain}`}>
                        {values.length === 0 ? 'None' : `${values.length} selected`}
                    </span>
                    <Pencil size={12} className={`${styles.textSub} opacity-50`} />
                </div>
            </button>
            
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-lg shadow-xl border ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'} max-h-60 overflow-y-auto`}
                >
                    {options.map(opt => {
                        const isSelected = values.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                onClick={(e) => { e.stopPropagation(); handleToggle(opt.value); }}
                                className={`w-full px-3 py-2 text-left text-sm ${styles.textMain} hover:bg-brand/10 flex items-center justify-between group first:rounded-t-lg last:rounded-b-lg`}
                            >
                                <span>{opt.label}</span>
                                {isSelected && <Check size={14} className="text-brand" />}
                            </button>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

export default PillarBuilderPreview;
