/**
 * DropOverlay — Full-screen overlay for batch review
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCheck, Sparkles } from 'lucide-react';
import { PillarDraft, ContentPillar } from '../../types';
import { PillarService } from '../../services/pillarService';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { NeuButton, NeuIconButton } from '../NeuComponents';
import { DropCard } from './DropCard';
import { DropEditModal } from './DropEditModal';

interface DropOverlayProps {
    batchId: string;
    startDate: string;
    endDate: string;
    onClose: () => void;
}

export function DropOverlay({ batchId, startDate, endDate, onClose }: DropOverlayProps) {
    const { isDark } = useTheme();
    const { addNotification } = useNotification();

    const [drafts, setDrafts] = useState<PillarDraft[]>([]);
    const [pillars, setPillars] = useState<Map<string, ContentPillar>>(new Map());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editingDraft, setEditingDraft] = useState<PillarDraft | null>(null);

    useEffect(() => {
        loadDrafts();
    }, [batchId]);

    async function loadDrafts() {
        try {
            const batchDrafts = await PillarService.getDraftsByBatch(batchId);
            setDrafts(batchDrafts.filter(d => d.status === 'pending'));

            // Load pillar names
            const pillarIds = [...new Set(batchDrafts.map(d => d.pillarId))];
            const pillarMap = new Map<string, ContentPillar>();
            for (const id of pillarIds) {
                const pillar = await PillarService.getPillar(id);
                if (pillar) pillarMap.set(id, pillar);
            }
            setPillars(pillarMap);
        } catch (err) {
            console.error('[DropOverlay] Error loading drafts:', err);
            addNotification({ type: 'error', message: 'Failed to load drafts' });
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(draft: PillarDraft) {
        try {
            await PillarService.approveDraft(draft.id);
            setDrafts(prev => prev.filter(d => d.id !== draft.id));

            if (drafts.length <= 1) {
                addNotification({ type: 'success', message: 'All drafts approved! 🎉' });
                onClose();
            }
        } catch (err) {
            addNotification({ type: 'error', message: 'Failed to approve draft' });
        }
    }

    async function handleSkip(draft: PillarDraft) {
        try {
            await PillarService.skipDraft(draft.id);
            setDrafts(prev => prev.filter(d => d.id !== draft.id));

            if (drafts.length <= 1) {
                onClose();
            }
        } catch (err) {
            addNotification({ type: 'error', message: 'Failed to skip draft' });
        }
    }

    async function handleApproveAll() {
        try {
            const count = await PillarService.approveAllInBatch(batchId);
            addNotification({ type: 'success', message: `${count} drafts approved! 🚀` });
            onClose();
        } catch (err) {
            addNotification({ type: 'error', message: 'Failed to approve all' });
        }
    }

    async function handleEditSave(updates: { caption?: string; scheduledDatetime?: string }) {
        if (!editingDraft) return;

        try {
            const updated = await PillarService.updateDraft(editingDraft.id, updates);
            setDrafts(prev => prev.map(d => d.id === updated.id ? updated : d));
            setEditingDraft(null);
        } catch (err) {
            addNotification({ type: 'error', message: 'Failed to save changes' });
        }
    }

    const dateRange = formatDateRange(startDate, endDate);
    const pendingCount = drafts.length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`
                    relative w-full max-w-md mx-4 max-h-[90vh] flex flex-col
                    rounded-3xl overflow-hidden
                    ${isDark ? 'bg-gray-900' : 'bg-gray-50'}
                `}
            >
                {/* Header */}
                <div className={`
                    px-6 py-4 flex items-center justify-between border-b
                    ${isDark ? 'border-gray-800' : 'border-gray-200'}
                `}>
                    <div>
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Week of {dateRange}
                        </h2>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {pendingCount} posts to review
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <NeuButton
                            variant="primary"
                            size="sm"
                            onClick={handleApproveAll}
                        >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Approve All
                        </NeuButton>
                        <NeuIconButton
                            icon={<X className="w-5 h-5" />}
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        />
                    </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Sparkles className={`w-8 h-8 animate-pulse ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                All caught up! 🎉
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {drafts.map((draft) => (
                                    <DropCard
                                        key={draft.id}
                                        draft={draft}
                                        pillarName={pillars.get(draft.pillarId)?.name}
                                        onApprove={() => handleApprove(draft)}
                                        onEdit={() => setEditingDraft(draft)}
                                        onSkip={() => handleSkip(draft)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Progress */}
                {pendingCount > 0 && (
                    <div className={`
                        px-6 py-3 text-center text-sm border-t
                        ${isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'}
                    `}>
                        {pendingCount} remaining
                    </div>
                )}
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingDraft && (
                    <DropEditModal
                        draft={editingDraft}
                        onClose={() => setEditingDraft(null)}
                        onSave={handleEditSave}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return startDate.toLocaleDateString('en-US', options);
}
