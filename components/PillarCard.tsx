/**
 * PillarCard - Display component for a single Content Pillar
 * 
 * Shows pillar name, theme, schedule, and active state with toggle.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ContentPillar, PillarTheme } from '../types';
import { NeuCard, useThemeStyles } from './NeuComponents';
import {
    Calendar, Clock, Repeat, Sparkles, Target, Users,
    MessageSquare, BookOpen, Pencil, Play, Pause, Trash2
} from 'lucide-react';

interface PillarCardProps {
    pillar: ContentPillar;
    onEdit: (pillar: ContentPillar) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
    onDelete: (id: string) => void;
}

// Theme icons and colors
const THEME_CONFIG: Record<PillarTheme, { icon: React.ReactNode; color: string; label: string }> = {
    motivation: { icon: <Sparkles size={16} />, color: 'text-yellow-500', label: 'Motivation' },
    product: { icon: <Target size={16} />, color: 'text-blue-500', label: 'Product Spotlight' },
    team: { icon: <Users size={16} />, color: 'text-green-500', label: 'Meet the Team' },
    testimonial: { icon: <MessageSquare size={16} />, color: 'text-pink-500', label: 'Testimonial' },
    educational: { icon: <BookOpen size={16} />, color: 'text-purple-500', label: 'Educational' },
    custom: { icon: <Calendar size={16} />, color: 'text-gray-500', label: 'Custom' },
};

// Day names
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PillarCard: React.FC<PillarCardProps> = ({
    pillar,
    onEdit,
    onToggleActive,
    onDelete
}) => {
    const { styles } = useThemeStyles();
    const themeConfig = THEME_CONFIG[pillar.theme] || THEME_CONFIG.custom;

    // Format schedule display
    const scheduleText = pillar.scheduleType === 'weekly' && pillar.dayOfWeek !== undefined
        ? `Every ${DAYS[pillar.dayOfWeek]}`
        : pillar.scheduleType === 'monthly' && pillar.dayOfMonth
            ? `Day ${pillar.dayOfMonth} of month`
            : 'Not scheduled';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            <NeuCard
                className={`relative transition-all duration-300 ${pillar.isActive ? '' : 'opacity-60'
                    }`}
            >
                {/* Active indicator bar */}
                <div
                    className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl transition-colors ${pillar.isActive ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                />

                <div className="pt-2">
                    {/* Header: Theme badge + Name */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${styles.bgAccent} ${themeConfig.color}`}>
                                {themeConfig.icon}
                            </div>
                            <div>
                                <h3 className={`font-bold ${styles.textMain}`}>{pillar.name}</h3>
                                <span className={`text-xs ${styles.textSub}`}>{themeConfig.label}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onEdit(pillar)}
                                className={`p-2 rounded-lg transition-colors ${styles.bgAccent} hover:bg-brand/10`}
                                title="Edit"
                            >
                                <Pencil size={14} className={styles.textSub} />
                            </button>
                            <button
                                onClick={() => onToggleActive(pillar.id, !pillar.isActive)}
                                className={`p-2 rounded-lg transition-colors ${pillar.isActive
                                        ? 'bg-brand/10 text-brand hover:bg-brand/20'
                                        : `${styles.bgAccent} ${styles.textSub} hover:text-brand`
                                    }`}
                                title={pillar.isActive ? 'Pause' : 'Activate'}
                            >
                                {pillar.isActive ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button
                                onClick={() => onDelete(pillar.id)}
                                className={`p-2 rounded-lg transition-colors ${styles.bgAccent} hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30`}
                                title="Delete"
                            >
                                <Trash2 size={14} className={styles.textSub} />
                            </button>
                        </div>
                    </div>

                    {/* Schedule info */}
                    <div className={`flex items-center gap-4 text-sm ${styles.textSub}`}>
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>{scheduleText}</span>
                        </div>
                        {pillar.subjectMode !== 'static' && (
                            <div className="flex items-center gap-1.5">
                                <Repeat size={14} />
                                <span className="capitalize">{pillar.subjectMode.replace('rotate_', 'Rotating ')}</span>
                            </div>
                        )}
                    </div>

                    {/* Platforms */}
                    {pillar.platforms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {pillar.platforms.map(platform => (
                                <span
                                    key={platform}
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${styles.bgAccent} ${styles.textSub}`}
                                >
                                    {platform}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </NeuCard>
        </motion.div>
    );
};

export default PillarCard;
