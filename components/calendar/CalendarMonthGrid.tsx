/**
 * CalendarMonthGrid - 7x5 month view grid
 * 
 * Features:
 * - Week day headers
 * - Day cells with post thumbnails
 * - Proper date calculations
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useThemeStyles } from '../NeuComponents';
import { SocialPost } from '../../types';
import { CalendarDayCell } from './CalendarDayCell';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    format
} from 'date-fns';

interface CalendarMonthGridProps {
    currentDate: Date;
    posts: SocialPost[];
    onDateClick?: (date: Date) => void;
    onPostClick?: (post: SocialPost) => void;
    onPostEdit?: (post: SocialPost) => void;
    onPostDelete?: (post: SocialPost) => void;
    dropTargetDate?: Date | null;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
    currentDate,
    posts,
    onDateClick,
    onPostClick,
    onPostEdit,
    onPostDelete,
    dropTargetDate,
}) => {
    const { styles } = useThemeStyles();

    // Calculate all days to display (including adjacent months' days to fill grid)
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentDate]);

    // Group posts by date for quick lookup
    const postsByDate = useMemo(() => {
        const map = new Map<string, SocialPost[]>();

        posts.forEach(post => {
            const postDate = post.scheduledAt || post.createdAt;
            if (postDate) {
                const dateKey = format(new Date(postDate), 'yyyy-MM-dd');
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)!.push(post);
            }
        });

        return map;
    }, [posts]);

    // Get posts for a specific date
    const getPostsForDate = (date: Date): SocialPost[] => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return postsByDate.get(dateKey) || [];
    };

    return (
        <div className={`rounded-2xl ${styles.bg} ${styles.shadowOut} p-4 overflow-hidden`}>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className={`text-center text-xs font-bold ${styles.textSub} py-2`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Day Cells Grid */}
            <motion.div
                className="grid grid-cols-7 gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.02 }}
            >
                {calendarDays.map((day, index) => (
                    <motion.div
                        key={day.toISOString()}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }}
                    >
                        <CalendarDayCell
                            date={day}
                            currentMonth={currentDate}
                            posts={getPostsForDate(day)}
                            onDateClick={onDateClick}
                            onPostClick={onPostClick}
                            onPostEdit={onPostEdit}
                            onPostDelete={onPostDelete}
                            isDropTarget={dropTargetDate ? isSameDay(day, dropTargetDate) : false}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default CalendarMonthGrid;
