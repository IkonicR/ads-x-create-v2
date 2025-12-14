/**
 * CalendarHeader - Navigation + View Toggle
 * 
 * Features:
 * - Prev/Next/Today navigation with NeuButton
 * - View toggle pills (Month | Week | Day) with animated indicator
 * - Date range label
 * - Sync button + connection status
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff, Settings } from 'lucide-react';
import { NeuButton, useThemeStyles } from '../NeuComponents';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type CalendarViewMode = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
    currentDate: Date;
    viewMode: CalendarViewMode;
    onViewModeChange: (mode: CalendarViewMode) => void;
    onNavigate: (direction: 'prev' | 'next' | 'today') => void;
    onSync?: () => void;
    onSettingsClick?: () => void;
    isSyncing?: boolean;
    isConnected?: boolean;
    lastSyncTime?: string | null;
}

const VIEW_MODES: { value: CalendarViewMode; label: string }[] = [
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
    currentDate,
    viewMode,
    onViewModeChange,
    onNavigate,
    onSync,
    onSettingsClick,
    isSyncing = false,
    isConnected = false,
    lastSyncTime,
}) => {
    const { styles } = useThemeStyles();

    // Get date range label based on view mode
    const getDateLabel = () => {
        switch (viewMode) {
            case 'month':
                return format(currentDate, 'MMMM yyyy');
            case 'week': {
                const start = startOfWeek(currentDate, { weekStartsOn: 1 });
                const end = endOfWeek(currentDate, { weekStartsOn: 1 });
                if (start.getMonth() === end.getMonth()) {
                    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
                }
                return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
            }
            case 'day':
                return format(currentDate, 'EEEE, MMMM d, yyyy');
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            {/* Left: Navigation */}
            <div className="flex items-center gap-3">
                {/* Prev/Next */}
                <div className="flex items-center gap-1">
                    <NeuButton
                        onClick={() => onNavigate('prev')}
                        className="!p-2 !rounded-xl"
                    >
                        <ChevronLeft size={20} />
                    </NeuButton>
                    <NeuButton
                        onClick={() => onNavigate('next')}
                        className="!p-2 !rounded-xl"
                    >
                        <ChevronRight size={20} />
                    </NeuButton>
                </div>

                {/* Today Button */}
                <NeuButton
                    onClick={() => onNavigate('today')}
                    className="!px-4 !py-2 !text-sm"
                >
                    Today
                </NeuButton>

                {/* Date Label */}
                <h2 className={`text-xl font-bold ${styles.textMain} ml-2`}>
                    {getDateLabel()}
                </h2>
            </div>

            {/* Right: View Toggle + Actions */}
            <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className={`relative flex items-center gap-1 p-1 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
                    {VIEW_MODES.map((mode) => (
                        <button
                            key={mode.value}
                            onClick={() => onViewModeChange(mode.value)}
                            className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === mode.value
                                    ? 'text-white'
                                    : `${styles.textSub} hover:${styles.textMain}`
                                }`}
                        >
                            {mode.label}
                            {viewMode === mode.value && (
                                <motion.div
                                    layoutId="viewModeIndicator"
                                    className="absolute inset-0 bg-brand rounded-lg -z-10"
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Sync Button */}
                {onSync && (
                    <NeuButton
                        onClick={onSync}
                        disabled={isSyncing}
                        className="!px-4 !py-2"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync'}
                    </NeuButton>
                )}

                {/* Settings Button */}
                {onSettingsClick && (
                    <NeuButton
                        onClick={onSettingsClick}
                        className="!p-2 !rounded-xl"
                    >
                        <Settings size={20} />
                    </NeuButton>
                )}

                {/* Connection Status */}
                <div className={`px-3 py-2 rounded-full text-xs font-bold border flex items-center gap-2 ${isConnected
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
                    }`}>
                    {isConnected ? (
                        <>
                            <Wifi className="w-3 h-3" />
                            <span className="hidden sm:inline">LIVE</span>
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-3 h-3" />
                            <span className="hidden sm:inline">OFFLINE</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;
