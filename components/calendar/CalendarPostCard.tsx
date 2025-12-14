/**
 * CalendarPostCard - Post representation with thumbnails
 * 
 * Variants:
 * - Month: Thumbnail only (32x32) + platform icon badge
 * - Week: Thumbnail (48x48) + time + caption (1 line)
 * - Day: Large (full width) + thumbnail (80px) + caption (2 lines) + quick actions
 * 
 * Quick Actions (hover):
 * - Edit - Opens PostDetailModal
 * - Delete - Confirmation then delete
 * - Duplicate - Copy to draft
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Instagram, Facebook, Linkedin, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useThemeStyles } from '../NeuComponents';
import { SocialPost } from '../../types';
import { format } from 'date-fns';

export type PostCardVariant = 'month' | 'week' | 'day';

interface CalendarPostCardProps {
    post: SocialPost;
    variant: PostCardVariant;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isDragging?: boolean;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
    instagram: <Instagram size={10} />,
    facebook: <Facebook size={10} />,
    linkedin: <Linkedin size={10} />,
    google: <Calendar size={10} />,
};

const STATUS_STYLES: Record<string, { bg: string; dot: string; text: string }> = {
    scheduled: { bg: 'bg-amber-500/10', dot: 'bg-amber-500', text: 'text-amber-500' },
    published: { bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', text: 'text-emerald-500' },
    failed: { bg: 'bg-red-500/10', dot: 'bg-red-500', text: 'text-red-500' },
    draft: { bg: 'bg-gray-500/10', dot: 'bg-gray-500', text: 'text-gray-500' },
};

export const CalendarPostCard: React.FC<CalendarPostCardProps> = ({
    post,
    variant,
    onClick,
    onEdit,
    onDelete,
    isDragging = false,
}) => {
    const { styles } = useThemeStyles();
    const [showActions, setShowActions] = useState(false);

    const thumbnail = post.mediaUrls?.[0];
    const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.draft;
    const time = post.scheduledAt ? format(new Date(post.scheduledAt), 'h:mm a') : '';

    // Month variant: Compact thumbnail only
    if (variant === 'month') {
        return (
            <motion.div
                onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                onHoverStart={() => setShowActions(true)}
                onHoverEnd={() => setShowActions(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-8 h-8 rounded-md overflow-hidden cursor-pointer ${isDragging ? 'opacity-50' : ''
                    } ${styles.shadowOut}`}
            >
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className={`w-full h-full ${statusStyle.bg} flex items-center justify-center`}>
                        <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                    </div>
                )}

                {/* Platform badge */}
                {post.platforms?.[0] && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                        {PLATFORM_ICONS[post.platforms[0].toLowerCase()]}
                    </div>
                )}
            </motion.div>
        );
    }

    // Week variant: Thumbnail + time + caption
    if (variant === 'week') {
        return (
            <motion.div
                onClick={onClick}
                onHoverStart={() => setShowActions(true)}
                onHoverEnd={() => setShowActions(false)}
                whileHover={{ y: -2 }}
                className={`relative flex items-center gap-2 p-2 rounded-xl cursor-pointer ${isDragging ? 'opacity-50' : ''
                    } ${styles.bg} ${styles.shadowOut} ${statusStyle.bg}`}
            >
                {/* Thumbnail */}
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        loading="lazy"
                    />
                ) : (
                    <div className={`w-12 h-12 rounded-lg ${styles.bgAccent} flex items-center justify-center flex-shrink-0`}>
                        <div className={`w-3 h-3 rounded-full ${statusStyle.dot}`} />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Time + Status */}
                    <div className="flex items-center gap-2 text-xs">
                        <Clock size={10} className={statusStyle.text} />
                        <span className={statusStyle.text}>{time}</span>
                        {/* Platform badges */}
                        <div className="flex items-center gap-1">
                            {post.platforms?.slice(0, 3).map((p, i) => (
                                <span key={i} className={styles.textSub}>
                                    {PLATFORM_ICONS[p.toLowerCase()]}
                                </span>
                            ))}
                        </div>
                    </div>
                    {/* Caption preview */}
                    <p className={`text-xs ${styles.textMain} truncate mt-1`}>
                        {post.summary || 'No caption'}
                    </p>
                </div>

                {/* Quick actions on hover */}
                {showActions && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
                    >
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                className={`p-1.5 rounded-lg ${styles.bg} ${styles.shadowOut} hover:text-brand transition-colors`}
                                title="Edit"
                            >
                                <Pencil size={12} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className={`p-1.5 rounded-lg ${styles.bg} ${styles.shadowOut} hover:text-red-500 transition-colors`}
                                title="Delete"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </motion.div>
                )}
            </motion.div>
        );
    }

    // Day variant: Full card with large thumbnail
    return (
        <motion.div
            onClick={onClick}
            onHoverStart={() => setShowActions(true)}
            onHoverEnd={() => setShowActions(false)}
            whileHover={{ y: -2 }}
            className={`relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer ${isDragging ? 'opacity-50' : ''
                } ${styles.bg} ${styles.shadowOut}`}
        >
            {/* Large Thumbnail */}
            {thumbnail ? (
                <img
                    src={thumbnail}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    loading="lazy"
                />
            ) : (
                <div className={`w-20 h-20 rounded-xl ${styles.bgAccent} flex items-center justify-center flex-shrink-0`}>
                    <div className={`w-4 h-4 rounded-full ${statusStyle.dot}`} />
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Header: Time + Status + Platforms */}
                <div className="flex items-center gap-3 mb-2">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {post.status === 'published' && <CheckCircle size={12} />}
                        {post.status === 'scheduled' && <Clock size={12} />}
                        {post.status === 'failed' && <AlertCircle size={12} />}
                        <span className="capitalize">{post.status}</span>
                        {time && <span>• {time}</span>}
                    </div>

                    {/* Platform badges */}
                    <div className="flex items-center gap-1">
                        {post.platforms?.map((p, i) => (
                            <span
                                key={i}
                                className={`p-1.5 rounded-full ${styles.bgAccent} ${styles.textSub}`}
                            >
                                {PLATFORM_ICONS[p.toLowerCase()]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Caption preview - 2 lines */}
                <p className={`text-sm ${styles.textMain} line-clamp-2`}>
                    {post.summary || 'No caption'}
                </p>

                {/* Media count if carousel */}
                {post.mediaUrls && post.mediaUrls.length > 1 && (
                    <p className={`text-xs ${styles.textSub} mt-2`}>
                        +{post.mediaUrls.length - 1} more images
                    </p>
                )}
            </div>

            {/* Quick actions */}
            {showActions && (
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute right-4 top-4 flex items-center gap-2"
                >
                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} hover:text-brand transition-colors`}
                            title="Edit"
                        >
                            <Pencil size={16} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className={`p-2 rounded-xl ${styles.bg} ${styles.shadowOut} hover:text-red-500 transition-colors`}
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
};

export default CalendarPostCard;
