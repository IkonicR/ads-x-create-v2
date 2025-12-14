/**
 * CalendarWeekGrid - Week view with time slots
 * 
 * Features:
 * - Time slots from 6am-11pm (17 hours)
 * - 7 day columns
 * - Posts positioned by scheduled time
 * - Current time indicator
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from '../NeuComponents';
import { SocialPost } from '../../types';
import { CalendarPostCard } from './CalendarPostCard';
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    getHours,
    getMinutes,
    isToday,
    isSameDay
} from 'date-fns';

interface CalendarWeekGridProps {
    currentDate: Date;
    posts: SocialPost[];
    onDateClick?: (date: Date) => void;
    onPostClick?: (post: SocialPost) => void;
    onPostEdit?: (post: SocialPost) => void;
    onPostDelete?: (post: SocialPost) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

export const CalendarWeekGrid: React.FC<CalendarWeekGridProps> = ({
    currentDate,
    posts,
    onDateClick,
    onPostClick,
    onPostEdit,
    onPostDelete,
}) => {
    const { styles } = useThemeStyles();

    // Get all days in the week
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    // Group posts by day and hour
    const postsByDayHour = useMemo(() => {
        const map = new Map<string, SocialPost[]>();

        posts.forEach(post => {
            const postDate = post.scheduledAt || post.createdAt;
            if (postDate) {
                const date = new Date(postDate);
                const dayKey = format(date, 'yyyy-MM-dd');
                const hour = getHours(date);
                const key = `${dayKey}-${hour}`;

                if (!map.has(key)) {
                    map.set(key, []);
                }
                map.get(key)!.push(post);
            }
        });

        return map;
    }, [posts]);

    // Get posts for a specific day and hour
    const getPostsForSlot = (day: Date, hour: number): SocialPost[] => {
        const key = `${format(day, 'yyyy-MM-dd')}-${hour}`;
        return postsByDayHour.get(key) || [];
    };

    // Current time indicator position
    const now = new Date();
    const currentHour = getHours(now);
    const currentMinute = getMinutes(now);
    const showCurrentTime = currentHour >= 6 && currentHour <= 22;
    const currentTimeTop = ((currentHour - 6) * 60 + currentMinute) / (17 * 60) * 100;

    return (
        <div className={`rounded-2xl ${styles.bg} ${styles.shadowOut} overflow-hidden`}>
            {/* Header with day names */}
            <div className="grid grid-cols-8 border-b" style={{ borderColor: 'var(--border-color, rgba(0,0,0,0.1))' }}>
                {/* Time column header */}
                <div className={`p-3 text-center text-xs font-bold ${styles.textSub}`}>
                    Time
                </div>
                {/* Day headers */}
                {weekDays.map((day) => (
                    <div
                        key={day.toISOString()}
                        onClick={() => onDateClick?.(day)}
                        className={`p-3 text-center cursor-pointer hover:bg-brand/5 transition-colors ${isToday(day) ? 'bg-brand/10' : ''
                            }`}
                    >
                        <div className={`text-xs ${styles.textSub}`}>
                            {format(day, 'EEE')}
                        </div>
                        <div className={`text-lg font-bold ${isToday(day)
                            ? 'w-8 h-8 mx-auto rounded-full bg-brand text-white flex items-center justify-center'
                            : styles.textMain
                            }`}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Time grid */}
            <div className="relative max-h-[600px] overflow-y-auto">
                {/* Current time indicator */}
                {showCurrentTime && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: `${currentTimeTop}%` }}
                    >
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div className="flex-1 h-0.5 bg-red-500" />
                        </div>
                    </motion.div>
                )}

                {/* Hour rows */}
                {HOURS.map((hour) => (
                    <div
                        key={hour}
                        className="grid grid-cols-8 border-b min-h-[60px]"
                        style={{ borderColor: 'var(--border-color, rgba(0,0,0,0.05))' }}
                    >
                        {/* Time label */}
                        <div className={`p-2 text-xs ${styles.textSub} text-center border-r`} style={{ borderColor: 'var(--border-color, rgba(0,0,0,0.05))' }}>
                            {format(new Date().setHours(hour, 0), 'h a')}
                        </div>

                        {/* Day slots */}
                        {weekDays.map((day) => {
                            const slotPosts = getPostsForSlot(day, hour);

                            return (
                                <div
                                    key={`${day.toISOString()}-${hour}`}
                                    onClick={() => onDateClick?.(day)}
                                    className={`p-1 border-r cursor-pointer hover:bg-brand/5 transition-colors ${isToday(day) ? 'bg-brand/5' : ''
                                        }`}
                                    style={{ borderColor: 'var(--border-color, rgba(0,0,0,0.05))' }}
                                >
                                    <div className="space-y-1">
                                        {slotPosts.slice(0, 2).map((post) => (
                                            <CalendarPostCard
                                                key={post.id}
                                                post={post}
                                                variant="week"
                                                onClick={() => onPostClick?.(post)}
                                                onEdit={() => onPostEdit?.(post)}
                                                onDelete={() => onPostDelete?.(post)}
                                            />
                                        ))}
                                        {slotPosts.length > 2 && (
                                            <div className={`text-xs ${styles.textSub} text-center`}>
                                                +{slotPosts.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CalendarWeekGrid;
