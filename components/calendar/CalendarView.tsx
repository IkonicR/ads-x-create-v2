/**
 * CalendarView - Main Calendar Component
 * 
 * Orchestrates all calendar sub-components:
 * - CalendarHeader (navigation, view toggle)
 * - CalendarFilters (platform/status filters)
 * - CalendarMonthGrid / CalendarWeekGrid / CalendarDayGrid
 * 
 * Features:
 * - View switching with Framer Motion transitions
 * - Filtering support
 * - Date navigation
 * - Post interactions
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles } from '../NeuComponents';
import { SocialPost } from '../../types';
import { CalendarHeader, CalendarViewMode } from './CalendarHeader';
import { CalendarFilters, CalendarFiltersState } from './CalendarFilters';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarWeekGrid } from './CalendarWeekGrid';
import { CalendarDayGrid } from './CalendarDayGrid';
import {
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays,
    startOfToday
} from 'date-fns';

interface CalendarViewProps {
    posts: SocialPost[];
    onPostClick?: (post: SocialPost) => void;
    onPostEdit?: (post: SocialPost) => void;
    onPostDelete?: (post: SocialPost) => void;
    onDateClick?: (date: Date) => void;
    onSync?: () => void;
    onSettingsClick?: () => void;
    isSyncing?: boolean;
    isConnected?: boolean;
    lastSyncTime?: string | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    posts,
    onPostClick,
    onPostEdit,
    onPostDelete,
    onDateClick,
    onSync,
    onSettingsClick,
    isSyncing = false,
    isConnected = false,
    lastSyncTime,
}) => {
    const { styles } = useThemeStyles();

    // State
    const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
    const [currentDate, setCurrentDate] = useState<Date>(startOfToday());
    const [filters, setFilters] = useState<CalendarFiltersState>({
        platforms: [],
        statuses: [],
    });

    // Get unique platforms from posts
    const availablePlatforms = useMemo(() => {
        const platforms = new Set<string>();
        posts.forEach(post => {
            post.platforms?.forEach(p => platforms.add(p));
        });
        return Array.from(platforms);
    }, [posts]);

    // Filter posts based on current filters
    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            // Filter by platforms
            if (filters.platforms.length > 0) {
                const hasMatchingPlatform = post.platforms?.some(p =>
                    filters.platforms.includes(p)
                );
                if (!hasMatchingPlatform) return false;
            }

            // Filter by status
            if (filters.statuses.length > 0) {
                if (!filters.statuses.includes(post.status)) return false;
            }

            return true;
        });
    }, [posts, filters]);

    // Navigation handlers
    const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setCurrentDate(startOfToday());
            return;
        }

        const isPrev = direction === 'prev';

        switch (viewMode) {
            case 'month':
                setCurrentDate(prev => isPrev ? subMonths(prev, 1) : addMonths(prev, 1));
                break;
            case 'week':
                setCurrentDate(prev => isPrev ? subWeeks(prev, 1) : addWeeks(prev, 1));
                break;
            case 'day':
                setCurrentDate(prev => isPrev ? subDays(prev, 1) : addDays(prev, 1));
                break;
        }
    }, [viewMode]);

    // Handle date click (navigate to day view for that date)
    const handleDateClick = useCallback((date: Date) => {
        setCurrentDate(date);
        if (viewMode === 'month') {
            setViewMode('day');
        }
        onDateClick?.(date);
    }, [viewMode, onDateClick]);

    // Animation variants for view transitions
    const viewTransition = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <CalendarHeader
                currentDate={currentDate}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onNavigate={handleNavigate}
                onSync={onSync}
                onSettingsClick={onSettingsClick}
                isSyncing={isSyncing}
                isConnected={isConnected}
                lastSyncTime={lastSyncTime}
            />

            {/* Filters */}
            {availablePlatforms.length > 0 && (
                <CalendarFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    availablePlatforms={availablePlatforms}
                />
            )}

            {/* Calendar Grid */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={viewMode}
                    variants={viewTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                >
                    {viewMode === 'month' && (
                        <CalendarMonthGrid
                            currentDate={currentDate}
                            posts={filteredPosts}
                            onDateClick={handleDateClick}
                            onPostClick={onPostClick}
                            onPostEdit={onPostEdit}
                            onPostDelete={onPostDelete}
                        />
                    )}

                    {viewMode === 'week' && (
                        <CalendarWeekGrid
                            currentDate={currentDate}
                            posts={filteredPosts}
                            onDateClick={handleDateClick}
                            onPostClick={onPostClick}
                            onPostEdit={onPostEdit}
                            onPostDelete={onPostDelete}
                        />
                    )}

                    {viewMode === 'day' && (
                        <CalendarDayGrid
                            currentDate={currentDate}
                            posts={filteredPosts}
                            onPostClick={onPostClick}
                            onPostEdit={onPostEdit}
                            onPostDelete={onPostDelete}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Empty state */}
            {filteredPosts.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-center py-16 rounded-2xl ${styles.bg} ${styles.shadowIn}`}
                >
                    <div className={`text-6xl mb-4`}>📅</div>
                    <h3 className={`text-xl font-bold ${styles.textMain} mb-2`}>
                        No Posts Scheduled
                    </h3>
                    <p className={`text-sm ${styles.textSub}`}>
                        {filters.platforms.length > 0 || filters.statuses.length > 0
                            ? 'Try adjusting your filters to see more posts'
                            : 'Create your first post to see it here'
                        }
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default CalendarView;
