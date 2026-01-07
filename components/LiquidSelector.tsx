import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap, Plus } from 'lucide-react';
import { useThemeStyles } from './NeuComponents';
import { NumberTicker } from './NumberTicker';
import { useSubscription } from '../context/SubscriptionContext';

import { Business } from '../types';

interface LiquidSelectorProps {
    business: Business;
    businesses: Business[];
    onSwitch: (id: string) => void;
    onAdd: () => void;
    isExpanded: boolean;
    onToggle: () => void;
}

export const LiquidSelector: React.FC<LiquidSelectorProps> = ({
    business,
    businesses,
    onSwitch,
    onAdd,
    isExpanded,
    onToggle
}) => {
    const { theme, styles } = useThemeStyles();
    const { creditsRemaining, planName } = useSubscription();
    const isDark = theme === 'dark';

    if (!business) return null;

    return (
        <div className="fixed top-6 right-6 z-40 flex flex-col items-end gap-4 pointer-events-none">
            {/* Main Pill */}
            <div className="pointer-events-auto relative">
                <motion.div
                    layout
                    onClick={onToggle}
                    className={`
            relative z-30 cursor-pointer
            flex items-center gap-3 pl-2 pr-4 py-3 rounded-full
            ${styles.bg}
            ${styles.textMain}
            ${isDark ? 'shadow-neu-in-dark border-b border-r border-white/5' : 'shadow-neu-in-light border-b border-r border-gray-300/20'}
          `}
                >
                    {/* Avatar */}
                    <div className={`
            w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
            bg-brand text-white shadow-inner
          `}>
                        {business.name.substring(0, 2).toUpperCase()}
                    </div>

                    {/* Text */}
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight">{business.name}</span>
                        <span className="text-[10px] opacity-60 leading-tight">{planName} Plan</span>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-6 bg-current opacity-20 mx-1" />

                    {/* Credits (from subscription) */}
                    <div className="flex items-center gap-1.5">
                        <Zap size={14} className="fill-brand text-brand" />
                        <NumberTicker value={creditsRemaining} className="text-sm font-bold text-brand" />
                    </div>

                    {/* Chevron */}
                    <ChevronDown size={14} className={`opacity-50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </motion.div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`
                absolute top-full right-0 mt-2 w-64 rounded-2xl overflow-hidden z-20
                ${isDark ? 'bg-[#1A1D21] border border-white/10' : 'bg-white border border-gray-200'}
                shadow-xl
              `}
                        >
                            <div className="p-2 space-y-1">
                                {businesses.map(b => (
                                    <button
                                        key={b.id}
                                        onClick={() => {
                                            onSwitch(b.id);
                                            onToggle();
                                        }}
                                        className={`
                      w-full flex items-center gap-3 p-2 rounded-xl transition-colors
                      ${isDark ? 'hover:bg-white/5 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}
                      ${business.id === b.id ? (isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900') : ''}
                    `}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-bold">
                                            {b.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-medium">{b.name}</span>
                                            <span className="text-[10px] opacity-60">{b.industry || 'Business'}</span>
                                        </div>
                                        {business.id === b.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />}
                                    </button>
                                ))}

                                <div className={`h-px my-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                                <button
                                    onClick={() => {
                                        onAdd();
                                        onToggle();
                                    }}
                                    className={`
                    w-full flex items-center gap-3 p-2 rounded-xl transition-colors
                    ${isDark ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}
                  `}
                                >
                                    <div className="w-8 h-8 rounded-full border border-dashed border-current flex items-center justify-center opacity-50">
                                        <Plus size={14} />
                                    </div>
                                    <span className="text-sm font-medium">Create New Business</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
