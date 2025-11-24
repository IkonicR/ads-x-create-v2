import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Business, ViewState, Task, Asset, ExtendedAsset } from './types';
import { StorageService } from './services/storage';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Onboarding from './views/Onboarding';
import UserOnboarding from './views/UserOnboarding';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import BrandKit from './views/BrandKit';
import Generator from './views/Generator';
import Tasks from './views/Tasks';
import BusinessProfile from './views/BusinessProfile';
import Offerings from './views/Offerings';
import Library from './views/Library';
import AdminDashboard from './views/AdminDashboard';
import ChatInterface from './views/ChatInterface';
import UserProfile from './views/UserProfile';
import { GalaxyHeading } from './components/GalaxyHeading';

// Helper to map URL paths to ViewState (for the Sidebar)
const getViewStateFromPath = (pathname: string): ViewState => {
  switch (pathname) {
    case '/': return ViewState.DASHBOARD;
    case '/dashboard': return ViewState.DASHBOARD;
    case '/profile': return ViewState.PROFILE;
    case '/offerings': return ViewState.OFFERINGS;
    case '/brand-kit': return ViewState.BRAND_KIT;
    case '/generator': return ViewState.GENERATOR;
    case '/tasks': return ViewState.TASKS;
    case '/library': return ViewState.LIBRARY;
    case '/chat': return ViewState.CHAT;
    case '/admin': return ViewState.ADMIN;
    case '/user-profile': return ViewState.USER_PROFILE;
    case '/onboarding': return ViewState.ONBOARDING;
    default: return ViewState.DASHBOARD;
  }
};

// Helper to map ViewState to URL paths (for Navigation)
const getPathFromViewState = (view: ViewState): string => {
  switch (view) {
    case ViewState.DASHBOARD: return '/dashboard';
    case ViewState.PROFILE: return '/profile';
    case ViewState.OFFERINGS: return '/offerings';
    case ViewState.BRAND_KIT: return '/brand-kit';
    case ViewState.GENERATOR: return '/generator';
    case ViewState.TASKS: return '/tasks';
    case ViewState.LIBRARY: return '/library';
    case ViewState.CHAT: return '/chat';
    case ViewState.ADMIN: return '/admin';
    case ViewState.USER_PROFILE: return '/user-profile';
    case ViewState.ONBOARDING: return '/onboarding';
    default: return '/dashboard';
  }
};

