
import React, { useState } from 'react';
import { ViewState, Business } from '../types';
import { LayoutDashboard, Palette, Briefcase, Zap, Layers, Plus, ChevronDown, ShoppingBag, User, LockKeyhole, Moon, Sun, MessageSquareText, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  business: Business | null;
  businesses: Business[];
  switchBusiness: (id: string) => void;
  toggleNewBusiness: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick, isCollapsed }: { icon: any, label: string, active: boolean, onClick: () => void, isCollapsed: boolean }) => {
  const { theme } = useTheme();
  // Using semantic token classes instead of hardcoded shadows/colors
  const activeClass = theme === 'light' 
    ? 'bg-neu-light shadow-neu-in-light text-brand'
    : 'bg-neu-dark shadow-neu-in-dark text-brand';

  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : ''}
      className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start gap-4 px-4'} py-4 rounded-xl transition-all duration-300 group ${
        active 
          ? activeClass
          : 'text-gray-500 hover:text-gray-400'
      }`}
    >
      <Icon size={20} className={`shrink-0 ${active ? 'text-brand' : 'text-gray-400 group-hover:text-gray-500'}`} />
      {!isCollapsed && (
        <span className="font-bold text-sm whitespace-nowrap overflow-hidden opacity-100 transition-opacity duration-300">{label}</span>
      )}
    </button>
  );
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  setView, 
  business, 
  businesses, 
  switchBusiness,
  toggleNewBusiness
}) => {
  const [showSwitcher, setShowSwitcher] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Semantic Sidebar Classes
  const sidebarBg = isDark ? 'bg-neu-dark' : 'bg-neu-light';
  const logoBg = isDark ? 'bg-neu-dark' : 'bg-neu-light';
  const logoShadow = isDark ? 'shadow-neu-out-dark' : 'shadow-neu-out-light';
  const switcherBg = isDark ? 'bg-neu-dark' : 'bg-neu-light';
  const switcherShadow = isDark ? 'shadow-neu-out-dark' : 'shadow-neu-out-light';
  const hoverBg = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const activeBg = isDark ? 'bg-gray-800' : 'bg-gray-100';

  if (!business && currentView === ViewState.ONBOARDING) {
    return <>{children}</>;
  }

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  const mainMargin = isCollapsed ? 'ml-20' : 'ml-64';

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDark ? 'bg-neu-dark' : 'bg-neu-light'}`}>
      {/* Sidebar */}
      <aside className={`${sidebarWidth} fixed h-screen p-4 flex flex-col gap-6 border-r border-gray-200/10 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.05)] z-20 ${sidebarBg} transition-all duration-300`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1 mb-2 relative`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-10 h-10 shrink-0 rounded-xl ${logoBg} ${logoShadow} flex items-center justify-center text-brand font-extrabold text-xl`}>
              A
            </div>
            {!isCollapsed && (
              <h1 className={`text-xl font-extrabold tracking-tight whitespace-nowrap ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Ads<span className="text-brand">Create</span></h1>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute -right-7 top-2 p-1.5 rounded-full ${sidebarBg} shadow-md border border-gray-200/10 text-gray-500 hover:text-brand z-50`}
          >
             {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar overflow-x-hidden">
          {!isCollapsed && <div className="text-xs font-bold text-gray-400 px-4 uppercase tracking-wider mb-1 animate-fade-in">Create</div>}
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={currentView === ViewState.DASHBOARD} 
            onClick={() => setView(ViewState.DASHBOARD)} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={Zap} 
            label="Generator" 
            active={currentView === ViewState.GENERATOR} 
            onClick={() => setView(ViewState.GENERATOR)} 
            isCollapsed={isCollapsed}
          />
           <NavItem 
            icon={MessageSquareText} 
            label="AI Consultant" 
            active={currentView === ViewState.CHAT} 
            onClick={() => setView(ViewState.CHAT)} 
            isCollapsed={isCollapsed}
          />
           <NavItem 
            icon={Layers} 
            label="Library" 
            active={currentView === ViewState.LIBRARY} 
            onClick={() => setView(ViewState.LIBRARY)} 
            isCollapsed={isCollapsed}
          />
           <NavItem 
            icon={Briefcase} 
            label="Tasks" 
            active={currentView === ViewState.TASKS} 
            onClick={() => setView(ViewState.TASKS)} 
            isCollapsed={isCollapsed}
          />

          {!isCollapsed && <div className="text-xs font-bold text-gray-400 px-4 uppercase tracking-wider mt-6 mb-1 animate-fade-in">Context</div>}
          {isCollapsed && <div className="h-6" />} {/* Spacer for collapsed mode */}
          
          <NavItem 
            icon={User} 
            label="Business Profile" 
            active={currentView === ViewState.PROFILE} 
            onClick={() => setView(ViewState.PROFILE)} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={ShoppingBag} 
            label="Offerings" 
            active={currentView === ViewState.OFFERINGS} 
            onClick={() => setView(ViewState.OFFERINGS)} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            icon={Palette} 
            label="Brand Kit" 
            active={currentView === ViewState.BRAND_KIT} 
            onClick={() => setView(ViewState.BRAND_KIT)} 
            isCollapsed={isCollapsed}
          />
          
          <div className="h-4" /> {/* Spacer */}
          
          <NavItem 
            icon={Settings} 
            label="My Settings" 
            active={currentView === ViewState.USER_PROFILE} 
            onClick={() => setView(ViewState.USER_PROFILE)} 
            isCollapsed={isCollapsed}
          />

           <div className="mt-8 pt-4 border-t border-gray-300/20">
            <NavItem 
              icon={LockKeyhole} 
              label="Admin HQ" 
              active={currentView === ViewState.ADMIN} 
              onClick={() => setView(ViewState.ADMIN)} 
              isCollapsed={isCollapsed}
            />
           </div>
        </nav>

        {/* Footer Actions */}
        <div className="space-y-4 pt-4 border-t border-gray-200/10">
           {/* Theme Toggle */}
           <button 
            onClick={toggleTheme}
            title={isCollapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : ''}
            className={`w-full p-3 rounded-xl flex items-center justify-center gap-3 ${switcherBg} ${switcherShadow} text-gray-500 hover:text-brand transition-all`}
           >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              {!isCollapsed && <span className="text-sm font-bold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
           </button>

           {/* Business Switcher */}
           <div className="relative">
             <button 
               onClick={() => setShowSwitcher(!showSwitcher)}
               className={`w-full p-3 rounded-xl ${switcherBg} ${switcherShadow} flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} group transition-all`}
             >
               <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-purple-400 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                   {business?.name.substring(0, 2).toUpperCase()}
                 </div>
                 {!isCollapsed && (
                   <div className="text-left truncate">
                     <p className="text-xs text-gray-400 font-bold uppercase">Business</p>
                     <p className={`text-sm font-bold truncate w-24 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{business?.name}</p>
                   </div>
                 )}
               </div>
               {!isCollapsed && <ChevronDown size={16} className="text-gray-400" />}
             </button>
             
             {showSwitcher && (
               <div className={`absolute bottom-full mb-4 left-0 ${isCollapsed ? 'w-48' : 'w-full'} rounded-xl ${switcherBg} ${switcherShadow} p-2 z-50 animate-fade-in`}>
                 {businesses.map(b => (
                   <button
                     key={b.id}
                     onClick={() => { switchBusiness(b.id); setShowSwitcher(false); }}
                     className={`w-full text-left p-2 rounded-lg text-sm font-bold mb-1 flex items-center justify-between ${b.id === business?.id ? `text-brand ${activeBg}` : `text-gray-500 ${hoverBg}`}`}
                   >
                     {b.name}
                     {b.id === business?.id && <div className="w-2 h-2 rounded-full bg-brand"></div>}
                   </button>
                 ))}
                 <div className="h-px bg-gray-300/20 my-2"></div>
                 <button 
                    onClick={() => { toggleNewBusiness(); setShowSwitcher(false); }}
                    className="w-full flex items-center gap-2 text-left p-2 rounded-lg text-sm font-bold text-gray-500 hover:text-brand"
                 >
                   <Plus size={14} /> Add Business
                 </button>
               </div>
             )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${mainMargin} p-8 md:p-10 overflow-y-auto h-screen transition-all duration-300`}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
