import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
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
  Calendar
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
  const { profile } = useAuth();
  const isDark = theme === 'dark';
  const [isHovered, setIsHovered] = useState(false);
  const isAdmin = profile?.is_admin === true;

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
              label="Resources"
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
          </div>

          {/* Bottom: System */}
          <div className={`mt-auto flex flex-col gap-4 w-full shrink-0 transition-all duration-300`}>
            <div className={`h-px bg-gray-300/20 dark:bg-gray-700/50 w-full`} />

            <DockKey
              icon={Settings}
              label="Settings"
              active={currentView === ViewState.USER_PROFILE}
              expanded={isHovered}
              onClick={() => navigate(ViewState.USER_PROFILE)}
            />

            {/* Admin Link - Only visible for super admins */}
            {isAdmin && (
              <DockKey
                icon={LockKeyhole}
                label="Admin"
                active={currentView === ViewState.ADMIN}
                expanded={isHovered}
                onClick={() => navigate(ViewState.ADMIN)}
              />
            )}
          </div>

        </motion.div>
      </div>
    </>
  );
};
