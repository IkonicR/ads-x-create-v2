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
    console.log("Auth: Starting Session Check...");

    // Check active sessions and subscribe to auth changes
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth: Session Error", error);
          throw error;
        }
        console.log("Auth: Session Result", session ? "User Found" : "No User");

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Fire and forget - don't await
          StorageService.getUserProfile(currentUser.id)
            .then(p => setProfile(p))
            .catch(e => console.error("Auth: Profile Fetch Error", e));
        }
      } catch (error) {
        console.error("Auth: Fatal Error", error);
      } finally {
        console.log("Auth: Finished Loading");
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth: State Changed", _event);
      setSession(session);

      const currentUser = session?.user ?? null;

      // STABILIZATION: Only update 'user' if the ID has changed to prevent loops
      setUser(prevUser => {
        if (prevUser?.id === currentUser?.id) return prevUser;
        return currentUser;
      });

      if (currentUser) {
        // Fire and forget - don't await
        StorageService.getUserProfile(currentUser.id)
          .then(p => setProfile(p))
          .catch(e => console.error("Auth: Profile Fetch Error", e));
      } else {
        setProfile(null);
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
    signInWithGoogle,
    signOut,
    refreshProfile
  }), [session, user, profile, loading]);

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
