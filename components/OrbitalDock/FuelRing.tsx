import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface FuelRingProps {
    credits: number;
    maxCredits?: number;
}

export const FuelRing: React.FC<FuelRingProps> = ({ credits, maxCredits = 100 }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Calculate percentage
    const percentage = Math.min(100, Math.max(0, (credits / maxCredits) * 100));

    // SVG Config
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Color Logic
    let strokeColor = "text-brand";
    if (percentage < 20) strokeColor = "text-red-500";
    else if (percentage < 50) strokeColor = "text-yellow-500";

    return (
        <div className="relative w-12 h-12 flex items-center justify-center group cursor-pointer">
            {/* Tooltip Container */}
            <div className="absolute left-full ml-4 px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {credits} Credits Remaining
            </div>

            <svg className="w-full h-full transform -rotate-90">
                {/* Track */}
                <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className={isDark ? "text-gray-800" : "text-gray-200"}
                />
                {/* Progress */}
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    cx="24"
                    cy="24"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className={`${strokeColor} drop-shadow-[0_0_2px_rgba(109,93,252,0.5)]`}
                />
            </svg>

            {/* Center Icon/Text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[10px] font-black ${isDark ? 'text-white' : 'text-gray-700'}`}>
                    A
                </span>
            </div>
        </div>
    );
};
