import React, { useState, useEffect } from 'react';
import { NeuCard, NeuInput, NeuButton, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { ArrowRight, User, Globe, Sparkles } from 'lucide-react';

const UserOnboarding: React.FC = () => {
  const { styles } = useThemeStyles();
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    website: ''
  });

  // Pre-fill data from Google Profile if available
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        website: profile.website || ''
      });
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!user || !formData.full_name.trim()) return;
    
    setLoading(true);
    try {
      await StorageService.updateUserProfile({
        id: user.id,
        full_name: formData.full_name,
        website: formData.website,
        onboarding_completed: true, // Mark as done!
        updated_at: new Date().toISOString()
      });
      
      // Refresh profile to trigger App.tsx to re-route
      await refreshProfile(); 
    } catch (error) {
      console.error("Failed to complete onboarding", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <NeuCard className="max-w-lg w-full p-8 md:p-12 flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />

        <div className={`w-20 h-20 rounded-full mb-6 ${styles.bg} ${styles.shadowOut} flex items-center justify-center text-[#6D5DFC] relative`}>
          <Sparkles size={32} className="animate-pulse" />
          {profile?.avatar_url && (
            <img 
              src={profile.avatar_url} 
              className="absolute inset-0 w-full h-full object-cover rounded-full opacity-50" 
              alt="Avatar"
            />
          )}
        </div>

        <GalaxyHeading text="Welcome Creator" className="text-3xl md:text-4xl font-bold mb-2" />
        
        <p className={`${styles.textSub} mb-8 max-w-sm`}>
          Let's get your profile set up so you can start generating world-class assets.
        </p>

        <div className="w-full space-y-5 text-left">
          
          <div>
            <label className={`block text-xs font-bold mb-2 ml-1 ${styles.textSub} uppercase tracking-wider`}>
              Your Name
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={18} />
              </div>
              <NeuInput 
                className="pl-10"
                placeholder="e.g. Rijn Hartman"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-2 ml-1 ${styles.textSub} uppercase tracking-wider`}>
              Website / Portfolio <span className="opacity-50 normal-case">(Optional)</span>
            </label>
             <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Globe size={18} />
              </div>
              <NeuInput 
                className="pl-10"
                placeholder="https://..."
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4">
            <NeuButton 
              variant="primary" 
              className="w-full py-4 text-base flex justify-center gap-2 shadow-lg shadow-purple-500/20"
              onClick={handleSubmit}
              disabled={loading || !formData.full_name}
            >
              {loading ? "Setting up..." : "Complete Setup"} <ArrowRight size={20} />
            </NeuButton>
          </div>

        </div>
      </NeuCard>
    </div>
  );
};

export default UserOnboarding;
