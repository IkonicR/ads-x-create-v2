/**
 * DatePicker - Custom Calendar with Framer Motion
 * 
 * Click to expand calendar grid, select date, collapse
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useThemeStyles } from './NeuComponents';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns';

interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date) => void;
    disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, disabled }) => {
    const { styles } = useThemeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const [viewMonth, setViewMonth] = useState(value || new Date());

    const handleSelect = (date: Date) => {
        onChange(date);
        setIsOpen(false);
    };

    // Generate calendar grid
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

    const days = generateCalendarDays();
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left ${styles.shadowIn} ${styles.textMain} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
            >
                <Calendar size={18} className="text-brand" />
                <span className="font-medium">
                    {value ? format(value, 'EEE, MMM d, yyyy') : 'Select date'}
                </span>
            </button>

            {/* Calendar Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl p-4 ${styles.bg} ${styles.shadowOut} overflow-hidden`}
                    >
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                                className={`p-2 rounded-xl ${styles.shadowIn} ${styles.textSub} hover:${styles.textMain}`}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className={`font-bold ${styles.textMain}`}>
                                {format(viewMonth, 'MMMM yyyy')}
                            </span>
                            <button
                                type="button"
                                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                                className={`p-2 rounded-xl ${styles.shadowIn} ${styles.textSub} hover:${styles.textMain}`}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {weekDays.map((day) => (
                                <div
                                    key={day}
                                    className={`text-center text-xs font-bold py-1 ${styles.textSub}`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, i) => {
                                const isCurrentMonth = isSameMonth(day, viewMonth);
                                const isSelected = value && isSameDay(day, value);
                                const isTodayDate = isToday(day);

                                return (
                                    <motion.button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSelect(day)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`
                                            aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-colors
                                            ${!isCurrentMonth ? 'opacity-30' : ''}
                                            ${isSelected
                                                ? 'bg-brand text-white'
                                                : isTodayDate
                                                    ? `${styles.shadowIn} text-brand font-bold`
                                                    : `${styles.textMain} hover:bg-brand/10`
                                            }
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-current/10">
                            <button
                                type="button"
                                onClick={() => handleSelect(new Date())}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold ${styles.shadowIn} text-brand`}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelect(addDays(new Date(), 1))}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold ${styles.shadowIn} ${styles.textSub}`}
                            >
                                Tomorrow
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DatePicker;
