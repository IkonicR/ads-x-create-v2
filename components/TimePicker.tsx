/**
 * TimePicker - Custom Time Selector with Framer Motion
 * 
 * Click to expand time slots, select time, collapse
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useThemeStyles } from './NeuComponents';

interface TimePickerProps {
    value: string; // "HH:mm" format
    onChange: (time: string) => void;
    disabled?: boolean;
}

// Generate time slots (15-min increments, 6am to 11:45pm)
const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 6; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const h = hour.toString().padStart(2, '0');
            const m = min.toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

const formatTime12h = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, disabled }) => {
    const { styles } = useThemeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to selected time when opened
    useEffect(() => {
        if (isOpen && scrollRef.current && value) {
            const index = TIME_SLOTS.indexOf(value);
            if (index >= 0) {
                const itemHeight = 40; // approx height of each item
                scrollRef.current.scrollTop = Math.max(0, index * itemHeight - 80);
            }
        }
    }, [isOpen, value]);

    const handleSelect = (time: string) => {
        onChange(time);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left ${styles.shadowIn} ${styles.textMain} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
            >
                <Clock size={18} className="text-brand" />
                <span className="font-medium">
                    {value ? formatTime12h(value) : 'Select time'}
                </span>
            </button>

            {/* Time Slots Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl overflow-hidden ${styles.bg} ${styles.shadowOut}`}
                    >
                        {/* Scrollable Time List */}
                        <div
                            ref={scrollRef}
                            className="max-h-[280px] overflow-y-auto p-2 scrollbar-thin"
                        >
                            <div className="grid grid-cols-3 gap-1">
                                {TIME_SLOTS.map((time) => {
                                    const isSelected = time === value;
                                    return (
                                        <motion.button
                                            key={time}
                                            type="button"
                                            onClick={() => handleSelect(time)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`
                                                py-2.5 px-2 rounded-xl text-sm font-medium transition-colors
                                                ${isSelected
                                                    ? 'bg-brand text-white'
                                                    : `${styles.textMain} hover:bg-brand/10`
                                                }
                                            `}
                                        >
                                            {formatTime12h(time)}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Popular Times */}
                        <div className={`flex gap-2 p-3 border-t border-current/10`}>
                            {['09:00', '12:00', '15:00', '18:00'].map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleSelect(time)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold ${styles.shadowIn} ${time === value ? 'text-brand' : styles.textSub}`}
                                >
                                    {formatTime12h(time)}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TimePicker;
