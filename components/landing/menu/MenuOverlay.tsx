import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import MenuNavigation from './MenuNavigation';
import MenuCarousel from './MenuCarousel';

interface MenuOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * MenuOverlay - Dropdown menu panel
 * 
 * Architecture:
 * - Backdrop: Rendered via PORTAL to document.body (z-30) - covers page, NOT header
 * - Panel: Rendered inline with absolute positioning (anchored to parent button container)
 * 
 * This ensures the Menu pill stays visible above the backdrop.
 */
const MenuOverlay: React.FC<MenuOverlayProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <>

            {/* DROPDOWN PANEL - Absolute, anchored to parent (button's relative container) */}
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ transformOrigin: 'top right' }}
                className="absolute top-full right-0 mt-4 w-[85vw] md:w-[750px] h-[500px] bg-[#0F1115] rounded-[24px] overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2 ring-1 ring-white/10 z-50"
            >
                {/* Left Column: Nav */}
                <div className="h-full overflow-y-auto">
                    <MenuNavigation />
                </div>

                {/* Right Column: Carousel */}
                <div className="h-full p-3 hidden md:block">
                    <div className="h-full w-full rounded-[16px] overflow-hidden">
                        <MenuCarousel />
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default MenuOverlay;
