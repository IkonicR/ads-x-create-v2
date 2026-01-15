import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuCard, NeuInput, NeuButton, useThemeStyles, useNeuAnimations } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import {
  ArrowRight, User, Globe, Sparkles, Building2, Briefcase,
  Target, Rocket, Heart, Palette, CheckCircle2, ChevronLeft
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
  const variants = useNeuAnimations();

  return (
    <motion.button
      onClick={onClick}
      variants={selected ? undefined : variants}
      initial="initial"
      whileHover={selected ? undefined : "hover"}
      whileTap={selected ? undefined : "pressed"}
      className={`w-full p-4 rounded-2xl text-left transition-colors duration-200 group relative
        ${selected
          ? `${styles.bg} ${styles.shadowIn} ring-2 ring-brand/50`
          : `${styles.bg}`
        }
      `}
      style={!selected ? {
        boxShadow: styles.shadowOutValue || undefined
      } : undefined}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl transition-all ${selected
          ? 'bg-brand text-white shadow-lg'
          : `${styles.bgSubtle} ${styles.textSub} group-hover:text-brand`}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-bold mb-1 ${selected ? 'text-brand' : styles.textMain}`}>{title}</h4>
          <p className={`text-xs ${styles.textSub}`}>{description}</p>
        </div>
        {selected && (
          <div className="text-brand">
            <CheckCircle2 size={22} />
          </div>
        )}
      </div>
    </motion.button>
  );
};

const PillSelect: React.FC<{ options: string[]; value: string; onChange: (val: string) => void }> = ({ options, value, onChange }) => {
  const { styles } = useThemeStyles();
  const variants = useNeuAnimations();

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <motion.button
            key={opt}
            onClick={() => onChange(opt)}
            variants={isSelected ? undefined : variants}
            initial="initial"
            whileHover={isSelected ? undefined : "hover"}
            whileTap={isSelected ? undefined : "pressed"}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200
              ${isSelected
                ? `${styles.bg} ${styles.shadowIn} text-brand ring-2 ring-brand/40`
                : `${styles.bg} ${styles.textSub} hover:text-brand`
              }
            `}
          >
            {opt}
          </motion.button>
        );
      })}
    </div>
  );
};

// --- Main Wizard ---

const UserOnboarding: React.FC = () => {
  const { styles } = useThemeStyles();
  const variants = useNeuAnimations(); // For referral buttons
  const { user, profile, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

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
    // Validate current step
    const canProceed =
      (currentStep === 'welcome' && formData.full_name) ||
      (currentStep === 'role' && formData.role) ||
      (currentStep === 'company' && formData.company_size && formData.primary_goal);

    if (!canProceed) {
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      return;
    }

    setShowError(false);
    setDirection(1);
    switch (currentStep) {
      case 'welcome': setCurrentStep('role'); break;
      case 'role': setCurrentStep('company'); break;
      case 'company': setCurrentStep('referral'); break;
    }
  };

  const goBack = () => {
    setDirection(-1);
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
        <div className="flex-1 flex flex-col justify-start overflow-hidden px-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full overflow-y-auto custom-scrollbar"
            >

              {/* STEP 1: WELCOME (Name/Website) */}
              {currentStep === 'welcome' && (
                <div className="space-y-6 p-4">
                  <div className="space-y-6">
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
                </div>
              )}

              {/* STEP 2: ROLE */}
              {currentStep === 'role' && (
                <div className="space-y-4 p-4">
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
                <div className="space-y-8 p-4">

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

              {currentStep === 'referral' && (
                <div className="space-y-6 p-4">
                  <label className={`block text-xs font-bold mb-3 ml-1 uppercase ${styles.textSub}`}>How did you hear about us?</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Google Search', 'Social Media', 'Friend / Colleague', 'YouTube', 'Podcast', 'Other'].map(opt => {
                      const isSelected = formData.referral_source === opt;
                      return (
                        <motion.button
                          key={opt}
                          onClick={() => setFormData({ ...formData, referral_source: opt })}
                          variants={isSelected ? undefined : variants}
                          initial="initial"
                          whileHover={isSelected ? undefined : "hover"}
                          whileTap={isSelected ? undefined : "pressed"}
                          className={`p-4 rounded-xl text-sm font-bold transition-colors text-center
                            ${isSelected
                              ? `${styles.bg} ${styles.shadowIn} text-brand ring-2 ring-brand/40`
                              : `${styles.bg} ${styles.textSub} hover:text-brand`
                            }
                          `}
                        >
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Validation Error Message */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-3"
            >
              <p className="text-red-400 text-sm font-medium">
                Please {currentStep === 'welcome' ? 'enter your name' : 'make a selection'} to continue
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className={`mt-4 pt-6 border-t border-gray-800 flex items-center justify-between ${!showError ? 'mt-8' : ''}`}>

          {currentStep !== 'welcome' ? (
            <button
              onClick={goBack}
              className={`px-4 py-2 ${styles.textSub} hover:text-brand transition-colors flex items-center gap-2 text-sm font-bold`}
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
