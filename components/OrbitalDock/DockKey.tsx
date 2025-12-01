import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

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
    const [isHovered, setIsHovered] = React.useState(false);

    // --- THE PREMIUM ENGINE (Ported from NeuButton) ---
    // Exact System Match + Dual-Shadow Interpolation + Premium Anticipation
    const variants = {
        initial: {
            y: 0,
            scale: 1,
            boxShadow: isDark
                ? "4px 4px 8px #060709, -3px -3px 6px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5), inset 4px 4px 8px rgba(0, 0, 0, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)"
                : "3px 3px 4px rgba(136, 158, 177, 0.4), -2px -2px 4px rgba(255, 255, 255, 1), 6px 6px 12px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3), inset 4px 4px 8px rgba(136, 158, 177, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)"
        },
        hover: {
            y: 0,
            scale: 0.975, // HEAVY: Deep Anticipation
            boxShadow: isDark
                ? "2px 2px 4px #060709, -1px -1px 3px #181b21, inset 1px 1px 1px rgba(255, 255, 255, 0.1), inset -1px -1px 2px rgba(0, 0, 0, 0.5), inset 4px 4px 8px rgba(0, 0, 0, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)" // Very Tight
                : "1px 1px 2px rgba(136, 158, 177, 0.4), -1px -1px 2px rgba(255, 255, 255, 1), 2px 2px 4px rgba(136, 158, 177, 0.2), inset 1px 1px 2px rgba(255, 255, 255, 1), inset -1px -1px 2px rgba(136, 158, 177, 0.3), inset 4px 4px 8px rgba(136, 158, 177, 0), inset -4px -4px 8px rgba(255, 255, 255, 0)" // Very Tight
        },
        pressed: {
            y: 1,
            scale: 0.95, // Deepest Press
            boxShadow: isDark
                ? "4px 4px 8px rgba(6, 7, 9, 0), -3px -3px 6px rgba(24, 27, 33, 0), inset 1px 1px 1px rgba(255, 255, 255, 0), inset -1px -1px 2px rgba(0, 0, 0, 0), inset 4px 4px 8px rgba(0, 0, 0, 0.9), inset -4px -4px 8px rgba(255, 255, 255, 0.05)"
                : "3px 3px 4px rgba(136, 158, 177, 0), -2px -2px 4px rgba(255, 255, 255, 0), 6px 6px 12px rgba(136, 158, 177, 0), inset 1px 1px 2px rgba(255, 255, 255, 0), inset -1px -1px 2px rgba(136, 158, 177, 0), inset 4px 4px 8px rgba(136, 158, 177, 0.9), inset -4px -4px 8px rgba(255, 255, 255, 1)"
        }
    };

    // Styles
    // We remove fixed width 'w-12' and use 'w-full' or flexible width when expanded
    const baseStyles = "relative flex items-center transition-colors duration-200 outline-none overflow-hidden";

    // Background colors only (Shadows handled by variants)
    const bgStyles = isDark ? 'bg-neu-dark' : 'bg-neu-light';
    const textStyles = active ? 'text-brand' : (isDark ? 'text-gray-500' : 'text-gray-400');

    return (
        <motion.button
            // Removed 'layout' prop to prevent fighting with parent container resize
            onClick={onClick}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}

            initial="initial"
            whileHover="hover"
            whileTap="pressed"
            animate={active ? "pressed" : "initial"}
            variants={variants}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}

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
