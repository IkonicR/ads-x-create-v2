import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Business, ViewState, Task, Asset, ExtendedAsset } from './types';
import { StorageService } from './services/storage';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AssetProvider, useAssets } from './context/AssetContext';
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
import DesignLab from './views/DesignLab';
import GlobalLoader from './components/GlobalLoader';
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
    case '/design-lab': return ViewState.DESIGN_LAB;
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
    case ViewState.DESIGN_LAB: return '/design-lab';
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
  const { user, profile, loading, authChecked, profileChecked } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { addAsset, setBusinessId } = useAssets();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string>('');

  // We no longer keep 'view' state here. We use 'location.pathname'.
  const currentView = getViewStateFromPath(location.pathname);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [pendingAssets, setPendingAssets] = useState<ExtendedAsset[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load initial data
  useEffect(() => {
    if (!user) {
      setLoadingData(false); // Allow Login screen to render if no user
      return;
    }

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
          const loadedTasks = await StorageService.getTasks(targetBusinessId);
          setTasks(loadedTasks);

          // Sync Asset Context
          // Sync Asset Context
          setBusinessId(targetBusinessId);

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
  }, [user?.id]); // Only on user ID change (prevents object ref loops)

  // --- TIMEOUT HANDLING ---
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading || loadingData) {
      timer = setTimeout(() => {
        setConnectionError(true);
      }, 15000); // 15 seconds timeout
    }
    return () => clearTimeout(timer);
  }, [loading, loadingData]);

  const handleRetry = () => {
    setConnectionError(false);
    window.location.reload();
  };

  if (connectionError) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-6 ${theme === 'dark' ? 'bg-neu-dark text-neu-text-main-dark' : 'bg-neu-light text-neu-text-main-light'} transition-colors duration-300`}>
        <div className="scale-110 opacity-50 grayscale">
          <GalaxyHeading text="SYSTEM OFFLINE" className="text-4xl md:text-6xl tracking-tighter" />
        </div>
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
          <p className="opacity-60">
            The database is taking too long to respond. This usually happens during a restart or network outage.
          </p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 rounded-xl bg-brand text-white font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-brand/20"
          >
            Retry Connection
          </button>
          <div className="text-xs font-mono opacity-30 mt-4">
            Error: Connection Timed Out (15s)
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATION GATES ---
  // Wait until auth check, profile check, AND data load are all complete
  if (!authChecked || !profileChecked || loadingData) {
    return <GlobalLoader />;
  }

  if (!user) return <Login />;
  // If user exists but has no profile (or onboarding not done), force onboarding
  if (user && (!profile || !profile.onboarding_completed)) return <UserOnboarding />;

  // Compute activeBusiness - if user has businesses but this is null, they need to go to onboarding
  const activeBusiness = businesses.find(b => b.id === activeBusinessId) || null;

  // EDGE CASE: If user has businesses but activeBusiness is somehow null,
  // show loader to prevent flash (this shouldn't happen but guards against race conditions)
  if (businesses.length > 0 && !activeBusiness) {
    return <GlobalLoader />;
  }

  // The wrapper function for navigation context
  const handleSetView = (newView: ViewState) => {
    const path = getPathFromViewState(newView);
    navigate(path);
  };

  const handleBusinessCreate = async (newBusinessData: Partial<Business>) => {
    if (!user) return;

    const newBusiness: Business = {
      ...newBusinessData as any,
      owner_id: user.id, // Explicitly set owner
      currency: 'USD', // Default currency
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
      // Clear data immediately to prevent ghosting
      setTasks([]);

      // Update Context
      setBusinessId(id);

      const loadedTasks = await StorageService.getTasks(id);
      setTasks(loadedTasks);
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

  // Optimized update for AdminDashboard (which already saves to DB)
  const handleExternalBusinessUpdate = (updated: Business) => {
    setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const deductCredit = (amount: number) => {
    if (activeBusiness) {
      updateBusiness({ ...activeBusiness, credits: Math.max(0, activeBusiness.credits - amount) });
    }
  };

  const updateCredits = (newBalance: number) => {
    if (activeBusiness) {
      // Update local state ONLY, because server already updated DB
      setBusinesses(prev => prev.map(b => b.id === activeBusiness.id ? { ...b, credits: newBalance } : b));
    }
  };

  // handleAddAsset removed - Generator uses Context directly
  // handleDeleteAsset removed - Generator uses Context directly



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
                  updateCredits={updateCredits}
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
                <Library businessId={activeBusiness.id} />
              } />
              <Route path="/chat" element={
                <ChatInterface business={activeBusiness} />
              } />
            </>
          )}

          <Route path="/admin" element={<AdminDashboard onBusinessUpdated={handleExternalBusinessUpdate} />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/design-lab" element={<DesignLab />} />

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
          <AssetProvider>
            <Router>
              <AppContent />
            </Router>
          </AssetProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;