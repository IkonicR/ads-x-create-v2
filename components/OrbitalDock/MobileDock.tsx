import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import {
    LayoutDashboard,
    Zap,
    Layers,
    Briefcase,
    User,
    MessageSquareText,
    ShoppingBag,
    Palette,
    Settings,
    LockKeyhole,
    Menu,
    X,
    Calendar
} from 'lucide-react';
import { ViewState, Business } from '../../types';
import { Check, Plus, Moon, Sun, ChevronLeft } from 'lucide-react';

// --- Mobile Dock Key ---
interface MobileKeyProps {
    icon: any;
    label: string;
    active: boolean;
    onClick: () => void;
}

const MobileKey: React.FC<MobileKeyProps> = ({ icon: Icon, label, active, onClick }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 relative outline-none`}
        >
            <div className={`
        relative w-12 h-8 rounded-xl flex items-center justify-center transition-all duration-300
        ${active
                    ? (isDark ? 'bg-neu-dark shadow-neu-in-dark text-brand' : 'bg-neu-light shadow-neu-in-light text-brand')
                    : (isDark ? 'bg-neu-dark shadow-neu-out-dark text-gray-400' : 'bg-neu-light shadow-neu-out-light text-gray-400')
                }
      `}>
                <Icon size={20} />
                {active && (
                    <motion.div
                        layoutId="mobile-active-indicator"
                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand"
                    />
                )}
            </div>
            <span className={`text-[10px] font-bold ${active ? 'text-brand' : 'text-gray-400'}`}>
                {label}
            </span>
        </button>
    );
};

// --- The Vault Item ---
const VaultItem: React.FC<{ icon: any; label: string; onClick: () => void }> = ({ icon: Icon, label, onClick }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={onClick}
            className={`
        flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all
        ${isDark ? 'bg-neu-dark shadow-neu-out-dark active:shadow-neu-in-dark' : 'bg-neu-light shadow-neu-out-light active:shadow-neu-in-light'}
      `}
        >
            <div className={`text-brand`}>
                <Icon size={24} />
            </div>
            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
        </button>
    );
};

interface MobileDockProps {
    business?: Business | null;
    businesses?: Business[];
    onSwitch?: (id: string) => void;
    onAdd?: () => void;
}

export const MobileDock: React.FC<MobileDockProps> = ({
    business,
    businesses = [],
    onSwitch,
    onAdd
}) => {
    const { theme, toggleTheme } = useTheme();
    const { navigate, currentView } = useNavigation();
    const { profile } = useAuth();
    const { creditsRemaining, planName } = useSubscription();
    const isDark = theme === 'dark';
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [vaultMode, setVaultMode] = useState<'menu' | 'switcher'>('menu');
    const isAdmin = profile?.is_admin === true;

    const handleToggleVault = () => {
        if (isVaultOpen) {
            setIsVaultOpen(false);
            // Reset to menu after animation completes so it's fresh next time
            setTimeout(() => setVaultMode('menu'), 300);
        } else {
            setIsVaultOpen(true);
        }
    };

    // Styles
    const dockStyles = isDark
        ? (isVaultOpen ? 'bg-neu-dark border-t border-transparent' : 'bg-neu-dark shadow-[0_-4px_20px_rgba(0,0,0,0.4)] border-t border-white/5')
        : (isVaultOpen ? 'bg-neu-light border-t border-transparent' : 'bg-neu-light shadow-[0_-4px_20px_rgba(136,158,177,0.3)] border-t border-white/50');

    const vaultStyles = isDark
        ? 'bg-neu-dark'
        : 'bg-neu-light';

    const handleNav = (view: ViewState) => {
        navigate(view);
        if (isVaultOpen) {
            handleToggleVault();
        }
    };

    return (
        <>
            {/* THE VAULT (Bottom Sheet) */}
            <AnimatePresence>
                {isVaultOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleToggleVault}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                        />

                        {/* Sheet */}
                        <motion.div
                            layout
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className={`fixed bottom-0 left-0 right-0 z-[101] rounded-t-[2rem] p-6 pb-32 ${vaultStyles} md:hidden border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden`}
                        >
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6 opacity-50" />

                            <AnimatePresence mode="popLayout" initial={false}>
                                {vaultMode === 'menu' ? (
                                    <motion.div
                                        key="menu"
                                        initial={{ x: "-100%", opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: "-100%", opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                        className="grid grid-cols-3 gap-4"
                                    >
                                        <VaultItem icon={Palette} label="Brand Kit" onClick={() => handleNav(ViewState.BRAND_KIT)} />
                                        <VaultItem icon={Briefcase} label="Tasks" onClick={() => handleNav(ViewState.TASKS)} />
                                        <VaultItem icon={Calendar} label="Planner" onClick={() => handleNav(ViewState.PLANNER)} />

                                        {/* Business Switcher Tile (Top Right) */}
                                        <button
                                            onClick={() => setVaultMode('switcher')}
                                            className={`
                                        flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all relative overflow-hidden
                                        ${isDark ? 'bg-neu-dark shadow-neu-out-dark active:shadow-neu-in-dark' : 'bg-neu-light shadow-neu-out-light active:shadow-neu-in-light'}
                                      `}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                                                {business?.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Business</span>

                                            {/* Subtle Indicator */}
                                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]" />
                                        </button>

                                        <VaultItem icon={ShoppingBag} label="Offerings" onClick={() => handleNav(ViewState.OFFERINGS)} />
                                        <VaultItem icon={MessageSquareText} label="Chat" onClick={() => handleNav(ViewState.CHAT)} />
                                        <VaultItem icon={User} label="Profile" onClick={() => handleNav(ViewState.PROFILE)} />

                                        <VaultItem icon={Settings} label="Settings" onClick={() => handleNav(ViewState.USER_PROFILE)} />
                                        {isAdmin && (
                                            <VaultItem icon={LockKeyhole} label="Admin" onClick={() => handleNav(ViewState.ADMIN)} />
                                        )}

                                        {/* Theme Toggle Tile */}
                                        <button
                                            onClick={toggleTheme}
                                            className={`
                                        flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all
                                        ${isDark ? 'bg-neu-dark shadow-neu-out-dark active:shadow-neu-in-dark' : 'bg-neu-light shadow-neu-out-light active:shadow-neu-in-light'}
                                      `}
                                        >
                                            <div className={`${isDark ? 'text-yellow-400' : 'text-orange-500'}`}>
                                                {isDark ? <Sun size={24} /> : <Moon size={24} />}
                                            </div>
                                            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Theme</span>
                                        </button>

                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="switcher"
                                        initial={{ x: "100%", opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: "100%", opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                        className="flex flex-col gap-3"
                                    >
                                        <div className="flex items-center gap-3 mb-4 pl-1">
                                            <button
                                                onClick={() => setVaultMode('menu')}
                                                className={`
                                                    w-8 h-8 flex items-center justify-center rounded-full transition-all
                                                    ${isDark ? 'bg-neu-dark shadow-neu-out-dark text-gray-400 active:shadow-neu-in-dark active:text-brand' : 'bg-neu-light shadow-neu-out-light text-gray-500 active:shadow-neu-in-light active:text-brand'}
                                                `}
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Select Business</h3>
                                        </div>

                                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-4 -mx-4">
                                            {businesses.map((b) => (
                                                <button
                                                    key={b.id}
                                                    onClick={() => {
                                                        if (onSwitch) onSwitch(b.id);
                                                        handleToggleVault();
                                                    }}
                                                    className={`
                                          w-full flex items-center justify-between p-4 rounded-2xl transition-all mb-2
                                          ${b.id === business?.id
                                                            ? (isDark ? 'bg-neu-dark shadow-neu-in-dark border border-brand/20' : 'bg-neu-light shadow-neu-in-light border border-brand/20')
                                                            : (isDark ? 'bg-neu-dark shadow-neu-out-dark' : 'bg-neu-light shadow-neu-out-light')
                                                        }
                                        `}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner ${b.id === business?.id ? 'bg-brand' : 'bg-gray-500'}`}>
                                                            {b.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col items-start">
                                                            <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{b.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs opacity-50">{b.industry || 'Business'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {b.id === business?.id && <Check size={18} className="text-brand" />}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Static Create Button */}
                                        <div className="pt-2">
                                            <button
                                                onClick={() => {
                                                    if (onAdd) onAdd();
                                                    handleToggleVault();
                                                }}
                                                className={`
                                                    w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all border-2 border-dashed
                                                    ${isDark
                                                        ? 'border-white/10 text-gray-400 hover:border-brand hover:text-brand hover:bg-white/5'
                                                        : 'border-black/10 text-gray-500 hover:border-brand hover:text-brand hover:bg-black/5'
                                                    }
                                                `}
                                            >
                                                <Plus size={16} />
                                                <span className="text-sm">Create New Business</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* THE TACTICAL STRIP (Bottom Bar) */}
            <div className={`fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe`}>
                <div className={`flex items-center justify-around px-2 pb-2 pt-2 transition-all duration-500 ease-in-out ${dockStyles}`}>

                    <MobileKey
                        icon={LayoutDashboard}
                        label="Home"
                        active={currentView === ViewState.DASHBOARD}
                        onClick={() => handleNav(ViewState.DASHBOARD)}
                    />

                    <MobileKey
                        icon={Zap}
                        label="Create"
                        active={currentView === ViewState.GENERATOR}
                        onClick={() => handleNav(ViewState.GENERATOR)}
                    />

                    <MobileKey
                        icon={Layers}
                        label="Assets"
                        active={currentView === ViewState.LIBRARY}
                        onClick={() => handleNav(ViewState.LIBRARY)}
                    />

                    <MobileKey
                        icon={isVaultOpen ? X : Menu}
                        label="Menu"
                        active={isVaultOpen}
                        onClick={handleToggleVault}
                    />

                </div>
            </div>
        </>
    );
};
