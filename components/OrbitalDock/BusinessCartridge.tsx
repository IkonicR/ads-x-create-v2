import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { ChevronRight } from 'lucide-react';
import { Business } from '../../types';

interface BusinessCartridgeProps {
    business: Business | null;
    onClick: () => void;
}

export const BusinessCartridge: React.FC<BusinessCartridgeProps> = ({ business, onClick }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!business) return null;

    const initials = business.name.substring(0, 2).toUpperCase();

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ y: 5 }} // "Eject" push down effect
            className={`
        relative w-12 h-16 rounded-xl flex flex-col items-center justify-end pb-2 gap-1 overflow-hidden
        ${isDark ? 'bg-neu-dark shadow-neu-out-dark' : 'bg-neu-light shadow-neu-out-light'}
        border border-white/5
      `}
        >
            {/* The "Sticker" / Label */}
            <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-brand/20 to-transparent flex items-center justify-center">
                <div className="w-8 h-1 rounded-full bg-brand/50 mt-2" />
            </div>

            <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-gray-800'} z-10`}>
                {initials}
            </span>

            {/* Grip Lines */}
            <div className="flex gap-0.5">
                <div className="w-0.5 h-2 bg-gray-400/30 rounded-full" />
                <div className="w-0.5 h-2 bg-gray-400/30 rounded-full" />
                <div className="w-0.5 h-2 bg-gray-400/30 rounded-full" />
            </div>

        </motion.button>
    );
};
