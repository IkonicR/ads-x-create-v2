import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { Business } from '../../types';
import { Plus, Check } from 'lucide-react';

interface BusinessDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    businesses: Business[];
    activeBusinessId: string | undefined;
    onSelectBusiness: (id: string) => void;
    onAddBusiness: () => void;
}

export const BusinessDrawer: React.FC<BusinessDrawerProps> = ({
    isOpen,
    onClose,
    businesses,
    activeBusinessId,
    onSelectBusiness,
    onAddBusiness
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (Invisible but clickable to close) */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: -20, opacity: 0, scale: 0.95 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -20, opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`
                            fixed left-32 bottom-8 z-40 w-72 p-4 rounded-3xl
              ${isDark ? 'bg-neu-dark shadow-neu-out-dark' : 'bg-neu-light shadow-neu-out-light'}
              border border-white/10
              flex flex-col gap-4
            `}
                    >
                        <div className="flex items-center justify-between px-2">
                            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Switch Business
                            </h3>
                        </div>

                        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {businesses.map((b) => {
                                const isActive = b.id === activeBusinessId;
                                return (
                                    <button
                                        key={b.id}
                                        onClick={() => {
                                            onSelectBusiness(b.id);
                                            onClose();
                                        }}
                                        className={`
                      relative w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200
                      ${isActive
                                                ? (isDark ? 'bg-neu-dark shadow-neu-in-dark' : 'bg-neu-light shadow-neu-in-light')
                                                : 'hover:bg-black/5 dark:hover:bg-white/5'
                                            }
                    `}
                                    >
                                        <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white
                      bg-gradient-to-br from-brand to-purple-500
                    `}>
                                            {b.name.substring(0, 2).toUpperCase()}
                                        </div>

                                        <div className="flex-1 text-left truncate">
                                            <p className={`text-sm font-bold truncate ${isActive ? 'text-brand' : (isDark ? 'text-gray-200' : 'text-gray-700')}`}>
                                                {b.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{b.industry}</p>
                                        </div>

                                        {isActive && <Check size={16} className="text-brand" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className={`h-px w-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />

                        <button
                            onClick={() => {
                                onAddBusiness();
                                onClose();
                            }}
                            className={`
                w-full p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all
                ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'}
              `}
                        >
                            <Plus size={16} />
                            Create New Business
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
