import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { OrbitalDock } from './OrbitalDock/DockContainer';
import { MobileDock } from './OrbitalDock/MobileDock';
import { BusinessSelector } from './BusinessSelector';
import { Business } from '../types';

interface LayoutProps {
  children?: React.ReactNode;
  business: Business;
  businesses: Business[];
  switchBusiness: (id: string) => void;
  toggleNewBusiness: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  business,
  businesses,
  switchBusiness,
  toggleNewBusiness
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'}`}>

      {/* Main Content Area */}
      {/* Main Content Area */}
      {/* Main Content Area */}
      <div className="fixed inset-0 overflow-y-auto custom-scrollbar px-4 md:pl-24 md:pr-4 py-8 pb-24 md:pb-8">
        <div className="hidden md:block">
          <BusinessSelector
            business={business}
            businesses={businesses}
            onSwitch={switchBusiness}
            onAdd={toggleNewBusiness}
          />
        </div>

        <div className="max-w-7xl mx-auto pt-16">
          {children || <Outlet />}
        </div>
      </div>

      {/* Navigation Dock (Always on top) */}
      <div className="relative z-40">
        <OrbitalDock />
        <MobileDock
          business={business}
          businesses={businesses}
          onSwitch={switchBusiness}
          onAdd={toggleNewBusiness}
        />
      </div>

    </div>
  );
};

export default Layout;
