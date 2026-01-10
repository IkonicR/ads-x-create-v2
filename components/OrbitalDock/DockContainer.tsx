import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  LayoutDashboard,
  Zap,
  Layers,
  Briefcase,
  User,
  MessageSquareText,
  ShoppingBag,
  Palette,
  Calendar,
  Share2
} from 'lucide-react';
import { DockKey } from './DockKey';
import { Business, ViewState } from '../../types';

interface OrbitalDockProps {
  business?: Business | null;
  credits?: number;
}

export const OrbitalDock: React.FC<OrbitalDockProps> = ({
  business,
  credits = 75
}) => {
  const { theme } = useTheme();
  const { navigate, currentView } = useNavigation();
  const isDark = theme === 'dark';
  const [isHovered, setIsHovered] = useState(false);

  // Container Styles - ETCHED / RECESSED LOOK
  const containerStyles = isDark
    ? 'bg-neu-dark shadow-neu-in-dark border-white/5'
    : 'bg-neu-light shadow-neu-in-light border-white/20';

  return (
    <>
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden md:block">
        <motion.div
          layout
          initial={{ x: -100, opacity: 0, width: 80 }}
          animate={{
            x: 0,
            opacity: 1,
            width: isHovered ? 170 : 80
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className={`
            py-6 rounded-[40px] flex flex-col gap-6
            ${containerStyles}
            border-b border-r
            max-h-[95vh] overflow-y-auto custom-scrollbar-hidden
            px-4
          `}
        >
          {/* Middle: Navigation */}
          <div className={`flex flex-col gap-3 w-full flex-1 justify-center transition-all duration-300`}>
            <DockKey
              icon={LayoutDashboard}
              label="Dashboard"
              active={currentView === ViewState.DASHBOARD}
              expanded={isHovered}
              onClick={() => navigate(ViewState.DASHBOARD)}
            />
            <DockKey
              icon={Zap}
              label="Generator"
              active={currentView === ViewState.GENERATOR}
              expanded={isHovered}
              onClick={() => navigate(ViewState.GENERATOR)}
            />
            <DockKey
              icon={MessageSquareText}
              label="Consultant"
              active={currentView === ViewState.CHAT}
              expanded={isHovered}
              onClick={() => navigate(ViewState.CHAT)}
            />

            <DockKey
              icon={Calendar}
              label="Planner"
              active={currentView === ViewState.PLANNER}
              expanded={isHovered}
              onClick={() => navigate(ViewState.PLANNER)}
            />

            <div className={`h-px bg-gray-300/20 dark:bg-gray-700/50 my-1 shrink-0 w-full`} />

            <DockKey
              icon={Layers}
              label="Assets"
              active={currentView === ViewState.LIBRARY}
              expanded={isHovered}
              onClick={() => navigate(ViewState.LIBRARY)}
            />
            <DockKey
              icon={Briefcase}
              label="Tasks"
              active={currentView === ViewState.TASKS}
              expanded={isHovered}
              onClick={() => navigate(ViewState.TASKS)}
            />

            <div className={`h-px bg-gray-300/20 dark:bg-gray-700/50 my-1 shrink-0 w-full`} />

            <DockKey
              icon={Palette}
              label="Brand Kit"
              active={currentView === ViewState.BRAND_KIT}
              expanded={isHovered}
              onClick={() => navigate(ViewState.BRAND_KIT)}
            />
            <DockKey
              icon={ShoppingBag}
              label="Offerings"
              active={currentView === ViewState.OFFERINGS}
              expanded={isHovered}
              onClick={() => navigate(ViewState.OFFERINGS)}
            />
            <DockKey
              icon={User}
              label="Profile"
              active={currentView === ViewState.PROFILE}
              expanded={isHovered}
              onClick={() => navigate(ViewState.PROFILE)}
            />
            <DockKey
              icon={Share2}
              label="Social"
              active={currentView === ViewState.SOCIAL}
              expanded={isHovered}
              onClick={() => navigate(ViewState.SOCIAL)}
            />
          </div>

        </motion.div>
      </div>
    </>
  );
};
