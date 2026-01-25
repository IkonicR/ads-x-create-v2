/**
 * DropCard — Individual swipeable draft card
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Instagram, Facebook, Linkedin, Twitter, Check, Edit3, SkipForward } from 'lucide-react';
import { PillarDraft } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { NeuButton, NeuIconButton } from '../NeuComponents';

interface DropCardProps {
    draft: PillarDraft;
    pillarName?: string;
    onApprove: () => void;
    onEdit: () => void;
    onSkip: () => void;
}

const platformIcons: Record<string, React.ReactNode> = {
    instagram: <Instagram className="w-4 h-4" />,
    facebook: <Facebook className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
};

export function DropCard({ draft, pillarName, onApprove, onEdit, onSkip }: DropCardProps) {
    const { isDark } = useTheme();

    const scheduledDate = new Date(draft.scheduledFor);
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });

    const scheduledTime = draft.scheduledDatetime
        ? new Date(draft.scheduledDatetime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        })
        : '9:00 AM';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 100 }}
            className={`
                rounded-2xl overflow-hidden
                ${isDark
                    ? 'bg-gray-800/80 border border-gray-700'
                    : 'bg-white border border-gray-200 shadow-lg'
                }
            `}
        >
            {/* Header */}
            <div className={`
                px-4 py-3 flex items-center justify-between
                ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}
            `}>
                <div className="flex items-center gap-3">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formattedDate}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                    <Clock className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {scheduledTime}
                    </span>
                </div>
                {pillarName && (
                    <span className={`
                        text-xs px-2 py-1 rounded-full
                        ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}
                    `}>
                        {pillarName}
                    </span>
                )}
            </div>

            {/* Image Preview */}
            {draft.imageUrl && (
                <div className="aspect-square">
                    <img
                        src={draft.imageUrl}
                        alt="Post preview"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Caption */}
            <div className="p-4">
                <p className={`
                    text-sm leading-relaxed line-clamp-4
                    ${isDark ? 'text-gray-300' : 'text-gray-700'}
                `}>
                    {draft.caption}
                </p>
            </div>

            {/* Platforms */}
            <div className={`
                px-4 py-2 flex items-center gap-2 border-t
                ${isDark ? 'border-gray-700' : 'border-gray-100'}
            `}>
                {draft.platforms?.map(platform => (
                    <span
                        key={platform}
                        className={`
                            p-1.5 rounded-lg
                            ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}
                        `}
                    >
                        {platformIcons[platform.toLowerCase()] || platform}
                    </span>
                ))}
            </div>

            {/* Actions */}
            <div className={`
                p-4 flex items-center gap-2 border-t
                ${isDark ? 'border-gray-700' : 'border-gray-200'}
            `}>
                <NeuButton
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={onApprove}
                >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                </NeuButton>
                <NeuIconButton
                    icon={<Edit3 className="w-4 h-4" />}
                    variant="secondary"
                    size="sm"
                    onClick={onEdit}
                />
                <NeuIconButton
                    icon={<SkipForward className="w-4 h-4" />}
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                />
            </div>
        </motion.div>
    );
}
