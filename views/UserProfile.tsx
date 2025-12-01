import React, { useState, useEffect } from 'react';
import { NeuCard, NeuInput, NeuButton, NeuBadge, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Bell, CreditCard, Shield, LogOut, Moon, Sun, Chrome } from 'lucide-react';
import { StorageService } from '../services/storage';

const UserProfile: React.FC = () => {
  const { styles } = useThemeStyles();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signInWithGoogle, signOut, refreshProfile, loading } = useAuth();

  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    website: ''
  });

  // Sync profile to form when loaded
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        website: profile.website || ''
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await StorageService.updateUserProfile({
        id: user.id,
        full_name: editForm.full_name,
        website: editForm.website,
        updated_at: new Date().toISOString()
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  // --- UNAUTHENTICATED STATE ---
  if (!loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center space-y-8">
        <GalaxyHeading text="Sign In" className="text-5xl font-extrabold mb-4" />
        <p className={`max-w-md text-lg ${styles.textSub}`}>
          Connect your account to sync your businesses, generated assets, and preferences across devices.
        </p>

        <NeuCard className="p-8 max-w-sm w-full flex flex-col gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg mb-2">
            <User size={32} />
          </div>
          <h3 className={`text-xl font-bold ${styles.textMain}`}>Welcome Back</h3>

          <NeuButton
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 text-base mt-4"
          >
            <Chrome size={20} /> Continue with Google
          </NeuButton>

          <p className="text-xs text-center opacity-50 mt-4">
            Secure authentication powered by Supabase.
          </p>
        </NeuCard>
      </div>
    );
  }

  // --- AUTHENTICATED STATE ---
  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <GalaxyHeading
            text="User Profile"
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 pb-2"
          />
          <p className={styles.textSub}>Manage your personal account settings and preferences.</p>
        </div>
        {user && (
          <NeuButton onClick={signOut} className="text-red-500 text-sm font-bold">
            <LogOut size={16} className="mr-2" /> Sign Out
          </NeuButton>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Identity & Plan */}
        <div className="space-y-6">
          <NeuCard className="flex flex-col items-center text-center p-8">
            <div className={`w-24 h-24 rounded-full mb-4 ${styles.bg} ${styles.shadowOut} flex items-center justify-center overflow-hidden relative`}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="opacity-50" />
              )}
            </div>
            <h2 className={`text-xl font-bold ${styles.textMain}`}>{profile?.full_name || user?.email}</h2>
            <p className={`text-sm ${styles.textSub} mb-4`}>{user?.email}</p>
            <NeuBadge variant="accent">Free Tier</NeuBadge>
          </NeuCard>

          <NeuCard>
            <h3 className={`text-sm font-bold ${styles.textSub} uppercase tracking-wider mb-4`}>Subscription</h3>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-bold text-lg">Free Plan</div>
                <div className="text-xs opacity-60">$0/month</div>
              </div>
              <div className="text-blue-500 font-bold text-xs px-2 py-1 bg-blue-500/10 rounded-full">Active</div>
            </div>
            <NeuButton className="w-full text-sm opacity-50 cursor-not-allowed"><CreditCard size={16} /> Manage Billing (Soon)</NeuButton>
          </NeuCard>
        </div>

        {/* Middle & Right: Settings Forms */}
        <div className="md:col-span-2 space-y-6">

          {/* Personal Info */}
          <NeuCard>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${styles.bg} ${styles.shadowOut} text-blue-500`}><User size={20} /></div>
                <h3 className={`text-lg font-bold ${styles.textMain}`}>Personal Information</h3>
              </div>
              {!isEditing ? (
                <NeuButton className="text-xs" onClick={() => setIsEditing(true)}>Edit Profile</NeuButton>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-500 px-3">Cancel</button>
                  <NeuButton className="text-xs text-green-600" onClick={handleSaveProfile}>Save Changes</NeuButton>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold ${styles.textSub} mb-2`}>Full Name</label>
                <NeuInput
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${styles.textSub} mb-2`}>Email Address</label>
                <NeuInput
                  value={user?.email || ''}
                  disabled={true} // Email cannot be changed here
                />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-xs font-bold ${styles.textSub} mb-2`}>Website</label>
                <NeuInput
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://your-portfolio.com"
                />
              </div>
            </div>
          </NeuCard>

          {/* App Preferences */}
          <NeuCard>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${styles.bg} ${styles.shadowOut} text-purple-500`}><Shield size={20} /></div>
              <h3 className={`text-lg font-bold ${styles.textMain}`}>App Preferences</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${styles.shadowIn}`}>
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">Dark Mode</div>
                    <div className="text-xs opacity-60">Toggle application theme</div>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-brand' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2 opacity-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${styles.shadowIn} text-gray-400`}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Notifications</div>
                    <div className="text-xs opacity-60">Coming soon</div>
                  </div>
                </div>
                <button
                  className={`w-12 h-6 rounded-full transition-colors relative bg-gray-300 cursor-not-allowed`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full`} />
                </button>
              </div>
            </div>
          </NeuCard>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;