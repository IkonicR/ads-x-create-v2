import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Business, ViewState, Task, Asset, ExtendedAsset } from './types';
import { StorageService } from './services/storage';
import { TeamService } from './services/teamService';
import { supabase } from './services/supabase';
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
import { TaskProvider } from './context/TaskContext';
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
import SubscriptionGate from './views/SubscriptionGate';
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
  const { user, profile, loading, authChecked, profileChecked, isOrphanedUser, signOut } = useAuth();
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

  // Tasks state removed - now managed by TaskContext at workspace level

  const [pendingAssets, setPendingAssets] = useState<ExtendedAsset[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null); // Gate 3: null = unchecked
  const reorderTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    // Don't act until we know if there's a user (auth check complete)
    if (!authChecked || !profileChecked) return;

    if (!user) {
      setLoadingData(false); // Allow Login screen to render if no user
      return;
    }

    // If user hasn't completed onboarding, skip business loading entirely
    // They'll go to AccessGate or UserOnboarding instead
    if (!profile || !profile.onboarding_completed) {
      setLoadingData(false);
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

          // Tasks are now loaded by TaskContext at workspace level, not per-business

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
  }, [authChecked, profileChecked, profile?.onboarding_completed, user?.id]); // Wait for auth + profile check

  // GATE 3: Check subscription exists after profile is confirmed
  useEffect(() => {
    const checkSubscription = async () => {
      // Only check if we have a fully onboarded user
      if (!user || !profile || !profile.onboarding_completed) {
        setHasSubscription(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error || !data) {
          console.warn('[Gate 3] No subscription found for user:', user.id);
          setHasSubscription(false);
        } else {
          setHasSubscription(true);
        }
      } catch (err) {
        console.error('[Gate 3] Subscription check failed:', err);
        setHasSubscription(false);
      }
    };

    checkSubscription();
  }, [user?.id, profile?.onboarding_completed]);

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

  // BLOCK ORPHANED USERS - authenticated but profile was deleted
  if (user && isOrphanedUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neu-dark p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-neu-dark shadow-neu-out-dark text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <GalaxyHeading text="Account Removed" className="text-2xl mb-2" mode="light-on-dark" />
            <p className="text-gray-400 text-sm">
              Your account has been removed from the system. Please sign out and use an invite code to create a new account.
            </p>
          </div>
          <button
            onClick={signOut}
            className="w-full px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
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

  // GATE 3: User has profile but no subscription → force invite code entry
  if (hasSubscription === null) {
    // Still checking subscription status
    return <GlobalLoader />;
  }

  if (hasSubscription === false) {
    // User has profile but no subscription - show SubscriptionGate
    return (
      <SubscriptionGate
        onSubscriptionCreated={() => {
          setHasSubscription(true);
        }}
      />
    );
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

    // Check business creation limit from user's own subscription
    // (Important for beta users who have limited max_businesses)
    try {
      const { data: userSub } = await supabase
        .from('subscriptions')
        .select('extra_businesses, plan_id')
        .eq('user_id', user.id)
        .single();

      if (userSub) {
        // Import dynamically to avoid circular deps at top level
        const { PLANS } = await import('./config/pricing');
        const plan = PLANS[userSub.plan_id as keyof typeof PLANS];
        const baseBusiness = plan?.features?.businesses ?? 1;
        const maxAllowed = baseBusiness + (userSub.extra_businesses ?? 0);

        if (businesses.length >= maxAllowed) {
          notify({
            type: 'warning',
            title: 'Business Limit Reached',
            message: `Your ${plan?.name || 'plan'} allows ${maxAllowed} business${maxAllowed > 1 ? 'es' : ''}. Upgrade to add more.`
          });
          navigate('/dashboard');
          return;
        }
      }
    } catch (err) {
      // No subscription = no limit (shouldn't happen for beta users)
      console.warn('[App] Could not check business limit:', err);
    }

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

      // Update Contexts (Asset + Subscription)
      setBusinessId(id);
      setSubscriptionBusinessId(id);

      // Preload social posts for instant calendar (find locationId from new business)
      const targetBusiness = businesses.find(b => b.id === id);
      setSocialBusinessId(id);
      loadSocialPosts(id, true); // Don't await - let it load in background

      // Tasks are now workspace-level (loaded by TaskContext), no per-business reload needed
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
  // handleUpdateTasks removed - Tasks now managed by TaskContext

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

  // FIRST BUSINESS: If user has 0 businesses, show full-screen onboarding (no sidebar/header)
  // This provides a clean, focused experience for new users
  if (businesses.length === 0) {
    return (
      <NavigationProvider currentView={ViewState.ONBOARDING} onNavigate={() => { }}>
        <Onboarding onComplete={handleBusinessCreate} />
      </NavigationProvider>
    );
  }

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
                <TaskProvider userId={user.id}>
                  <Dashboard
                    business={activeBusiness}
                    onNavigate={handleSetView}
                  />
                </TaskProvider>
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
                  userId={user.id}
                  businessDesc={activeBusiness.description}
                  activeBusinessId={activeBusiness.id}
                  businesses={businesses.map(b => ({ id: b.id, name: b.name }))}
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