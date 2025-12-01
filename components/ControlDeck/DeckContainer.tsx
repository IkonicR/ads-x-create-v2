import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard,
    Zap,
    Layers,
    Briefcase,
    Settings,
    User,
    Power
} from 'lucide-react';

const ToggleSwitch = ({ label, active, onClick, icon: Icon }: { label: string, active: boolean, onClick: () => void, icon: any }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={onClick}
            className="group flex items-center justify-between w-full p-3 rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={active ? 'text-brand' : 'text-gray-400'} />
                <span className={`text-sm font-bold uppercase tracking-wider ${active ? 'text-brand' : 'text-gray-500'}`}>{label}</span>
            </div>

            {/* The Physical Switch */}
            <div className={`
        w-10 h-5 rounded-full relative transition-colors duration-300
        ${active ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'}
        shadow-inner
      `}>
                <motion.div
                    layout
                    className={`
            absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md
            ${active ? 'left-[22px]' : 'left-0.5'}
          `}
                />
            </div>
        </button>
    );
};

export const ControlDeck = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeItem, setActiveItem] = useState('dashboard');

    return (
        <div className="fixed left-0 top-0 bottom-0 z-50 flex items-center">
            <motion.div
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                className={`
          w-64 h-[90vh] ml-4 rounded-2xl flex flex-col p-6
          ${isDark ? 'bg-[#1a1d24]' : 'bg-gray-100'}
          border-r-4 border-b-4 border-black/10 dark:border-black/30
          shadow-2xl
        `}
            >
                {/* Header / Fuel Gauge */}
                <div className="mb-8 p-4 rounded-xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase text-gray-400">Fuel Level</span>
                        <span className="text-[10px] font-bold text-brand">75%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand w-3/4 shadow-[0_0_10px_rgba(109,93,252,0.5)]" />
                    </div>
                </div>

                {/* Switches */}
                <div className="space-y-2 flex-1">
                    <ToggleSwitch
                        icon={LayoutDashboard}
                        label="Dashboard"
                        active={activeItem === 'dashboard'}
                        onClick={() => setActiveItem('dashboard')}
                    />
                    <ToggleSwitch
                        icon={Zap}
                        label="Generator"
                        active={activeItem === 'generator'}
                        onClick={() => setActiveItem('generator')}
                    />
                    <ToggleSwitch
                        icon={Layers}
                        label="Library"
                        active={activeItem === 'library'}
                        onClick={() => setActiveItem('library')}
                    />
                    <ToggleSwitch
                        icon={Briefcase}
                        label="Tasks"
                        active={activeItem === 'tasks'}
                        onClick={() => setActiveItem('tasks')}
                    />
                </div>

                {/* Footer */}
                <div className="mt-auto pt-6 border-t border-gray-300 dark:border-gray-700">
                    <button className="w-full py-3 rounded-lg bg-red-500/10 text-red-500 font-bold uppercase text-xs hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                        <Power size={14} /> System Off
                    </button>
                </div>

            </motion.div>
        </div>
    );
};
