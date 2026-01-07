import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useNeuButtonProps } from '../NeuComponents';

interface DockKeyProps {
    icon: any;
    label: string;
    active: boolean;
    expanded?: boolean;
    onClick: () => void;
}

export const DockKey: React.FC<DockKeyProps> = ({ icon: Icon, label, active, expanded = false, onClick }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';


    // Styles
    // We remove fixed width 'w-12' and use 'w-full' or flexible width when expanded
    const baseStyles = "relative flex items-center transition-colors duration-200 outline-none overflow-hidden";

    // Background colors only (Shadows handled by variants)
    const bgStyles = isDark ? 'bg-neu-dark' : 'bg-neu-light';
    const textStyles = active ? 'text-brand' : (isDark ? 'text-gray-500' : 'text-gray-400');

    const motionProps = useNeuButtonProps(active);

    return (
        <motion.button
            // Removed 'layout' prop to prevent fighting with parent container resize
            onClick={onClick}
            {...motionProps}

            className={`
                ${baseStyles} ${bgStyles} ${textStyles}
                h-12 rounded-xl w-full
                /* Always left-aligned flex container */
                flex items-center justify-start
            `}
        >
            {/* Fixed Icon Container - Anchors the icon */}
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
                <Icon size={20} className={`transition-colors duration-300 ${active ? 'text-brand' : 'group-hover:text-brand'}`} />
            </div>

            {/* Label Container - Animates width/opacity */}
            <div className="overflow-hidden flex items-center h-full">
                <AnimatePresence mode="wait">
                    {expanded && (
                        <motion.span
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="text-sm font-bold whitespace-nowrap pr-4"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Active Indicator Dot - Only when collapsed */}
            {active && !expanded && (
                <motion.div
                    layoutId="active-dot"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(109,93,252,0.8)]"
                />
            )}
        </motion.button>
    );
};
