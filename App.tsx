import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Business, ViewState, Task, Asset, ExtendedAsset } from './types';
import { StorageService } from './services/storage';
import { TeamService } from './services/teamService';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AssetProvider, useAssets } from './context/AssetContext';
import { SocialProvider, useSocial } from './context/SocialContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import Layout from './components/Layout';
import Onboarding from './views/Onboarding';
import UserOnboarding from './views/UserOnboarding';
import Login from './views/Login';
import LandingPage from './views/LandingPage';
import Dashboard from './views/Dashboard';
import BrandKit from './views/BrandKit';
import Generator from './views/Generator';
import Tasks from './views/Tasks';
import BusinessProfile from './views/BusinessProfile';
import Offerings from './views/Offerings';
import Library from './views/Library';
import Planner from './views/Planner';
import AdminDashboard from './views/AdminDashboard';
import ChatInterface from './views/ChatInterface';
import UserProfile from './views/UserProfile';
import DesignLab from './views/DesignLab';
import BusinessManager from './views/BusinessManager';
import AcceptInvite from './views/AcceptInvite';
import AccessGate from './views/AccessGate';
import TeamSettings from './views/TeamSettings';

import SocialSettings from './views/SocialSettings';
import Social from './views/Social';
import { PrinterDownload } from './views/PrinterDownload';
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
    case '/planner': return ViewState.PLANNER;
    case '/chat': return ViewState.CHAT;
    case '/admin': return ViewState.ADMIN;
    case '/account': return ViewState.USER_PROFILE;
    case '/onboarding': return ViewState.ONBOARDING;
    case '/design-lab': return ViewState.DESIGN_LAB;
    case '/social': return ViewState.SOCIAL;
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
    case ViewState.PLANNER: return '/planner';
    case ViewState.CHAT: return '/chat';
    case ViewState.ADMIN: return '/admin';
    case ViewState.USER_PROFILE: return '/account';
    case ViewState.ONBOARDING: return '/onboarding';
    case ViewState.DESIGN_LAB: return '/design-lab';
    case ViewState.SOCIAL: return '/social';
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
  const { loadPosts: loadSocialPosts, setBusinessId: setSocialBusinessId } = useSocial();
  const { setBusinessId: setSubscriptionBusinessId } = useSubscription();
  const { notify } = useNotification();
  const [pendingInviteChecked, setPendingInviteChecked] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string>('');

  // We no longer keep 'view' state here. We use 'location.pathname'.
  const currentView = getViewStateFromPath(location.pathname);

  const [tasks, setTasks] = useState<Task[]>([]);

  const [pendingAssets, setPendingAssets] = useState<ExtendedAsset[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const reorderTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    // Don't act until we know if there's a user (auth check complete)
    if (!authChecked) return;

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

          // Sync Contexts
          setBusinessId(targetBusinessId);
          setSubscriptionBusinessId(targetBusinessId);

          // Redirect logic: Check for OAuth returnTo first, then default to Dashboard
          const authReturnTo = localStorage.getItem('auth_return_to');
          if (authReturnTo) {
            localStorage.removeItem('auth_return_to');
            navigate(authReturnTo);
          } else if (location.pathname === '/') {
            navigate('/dashboard');
          }

        } else {
          // User has 0 businesses - check if coming from OAuth with returnTo
          const authReturnTo = localStorage.getItem('auth_return_to');
          if (authReturnTo) {
            localStorage.removeItem('auth_return_to');
            navigate(authReturnTo);
          }
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setLoadingData(false); // Data load complete
      }
    };
    load();
  }, [authChecked, user?.id]); // Wait for auth check, then load on user ID change

  // Check for pending team invites on login
  useEffect(() => {
    if (!user?.email || pendingInviteChecked) return;

    const checkPendingInvites = async () => {
      try {
        const invites = await TeamService.getPendingInvitesForEmail(user.email);

        // Filter out already notified invites (stored in sessionStorage)
        const notifiedKey = `notified_invites_${user.id}`;
        const notifiedRaw = sessionStorage.getItem(notifiedKey);
        const notifiedIds: string[] = notifiedRaw ? JSON.parse(notifiedRaw) : [];

        // Only show NEW invites we haven't notified about
        const newInvites = invites.filter(inv => !notifiedIds.includes(inv.id));

        if (newInvites.length > 0) {
          // Deduplicate by businessId - show ONE notification per business
          const seenBusinesses = new Set<string>();
          const uniqueByBusiness = newInvites.filter(inv => {
            if (seenBusinesses.has(inv.businessId)) return false;
            seenBusinesses.add(inv.businessId);
            return true;
          });

          // Show one notification summarizing all invites
          if (uniqueByBusiness.length === 1) {
            const inv = uniqueByBusiness[0];
            notify({
              type: 'info',
              title: 'Team Invitation',
              message: `You've been invited to join ${inv.businessName || 'a business'} as ${inv.role}`,
              link: `/invite/${inv.token}`
            });
          } else {
            notify({
              type: 'info',
              title: 'Team Invitations',
              message: `You have ${uniqueByBusiness.length} pending team invitations`,
              link: `/invite/${uniqueByBusiness[0].token}`
            });
          }

          // Mark all as notified
          const allNotified = [...notifiedIds, ...newInvites.map(i => i.id)];
          sessionStorage.setItem(notifiedKey, JSON.stringify(allNotified));
        }
      } catch (err) {
        console.error('Failed to check pending invites:', err);
      } finally {
        setPendingInviteChecked(true);
      }
    };
    checkPendingInvites();
  }, [user?.email, user?.id, pendingInviteChecked, notify]);

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
    // Allow public routes to bypass loading gate
    if (location.pathname.startsWith('/print/')) {
      return (
        <Routes>
          <Route path="/print/:token" element={<PrinterDownload />} />
        </Routes>
      );
    }
    return <GlobalLoader />;
  }

  // Allow public routes without auth
  if (location.pathname.startsWith('/print/')) {
    return (
      <Routes>
        <Route path="/print/:token" element={<PrinterDownload />} />
      </Routes>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Allow invite page for non-auth users - they'll see invite preview with sign-in prompt */}
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }
  // If user exists but has no profile (or onboarding not done), check access
  // EXCEPTION: /invite/:token routes bypass - team invites have their own flow
  if (user && (!profile || !profile.onboarding_completed)) {
    // Allow team invite routes to bypass access gate
    if (location.pathname.startsWith('/invite/')) {
      return (
        <Routes>
          <Route path="/invite/:token" element={<AcceptInvite />} />
        </Routes>
      );
    }

    // Check if returning from OAuth with a pending redirect (e.g., /invite/{token})
    const authReturnTo = localStorage.getItem('auth_return_to');
    if (authReturnTo) {
      localStorage.removeItem('auth_return_to');
      // Use window.location to force a full navigation since we're in early render
      window.location.href = authReturnTo;
      return <GlobalLoader />; // Show loader while redirecting
    }

    // EXISTING user who started onboarding but didn't finish → continue onboarding
    if (profile && !profile.onboarding_completed) {
      return <UserOnboarding />;
    }

    // NEW user (no profile yet) → AccessGate checks for invite code / team invites
    return <AccessGate />;
  }

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
      adPreferences: { goals: '', targetAudience: '', complianceText: '', preferredCta: '', sloganProminence: 'standard', businessNameProminence: 'standard', contactProminence: 'standard', locationProminence: 'standard', hoursProminence: 'standard', ...newBusinessData.adPreferences },
      offerings: [],
      teamMembers: [],
      voice: { tone: 'Professional', keywords: [], slogan: '', negativeKeywords: [], ...newBusinessData.voice }
    };

    await StorageService.saveBusiness(newBusiness, user.id);
    const updatedList = await StorageService.getBusinesses(user.id);
    setBusinesses(updatedList);
    setActiveBusinessId(newBusiness.id);
    setSubscriptionBusinessId(newBusiness.id);
    localStorage.setItem('lastBusinessId', newBusiness.id);
    navigate('/dashboard');
  };

  const handleSwitchBusiness = async (id: string) => {
    try {
      setActiveBusinessId(id);
      localStorage.setItem('lastBusinessId', id);

      // Clear data immediately to prevent ghosting
      setTasks([]);

      // Update Contexts (Asset + Subscription)
      setBusinessId(id);
      setSubscriptionBusinessId(id);

      // Preload social posts for instant calendar (find locationId from new business)
      const targetBusiness = businesses.find(b => b.id === id);
      setSocialBusinessId(id);
      loadSocialPosts(id, true); // Don't await - let it load in background

      const loadedTasks = await StorageService.getTasks(id);
      setTasks(loadedTasks);
      // Stay on current view
    } catch (error) {
      console.error("Error switching business", error);
    }
  };

  const updateBusiness = async (updated: Business) => {
    if (!user) return;

    console.log("[App.tsx] Saving business update...", updated.name);
    // 1. Save to Database
    await StorageService.saveBusiness(updated, user.id);

    // 2. FORCE RE-FETCH from DB to ensure local state is 100% in sync
    // Trusting the 'updated' object from the view can lead to stale state if the view had drift.
    console.log("[App.tsx] Force-fetching fresh business data...");
    const freshList = await StorageService.getBusinesses(user.id);

    // 3. Update State with FRESH data
    setBusinesses(freshList);

    console.log("[App.tsx] Global state updated with fresh data.");
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

  // Handle business reorder (drag-and-drop)
  const handleReorderBusinesses = async (orderedIds: string[]) => {
    // Update local state immediately (optimistic)
    const reordered = orderedIds
      .map(id => businesses.find(b => b.id === id))
      .filter(Boolean) as Business[];
    setBusinesses(reordered);

    // Debounce API call
    if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(async () => {
      try {
        const session = await StorageService.getCurrentSession();
        const token = session?.access_token;
        if (!token) return;

        const apiUrl = import.meta.env.DEV ? 'http://localhost:3000/api/business-order' : '/api/business-order';
        await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ businessIds: orderedIds })
        });
        console.log('[App] Business order persisted');
      } catch (err) {
        console.error('[App] Failed to persist business order:', err);
      }
    }, 300);
  };

  return (
    <NavigationProvider currentView={currentView} onNavigate={handleSetView}>
      <MainLayout
        business={activeBusiness}
        businesses={businesses}
        switchBusiness={handleSwitchBusiness}
        toggleNewBusiness={() => navigate('/onboarding')}
        onReorder={handleReorderBusinesses}
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
                  businessId={activeBusiness.id}
                  businessDesc={activeBusiness.description}
                />
              } />
              <Route path="/library" element={
                <Library businessId={activeBusiness.id} />
              } />
              <Route path="/planner" element={
                <Planner business={activeBusiness} />
              } />
              <Route path="/social" element={
                <Social business={activeBusiness} updateBusiness={updateBusiness} />
              } />
              {/* Redirect old route for backward compatibility */}
              <Route path="/social-settings" element={<Navigate to="/social" replace />} />
              <Route path="/chat" element={
                <ChatInterface business={activeBusiness} />
              } />
            </>
          )}

          {/* Admin Route - Protected for super admins only */}
          <Route path="/admin" element={
            profile?.is_admin ? <AdminDashboard onBusinessUpdated={handleExternalBusinessUpdate} /> : <Navigate to="/dashboard" replace />
          } />
          <Route path="/account" element={<UserProfile />} />
          {/* Redirect old route for backward compatibility */}
          <Route path="/user-profile" element={<Navigate to="/account" replace />} />
          <Route path="/business-manager" element={<BusinessManager />} />
          <Route path="/design-lab" element={<DesignLab />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />

          {/* Public Routes (No Auth Required) */}
          <Route path="/print/:token" element={<PrinterDownload />} />

          {/* Team Settings - account-level view */}
          {businesses.length > 0 && (
            <Route path="/team" element={
              <TeamSettings
                allBusinesses={businesses.map(b => ({ id: b.id, name: b.name }))}
                onMembershipChange={() => {
                  if (user) StorageService.getBusinesses(user.id).then(setBusinesses);
                }}
              />
            } />
          )}



          {/* Fallback: If still loading data, show nothing. Otherwise redirect based on business state */}
          <Route path="*" element={
            loadingData ? <GlobalLoader /> : <Navigate to={activeBusiness ? "/dashboard" : "/onboarding"} replace />
          } />
        </Routes>
      </MainLayout>
    </NavigationProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <NotificationProvider>
            <AssetProvider>
              <SocialProvider>
                <Router>
                  <AppContent />
                </Router>
              </SocialProvider>
            </AssetProvider>
          </NotificationProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;