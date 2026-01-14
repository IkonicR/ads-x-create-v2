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
  authChecked: boolean;
  profileChecked: boolean; // True once profile fetch completes (or no user)
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const refreshProfile = async () => {
    if (session?.user) {
      const p = await StorageService.getUserProfile(session.user.id);
      setProfile(p);
    }
  };

  useEffect(() => {


    // Check active sessions and subscribe to auth changes
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth: Session Error", error);
          throw error;
        }


        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // AWAIT profile fetch - don't proceed until we know profile state
          try {
            const p = await StorageService.getUserProfile(currentUser.id);
            setProfile(p);
          } catch (e) {
            console.error("Auth: Profile Fetch Error", e);
          } finally {
            setProfileChecked(true);
          }
        } else {
          // No user = no profile to fetch
          setProfileChecked(true);
        }
      } catch (error) {
        console.error("Auth: Fatal Error", error);
        setProfileChecked(true); // Still mark as checked on error
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {

      setSession(session);

      const currentUser = session?.user ?? null;

      // STABILIZATION: Only update 'user' if the ID has changed to prevent loops
      setUser(prevUser => {
        if (prevUser?.id === currentUser?.id) return prevUser;
        return currentUser;
      });

      if (currentUser) {
        // Fetch profile on auth change
        StorageService.getUserProfile(currentUser.id)
          .then(async (p) => {
            setProfile(p);
            setProfileChecked(true);
            // NOTE: Invite code consumption is now handled by AccessGate component
            // This allows for proper UI feedback when codes are invalid
          })
          .catch(e => {
            console.error("Auth: Profile Fetch Error", e);
            setProfileChecked(true);
          });
      } else {
        setProfile(null);
        setProfileChecked(true);
      }

      // GUARANTEED TO RUN
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error signing in with Google:', error.message);
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      console.error('Error signing in with email:', error.message);
      return { error: error.message };
    }
    return {};
  };

  const signOut = async () => {
    await StorageService.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('lastView');
    localStorage.removeItem('lastBusinessId');
  };

  const value = React.useMemo(() => ({
    session,
    user,
    profile,
    loading,
    authChecked,
    profileChecked,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    refreshProfile
  }), [session, user, profile, loading, authChecked, profileChecked]);

  return (
    <AuthContext.Provider value={value}>
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
