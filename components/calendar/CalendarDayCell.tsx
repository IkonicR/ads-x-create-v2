/**
 * CalendarDayCell - Individual day cell for month view
 * 
 * Features:
 * - Day number (top left), today highlighted with brand ring
 * - Post thumbnails (small 32x32 squares, max 4 visible)
 * - Overflow badge: "+X more"
 * - Droppable zone with visual feedback
 * - Hover: subtle elevation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from '../NeuComponents';
import { SocialPost } from '../../types';
import { CalendarPostCard } from './CalendarPostCard';
import { isToday, isSameMonth } from 'date-fns';

interface CalendarDayCellProps {
    date: Date;
    currentMonth: Date;
    posts: SocialPost[];
    onDateClick?: (date: Date) => void;
    onPostClick?: (post: SocialPost) => void;
    onPostEdit?: (post: SocialPost) => void;
    onPostDelete?: (post: SocialPost) => void;
    isDropTarget?: boolean;
}

const MAX_VISIBLE_POSTS = 4;

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
    date,
    currentMonth,
    posts,
    onDateClick,
    onPostClick,
    onPostEdit,
    onPostDelete,
    isDropTarget = false,
}) => {
    const { styles } = useThemeStyles();
    const today = isToday(date);
    const inCurrentMonth = isSameMonth(date, currentMonth);
    const dayNumber = date.getDate();
    const visiblePosts = posts.slice(0, MAX_VISIBLE_POSTS);
    const overflowCount = posts.length - MAX_VISIBLE_POSTS;

    return (
        <motion.div
            onClick={() => onDateClick?.(date)}
            whileHover={{ scale: 1.02 }}
            className={`relative min-h-[100px] p-2 rounded-xl border transition-all cursor-pointer ${isDropTarget
                    ? 'border-brand bg-brand/5'
                    : today
                        ? `border-brand/50 ${styles.bg}`
                        : `${styles.border} ${styles.bg}`
                } ${!inCurrentMonth ? 'opacity-40' : ''
                } ${styles.shadowOut} hover:${styles.shadowIn}`}
        >
            {/* Day Number */}
            <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${today
                        ? 'w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center'
                        : styles.textMain
                    }`}>
                    {dayNumber}
                </span>
                {posts.length > 0 && (
                    <span className={`text-xs ${styles.textSub}`}>
                        {posts.length}
                    </span>
                )}
            </div>

            {/* Post Thumbnails */}
            <div className="flex flex-wrap gap-1">
                {visiblePosts.map((post) => (
                    <CalendarPostCard
                        key={post.id}
                        post={post}
                        variant="month"
                        onClick={() => onPostClick?.(post)}
                        onEdit={() => onPostEdit?.(post)}
                        onDelete={() => onPostDelete?.(post)}
                    />
                ))}

                {/* Overflow badge */}
                {overflowCount > 0 && (
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold ${styles.bgAccent} ${styles.textSub}`}>
                        +{overflowCount}
                    </div>
                )}
            </div>

            {/* Drop target indicator */}
            {isDropTarget && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 border-2 border-dashed border-brand rounded-xl pointer-events-none"
                />
            )}
        </motion.div>
    );
};

export default CalendarDayCell;
