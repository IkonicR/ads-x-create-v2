
import React, { useState } from 'react';
import { NeuCard, NeuButton, NeuInput, NeuTextArea, useThemeStyles, BRAND_COLOR } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { Business } from '../types';
import { Globe, ArrowRight, Building, Store, ShoppingCart, UserCheck, Briefcase, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: (business: Partial<Business>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<Business['type'] | null>(null);
  const { styles } = useThemeStyles();

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    website: ''
  });

  const handleTypeSelect = (type: Business['type']) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleSubmit = () => {
    onComplete({
      ...formData,
      type: selectedType || 'Other',
      id: Math.random().toString(36).substr(2, 9),
      credits: 50,
      role: 'Owner',
      colors: { primary: '#000000', secondary: '#ffffff', accent: BRAND_COLOR },
      voice: {
        sliders: { identity: 50, style: 50, emotion: 50 },
        keywords: [],
        slogan: '',
        negativeKeywords: []
      },
      offerings: [],
      teamMembers: [],
      inspirationImages: []
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <NeuCard className="max-w-3xl w-full flex flex-col items-center text-center py-12 px-8 relative overflow-hidden">

        {/* Decorative Glow */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h - 1 w - 12 rounded - full transition - colors duration - 300 ${step >= i ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'} `} />
          ))}
        </div>

        <div className="mb-2">
          {step === 1 && <GalaxyHeading text="Business Type" className="text-3xl md:text-4xl" />}
          {step === 2 && <GalaxyHeading text="Basic Info" className="text-3xl md:text-4xl" />}
          {step === 3 && <GalaxyHeading text="Almost Done" className="text-3xl md:text-4xl" />}
        </div>

        <p className={`${styles.textSub} mb - 12 max - w - md`}>
          {step === 1 && "Select the category that best describes your business to tailor the AI."}
          {step === 2 && "Choose how you would like to start building your profile."}
          {step === 3 && "Add the final details to launch your workspace."}
        </p>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <NeuButton
              className="h-48 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02] transition-transform"
              onClick={() => handleTypeSelect('Retail')}
            >
              <div className={`w - 16 h - 16 rounded - full ${styles.bg} ${styles.shadowOut} flex items - center justify - center text - brand`}>
                <Store size={32} />
              </div>
              <div className="text-center">
                <div className="font-bold text-base">Local / Retail</div>
                <div className={`text - xs ${styles.textSub} font - normal mt - 1 opacity - 70`}>Physical store, Foot traffic</div>
              </div>
            </NeuButton>

            <NeuButton
              className="h-48 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02] transition-transform"
              onClick={() => handleTypeSelect('E-Commerce')}
            >
              <div className={`w - 16 h - 16 rounded - full ${styles.bg} ${styles.shadowOut} flex items - center justify - center text - purple - 500`}>
                <ShoppingCart size={32} />
              </div>
              <div className="text-center">
                <div className="font-bold text-base">E-Commerce</div>
                <div className={`text - xs ${styles.textSub} font - normal mt - 1 opacity - 70`}>Online store, Shipping</div>
              </div>
            </NeuButton>

            <NeuButton
              className="h-48 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02] transition-transform"
              onClick={() => handleTypeSelect('Service')}
            >
              <div className={`w - 16 h - 16 rounded - full ${styles.bg} ${styles.shadowOut} flex items - center justify - center text - blue - 500`}>
                <UserCheck size={32} />
              </div>
              <div className="text-center">
                <div className="font-bold text-base">Service / Agency</div>
                <div className={`text - xs ${styles.textSub} font - normal mt - 1 opacity - 70`}>Consulting, Booking</div>
              </div>
            </NeuButton>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <NeuButton
              className="h-40 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02]"
              onClick={() => setStep(3)} // Skip website import for now
            >
              <div className={`w - 12 h - 12 rounded - full ${styles.bg} ${styles.shadowOut} flex items - center justify - center text - brand`}>
                <Globe size={24} />
              </div>
              <div>
                <div className="font-bold">Import from Website</div>
                <div className={`text - xs ${styles.textSub} font - normal mt - 1 opacity - 60`}>(Coming Soon)</div>
              </div>
            </NeuButton>

            <NeuButton
              className="h-40 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02]"
              onClick={() => setStep(3)}
            >
              <div className={`w - 12 h - 12 rounded - full ${styles.bg} ${styles.shadowOut} flex items - center justify - center text - brand`}>
                <Briefcase size={24} />
              </div>
              Manual Entry
            </NeuButton>
          </div>
        )}

        {step === 3 && (
          <div className="w-full space-y-6 text-left max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text - xs font - bold mb - 2 ml - 1 ${styles.textSub} uppercase tracking - wider`}>Business Name</label>
                <NeuInput
                  placeholder="e.g. Acme Co."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className={`block text - xs font - bold mb - 2 ml - 1 ${styles.textSub} uppercase tracking - wider`}>Industry</label>
                <NeuInput
                  placeholder="e.g. Fashion, Tech, Food"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={`block text - xs font - bold mb - 2 ml - 1 ${styles.textSub} uppercase tracking - wider`}>Website (Optional)</label>
              <NeuInput
                placeholder="https://..."
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>

            <div>
              <label className={`block text - xs font - bold mb - 2 ml - 1 ${styles.textSub} uppercase tracking - wider`}>Short Description</label>
              <NeuTextArea
                placeholder={selectedType === 'Retail'
                  ? "Describe your store, location, and what makes you unique to locals..."
                  : "Describe your brand, what you sell, and your mission..."}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex justify-between pt-6">
              <NeuButton onClick={() => setStep(1)} className="text-sm px-6 opacity-70">
                <ChevronLeft size={16} /> Back
              </NeuButton>
              <NeuButton onClick={handleSubmit} variant="primary" disabled={!formData.name} className="px-8">
                Create Business Profile <ArrowRight size={18} />
              </NeuButton>
            </div>
          </div>
        )}
      </NeuCard>
    </div>
  );
};

export default Onboarding;
