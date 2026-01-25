/**
 * PostDetailModal V2 - Premium Post Viewer/Editor
 * 
 * Features:
 * - max-w-4xl (larger modal)
 * - Lucide icons for platforms
 * - INLINE expanding date/time pickers (not dropdowns)
 * - Mutual exclusivity (only one picker open at a time)
 * - Only shows connected platforms
 * - Toggleable platform pills
 * - Image carousel with dots + arrows
 * - Hashtag display
 */

import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles, NeuButton, NeuCloseButton } from './NeuComponents';
import {
    Trash2, Save,
    AlertCircle, Check, ChevronLeft, ChevronRight,
    Image as ImageIcon, Hash, Clock, Calendar,
    Instagram, Facebook, Linkedin, MapPin, MessageCircle
} from 'lucide-react';
import { SocialPost } from '../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';

// Platform config with Lucide icons
const PLATFORMS: Record<string, { icon: React.ReactNode; color: string; name: string }> = {
    instagram: { icon: <Instagram size={14} />, color: 'bg-gradient-to-r from-purple-500 to-pink-500', name: 'IG' },
    facebook: { icon: <Facebook size={14} />, color: 'bg-blue-600', name: 'FB' },
    linkedin: { icon: <Linkedin size={14} />, color: 'bg-blue-700', name: 'LI' },
    google: { icon: <MapPin size={14} />, color: 'bg-emerald-600', name: 'GMB' },
    threads: { icon: <MessageCircle size={14} />, color: 'bg-gray-800', name: 'Threads' },
};

// Status config
const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    scheduled: { bg: 'bg-amber-500/15', text: 'text-amber-500', label: 'Scheduled' },
    published: { bg: 'bg-emerald-500/15', text: 'text-emerald-500', label: 'Published' },
    failed: { bg: 'bg-red-500/15', text: 'text-red-500', label: 'Failed' },
    draft: { bg: 'bg-gray-500/15', text: 'text-gray-500', label: 'Draft' },
};

// Time slots (15-min increments)
const TIME_SLOTS: string[] = [];
for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
        TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
}

const formatTime12h = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

