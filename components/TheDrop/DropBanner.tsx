/**
 * DropBanner — Notification banner shown in Planner when pending batches exist
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ChevronRight } from 'lucide-react';
import { PillarService } from '../../services/pillarService';
import { useTheme } from '../../context/ThemeContext';
import { NeuButton } from '../NeuComponents';

interface PendingBatch {
    batchId: string;
    count: number;
    startDate: string;
    endDate: string;
}

interface DropBannerProps {
    businessId: string;
    onReviewClick: (batch: PendingBatch) => void;
}

export function DropBanner({ businessId, onReviewClick }: DropBannerProps) {
    const { isDark } = useTheme();
    const [batches, setBatches] = useState<PendingBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!businessId) return;

        const loadBatches = async () => {
            try {
                const pending = await PillarService.getPendingBatches(businessId);
                setBatches(pending);
            } catch (err) {
                console.error('[DropBanner] Error loading batches:', err);
            } finally {
                setLoading(false);
            }
        };

        loadBatches();
    }, [businessId]);

    if (loading || batches.length === 0) return null;

    const batch = batches[0]; // Show first pending batch
    const dateRange = formatDateRange(batch.startDate, batch.endDate);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`
                    relative overflow-hidden rounded-2xl mb-6
                    ${isDark
                        ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30'
                        : 'bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-300'
                    }
                `}
            >
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative p-5 flex items-center gap-4">
                    {/* Icon */}
                    <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${isDark ? 'bg-purple-500/20' : 'bg-purple-200'}
                    `}>
                        <Gift className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Your Weekly Drop is Ready 🎁
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {batch.count} posts for {dateRange}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <NeuButton
                            variant="primary"
                            size="sm"
                            onClick={() => onReviewClick(batch)}
                        >
                            Review Now
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </NeuButton>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);

    if (startStr === endStr) return startStr;
    return `${startStr} - ${endStr}`;
}
