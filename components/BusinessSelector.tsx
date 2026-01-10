import React, { useState, useRef, useEffect } from 'react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigation } from '../context/NavigationContext';
import { Business, ViewState } from '../types';
import { ChevronDown, Zap, Plus, Check, Moon, Sun, Settings, User, Users, Building, LogOut, LockKeyhole, GripVertical } from 'lucide-react';
import { NotificationBell } from './Notifications/NotificationBell';
import { NotificationDrawer } from './Notifications/NotificationDrawer';

interface BusinessSelectorProps {
    business: Business | null;
    businesses: Business[];
    onSwitch: (id: string) => void;
    onAdd: () => void;
    onReorder?: (orderedIds: string[]) => void;
}

type DropdownMode = 'business' | 'account' | null;

// Sortable business item using @dnd-kit
const SortableBusinessItem = ({ business, isActive, isDark, onClick }: {
    business: Business,
    isActive: boolean,
    isDark: boolean,
    onClick: () => void
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: business.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging
            ? (isDark ? '0 8px 20px rgba(0,0,0,0.5)' : '0 8px 20px rgba(0,0,0,0.15)')
            : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group relative w-full flex items-center gap-2 p-3 rounded-xl text-sm font-bold transition-colors
                ${isActive
                    ? (isDark ? 'bg-white/5 text-brand' : 'bg-gray-100 text-brand')
                    : (isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                }
            `}
        >
            {/* Grip Handle */}
            <div
                {...attributes}
                {...listeners}
                className="opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 -ml-1 flex-shrink-0"
            >
                <GripVertical size={14} />
            </div>

            {/* Clickable Area */}
            <div
                onClick={onClick}
                className="flex-1 flex items-center justify-between cursor-pointer select-none"
            >
                <div className="flex items-center gap-3">
                    {business.logoUrl ? (
                        <img src={business.logoUrl} alt={business.name} className="h-6 max-w-10 object-contain pointer-events-none" draggable="false" />
                    ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white ${isActive ? 'bg-brand' : 'bg-gray-500'}`}>
                            {business.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    {business.name}
                </div>
                {isActive && <Check size={14} />}
            </div>
        </div>
    );
};

export const BusinessSelector: React.FC<BusinessSelectorProps> = ({
    business,
    businesses,
    onSwitch,
    onAdd,
    onReorder
}) => {
    const { theme, toggleTheme } = useTheme();
    const { user, profile, signOut } = useAuth();
    const { navigate } = useNavigation();
    const { creditsRemaining, planName } = useSubscription();
    const isDark = theme === 'dark';
    const [dropdownMode, setDropdownMode] = useState<DropdownMode>(null);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const [orderedBusinesses, setOrderedBusinesses] = useState<Business[]>(businesses);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Track changes for persistence on close
    const orderChangedRef = useRef(false);
    const latestOrderRef = useRef<string[]>([]);

    // Sync local state when businesses prop changes
    useEffect(() => {
        setOrderedBusinesses(businesses);
        orderChangedRef.current = false;
    }, [businesses]);

    // Handle drag end - @dnd-kit pattern
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = orderedBusinesses.findIndex(b => b.id === String(active.id));
            const newIndex = orderedBusinesses.findIndex(b => b.id === String(over.id));
            const newOrder = arrayMove(orderedBusinesses, oldIndex, newIndex);
            setOrderedBusinesses(newOrder);
            orderChangedRef.current = true;
            latestOrderRef.current = newOrder.map(b => b.id);
        }
    };

    // Persist to backend when dropdown closes
    const closeDropdown = () => {
        if (orderChangedRef.current && onReorder) {
            onReorder(latestOrderRef.current);
            orderChangedRef.current = false;
        }
        setDropdownMode(null);
    };

    useOnClickOutside(dropdownRef, closeDropdown);

    const isAdmin = profile?.is_admin === true;

    const toggleDropdown = (mode: DropdownMode) => {
        if (dropdownMode === mode) {
            closeDropdown();
        } else {
            setDropdownMode(mode);
        }
    };

    // Animation Variants (Tray Expansion Pattern)
    // NOTE: No height animation here - it breaks drag-and-drop coordinates
    const dropdownVariants = {
        hidden: {
            opacity: 0,
            transition: {
                duration: 0.15,
                ease: "easeOut"
            }
        },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.2,
                ease: "easeIn",
                staggerChildren: 0.03
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    const handleNavigate = (view: ViewState) => {
        navigate(view);
        setDropdownMode(null);
    };

    const handleSignOut = async () => {
        setDropdownMode(null);
        await signOut();
    };

    return (
        <>
            <div ref={dropdownRef} className="fixed top-6 right-6 z-50">
                {/* Single Unified Header Pill */}
                <motion.div
                    animate={{ height: dropdownMode ? 'auto' : 48 }}
                    transition={{ duration: 0.3, type: "spring", bounce: 0 }}
                    className={`
                        relative overflow-hidden rounded-xl px-1
                        transition-shadow duration-300
                        ${isDark ? 'bg-neu-dark' : 'bg-neu-light'}
                        ${dropdownMode
                            ? (isDark ? 'shadow-neu-in-dark' : 'shadow-neu-in-light')
                            : (isDark ? 'shadow-neu-out-dark' : 'shadow-neu-out-light')
                        }
                    `}
                >
                    {/* Top Row - Always Visible */}
                    <div className={`flex items-center h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {/* Notification Bell */}
                        <div className="mr-1">
                            <NotificationBell onClick={() => setIsNotificationOpen(true)} />
                        </div>

                        {/* Divider */}
                        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></div>

                        {/* Business Section (Clickable) */}
                        <button
                            onClick={() => toggleDropdown('business')}
                            className="flex items-center gap-3 pl-2 pr-4 h-full outline-none"
                        >
                            {/* Logo */}
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
                            <div className="flex flex-col items-start leading-none justify-center">
                                <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {business?.name || 'Select Business'}
                                </span>
                            </div>

                            {/* Divider */}
                            <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></div>

                            {/* Account Status (Credits + Plan) */}
                            <div className="flex flex-col items-end leading-none justify-center gap-0.5">
                                <div className="flex items-center gap-1.5 text-brand font-bold text-xs">
                                    <Zap size={14} fill="currentColor" />
                                    <span>{creditsRemaining}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest opacity-50`}>
                                    {planName}
                                </span>
                            </div>

                            <motion.div
                                animate={{ rotate: dropdownMode === 'business' ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={14} className="opacity-50 ml-1" />
                            </motion.div>
                        </button>

                        {/* Divider */}
                        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`
                                hidden md:flex items-center justify-center w-10 h-10 rounded-xl transition-all
                                ${isDark ? 'text-indigo-400 hover:bg-white/5' : 'text-orange-500 hover:bg-black/5'}
                            `}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDark ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        {/* Divider */}
                        <div className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></div>

                        {/* Account Section (Clickable) */}
                        <button
                            onClick={() => toggleDropdown('account')}
                            className="flex items-center gap-2 px-2 h-full outline-none"
                        >
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-brand to-purple-600">
                                {profile?.avatar_url && !avatarError ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <User size={14} className="text-white" />
                                )}
                            </div>

                            <motion.div
                                animate={{ rotate: dropdownMode === 'account' ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={14} className="opacity-50" />
                            </motion.div>
                        </button>
                    </div>

                    {/* Expanding Dropdown Content */}
                    <AnimatePresence mode="wait">
                        {dropdownMode === 'business' && (
                            <motion.div
                                key="business"
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className={`border-t ${isDark ? 'border-white/10' : 'border-black/5'}`}
                            >
                                <div className="p-2 flex flex-col gap-1">
                                    <motion.div variants={itemVariants} className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Switch Context
                                    </motion.div>

                                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={orderedBusinesses.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                            <div className="flex flex-col gap-1">
                                                {orderedBusinesses.map((b) => (
                                                    <SortableBusinessItem
                                                        key={b.id}
                                                        business={b}
                                                        isActive={b.id === business?.id}
                                                        isDark={isDark}
                                                        onClick={() => {
                                                            onSwitch(b.id);
                                                            setDropdownMode(null);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>

                                    <motion.div variants={itemVariants} className={`h-px my-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></motion.div>

                                    <motion.button
                                        variants={itemVariants}
                                        whileTap={{ scale: 0.98, x: 5 }}
                                        onClick={() => { window.location.href = '/business-manager'; setDropdownMode(null); }}
                                        className={`
                                            w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all
                                            ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                                            <Settings size={12} />
                                        </div>
                                        Manage Businesses
                                    </motion.button>

                                    <motion.button
                                        variants={itemVariants}
                                        whileTap={{ scale: 0.98, x: 5 }}
                                        onClick={() => { onAdd(); setDropdownMode(null); }}
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
                                </div>
                            </motion.div>
                        )}

                        {dropdownMode === 'account' && (
                            <motion.div
                                key="account"
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className={`border-t ${isDark ? 'border-white/10' : 'border-black/5'}`}
                            >
                                <div className="p-2 flex flex-col gap-1">
                                    <motion.div variants={itemVariants} className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Account
                                    </motion.div>

                                    <motion.button
                                        variants={itemVariants}
                                        whileTap={{ scale: 0.98, x: 5 }}
                                        onClick={() => handleNavigate(ViewState.USER_PROFILE)}
                                        className={`
                                            w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all
                                            ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-500'}`}>
                                            <User size={12} />
                                        </div>
                                        My Account
                                    </motion.button>

                                    <motion.button
                                        variants={itemVariants}
                                        whileTap={{ scale: 0.98, x: 5 }}
                                        onClick={() => { window.location.href = '/team'; setDropdownMode(null); }}
                                        className={`
                                            w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all
                                            ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/10 text-purple-500'}`}>
                                            <Users size={12} />
                                        </div>
                                        Manage Team
                                    </motion.button>

                                    <motion.button
                                        variants={itemVariants}
                                        whileTap={{ scale: 0.98, x: 5 }}
                                        onClick={() => { window.location.href = '/business-manager'; setDropdownMode(null); }}
                                        className={`
                                            w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all
                                            ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-500'}`}>
                                            <Building size={12} />
                                        </div>
                                        Manage Businesses
                                    </motion.button>

                                    {isAdmin && (
                                        <>
                                            <motion.div variants={itemVariants} className={`h-px my-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></motion.div>
                                            <motion.button
                                                variants={itemVariants}
                                                whileTap={{ scale: 0.98, x: 5 }}
                                                onClick={() => handleNavigate(ViewState.ADMIN)}
                                                className={`
                                                    w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all
                                                    ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                                `}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-500/10 text-red-500'}`}>
                                                    <LockKeyhole size={12} />
                                                </div>
                                                Admin HQ
                                            </motion.button>
                                        </>
                                    )}

                                    <motion.div variants={itemVariants} className={`h-px my-1 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}></motion.div>

                                    <motion.button
                                        variants={itemVariants}
                                        whileTap={{ scale: 0.98, x: 5 }}
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all text-red-500 hover:bg-red-500/10"
                                    >
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-500/20">
                                            <LogOut size={12} />
                                        </div>
                                        Sign Out
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <NotificationDrawer
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
            />
        </>
    );
};
