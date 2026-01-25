/**
 * PillarBuilderPreview - Right panel live preview of pillar being built
 * 
 * Shows the pillar configuration as it's being created via chat
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PillarDraft } from './PillarBuilder';
import { useThemeStyles, NeuButton, NeuCard } from './NeuComponents';
import {
    Calendar, Repeat, Sparkles, Target, Users,
    MessageSquare, BookOpen, Image, Check, Pencil
} from 'lucide-react';

interface PillarBuilderPreviewProps {
    draft: PillarDraft;
    canSave: boolean;
    isSaving: boolean;
    onSave: () => void;
    onEdit: (field: string) => void;
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

export const PillarBuilderPreview: React.FC<PillarBuilderPreviewProps> = ({
    draft,
    canSave,
    isSaving,
    onSave,
    onEdit,
}) => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

    const themeConfig = THEME_CONFIG[draft.theme || 'custom'] || THEME_CONFIG.custom;
    const hasAnyContent = draft.name || draft.theme || draft.dayOfWeek !== undefined;

    return (
        <div className={`flex flex-col h-full ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
            {/* Header */}
            <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <h2 className={`text-lg font-bold ${styles.textMain}`}>Preview</h2>
                <p className={`text-sm ${styles.textSub}`}>
                    {hasAnyContent ? 'Building your pillar...' : 'Start chatting to see your pillar'}
                </p>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {hasAnyContent ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Main Pillar Card */}
                        <NeuCard className="relative">
                            {/* Active indicator */}
                            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-brand" />

                            <div className="pt-2 space-y-4">
                                {/* Name & Theme */}
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
                                {draft.dayOfWeek !== undefined && (
                                    <PreviewRow
                                        icon={<Calendar size={16} />}
                                        label="Schedule"
                                        value={`Every ${DAYS[draft.dayOfWeek]}`}
                                        isDark={isDark}
                                        styles={styles}
                                    />
                                )}

                                {/* Subject Mode */}
                                {draft.subjectMode && draft.subjectMode !== 'static' && (
                                    <PreviewRow
                                        icon={<Repeat size={16} />}
                                        label="Content Source"
                                        value={SUBJECT_MODE_LABELS[draft.subjectMode] || draft.subjectMode}
                                        isDark={isDark}
                                        styles={styles}
                                    />
                                )}

                                {/* Platforms */}
                                {draft.platforms && draft.platforms.length > 0 && (
                                    <PreviewRow
                                        icon={<MessageSquare size={16} />}
                                        label="Platforms"
                                        value={draft.platforms.join(', ')}
                                        isDark={isDark}
                                        styles={styles}
                                    />
                                )}

                                {/* Image Generation */}
                                {draft.generateImage !== undefined && (
                                    <PreviewRow
                                        icon={<Image size={16} />}
                                        label="Auto-generate images"
                                        value={draft.generateImage ? 'Yes' : 'No'}
                                        isDark={isDark}
                                        styles={styles}
                                    />
                                )}

                                {/* Instructions */}
                                {draft.instructions && (
                                    <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                                        <p className={`text-xs font-bold ${styles.textSub} mb-1`}>Instructions</p>
                                        <p className={`text-sm ${styles.textMain}`}>"{draft.instructions}"</p>
                                    </div>
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
        <span className={`text-sm font-medium ${styles.textMain}`}>{value}</span>
    </div>
);

export default PillarBuilderPreview;
