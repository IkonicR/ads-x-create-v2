/**
 * CalendarDayGrid - Day view with hourly time slots
 * 
 * Features:
 * - Full day view with hourly slots
 * - Large post cards with full details
 * - Current time indicator
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from '../NeuComponents';
import { SocialPost } from '../../types';
import { CalendarPostCard } from './CalendarPostCard';
import {
    format,
    getHours,
    getMinutes,
    isSameDay
} from 'date-fns';

interface CalendarDayGridProps {
    currentDate: Date;
    posts: SocialPost[];
    onPostClick?: (post: SocialPost) => void;
    onPostEdit?: (post: SocialPost) => void;
    onPostDelete?: (post: SocialPost) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

export const CalendarDayGrid: React.FC<CalendarDayGridProps> = ({
    currentDate,
    posts,
    onPostClick,
    onPostEdit,
    onPostDelete,
}) => {
    const { styles } = useThemeStyles();

    // Filter posts for current day and group by hour
    const postsByHour = useMemo(() => {
        const map = new Map<number, SocialPost[]>();

        posts.forEach(post => {
            const postDate = post.scheduledAt || post.createdAt;
            if (postDate) {
                const date = new Date(postDate);
                if (isSameDay(date, currentDate)) {
                    const hour = getHours(date);
                    if (!map.has(hour)) {
                        map.set(hour, []);
                    }
                    map.get(hour)!.push(post);
                }
            }
        });

        return map;
    }, [posts, currentDate]);

    // Current time indicator
    const now = new Date();
    const isCurrentDay = isSameDay(now, currentDate);
    const currentHour = getHours(now);
    const currentMinute = getMinutes(now);
    const showCurrentTime = isCurrentDay && currentHour >= 6 && currentHour <= 22;
    const currentTimeTop = ((currentHour - 6) * 80 + (currentMinute / 60) * 80);

    return (
        <div className={`rounded-2xl ${styles.bg} ${styles.shadowOut} overflow-hidden`}>
            {/* Day header */}
            <div className={`p-4 border-b ${styles.border} text-center`}>
                <div className={`text-xs ${styles.textSub} uppercase tracking-wider`}>
                    {format(currentDate, 'EEEE')}
                </div>
                <div className={`text-3xl font-bold ${styles.textMain} mt-1`}>
                    {format(currentDate, 'MMMM d, yyyy')}
                </div>
            </div>

            {/* Time slots */}
            <div className="relative max-h-[700px] overflow-y-auto p-4">
                {/* Current time indicator */}
                {showCurrentTime && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute left-4 right-4 z-10 pointer-events-none flex items-center"
                        style={{ top: `${currentTimeTop + 16}px` }}
                    >
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                        <span className="text-xs font-bold text-red-500 ml-2">
                            {format(now, 'h:mm a')}
                        </span>
                    </motion.div>
                )}

                {/* Hour rows */}
                {HOURS.map((hour) => {
                    const hourPosts = postsByHour.get(hour) || [];

                    return (
                        <div
                            key={hour}
                            className={`flex gap-4 py-2 min-h-[80px] border-b ${styles.border}`}
                        >
                            {/* Time label */}
                            <div className={`w-20 flex-shrink-0 text-sm font-medium ${styles.textSub}`}>
                                {format(new Date().setHours(hour, 0), 'h:mm a')}
                            </div>

                            {/* Posts for this hour */}
                            <div className="flex-1 space-y-2">
                                {hourPosts.map((post) => (
                                    <CalendarPostCard
                                        key={post.id}
                                        post={post}
                                        variant="day"
                                        onClick={() => onPostClick?.(post)}
                                        onEdit={() => onPostEdit?.(post)}
                                        onDelete={() => onPostDelete?.(post)}
                                    />
                                ))}

                                {hourPosts.length === 0 && (
                                    <div className={`h-full min-h-[60px] rounded-xl border-2 border-dashed ${styles.border} flex items-center justify-center transition-colors hover:border-brand/30 hover:bg-brand/5`}>
                                        <span className={`text-xs ${styles.textSub}`}>
                                            No posts scheduled
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarDayGrid;
