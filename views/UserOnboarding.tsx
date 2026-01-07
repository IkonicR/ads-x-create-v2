import React, { useState, useEffect } from 'react';
import { NeuCard, NeuInput, NeuButton, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import {
  ArrowRight, User, Globe, Sparkles, Building2, Briefcase,
  Target, Rocket, Heart, Palette, Code, CheckCircle2, ChevronLeft
} from 'lucide-react';

// --- Types ---

type Step = 'welcome' | 'role' | 'company' | 'referral';

interface OnboardingData {
  full_name: string;
  website: string;
  role: string;
  company_size: string;
  primary_goal: string;
  referral_source: string;
}

// --- Components ---

const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <React.Fragment key={i}>
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${i + 1 <= currentStep ? 'bg-brand scale-110 shadow-glow' : 'bg-gray-700'
              }`}
          />
          {i < totalSteps - 1 && (
            <div className={`w-8 h-0.5 transition-colors duration-300 ${i + 1 < currentStep ? 'bg-brand/50' : 'bg-gray-800'
              }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface SelectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

const SelectionCard: React.FC<SelectionCardProps> = ({ icon, title, description, selected, onClick }) => {
  const { styles } = useThemeStyles();
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden
        ${selected
          ? 'border-brand bg-brand/10 shadow-glow-sm scale-[1.02]'
          : 'border-gray-700 bg-black/20 hover:border-gray-500 hover:bg-black/40'
        }
      `}
    >
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg transition-colors ${selected ? 'bg-brand text-white' : 'bg-gray-800 text-gray-400 group-hover:text-gray-300'}`}>
          {icon}
        </div>
        <div>
          <h4 className={`font-bold mb-1 ${selected ? 'text-white' : 'text-gray-200'}`}>{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        {selected && (
          <div className="absolute top-4 right-4 text-brand">
            <CheckCircle2 size={20} fill="currentColor" className="text-white" />
          </div>
        )}
      </div>
    </button>
  );
};

