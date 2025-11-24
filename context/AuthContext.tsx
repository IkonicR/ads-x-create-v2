import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { StorageService } from '../services/storage';
import { UserProfile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (session?.user) {
      const p = await StorageService.getUserProfile(session.user.id);
      setProfile(p);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Set up the Timeout (Safety Valve)
    // If Supabase is completely unresponsive for 5s, we stop the loading screen.
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth check timed out (5s). Proceeding as logged out.");
        setLoading(false);
      }
    }, 5000);

    // 2. Initialize via Listener (Non-blocking)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        setSession(session);
        setUser(session?.user ?? null);

        // CRITICAL FIX: Stop loading IMMEDIATELY. Do not wait for the profile.
        // This ensures the dashboard loads instantly on refresh.
        if (mounted) setLoading(false);
        clearTimeout(safetyTimer);

        if (session?.user) {
          // Fetch profile in the background without blocking the UI
          StorageService.getUserProfile(session.user.id)
            .then(p => {
              if (mounted) setProfile(p);
            })
            .catch(e => {
              console.warn("Background profile fetch failed", e);
            });
        } else {
          if (mounted) setProfile(null);
        }
      } catch (err) {
        console.error("Auth state change critical error:", err);
        // Ensure we unlock if something explodes
        if (mounted) setLoading(false);
        clearTimeout(safetyTimer);
      }
    });

    // 3. Trigger Initial Check
    supabase.auth.getSession().catch(err => console.error("Session check error", err));

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error signing in with Google:', error.message);
  };

  const signOut = async () => {
    await StorageService.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('lastView');
    localStorage.removeItem('lastBusinessId');
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
