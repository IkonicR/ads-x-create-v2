/**
 * DropEditModal — Modal for editing draft caption and scheduled time
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RefreshCw } from 'lucide-react';
import { PillarDraft } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { NeuButton, NeuIconButton, NeuInput } from '../NeuComponents';

interface DropEditModalProps {
    draft: PillarDraft;
    onClose: () => void;
    onSave: (updates: { caption?: string; scheduledDatetime?: string }) => void;
}

export function DropEditModal({ draft, onClose, onSave }: DropEditModalProps) {
    const { isDark } = useTheme();
    const [caption, setCaption] = useState(draft.caption);
    const [time, setTime] = useState(() => {
        if (draft.scheduledDatetime) {
            return new Date(draft.scheduledDatetime).toTimeString().slice(0, 5);
        }
        return '09:00';
    });
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);

        // Build scheduled datetime from date + new time
        const scheduledDatetime = draft.scheduledDatetime
            ? (() => {
                const date = new Date(draft.scheduledDatetime);
                const [hours, minutes] = time.split(':').map(Number);
                date.setHours(hours, minutes, 0, 0);
                return date.toISOString();
            })()
            : undefined;

        await onSave({
            caption: caption !== draft.caption ? caption : undefined,
            scheduledDatetime,
        });

        setSaving(false);
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`
                    relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden
                    ${isDark ? 'bg-gray-800' : 'bg-white'}
                `}
            >
                {/* Header */}
                <div className={`
                    px-5 py-4 flex items-center justify-between border-b
                    ${isDark ? 'border-gray-700' : 'border-gray-200'}
                `}>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Edit Draft
                    </h3>
                    <NeuIconButton
                        icon={<X className="w-5 h-5" />}
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                    />
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Caption */}
                    <div>
                        <label className={`
                            block text-sm font-medium mb-2
                            ${isDark ? 'text-gray-300' : 'text-gray-700'}
                        `}>
                            Caption
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            rows={6}
                            className={`
                                w-full px-4 py-3 rounded-xl resize-none
                                ${isDark
                                    ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                                    : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-purple-500'
                                }
                                border focus:outline-none focus:ring-2 focus:ring-purple-500/20
                                transition-colors
                            `}
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <label className={`
                            block text-sm font-medium mb-2
                            ${isDark ? 'text-gray-300' : 'text-gray-700'}
                        `}>
                            Posting Time
                        </label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className={`
                                w-full px-4 py-3 rounded-xl
                                ${isDark
                                    ? 'bg-gray-700 text-white border-gray-600'
                                    : 'bg-gray-50 text-gray-900 border-gray-200'
                                }
                                border focus:outline-none focus:ring-2 focus:ring-purple-500/20
                            `}
                        />
                    </div>

                    {/* TODO: Regenerate buttons */}
                    <div className={`
                        pt-2 flex gap-2 border-t
                        ${isDark ? 'border-gray-700' : 'border-gray-100'}
                    `}>
                        <button
                            disabled
                            className={`
                                flex items-center gap-2 text-sm px-3 py-2 rounded-lg
                                ${isDark ? 'text-gray-500 bg-gray-700/50' : 'text-gray-400 bg-gray-100'}
                                opacity-50 cursor-not-allowed
                            `}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Regenerate Caption (Coming Soon)
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className={`
                    px-5 py-4 flex justify-end gap-2 border-t
                    ${isDark ? 'border-gray-700' : 'border-gray-200'}
                `}>
                    <NeuButton variant="secondary" onClick={onClose}>
                        Cancel
                    </NeuButton>
                    <NeuButton
                        variant="primary"
                        onClick={handleSave}
                        loading={saving}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </NeuButton>
                </div>
            </motion.div>
        </motion.div>
    );
}
