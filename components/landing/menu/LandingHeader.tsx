import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import MenuOverlay from './MenuOverlay';

/**
 * LandingHeader - Transparent fixed header
 * 
 * Features:
 * - Wordmark Logo (Dark Mode)
 * - Menu Toggle Pill
 * - Dropdown anchored to the right
 */
const LandingHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 py-6 px-6 md:px-12 pointer-events-none overflow-visible"
        >
            {/* Inner container with relative positioning for dropdown anchor */}
            <div className="relative flex justify-between items-center max-w-[1440px] mx-auto pointer-events-auto">
                {/* Logo - Padding from left grid line */}
                <img
                    src="/xcreate-wordmark-logo-dark-mode.png"
                    alt="x Create"
                    className="h-8 md:h-10 w-auto object-contain ml-4"
                />

                {/* Menu Toggle - Padding from right grid line */}
                <div className="relative mr-4 z-40">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="
                            group flex items-center gap-2 pl-5 pr-4 py-2.5 
                            bg-[#0F1115] text-white rounded-full 
                            font-medium text-sm transition-all duration-300
                            hover:bg-[#1a1a1a] hover:scale-105 active:scale-95
                            shadow-lg shadow-black/10
                        "
                    >
                        <span>Menu</span>
                        <div className="bg-white/20 rounded-full p-0.5 transition-transform duration-300 group-hover:rotate-90">
                            {isMenuOpen ? <X size={14} /> : <Plus size={14} />}
                        </div>
                    </button>

                    {/* Dropdown Menu - Anchored to this relative container */}
                    <AnimatePresence>
                        {isMenuOpen && (
                            <MenuOverlay
                                isOpen={isMenuOpen}
                                onClose={() => setIsMenuOpen(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.header>
    );
};

export default LandingHeader;