const PillSelect: React.FC<{ options: string[]; value: string; onChange: (val: string) => void }> = ({ options, value, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
            ${value === opt
              ? 'bg-brand border-brand text-white shadow-glow-sm'
              : 'bg-black/20 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }
          `}
        >
          {opt}
        </button>
      ))}
    </div>
  );
};

// --- Main Wizard ---

const UserOnboarding: React.FC = () => {
  const { styles } = useThemeStyles();
  const { user, profile, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '',
    website: '',
    role: '',
    company_size: '',
    primary_goal: '',
    referral_source: ''
  });

  // Pre-fill
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        website: profile.website || ''
      }));
    }
  }, [profile]);

  const goToNext = () => {
    switch (currentStep) {
      case 'welcome': setCurrentStep('role'); break;
      case 'role': setCurrentStep('company'); break;
      case 'company': setCurrentStep('referral'); break;
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'role': setCurrentStep('welcome'); break;
      case 'company': setCurrentStep('role'); break;
      case 'referral': setCurrentStep('company'); break;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await StorageService.updateUserProfile({
        id: user.id,
        ...formData,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      });

      // Refresh profile to trigger App.tsx routing
      await refreshProfile();
    } catch (error) {
      console.error("Failed to complete onboarding", error);
    } finally {
      setLoading(false);
    }
  };

  // Step Content Map
  const stepConfig = {
    welcome: { step: 1, title: "Welcome Creator", subtitle: "Let's set up your profile." },
    role: { step: 2, title: "What Describes You?", subtitle: "This helps us tailor your experience." },
    company: { step: 3, title: "Tell Us About Your Work", subtitle: "Context helps our AI generate better assets." },
    referral: { step: 4, title: "Last Question", subtitle: "How did you hear about us?" }
  };

  const activeConfig = stepConfig[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <NeuCard className="max-w-xl w-full p-8 md:p-10 flex flex-col relative overflow-hidden min-h-[500px]">

        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="text-center mb-8">
          <StepIndicator currentStep={activeConfig.step} totalSteps={4} />
          <GalaxyHeading text={activeConfig.title} className="text-3xl font-bold mb-2" />
          <p className="text-gray-400">{activeConfig.subtitle}</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-start overflow-y-auto custom-scrollbar px-1">

          {/* STEP 1: WELCOME (Name/Website) */}
          {currentStep === 'welcome' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex justify-center mb-6">
                <div className={`w-24 h-24 rounded-full ${styles.bg} ${styles.shadowOut} flex items-center justify-center text-brand relative`}>
                  <Sparkles size={32} className="opacity-80" />
                  {profile?.avatar_url && (
                    <img
                      src={profile.avatar_url}
                      className="absolute inset-0 w-full h-full object-cover rounded-full opacity-60"
                      alt="Avatar"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 ml-1 text-gray-500 uppercase">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <NeuInput
                    className="pl-10"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2 ml-1 text-gray-500 uppercase">Website (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <NeuInput
                    className="pl-10"
                    placeholder="https://..."
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ROLE */}
          {currentStep === 'role' && (
            <div className="space-y-3 animate-fade-in-up">
              <SelectionCard
                title="Business Owner / Founder"
                description="I run my own business and wear many hats."
                icon={<Building2 size={24} />}
                selected={formData.role === 'founder'}
                onClick={() => setFormData({ ...formData, role: 'founder' })}
              />
              <SelectionCard
                title="Marketer / Growth Lead"
                description="I manage campaigns and content strategy."
                icon={<Target size={24} />}
                selected={formData.role === 'marketer'}
                onClick={() => setFormData({ ...formData, role: 'marketer' })}
              />
              <SelectionCard
                title="Agency Professional"
                description="I manage multiple client accounts."
                icon={<Briefcase size={24} />}
                selected={formData.role === 'agency'}
                onClick={() => setFormData({ ...formData, role: 'agency' })}
              />
              <SelectionCard
                title="Creative / Designer"
                description="I create assets and visual identity."
                icon={<Palette size={24} />}
                selected={formData.role === 'creative'}
                onClick={() => setFormData({ ...formData, role: 'creative' })}
              />
            </div>
          )}

          {/* STEP 3: COMPANY & GOALS */}
          {currentStep === 'company' && (
            <div className="space-y-8 animate-fade-in-up">

              <div>
                <label className="block text-xs font-bold mb-3 ml-1 text-gray-500 uppercase">Company Size</label>
                <PillSelect
                  options={['Solo (Just Me)', '2-10 Employees', '11-50 Employees', '50+ Employees']}
                  value={formData.company_size}
                  onChange={(val) => setFormData({ ...formData, company_size: val })}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold mb-1 ml-1 text-gray-500 uppercase">Primary Goal</label>
                <SelectionCard
                  title="Generate High-Converting Ads"
                  description="I need assets for paid social campaigns."
                  icon={<Rocket size={20} />}
                  selected={formData.primary_goal === 'generate_ads'}
                  onClick={() => setFormData({ ...formData, primary_goal: 'generate_ads' })}
                />
                <SelectionCard
                  title="Consistent Brand Content"
                  description="I need daily organic social posts."
                  icon={<Heart size={20} />}
                  selected={formData.primary_goal === 'build_brand'}
                  onClick={() => setFormData({ ...formData, primary_goal: 'build_brand' })}
                />
              </div>
            </div>
          )}

          {/* STEP 4: REFERRAL */}
          {currentStep === 'referral' && (
            <div className="space-y-6 animate-fade-in-up">
              <label className="block text-xs font-bold mb-3 ml-1 text-gray-500 uppercase">How did you hear about us?</label>
              <div className="grid grid-cols-2 gap-3">
                {['Google Search', 'Social Media', 'Friend / Colleague', 'YouTube', 'Podcast', 'Other'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFormData({ ...formData, referral_source: opt })}
                    className={`p-4 rounded-lg text-sm font-medium border transition-all text-center
                      ${formData.referral_source === opt
                        ? 'bg-brand/20 border-brand text-white shadow-glow-sm'
                        : 'bg-black/20 border-gray-700 text-gray-400 hover:bg-black/40'
                      }
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between">

          {currentStep !== 'welcome' ? (
            <button
              onClick={goBack}
              className="px-4 py-2 text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <div /> // Spacer
          )}

          <NeuButton
            variant="primary"
            onClick={currentStep === 'referral' ? handleSubmit : goToNext}
            disabled={
              (currentStep === 'welcome' && !formData.full_name) ||
              (currentStep === 'role' && !formData.role) ||
              (currentStep === 'company' && (!formData.company_size || !formData.primary_goal)) ||
              (currentStep === 'referral' && !formData.referral_source) ||
              loading
            }
            className="px-8 py-3 flex items-center gap-2"
          >
            {loading ? (
              'Setting up...'
            ) : currentStep === 'referral' ? (
              <>Complete Setup <Sparkles size={18} /></>
            ) : (
              <>Next Step <ArrowRight size={18} /></>
            )}
          </NeuButton>
        </div>

      </NeuCard>
    </div>
  );
};

export default UserOnboarding;
