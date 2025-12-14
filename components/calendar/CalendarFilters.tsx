/**
 * CalendarFilters - Platform and Status Filters
 * 
 * Features:
 * - Platform filter pills (toggle IG, FB, LI, etc.)
 * - Status filter (Scheduled | Published | Failed | All)
 * - Clear filters button when active
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, Facebook, Linkedin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useThemeStyles } from '../NeuComponents';

export interface CalendarFiltersState {
    platforms: string[];
    statuses: string[];
}

interface CalendarFiltersProps {
    filters: CalendarFiltersState;
    onFiltersChange: (filters: CalendarFiltersState) => void;
    availablePlatforms: string[];
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
    instagram: <Instagram size={14} />,
    facebook: <Facebook size={14} />,
    linkedin: <Linkedin size={14} />,
    google: <Calendar size={14} />,
};

const PLATFORM_COLORS: Record<string, string> = {
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    facebook: 'bg-blue-600',
    linkedin: 'bg-blue-700',
    google: 'bg-red-500',
};

const STATUS_OPTIONS = [
    { value: 'scheduled', label: 'Scheduled', icon: <Calendar size={14} />, color: 'text-amber-500' },
    { value: 'published', label: 'Published', icon: <CheckCircle size={14} />, color: 'text-emerald-500' },
    { value: 'failed', label: 'Failed', icon: <AlertCircle size={14} />, color: 'text-red-500' },
];

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
    filters,
    onFiltersChange,
    availablePlatforms,
}) => {
    const { styles } = useThemeStyles();

    const togglePlatform = (platform: string) => {
        const newPlatforms = filters.platforms.includes(platform)
            ? filters.platforms.filter(p => p !== platform)
            : [...filters.platforms, platform];
        onFiltersChange({ ...filters, platforms: newPlatforms });
    };

    const toggleStatus = (status: string) => {
        const newStatuses = filters.statuses.includes(status)
            ? filters.statuses.filter(s => s !== status)
            : [...filters.statuses, status];
        onFiltersChange({ ...filters, statuses: newStatuses });
    };

    const clearFilters = () => {
        onFiltersChange({ platforms: [], statuses: [] });
    };

    const hasActiveFilters = filters.platforms.length > 0 || filters.statuses.length > 0;

    return (
        <div className={`flex flex-wrap items-center gap-3 p-3 rounded-xl ${styles.bg} ${styles.shadowIn} mb-4`}>
            {/* Platform Filters */}
            <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${styles.textSub}`}>Platforms:</span>
                <div className="flex items-center gap-1">
                    {availablePlatforms.map((platform) => {
                        const isActive = filters.platforms.length === 0 || filters.platforms.includes(platform);
                        const Icon = PLATFORM_ICONS[platform.toLowerCase()];

                        return (
                            <motion.button
                                key={platform}
                                onClick={() => togglePlatform(platform)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                                        ? `${PLATFORM_COLORS[platform.toLowerCase()] || 'bg-gray-500'} text-white`
                                        : `${styles.bg} ${styles.shadowOut} ${styles.textSub} opacity-50`
                                    }`}
                            >
                                {Icon}
                                <span className="capitalize">{platform}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Divider */}
            <div className={`w-px h-6 ${styles.border}`} />

            {/* Status Filters */}
            <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${styles.textSub}`}>Status:</span>
                <div className="flex items-center gap-1">
                    {STATUS_OPTIONS.map((status) => {
                        const isActive = filters.statuses.length === 0 || filters.statuses.includes(status.value);

                        return (
                            <motion.button
                                key={status.value}
                                onClick={() => toggleStatus(status.value)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                                        ? `${styles.bg} ${styles.shadowOut} ${status.color}`
                                        : `${styles.bg} ${styles.textSub} opacity-50`
                                    }`}
                            >
                                {status.icon}
                                {status.label}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Clear Filters */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={clearFilters}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${styles.textSub} hover:text-red-500 transition-colors`}
                    >
                        <X size={14} />
                        Clear
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarFilters;
