import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuCard, NeuButton, NeuInput, NeuTextArea, useThemeStyles, BRAND_COLOR } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { ExtractionProgressComponent } from '../components/ExtractionProgress';
import { ExtractionPreview } from '../components/ExtractionPreview';
import { Business } from '../types';
import {
  extractWebsite,
  discoverPages,
  extractedDataToBusiness,
  extractedDataToOfferings,
  ExtractionState,
  ExtractionResult,
  ExtractedBusinessData,
  DiscoveredPage
} from '../services/extractionService';
import {
  Globe, ArrowRight, Building, Store, ShoppingCart,
  UserCheck, Briefcase, ChevronLeft, Sparkles, PenLine,
  CheckSquare, Square, Loader2, AlertTriangle, FileText, ListChecks
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

interface OnboardingProps {
  onComplete: (business: Partial<Business>) => void;
}

type OnboardingStep =
  | 'type'           // Step 1: Select business type
  | 'method'         // Step 2: Choose import method
  | 'url-input'      // Step 2b: Enter URL
  | 'select-pages'   // Step 2c: Choose which pages to extract (NEW)
  | 'extracting'     // Step 2d: Loading state during extraction
  | 'preview'        // Step 2e: Review extracted data
  | 'manual';        // Step 3: Manual entry form

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { styles, theme } = useThemeStyles();
  const navigate = useNavigate();
  const { subscription, loading: subLoading, planName } = useSubscription();

  // Limit check from context
  // NOTE: For first-business users (0 businesses, full-screen onboarding), they're always allowed
  // For existing users adding a new business, the limit is already checked in App.tsx
  // So we primarily show the blocking screen only when subscription is loaded and limit is explicitly reached
  const limitCheck = {
    loading: subLoading,
    atLimit: false, // Limit check is done in App.tsx before reaching here
    maxAllowed: subscription?.maxBusinesses ?? 10,
    currentCount: 0,
    planName: planName || 'Your plan'
  };

  // Flow state
  const [step, setStep] = useState<OnboardingStep>('type');
  const [selectedType, setSelectedType] = useState<Business['type'] | null>(null);

  // URL extraction state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [crawlMode, setCrawlMode] = useState<'single' | 'full' | 'select'>('single');
  const [extractionState, setExtractionState] = useState<ExtractionState>({
    progress: 'idle',
    message: '',
  });
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);

  // Page selection state (for 'select' mode)
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  const [selectedPageUrls, setSelectedPageUrls] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Manual form data (fallback or override)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    description: '',
    website: ''
  });

  const handleTypeSelect = (type: Business['type']) => {
    setSelectedType(type);
    setStep('method');
  };

  // Handle the "Extract & Build" button
  const handleStartExtraction = useCallback(async () => {
    if (!websiteUrl) return;
    setFormData(prev => ({ ...prev, website: websiteUrl }));

    // If 'select' mode, discover pages first
    if (crawlMode === 'select') {
      setIsDiscovering(true);
      const discovery = await discoverPages(websiteUrl);
      setIsDiscovering(false);

      if (discovery.success && discovery.pages && discovery.pages.length > 0) {
        setDiscoveredPages(discovery.pages);
        setSelectedPageUrls([discovery.pages[0].url]); // Pre-select first page
        setStep('select-pages');
      } else {
        // Fallback to single page if discovery fails
        setStep('extracting');
        const result = await extractWebsite(websiteUrl, 'single', setExtractionState);
        setExtractionResult(result);
        if (result.success && result.data) setStep('preview');
      }
      return;
    }

    // For 'single' or 'full' modes, go straight to extraction
    setStep('extracting');
    const result = await extractWebsite(websiteUrl, crawlMode, setExtractionState);
    setExtractionResult(result);
    if (result.success && result.data) setStep('preview');
  }, [websiteUrl, crawlMode]);

  // Handle extraction of selected pages
  const handleExtractSelectedPages = useCallback(async () => {
    if (selectedPageUrls.length === 0) return;

    setStep('extracting');

    // Pass ALL selected URLs with 'select' mode for batch scraping
    const result = await extractWebsite(selectedPageUrls, 'select', setExtractionState);
    setExtractionResult(result);
    if (result.success && result.data) setStep('preview');
  }, [selectedPageUrls]);

  const togglePageSelection = (url: string) => {
    setSelectedPageUrls(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      }
      if (prev.length >= 10) return prev; // Max 10 pages
      return [...prev, url];
    });
  };

  const handleConfirmExtraction = (extractedData: ExtractedBusinessData) => {
    // Convert extracted data to Business format
    const businessData = extractedDataToBusiness(extractedData, selectedType || undefined);
    const offerings = extractedDataToOfferings(extractedData);

    onComplete({
      ...businessData,
      website: websiteUrl || businessData.website,
      type: selectedType || businessData.type || 'Other',
      id: Math.random().toString(36).substr(2, 9),
      credits: 50,
      role: 'Owner',
      offerings: offerings as any,
    });
  };

  const handleManualSubmit = () => {
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

  // Calculate progress indicator step
  const getProgressStep = () => {
    switch (step) {
      case 'type': return 1;
      case 'method':
      case 'url-input':
      case 'extracting':
      case 'preview': return 2;
      case 'manual': return 3;
      default: return 1;
    }
  };

  // URL Input Step (2b)
  const renderUrlInput = () => (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <GalaxyHeading text="Enter Your Website" className="text-3xl md:text-4xl" />
        <p className={`${styles.textSub} mt-4 max-w-md mx-auto`}>
          We'll extract your brand colors, contact info, products, and more.
        </p>
      </div>

      <NeuCard className="p-6">
        <div className="flex gap-3">
          <div className={`w-12 h-12 rounded-xl ${styles.bg} ${styles.shadowIn} flex items-center justify-center text-brand shrink-0`}>
            <Globe size={24} />
          </div>
          <NeuInput
            placeholder="https://yourwebsite.com or https://yoursite.com/specific-page"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Crawl Mode Toggle */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => setCrawlMode('single')}
            className={`py-3 px-3 rounded-xl text-sm font-medium transition-all ${crawlMode === 'single'
              ? 'bg-brand/20 text-brand border-2 border-brand'
              : `${styles.bg} ${styles.shadowOut} hover:scale-[1.01]`
              }`}
          >
            <FileText size={18} className="mx-auto mb-1" />
            This Page
            <span className={`block text-xs mt-1 ${crawlMode === 'single' ? 'opacity-80' : styles.textSub}`}>
              Fast
            </span>
          </button>
          <button
            onClick={() => setCrawlMode('select')}
            className={`py-3 px-3 rounded-xl text-sm font-medium transition-all ${crawlMode === 'select'
              ? 'bg-brand/20 text-brand border-2 border-brand'
              : `${styles.bg} ${styles.shadowOut} hover:scale-[1.01]`
              }`}
          >
            <ListChecks size={18} className="mx-auto mb-1" />
            Choose Pages
            <span className={`block text-xs mt-1 ${crawlMode === 'select' ? 'opacity-80' : styles.textSub}`}>
              Select up to 10
            </span>
          </button>
          <button
            onClick={() => setCrawlMode('full')}
            className={`py-3 px-3 rounded-xl text-sm font-medium transition-all ${crawlMode === 'full'
              ? 'bg-brand/20 text-brand border-2 border-brand'
              : `${styles.bg} ${styles.shadowOut} hover:scale-[1.01]`
              }`}
          >
            <Globe size={18} className="mx-auto mb-1" />
            Full Site
            <span className={`block text-xs mt-1 ${crawlMode === 'full' ? 'opacity-80' : styles.textSub}`}>
              Auto-crawl 5 pages
            </span>
          </button>
        </div>
      </NeuCard>

      <div className="flex justify-between pt-4">
        <NeuButton onClick={() => setStep('method')} className="text-sm px-6">
          <ChevronLeft size={16} /> Back
        </NeuButton>
        <NeuButton
          onClick={handleStartExtraction}
          variant="primary"
          disabled={!websiteUrl || isDiscovering}
          className="px-8"
        >
          {isDiscovering ? (
            <><Loader2 size={18} className="animate-spin" /> Finding Pages...</>
          ) : (
            <><Sparkles size={18} /> Extract & Build</>
          )}
        </NeuButton>
      </div>

      <p className={`text-xs pl-2 pt-4 py-2 ${styles.textSub} opacity-70 text-center max-w-sm mx-auto`}>
        This feature is in <strong>Beta</strong>. The AI may make mistakes or miss content. Please review all extracted data carefully.
      </p>

      <button
        onClick={() => setStep('manual')}
        className={`w-full text-center text-sm ${styles.textSub} hover:text-brand transition-colors`}
      >
        I don't have a website → Enter manually
      </button>
    </div>
  );

  // Select Pages Step (2c) - Choose which pages to extract
  const renderSelectPages = () => (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <GalaxyHeading text="Choose Pages" className="text-3xl md:text-4xl" />
        <p className={`${styles.textSub} mt-4 max-w-md mx-auto`}>
          Select up to 10 pages to extract data from. More pages = more info.
        </p>
      </div>

      <NeuCard className="p-6">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {discoveredPages.slice(0, 15).map((page) => {
            const isSelected = selectedPageUrls.includes(page.url);
            return (
              <button
                key={page.id}
                onClick={() => togglePageSelection(page.url)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isSelected
                  ? 'bg-brand/20 border-2 border-brand'
                  : `${styles.bg} ${styles.shadowOut} hover:scale-[1.01]`
                  }`}
              >
                {isSelected ? (
                  <CheckSquare size={20} className="text-brand shrink-0" />
                ) : (
                  <Square size={20} className={`${styles.textSub} shrink-0`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{page.title || 'Page'}</div>
                  <div className={`text-xs ${styles.textSub} truncate`}>{page.url}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className={`mt-4 text-center text-sm ${styles.textSub}`}>
          {selectedPageUrls.length}/10 pages selected
        </div>
      </NeuCard>

      <div className="flex justify-between pt-4">
        <NeuButton onClick={() => setStep('url-input')} className="text-sm px-6">
          <ChevronLeft size={16} /> Back
        </NeuButton>
        <NeuButton
          onClick={handleExtractSelectedPages}
          variant="primary"
          disabled={selectedPageUrls.length === 0}
          className="px-8"
        >
          <Sparkles size={18} /> Extract Selected
        </NeuButton>
      </div>
    </div>
  );

  // Extracting Step (2c)
  const renderExtracting = () => (
    <div className="w-full py-8 animate-fade-in">
      <ExtractionProgressComponent
        progress={extractionState.progress}
        message={extractionState.message}
        url={websiteUrl}
      />

      {extractionState.progress === 'error' && (
        <div className="flex justify-center gap-4 mt-8">
          <NeuButton onClick={() => setStep('url-input')} className="px-6">
            <ChevronLeft size={16} /> Try Different URL
          </NeuButton>
          <NeuButton onClick={() => setStep('manual')} className="px-6">
            <PenLine size={16} /> Enter Manually
          </NeuButton>
        </div>
      )}
    </div>
  );

  // Preview Step (2d)
  const renderPreview = () => {
    if (!extractionResult) return null;

    return (
      <ExtractionPreview
        result={extractionResult}
        onConfirm={handleConfirmExtraction}
        onBack={() => setStep('url-input')}
      />
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      {/* Loading State */}
      {limitCheck.loading && (
        <NeuCard className="max-w-md w-full flex flex-col items-center text-center py-12 px-8">
          <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
          <p className={styles.textSub}>Checking your plan limits...</p>
        </NeuCard>
      )}

      {/* Limit Reached State */}
      {!limitCheck.loading && limitCheck.atLimit && (
        <NeuCard className="max-w-md w-full flex flex-col items-center text-center py-12 px-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 opacity-70" />

          <div className={`w-16 h-16 rounded-full ${styles.bg} ${styles.shadowIn} flex items-center justify-center text-orange-400 mb-6`}>
            <AlertTriangle size={32} />
          </div>

          <GalaxyHeading text="Business Limit Reached" className="text-2xl md:text-3xl mb-4" />

          <p className={`${styles.textSub} mb-2`}>
            Your <strong className={styles.textMain}>{limitCheck.planName}</strong> plan allows{' '}
            <strong className={styles.textMain}>{limitCheck.maxAllowed}</strong> business{limitCheck.maxAllowed > 1 ? 'es' : ''}.
          </p>
          <p className={`${styles.textSub} mb-8`}>
            You currently have <strong className={styles.textMain}>{limitCheck.currentCount}</strong>.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <NeuButton
              variant="primary"
              className="w-full justify-center"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </NeuButton>
            <p className={`text-xs ${styles.textSub}`}>
              Need more businesses? Contact support to upgrade.
            </p>
          </div>
        </NeuCard>
      )}

      {/* Normal Onboarding Flow */}
      {!limitCheck.loading && !limitCheck.atLimit && (
        <NeuCard className="max-w-3xl w-full flex flex-col items-center text-center py-12 px-8 relative overflow-hidden">

          {/* Decorative Glow */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />

          {/* Progress Indicator - only for standard steps */}
          {!['extracting', 'preview'].includes(step) && (
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-1 w-12 rounded-full transition-colors duration-300 ${getProgressStep() >= i ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                />
              ))}
            </div>
          )}

          {/* Step 1: Business Type */}
          {step === 'type' && (
            <>
              <div className="mb-2">
                <GalaxyHeading text="Business Type" className="text-3xl md:text-4xl" />
              </div>
              <p className={`${styles.textSub} mb-12 max-w-md`}>
                Select the category that best describes your business to tailor the AI.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <NeuButton
                  className="h-48 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02] transition-transform"
                  onClick={() => handleTypeSelect('Retail')}
                >
                  <div className={`w-16 h-16 rounded-full ${styles.bg} ${styles.shadowOut} flex items-center justify-center text-brand`}>
                    <Store size={32} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-base">Local / Retail</div>
                    <div className={`text-xs ${styles.textSub} font-normal mt-1 opacity-70`}>Physical store, Foot traffic</div>
                  </div>
                </NeuButton>

                <NeuButton
                  className="h-48 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02] transition-transform"
                  onClick={() => handleTypeSelect('E-Commerce')}
                >
                  <div className={`w-16 h-16 rounded-full ${styles.bg} ${styles.shadowOut} flex items-center justify-center text-purple-500`}>
                    <ShoppingCart size={32} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-base">E-Commerce</div>
                    <div className={`text-xs ${styles.textSub} font-normal mt-1 opacity-70`}>Online store, Shipping</div>
                  </div>
                </NeuButton>

                <NeuButton
                  className="h-48 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02] transition-transform"
                  onClick={() => handleTypeSelect('Service')}
                >
                  <div className={`w-16 h-16 rounded-full ${styles.bg} ${styles.shadowOut} flex items-center justify-center text-blue-500`}>
                    <UserCheck size={32} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-base">Service / Agency</div>
                    <div className={`text-xs ${styles.textSub} font-normal mt-1 opacity-70`}>Consulting, Booking</div>
                  </div>
                </NeuButton>
              </div>
            </>
          )}

          {/* Step 2: Profile Method */}
          {step === 'method' && (
            <>
              <div className="mb-2">
                <GalaxyHeading text="Build Your Profile" className="text-3xl md:text-4xl" />
              </div>
              <p className={`${styles.textSub} mb-12 max-w-md`}>
                Import from your website for instant setup, or start from scratch.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
                <NeuButton
                  className="h-44 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02] transition-transform border-2 border-brand/30"
                  onClick={() => setStep('url-input')}
                >
                  <div className={`w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center text-brand`}>
                    <Sparkles size={28} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold flex items-center justify-center gap-2">
                      Import from Website
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 border border-blue-200 uppercase tracking-wide">
                        Beta
                      </span>
                    </div>
                    <div className={`text-xs ${styles.textSub} font-normal mt-1`}>
                      AI extracts your brand automatically
                    </div>
                  </div>
                </NeuButton>

                <NeuButton
                  className="h-44 flex flex-col items-center justify-center gap-4 text-lg hover:scale-[1.02] transition-transform"
                  onClick={() => setStep('manual')}
                >
                  <div className={`w-14 h-14 rounded-full ${styles.bg} ${styles.shadowOut} flex items-center justify-center text-brand`}>
                    <PenLine size={28} />
                  </div>
                  <div className="text-center">
                    <div className="font-bold">Start from Scratch</div>
                    <div className={`text-xs ${styles.textSub} font-normal mt-1`}>
                      Enter details manually
                    </div>
                  </div>
                </NeuButton>
              </div>

              <button
                onClick={() => setStep('type')}
                className={`mt-8 text-sm ${styles.textSub} hover:text-brand transition-colors flex items-center gap-1`}
              >
                <ChevronLeft size={14} /> Change business type
              </button>
            </>
          )}

          {/* Step 2b: URL Input */}
          {step === 'url-input' && renderUrlInput()}

          {/* Step 2c: Select Pages (Choose Pages mode) */}
          {step === 'select-pages' && renderSelectPages()}

          {/* Step 2d: Extracting */}
          {step === 'extracting' && renderExtracting()}

          {/* Step 2e: Preview */}
          {step === 'preview' && renderPreview()}

          {/* Step 3: Manual Entry */}
          {step === 'manual' && (
            <>
              <div className="mb-2">
                <GalaxyHeading text="Basic Info" className="text-3xl md:text-4xl" />
              </div>
              <p className={`${styles.textSub} mb-8 max-w-md`}>
                Add the details to launch your workspace.
              </p>

              <div className="w-full space-y-6 text-left max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-2 ml-1 ${styles.textSub} uppercase tracking-wider`}>Business Name</label>
                    <NeuInput
                      placeholder="e.g. Acme Co."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-2 ml-1 ${styles.textSub} uppercase tracking-wider`}>Industry</label>
                    <NeuInput
                      placeholder="e.g. Fashion, Tech, Food"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-2 ml-1 ${styles.textSub} uppercase tracking-wider`}>Website (Optional)</label>
                  <NeuInput
                    placeholder="https://..."
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-2 ml-1 ${styles.textSub} uppercase tracking-wider`}>Short Description</label>
                  <NeuTextArea
                    placeholder={selectedType === 'Retail'
                      ? "Describe your store, location, and what makes you unique to locals..."
                      : "Describe your brand, what you sell, and your mission..."}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-between pt-6">
                  <NeuButton onClick={() => setStep('method')} className="text-sm px-6">
                    <ChevronLeft size={16} /> Back
                  </NeuButton>
                  <NeuButton onClick={handleManualSubmit} variant="primary" disabled={!formData.name} className="px-8">
                    Create Business Profile <ArrowRight size={18} />
                  </NeuButton>
                </div>
              </div>
            </>
          )}
        </NeuCard>
      )}
    </div>
  );
};

export default Onboarding;