interface PostDetailModalProps {
    isOpen: boolean;
    post: SocialPost | null;
    connectedPlatforms?: string[]; // Only show these platforms
    onClose: () => void;
    onSave?: (updatedPost: SocialPost) => Promise<void>;
    onDelete?: (postId: string) => Promise<void>;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
    isOpen,
    post,
    connectedPlatforms = [],
    onClose,
    onSave,
    onDelete,
}) => {
    const { styles } = useThemeStyles();

    // State
    const [editedCaption, setEditedCaption] = useState(post?.summary || '');
    const [editedDate, setEditedDate] = useState<Date | null>(null);
    const [editedTime, setEditedTime] = useState<string>('');
    const [editedPlatforms, setEditedPlatforms] = useState<string[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Picker state - only one can be open at a time
    const [openPicker, setOpenPicker] = useState<'date' | 'time' | null>(null);
    const [viewMonth, setViewMonth] = useState(new Date());

    // Sync state when post changes
    React.useEffect(() => {
        if (post) {
            setEditedCaption(post.summary || '');
            setEditedPlatforms(post.platforms || []);
            setCurrentImageIndex(0);
            setError(null);
            setShowDeleteConfirm(false);
            setOpenPicker(null);

            if (post.scheduledAt) {
                const date = new Date(post.scheduledAt);
                setEditedDate(date);
                setEditedTime(format(date, 'HH:mm'));
                setViewMonth(date);
            } else {
                setEditedDate(null);
                setEditedTime('');
                setViewMonth(new Date());
            }
        }
    }, [post]);

    // Image carousel
    const images = post?.mediaUrls || [];
    const hasMultipleImages = images.length > 1;

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Toggle platform
    const togglePlatform = (platform: string) => {
        setEditedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    // Extract hashtags
    const extractHashtags = (text: string): string[] => {
        const matches = text.match(/#\w+/g);
        return matches || [];
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const monthStart = startOfMonth(viewMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        const days: Date[] = [];
        let day = startDate;
        while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
        }
        return days;
    };

    // Handlers
    const handleDateSelect = (date: Date) => {
        setEditedDate(date);
        setOpenPicker(null);
    };

    const handleTimeSelect = (time: string) => {
        setEditedTime(time);
        setOpenPicker(null);
    };

    const handleSave = async () => {
        if (!onSave || !post) return;
        setIsSaving(true);
        setError(null);

        try {
            let newScheduledAt = post.scheduledAt;
            if (editedDate && editedTime) {
                const [h, m] = editedTime.split(':').map(Number);
                const combined = new Date(editedDate);
                combined.setHours(h, m, 0, 0);
                newScheduledAt = combined.toISOString();
            }

            await onSave({
                ...post,
                summary: editedCaption,
                scheduledAt: newScheduledAt,
                platforms: editedPlatforms,
            });
            onClose();
        } catch (e: any) {
            setError(e.message || 'Failed to save changes');
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (!onDelete || !post) return;
        setIsDeleting(true);
        setError(null);
        try {
            await onDelete(post.id);
            setShowDeleteConfirm(false);
            onClose();
        } catch (e: any) {
            setError(e.message || 'Failed to delete post');
            setIsDeleting(false);
        }
    };

    // Check for changes (only for editable posts)
    const isEditable = post?.status !== 'published';
    const hasChanges = post && isEditable && (
        editedCaption !== post.summary ||
        JSON.stringify(editedPlatforms.sort()) !== JSON.stringify((post.platforms || []).sort()) ||
        (editedDate && editedTime)
    );

    if (!isOpen || !post) return null;

    const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
    const hashtags = extractHashtags(editedCaption);
    const calendarDays = generateCalendarDays();
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Only show platforms that are connected
    const availablePlatforms = connectedPlatforms.length > 0
        ? Object.entries(PLATFORMS).filter(([key]) => connectedPlatforms.includes(key))
        : Object.entries(PLATFORMS).filter(([key]) => editedPlatforms.includes(key));

    // Handle close with unsaved changes warning
    const handleClose = () => {
        if (hasChanges) {
            const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
            if (!confirmed) return;
        }
        onClose();
    };

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-4xl my-8 rounded-3xl overflow-hidden ${styles.bg} ${styles.shadowOut}`}
                    >
                        {/* Close button */}
                        <NeuCloseButton onClick={handleClose} className="absolute top-4 right-4 z-20" />

                        {/* Main content */}
                        <div className="flex flex-col md:flex-row">
                            {/* Left: Image Preview */}
                            <div className="relative md:w-1/2 flex items-center justify-center min-h-[300px] md:min-h-[500px] bg-neutral-100 dark:bg-neutral-900">
                                {images.length > 0 ? (
                                    <>
                                        <AnimatePresence mode="wait">
                                            <motion.img
                                                key={currentImageIndex}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                                src={images[currentImageIndex]}
                                                alt={`Post image ${currentImageIndex + 1}`}
                                                className="w-full h-full object-contain max-h-[500px]"
                                            />
                                        </AnimatePresence>

                                        {hasMultipleImages && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
                                                >
                                                    <ChevronLeft size={22} />
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
                                                >
                                                    <ChevronRight size={22} />
                                                </button>
                                            </>
                                        )}

                                        {hasMultipleImages && (
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full">
                                                {images.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentImageIndex(i)}
                                                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white scale-110' : 'bg-white/40'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className={`flex flex-col items-center justify-center ${styles.textSub}`}>
                                        <ImageIcon size={56} className="mb-3 opacity-30" />
                                        <span className="text-sm">No image</span>
                                    </div>
                                )}
                            </div>

                            {/* Right: Details */}
                            <div className="md:w-1/2 p-6 flex flex-col">
                                {/* Status Badge */}
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-5 self-start ${statusConfig.bg} ${statusConfig.text}`}>
                                    {post.status === 'published' && <Check size={14} />}
                                    {post.status === 'failed' && <AlertCircle size={14} />}
                                    {post.status === 'scheduled' && <Clock size={14} />}
                                    {statusConfig.label}
                                </div>

                                {/* Platforms - Only connected ones */}
                                {availablePlatforms.length > 0 && (
                                    <div className="mb-5">
                                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                                            Platforms
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {availablePlatforms.map(([key, config]) => {
                                                const isActive = editedPlatforms.includes(key);
                                                return (
                                                    <motion.button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => isEditable && togglePlatform(key)}
                                                        whileHover={{ scale: isEditable ? 1.05 : 1 }}
                                                        whileTap={{ scale: isEditable ? 0.95 : 1 }}
                                                        disabled={!isEditable}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isActive
                                                            ? `${config.color} text-white`
                                                            : `${styles.shadowIn} ${styles.textSub}`
                                                            }`}
                                                    >
                                                        {config.icon}
                                                        <span>{config.name}</span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Schedule - INLINE EXPANDING */}
                                <div className="mb-5">
                                    <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${styles.textSub}`}>
                                        Schedule
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Date Picker Trigger */}
                                        <button
                                            type="button"
                                            onClick={() => !isEditable ? null : setOpenPicker(openPicker === 'date' ? null : 'date')}
                                            disabled={!isEditable}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-left ${styles.shadowIn} ${styles.textMain} ${!isEditable ? 'opacity-60' : ''}`}
                                        >
                                            <Calendar size={16} className="text-brand" />
                                            <span className="text-sm font-medium">
                                                {editedDate ? format(editedDate, 'MMM d, yyyy') : 'Select date'}
                                            </span>
                                        </button>

                                        {/* Time Picker Trigger */}
                                        <button
                                            type="button"
                                            onClick={() => !isEditable ? null : setOpenPicker(openPicker === 'time' ? null : 'time')}
                                            disabled={!isEditable}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-left ${styles.shadowIn} ${styles.textMain} ${!isEditable ? 'opacity-60' : ''}`}
                                        >
                                            <Clock size={16} className="text-brand" />
                                            <span className="text-sm font-medium">
                                                {editedTime ? formatTime12h(editedTime) : 'Select time'}
                                            </span>
                                        </button>
                                    </div>

                                    {/* INLINE Date Calendar */}
                                    <AnimatePresence>
                                        {openPicker === 'date' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`mt-3 p-4 rounded-2xl ${styles.shadowIn} overflow-hidden`}
                                            >
                                                {/* Month Nav */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <button type="button" onClick={() => setViewMonth(subMonths(viewMonth, 1))} className={`p-1.5 rounded-lg ${styles.textSub} hover:${styles.textMain}`}>
                                                        <ChevronLeft size={18} />
                                                    </button>
                                                    <span className={`font-bold ${styles.textMain}`}>{format(viewMonth, 'MMMM yyyy')}</span>
                                                    <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className={`p-1.5 rounded-lg ${styles.textSub} hover:${styles.textMain}`}>
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                                {/* Weekdays */}
                                                <div className="grid grid-cols-7 gap-1 mb-1">
                                                    {weekDays.map(d => (
                                                        <div key={d} className={`text-center text-xs font-bold py-1 ${styles.textSub}`}>{d}</div>
                                                    ))}
                                                </div>
                                                {/* Days */}
                                                <div className="grid grid-cols-7 gap-1">
                                                    {calendarDays.map((day, i) => {
                                                        const inMonth = isSameMonth(day, viewMonth);
                                                        const selected = editedDate && isSameDay(day, editedDate);
                                                        const today = isToday(day);
                                                        return (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => handleDateSelect(day)}
                                                                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                                                                    ${!inMonth ? 'opacity-30' : ''}
                                                                    ${selected ? 'bg-brand text-white' : today ? 'text-brand font-bold' : styles.textMain}
                                                                    hover:bg-brand/10
                                                                `}
                                                            >
                                                                {format(day, 'd')}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* INLINE Time Picker */}
                                    <AnimatePresence>
                                        {openPicker === 'time' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`mt-3 p-3 rounded-2xl ${styles.shadowIn} overflow-hidden`}
                                            >
                                                <div className="grid grid-cols-4 gap-1 max-h-[200px] overflow-y-auto">
                                                    {TIME_SLOTS.map(time => (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            onClick={() => handleTimeSelect(time)}
                                                            className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors
                                                                ${time === editedTime ? 'bg-brand text-white' : `${styles.textMain} hover:bg-brand/10`}
                                                            `}
                                                        >
                                                            {formatTime12h(time)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Caption */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${styles.textSub}`}>Caption</label>
                                        <span className={`text-xs ${styles.textSub}`}>{editedCaption.length} chars</span>
                                    </div>
                                    <textarea
                                        value={editedCaption}
                                        onChange={(e) => setEditedCaption(e.target.value)}
                                        rows={4}
                                        disabled={!isEditable}
                                        className={`w-full px-4 py-3 rounded-2xl text-sm ${styles.shadowIn} ${styles.textMain} bg-transparent outline-none resize-none ${!isEditable ? 'opacity-60' : ''}`}
                                        placeholder="Enter post caption..."
                                    />
                                </div>

                                {/* Hashtags */}
                                {hashtags.length > 0 && (
                                    <div className="mb-4">
                                        <label className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${styles.textSub}`}>
                                            <Hash size={12} /> Hashtags ({hashtags.length})
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {hashtags.slice(0, 6).map((tag, i) => (
                                                <span key={i} className="px-2 py-1 rounded-lg text-xs font-medium text-brand bg-brand/10">{tag}</span>
                                            ))}
                                            {hashtags.length > 6 && <span className={`px-2 py-1 text-xs ${styles.textSub}`}>+{hashtags.length - 6}</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {error && (
                                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />{error}
                                    </div>
                                )}

                                {/* Delete Confirm */}
                                <AnimatePresence>
                                    {showDeleteConfirm && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                                        >
                                            <p className="text-sm font-bold text-red-500 mb-3">Delete this post permanently?</p>
                                            <div className="flex gap-2">
                                                <NeuButton variant="danger" onClick={handleDelete} disabled={isDeleting} className="flex-1">
                                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                                </NeuButton>
                                                <NeuButton onClick={() => setShowDeleteConfirm(false)} className="flex-1">Cancel</NeuButton>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Actions */}
                                {!showDeleteConfirm && (
                                    <div className="flex gap-3 mt-auto pt-4">
                                        {isEditable && onSave && (
                                            <NeuButton variant="primary" onClick={handleSave} disabled={isSaving || !hasChanges} className="flex-1">
                                                <Save size={16} className="mr-2" />
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </NeuButton>
                                        )}
                                        {onDelete && isEditable && (
                                            <NeuButton onClick={() => setShowDeleteConfirm(true)} className="!text-red-500">
                                                <Trash2 size={16} />
                                            </NeuButton>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default PostDetailModal;