// Wrapper to inject navigation context into Layout
const MainLayout: React.FC<any> = (props) => {
  const { navigate } = useNavigation();
  const location = useLocation();
  const currentView = getViewStateFromPath(location.pathname);

  return <Layout {...props} currentView={currentView} setView={navigate} />;
};

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth(); 
  const { theme } = useTheme(); 
  const navigate = useNavigate();
  const location = useLocation();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string>('');
  
  // We no longer keep 'view' state here. We use 'location.pathname'.
  const currentView = getViewStateFromPath(location.pathname);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pendingAssets, setPendingAssets] = useState<ExtendedAsset[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load initial data
  useEffect(() => {
    if (!user) return; 

    const load = async () => {
      try {
        // SECURITY: Pass user.id to filter businesses
        const loadedBusinesses = await StorageService.getBusinesses(user.id);
        setBusinesses(loadedBusinesses);
        
        if (loadedBusinesses.length > 0) {
          const savedBusinessId = localStorage.getItem('lastBusinessId');
          const targetBusinessId = (savedBusinessId && loadedBusinesses.find(b => b.id === savedBusinessId)) 
            ? savedBusinessId 
            : loadedBusinesses[0].id;
          
          setActiveBusinessId(targetBusinessId);

          // Initial Fetch
          const [loadedTasks, loadedAssets] = await Promise.all([
            StorageService.getTasks(targetBusinessId),
            StorageService.getAssets(targetBusinessId)
          ]);
          setTasks(loadedTasks);
          setAssets(loadedAssets);

          // Redirect logic: If we are at root '/', go to Dashboard or Onboarding
          if (location.pathname === '/') {
              navigate('/dashboard');
          }

        } else {
          // Only if we are SURE there are 0 businesses do we redirect
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setLoadingData(false); // Data load complete
      }
    };
    load();
  }, [user]); // Only on user login

  // --- AUTHENTICATION GATES ---
  if (loading || loadingData || (user && !profile)) {
    const bgClass = theme === 'dark' ? 'bg-[#0F1115]' : 'bg-[#E0E5EC]';
    return ( 
      <div className={`min-h-screen flex flex-col items-center justify-center gap-8 ${bgClass} transition-colors duration-300`}>
        <div className="scale-110">
          <GalaxyHeading text="ADS X CREATE" className="text-4xl md:text-6xl tracking-tighter" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
          <div className="text-xs font-bold tracking-[0.3em] opacity-40 uppercase animate-pulse">
            Loading Studio
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) return <Login />;
  if (profile && !profile.onboarding_completed) return <UserOnboarding />;
  
  // The wrapper function for navigation context
  const handleSetView = (newView: ViewState) => {
    const path = getPathFromViewState(newView);
    navigate(path);
  };

  const activeBusiness = businesses.find(b => b.id === activeBusinessId) || null;

  const handleBusinessCreate = async (newBusinessData: Partial<Business>) => {
    if (!user) return;

    const newBusiness: Business = {
      ...newBusinessData as any,
      owner_id: user.id, // Explicitly set owner
      profile: { address: '', contactEmail: '', contactPhone: '', hours: [], socials: [], ...newBusinessData.profile },
      adPreferences: { goals: '', targetAudience: '', complianceText: '', preferredCta: 'Learn More', sloganUsage: 'Sometimes', ...newBusinessData.adPreferences },
      offerings: [],
      teamMembers: [],
      voice: { tone: 'Professional', keywords: [], slogan: '', negativeKeywords: [], ...newBusinessData.voice }
    };
    
    await StorageService.saveBusiness(newBusiness, user.id);
    const updatedList = await StorageService.getBusinesses(user.id);
    setBusinesses(updatedList);
    setActiveBusinessId(newBusiness.id);
    localStorage.setItem('lastBusinessId', newBusiness.id);
    navigate('/dashboard');
  };

  const handleSwitchBusiness = async (id: string) => {
    try {
      setActiveBusinessId(id);
      localStorage.setItem('lastBusinessId', id);
      
      // Clear data immediately to prevent ghosting
      setTasks([]);
      setAssets([]);

      const [loadedTasks, loadedAssets] = await Promise.all([
        StorageService.getTasks(id),
        StorageService.getAssets(id)
      ]);
      setTasks(loadedTasks);
      setAssets(loadedAssets);
      // Stay on current view
    } catch (error) {
      console.error("Error switching business", error);
    }
  };

  const updateBusiness = async (updated: Business) => {
    if (!user) return;
    await StorageService.saveBusiness(updated, user.id);
    setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const deductCredit = (amount: number) => {
    if (activeBusiness) {
      updateBusiness({ ...activeBusiness, credits: Math.max(0, activeBusiness.credits - amount) });
    }
  };

  const handleAddAsset = async (asset: Asset) => {
    await StorageService.saveAsset({ ...asset, businessId: activeBusinessId });
    setAssets(prev => [asset, ...prev]);
  }

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await StorageService.deleteAsset(assetId);
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (error) {
      console.error("Failed to delete asset", error);
    }
  };

  const handleUpdateTasks = async (newTasks: Task[]) => {
     await StorageService.saveTasks(newTasks, activeBusinessId);
     setTasks(newTasks);
  }
  
  const setTasksWrapper = (val: React.SetStateAction<Task[]>) => {
     if (typeof val === 'function') {
        const newState = val(tasks);
        handleUpdateTasks(newState);
     } else {
        handleUpdateTasks(val);
     }
  };

  return (
    <NavigationProvider currentView={currentView} onNavigate={handleSetView}>
      <MainLayout
        business={activeBusiness}
        businesses={businesses}
        switchBusiness={handleSwitchBusiness}
        toggleNewBusiness={() => navigate('/onboarding')}
      >
        <Routes>
          <Route path="/onboarding" element={<Onboarding onComplete={handleBusinessCreate} />} />
          
          {/* Protected Routes - Only render if activeBusiness exists */}
          {activeBusiness && (
            <>
              <Route path="/dashboard" element={
                <Dashboard 
                  business={activeBusiness} 
                  tasks={tasks} 
                  recentAssets={assets.slice(0, 4)}
                  onNavigate={handleSetView} 
                />
              } />
              <Route path="/profile" element={
                <BusinessProfile business={activeBusiness} updateBusiness={updateBusiness} />
              } />
              <Route path="/offerings" element={
                <Offerings business={activeBusiness} updateBusiness={updateBusiness} />
              } />
              <Route path="/brand-kit" element={
                <BrandKit business={activeBusiness} updateBusiness={updateBusiness} />
              } />
              <Route path="/generator" element={
                <Generator 
                  business={activeBusiness} 
                  deductCredit={deductCredit} 
                  addAsset={handleAddAsset}
                  deleteAsset={handleDeleteAsset}
                  assets={assets}
                  pendingAssets={pendingAssets}
                  setPendingAssets={setPendingAssets}
                />
              } />
              <Route path="/tasks" element={
                <Tasks 
                  tasks={tasks} 
                  setTasks={setTasksWrapper} 
                  businessDesc={activeBusiness.description}
                />
              } />
              <Route path="/library" element={
                <Library assets={assets} />
              } />
              <Route path="/chat" element={
                <ChatInterface business={activeBusiness} />
              } />
            </>
          )}

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/user-profile" element={<UserProfile />} />
          
          {/* Fallback: If no active business, go to onboarding, else dashboard */}
          <Route path="*" element={<Navigate to={activeBusiness ? "/dashboard" : "/onboarding"} replace />} />
        </Routes>
      </MainLayout>
    </NavigationProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;