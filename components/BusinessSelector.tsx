import React, { useState, useRef } from 'react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Business } from '../types';
import { ChevronDown, Zap, Plus, Check, Moon, Sun, Settings } from 'lucide-react';
import { NotificationBell } from './Notifications/NotificationBell';
import { NotificationDrawer } from './Notifications/NotificationDrawer';

interface BusinessSelectorProps {
    business: Business | null;
    businesses: Business[];
    onSwitch: (id: string) => void;
    onAdd: () => void;
}

export const BusinessSelector: React.FC<BusinessSelectorProps> = ({
    business,
    businesses,
    onSwitch,
    onAdd
}) => {
    const { theme, toggleTheme } = useTheme();
    const { creditsRemaining, planName } = useSubscription();
    const isDark = theme === 'dark';
    const [isOpen, setIsOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    // Neumorphic Styles (Matched to DockKey)
    const baseStyles = isDark
        ? 'bg-neu-dark shadow-neu-out-dark text-gray-500'
        : 'bg-neu-light shadow-neu-out-light text-gray-400';

    const dropdownStyles = isDark
        ? 'bg-neu-dark border-white/5 shadow-neu-out-dark'
        : 'bg-white border-gray-200 shadow-xl shadow-gray-200/50';

    // Animation Variants (Matched to NeuDropdown)
    const containerVariants = {
        hidden: {
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: {
                duration: 0.2,
                ease: "easeInOut",
                when: "afterChildren"
            }
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.3,
                type: "spring",
                bounce: 0,
                when: "beforeChildren",
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <>
            <div ref={dropdownRef} className="fixed top-6 right-6 z-50 flex flex-col items-end">

                {/* The "Holo-Tag" Pill */}
                <motion.div
                    layout
                    className={`
                        relative flex items-center h-12 rounded-xl px-1
                        transition-all duration-300
                        ${baseStyles}
                    `}
                >
                    {/* Notification Bell */}
                    <div className="mr-1">
                        <NotificationBell onClick={() => setIsNotificationOpen(true)} />
                    </div>

                    {/* Divider */}
                    <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-3 pl-2 pr-4 h-full outline-none"
                    >
                        {/* Avatar / Logo */}
                        {business?.logoUrl ? (
                            <img
                                src={business.logoUrl}
                                alt={business.name}
                                className="h-8 max-w-12 object-contain shrink-0"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
                                {business?.name.substring(0, 2).toUpperCase() || '??'}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex flex-col items-start leading-none">
                            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                {business?.name || 'Select Business'}
                            </span>
                            <span className={`text-[10px] font-medium opacity-70`}>
                                {planName} Plan
                            </span>
                        </div>

                        {/* Divider */}
                        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></div>

                        {/* Credits (from subscription) */}
                        <div className="flex items-center gap-1.5 text-brand font-bold text-xs">
                            <Zap size={14} fill="currentColor" />
                            <span>{creditsRemaining}</span>
                        </div>

                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={14} className={`opacity-50 ml-1`} />
                        </motion.div>
                    </button>

                </motion.div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`
                    absolute top-14 right-0 w-64 p-2 rounded-2xl z-50
                    border backdrop-blur-xl flex flex-col gap-1
                    ${dropdownStyles}
                `}
                        >
                            <motion.div variants={itemVariants} className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Switch Context
                            </motion.div>

                            {businesses.map((b) => (
                                <motion.button
                                    key={b.id}
                                    variants={itemVariants}
                                    onClick={() => {
                                        onSwitch(b.id);
                                        setIsOpen(false);
                                    }}
                                    whileTap={{ scale: 0.98, x: 5 }}
                                    className={`
                        w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all
                        ${b.id === business?.id
                                            ? (isDark ? 'bg-white/5 text-brand' : 'bg-gray-100 text-brand')
                                            : (isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                                        }
                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {b.logoUrl ? (
                                            <img
                                                src={b.logoUrl}
                                                alt={b.name}
                                                className="h-6 max-w-10 object-contain"
                                            />
                                        ) : (
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white ${b.id === business?.id ? 'bg-brand' : 'bg-gray-500'}`}>
                                                {b.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        {b.name}
                                    </div>
                                    {b.id === business?.id && <Check size={14} />}
                                </motion.button>
                            ))}

                            <motion.div variants={itemVariants} className={`h-px my-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></motion.div>

                            {/* Theme Toggle */}
                            <motion.button
                                variants={itemVariants}
                                whileTap={{ scale: 0.98, x: 5 }}
                                onClick={() => toggleTheme()}
                                className={`
                                        w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all
                                        ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                    `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-500'}`}>
                                        {isDark ? <Moon size={12} /> : <Sun size={12} />}
                                    </div>
                                    {isDark ? 'Dark Mode' : 'Light Mode'}
                                </div>

                                {/* Toggle Switch */}
                                <div className={`w-10 h-5 rounded-full p-1 flex items-center transition-colors ${isDark ? 'bg-brand' : 'bg-gray-300'}`}>
                                    <motion.div
                                        layout
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className={`w-3 h-3 rounded-full bg-white shadow-sm ${isDark ? 'ml-auto' : ''}`}
                                    />
                                </div>
                            </motion.button>

                            <motion.button
                                variants={itemVariants}
                                whileTap={{ scale: 0.98, x: 5 }}
                                onClick={() => {
                                    window.location.href = '/business-manager';
                                    setIsOpen(false);
                                }}
                                className={`
                    w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all
                    ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                                    <Settings size={12} />
                                </div>
                                Manage Businesses
                            </motion.button>

                            <motion.button
                                variants={itemVariants}
                                whileTap={{ scale: 0.98, x: 5 }}
                                onClick={() => {
                                    onAdd();
                                    setIsOpen(false);
                                }}
                                className={`
                    w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all
                    ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-brand' : 'text-gray-600 hover:bg-gray-50 hover:text-brand'}
                    `}
                            >
                                <div className="w-6 h-6 rounded-full border border-dashed border-current flex items-center justify-center">
                                    <Plus size={12} />
                                </div>
                                Add New Business
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <NotificationDrawer
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
            />
        </>
    );
};
