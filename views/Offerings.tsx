
import React, { useState, useEffect } from 'react';
import { Business, Offering, TeamMember, Location } from '../types';
import { NeuCard, NeuInput, NeuButton, NeuTextArea, NeuDropdown, useThemeStyles, NeuBadge, NeuListBuilder } from '../components/NeuComponents';
import { NeuImageUploader } from '../components/NeuImageUploader';
import { ShoppingBag, Plus, Trash2, DollarSign, Tag, Edit2, Save, X, Sparkles, Target, List, Gift, Users, Briefcase, MapPin } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { enhanceOffering } from '../services/geminiService';

interface OfferingsProps {
  business: Business;
  updateBusiness: (b: Business) => Promise<void>;
}

const Offerings: React.FC<OfferingsProps> = ({ business, updateBusiness }) => {
  const [localBusiness, setLocalBusiness] = useState<Business>(business);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isDirty, setDirty, registerSaveHandler } = useNavigation();
  const { toast } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { styles } = useThemeStyles();
  const localBusinessRef = React.useRef(localBusiness);

  const [activeTab, setActiveTab] = useState<'products' | 'team' | 'locations'>('products');
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamFormState, setTeamFormState] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    imageUrl: ''
  });

  // Location state
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationFormState, setLocationFormState] = useState<Partial<Location>>({
    name: '',
    description: '',
    imageUrl: '',
    additionalImages: []
  });

  const [formState, setFormState] = useState<Partial<Offering>>({
    name: '',
    description: '',
    price: '',
    category: 'Product',
    imageUrl: '',
    additionalImages: [],
    preserveLikeness: false,
    targetAudience: '',
    benefits: [],
    features: [],
    promotion: ''
  });

  useEffect(() => {
    localBusinessRef.current = localBusiness;
  }, [localBusiness]);

  useEffect(() => {
    setLocalBusiness(business);
  }, [business]);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      await updateBusiness(localBusinessRef.current);
      toast({ title: 'Offerings Saved', type: 'success' });
    } catch (e) {
      toast({ title: 'Save Failed', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [updateBusiness, toast]);

  useEffect(() => {
    const isChanged = JSON.stringify(business) !== JSON.stringify(localBusiness);
    setDirty(isChanged);
    registerSaveHandler(isChanged ? handleSave : null);
  }, [business, localBusiness, setDirty, registerSaveHandler, handleSave]);

  // Check for pending edit from Chat UI
  useEffect(() => {
    const pendingId = localStorage.getItem('pending_edit_id');
    if (pendingId && localBusiness.offerings.length > 0) {
      const offering = localBusiness.offerings.find(o => o.id === pendingId);
      if (offering) {
        handleEditClick(offering);
        localStorage.removeItem('pending_edit_id');
      }
    }
  }, [localBusiness.offerings]);

  const resetForm = () => {
    setFormState({
      name: '', description: '', price: '', category: 'Product', imageUrl: '', additionalImages: [], preserveLikeness: false,
      targetAudience: '', benefits: [], features: [], promotion: ''
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEditClick = (offering: Offering) => {
    setFormState({ ...offering, price: offering.price || '', additionalImages: offering.additionalImages || [] });
    setEditingId(offering.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnhance = async () => {
    if (!formState.name) {
      toast({ title: 'Enter a name first', type: 'info' });
      return;
    }
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceOffering(
        formState.name,
        formState.price,
        formState.category,
        formState.description
      );

      setFormState(prev => ({
        ...prev,
        description: enhanced.description,
        targetAudience: enhanced.targetAudience,
        benefits: enhanced.benefits,
        features: enhanced.features,
        promotion: enhanced.promotion
      }));
      toast({ title: 'Product Enhanced!', type: 'success' });
    } catch (e) {
      toast({ title: 'Enhancement Failed', type: 'error' });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = () => {
    if (!formState.name) return;

    // Sanitize Price: Strip currency symbols, letters, etc. Ensure clean number string.
    const cleanPrice = formState.price ? formState.price.replace(/[^0-9.]/g, '') : '';

    const baseOffering: Offering = {
      id: editingId || Date.now().toString(),
      name: formState.name!,
      description: formState.description || '',
      price: cleanPrice,
      category: formState.category || 'Product',
      active: true,
      imageUrl: formState.imageUrl || '',
      additionalImages: formState.additionalImages || [],
      preserveLikeness: formState.preserveLikeness || false,
      targetAudience: formState.targetAudience || '',
      benefits: formState.benefits || [],
      features: formState.features || [],
      promotion: formState.promotion || ''
    };

    if (editingId) {
      setLocalBusiness(prev => ({
        ...prev,
        offerings: prev.offerings.map(o => o.id === editingId ? baseOffering : o)
      }));
      toast({ title: 'Offering Updated', type: 'success' });
    } else {
      setLocalBusiness(prev => ({
        ...prev,
        offerings: [...prev.offerings, baseOffering]
      }));
      toast({ title: 'Offering Added', type: 'success' });
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this offering?')) {
      setLocalBusiness(prev => ({
        ...prev,
        offerings: prev.offerings.filter(o => o.id !== id)
      }));
    }
  };

  // Helper to add an additional image
  const addAdditionalImage = (url: string) => {
    setFormState(prev => ({
      ...prev,
      additionalImages: [...(prev.additionalImages || []), url]
    }));
  };

  // Helper to remove an additional image
  const removeAdditionalImage = (index: number) => {
    setFormState(prev => ({
      ...prev,
      additionalImages: (prev.additionalImages || []).filter((_, i) => i !== index)
    }));
  };

  // --- TEAM HANDLERS ---
  const resetTeamForm = () => {
    setTeamFormState({ name: '', role: '', imageUrl: '' });
    setEditingTeamId(null);
    setIsTeamFormOpen(false);
  };

  const handleEditTeamClick = (member: TeamMember) => {
    setTeamFormState({ ...member });
    setEditingTeamId(member.id);
    setIsTeamFormOpen(true);
  };

  const handleSaveTeam = () => {
    if (!teamFormState.name) return;

    const baseMember: TeamMember = {
      id: editingTeamId || Date.now().toString(),
      name: teamFormState.name!,
      role: teamFormState.role || 'Team Member',
      imageUrl: teamFormState.imageUrl || ''
    };

    let newMembers = [...(localBusiness.teamMembers || [])];
    if (editingTeamId) {
      newMembers = newMembers.map(m => m.id === editingTeamId ? baseMember : m);
      toast({ title: 'Team Member Updated', type: 'success' });
    } else {
      newMembers.push(baseMember);
      toast({ title: 'Team Member Added', type: 'success' });
    }

    setLocalBusiness(prev => ({ ...prev, teamMembers: newMembers }));
    resetTeamForm();
  };

  const handleDeleteTeam = (id: string) => {
    if (confirm('Remove this team member?')) {
      setLocalBusiness(prev => ({
        ...prev,
        teamMembers: prev.teamMembers?.filter(m => m.id !== id) || []
      }));
    }
  };

  // --- LOCATION HANDLERS ---
  const resetLocationForm = () => {
    setLocationFormState({ name: '', description: '', imageUrl: '', additionalImages: [] });
    setEditingLocationId(null);
    setIsLocationFormOpen(false);
  };

  const handleEditLocationClick = (location: Location) => {
    setLocationFormState({ ...location });
    setEditingLocationId(location.id);
    setIsLocationFormOpen(true);
  };

  const handleSaveLocation = () => {
    if (!locationFormState.name) return;

    const baseLocation: Location = {
      id: editingLocationId || Date.now().toString(),
      name: locationFormState.name!,
      description: locationFormState.description || '',
      imageUrl: locationFormState.imageUrl || '',
      additionalImages: locationFormState.additionalImages || []
    };

    let newLocations = [...(localBusiness.locations || [])];
    if (editingLocationId) {
      newLocations = newLocations.map(l => l.id === editingLocationId ? baseLocation : l);
      toast({ title: 'Location Updated', type: 'success' });
    } else {
      newLocations.push(baseLocation);
      toast({ title: 'Location Added', type: 'success' });
    }

    setLocalBusiness(prev => ({ ...prev, locations: newLocations }));
    resetLocationForm();
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm('Remove this location?')) {
      setLocalBusiness(prev => ({
        ...prev,
        locations: prev.locations?.filter(l => l.id !== id) || []
      }));
    }
  };

  const addLocationImage = (url: string) => {
    setLocationFormState(prev => ({
      ...prev,
      additionalImages: [...(prev.additionalImages || []), url]
    }));
  };

  const removeLocationImage = (index: number) => {
    setLocationFormState(prev => ({
      ...prev,
      additionalImages: (prev.additionalImages || []).filter((_, i) => i !== index)
    }));
  };

  const getCurrencySymbol = (code?: string) => {
    switch (code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CNY': return '¥';
      case 'INR': return '₹';
      case 'BRL': return 'R$';
      case 'ZAR': return 'R';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(business.currency);

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-center sticky top-0 z-10 py-4 bg-opacity-90 backdrop-blur-sm">
        <div>
          <GalaxyHeading
            text={activeTab === 'products' ? "Product Lab" : "Team Roster"}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
          />
          <p className={styles.textSub}>
            {activeTab === 'products'
              ? "Define your products with AI-powered marketing intelligence."
              : "Manage your team members for AI-generated content."}
          </p>
        </div>
        <div className="flex gap-3">
          <NeuButton
            variant={isDirty ? 'primary' : 'secondary'}
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </NeuButton>

          {activeTab === 'products' && !isFormOpen && (
            <NeuButton variant="primary" onClick={() => setIsFormOpen(true)}>
              <Plus size={18} /> Add Product
            </NeuButton>
          )}

          {activeTab === 'team' && !isTeamFormOpen && (
            <NeuButton variant="primary" onClick={() => setIsTeamFormOpen(true)}>
              <Plus size={18} /> Add Member
            </NeuButton>
          )}

          {activeTab === 'locations' && !isLocationFormOpen && (
            <NeuButton variant="primary" onClick={() => setIsLocationFormOpen(true)}>
              <Plus size={18} /> Add Location
            </NeuButton>
          )}
        </div>
      </header>

      {/* Tab Switcher */}
      <div className={`flex p-1 ${styles.bg} rounded-xl ${styles.shadowIn} max-w-md mb-8`}>
        {[
          { id: 'products', label: 'Products', icon: ShoppingBag },
          { id: 'team', label: 'Team', icon: Users },
          { id: 'locations', label: 'Locations', icon: MapPin }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
              ? `${styles.bg} ${styles.shadowOut} text-brand`
              : `${styles.textSub} hover:${styles.textMain}`
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <>
          {isFormOpen && (
            <NeuCard className="animate-fade-in border-2 border-brand/20 ring-4 ring-brand/5">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/10 rounded-lg">
                    {editingId ? <Edit2 className="text-brand" size={20} /> : <Plus className="text-brand" size={20} />}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${styles.textMain}`}>
                      {editingId ? 'Edit Product Strategy' : 'New Product Strategy'}
                    </h3>
                    <p className={`text-xs ${styles.textSub}`}>
                      Enter basic details and let AI flesh out the marketing strategy.
                    </p>
                  </div>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} className={styles.textSub} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-6">
                {/* Left Column: Visuals */}
                <div className="md:col-span-4 space-y-6">
                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-2 uppercase tracking-wider`}>Hero Image</label>
                    <NeuImageUploader
                      currentValue={formState.imageUrl || ''}
                      onUpload={(url) => setFormState(prev => ({ ...prev, imageUrl: url }))}
                      folder="products"
                    />
                  </div>

                  {/* Additional Angles */}
                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-2 uppercase tracking-wider`}>
                      Additional Angles ({(formState.additionalImages || []).length}/3)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(formState.additionalImages || []).map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10">
                          <img src={url} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeAdditionalImage(index)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {(formState.additionalImages?.length || 0) < 3 && (
                        <div className="aspect-square">
                          <NeuImageUploader
                            currentValue=""
                            onUpload={addAdditionalImage}
                            folder="products/extras"
                            compact
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${styles.border} bg-black/5 flex items-start gap-3`}>
                    <input
                      type="checkbox"
                      id="preserve"
                      checked={formState.preserveLikeness || false}
                      onChange={e => setFormState(prev => ({ ...prev, preserveLikeness: e.target.checked }))}
                      className="mt-1 w-4 h-4 accent-brand"
                    />
                    <div>
                      <label htmlFor="preserve" className={`text-sm font-bold ${styles.textMain} cursor-pointer block`}>
                        Preserve Product Integrity
                      </label>
                      <p className={`text-xs ${styles.textSub} mt-1 leading-relaxed`}>
                        Uses the real product image. Disable to allow the AI to stylize it.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Data */}
                <div className="md:col-span-8 space-y-6">
                  {/* Core Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Product Name</label>
                      <NeuInput
                        placeholder="e.g. Summer Latte"
                        value={formState.name}
                        onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Category</label>
                      <NeuDropdown
                        value={formState.category || 'Product'}
                        onChange={val => setFormState(prev => ({ ...prev, category: val }))}
                        options={[
                          { value: "Physical Product", label: "Physical Product" },
                          { value: "Service", label: "Service" },
                          { value: "Digital Product", label: "Digital Product" },
                          { value: "Food & Beverage", label: "Food & Beverage" },
                          { value: "Retail", label: "Retail" },
                          { value: "Real Estate", label: "Real Estate" },
                          { value: "Other", label: "Other" }
                        ]}
                      />
                    </div>

                    <div className="relative col-span-1">
                      <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Price ({currencySymbol})</label>
                      <div className="relative">
                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${styles.textSub} font-bold`}>
                          {currencySymbol}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className={`w-full rounded-xl pl-10 pr-4 py-3 outline-none transition-all ${styles.bg} ${styles.shadowIn} ${styles.textMain} ${styles.inputPlaceholder} focus:ring-2 focus:ring-brand/20`}
                          value={formState.price ? String(formState.price).replace(/[^0-9.]/g, '') : ''}
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setFormState(prev => ({ ...prev, price: val }));
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-end col-span-1">
                      <NeuButton
                        variant="primary"
                        onClick={handleEnhance}
                        disabled={isEnhancing || !formState.name}
                        className="w-full h-[50px]"
                      >
                        {isEnhancing ? (
                          <span className="animate-pulse">✨ Magic Working...</span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Sparkles size={16} /> Auto-Generate Strategy
                          </span>
                        )}
                      </NeuButton>
                    </div>
                  </div>

                  {/* AI Generated / Manual Strategy Fields */}
                  <div className="space-y-4 pt-4 border-t border-gray-200/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={16} className="text-brand" />
                      <span className={`text-sm font-bold ${styles.textSub} uppercase tracking-wider`}>Marketing Intelligence</span>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Persuasive Description</label>
                      <NeuTextArea
                        placeholder="Describe the outcome and experience..."
                        value={formState.description}
                        onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                        expandable
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Target Audience</label>
                        <NeuInput
                          placeholder="e.g. Busy professionals"
                          value={formState.targetAudience}
                          onChange={e => setFormState(prev => ({ ...prev, targetAudience: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Active Promotion</label>
                        <NeuInput
                          placeholder="e.g. Buy 1 Get 1 Free"
                          value={formState.promotion}
                          onChange={e => setFormState(prev => ({ ...prev, promotion: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <NeuListBuilder
                        title="Key Benefits"
                        items={formState.benefits || []}
                        onItemsChange={(items) => setFormState(prev => ({ ...prev, benefits: items }))}
                        placeholder="Add a benefit (e.g. Saves time)"
                      />

                      <NeuListBuilder
                        title="Tech Specs / Features"
                        items={formState.features || []}
                        onItemsChange={(items) => setFormState(prev => ({ ...prev, features: items }))}
                        placeholder="Add a feature (e.g. 12oz Cup)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-end border-t pt-6 border-gray-200/10">
                <NeuButton onClick={resetForm}>Cancel</NeuButton>
                <NeuButton variant="primary" onClick={handleSubmit}>
                  {editingId ? 'Update Strategy' : 'Save Product'}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {localBusiness.offerings.map(offering => (
              <NeuCard key={offering.id} className="h-full flex flex-col justify-between group relative overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="flex gap-5">
                  <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200/20 shadow-inner relative">
                    {offering.imageUrl ? (
                      <img src={offering.imageUrl} alt={offering.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag size={32} className="text-gray-300" />
                    )}
                    {offering.preserveLikeness && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm py-1 flex justify-center">
                        <span className="text-[9px] text-white font-bold uppercase tracking-wider">Strict Mode</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-bold ${styles.textMain} text-xl truncate pr-2`}>{offering.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <NeuBadge variant="neutral">{offering.category}</NeuBadge>
                          <span className={`text-sm font-bold ${styles.textMain}`}>
                            {/* Display Logic: Strip existing symbols/letters, then format with current currency */}
                            {`${currencySymbol}${offering.price.replace(/[^0-9.]/g, '')}`}
                          </span>
                        </div>
                      </div>
                      {offering.promotion && (
                        <NeuBadge variant="primary" className="animate-pulse-slow max-w-[120px] truncate inline-flex items-center">
                          <Gift size={10} className="mr-1 shrink-0" />
                          <span className="truncate">{offering.promotion}</span>
                        </NeuBadge>
                      )}
                    </div>

                    <p className={`${styles.textSub} text-sm line-clamp-2 leading-relaxed`}>
                      {offering.description || "No description set."}
                    </p>

                    {offering.targetAudience && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Target size={12} className="text-brand shrink-0" />
                        <span className="text-xs font-medium text-gray-500 truncate">Target: {offering.targetAudience}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className={`mt-5 pt-4 border-t ${styles.border} flex justify-between items-center opacity-60 group-hover:opacity-100 transition-all duration-300`}>
                  <div className="flex gap-2">
                    {(offering.benefits?.length || 0) > 0 && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold">
                        {offering.benefits?.length} Benefits
                      </span>
                    )}
                    {(offering.features?.length || 0) > 0 && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold">
                        {offering.features?.length} Features
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditClick(offering)}
                      className={`text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors`}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(offering.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </NeuCard>
            ))}

            {localBusiness.offerings.length === 0 && !isFormOpen && (
              <div className={`col-span-1 md:col-span-2 text-center py-20 ${styles.textSub} border-2 border-dashed border-gray-300/20 rounded-3xl bg-gray-50/50`}>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} className="text-brand opacity-50" />
                </div>
                <p className="text-xl font-bold mb-2">Your Product Lab is Empty</p>
                <p className="text-sm opacity-70 mb-8 max-w-md mx-auto">
                  Add your products and services. Our AI will automatically generate marketing angles, benefits, and target audiences for you.
                </p>
                <NeuButton variant="primary" onClick={() => setIsFormOpen(true)}>
                  <Plus size={18} /> Add First Product
                </NeuButton>
              </div>
            )}

          </div>
        </>
      )}

      {activeTab === 'team' && (
        <>
          {isTeamFormOpen && (
            <NeuCard className="animate-fade-in border-2 border-brand/20 ring-4 ring-brand/5 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/10 rounded-lg">
                    {editingTeamId ? <Edit2 className="text-brand" size={20} /> : <Plus className="text-brand" size={20} />}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${styles.textMain}`}>
                      {editingTeamId ? 'Edit Team Member' : 'Add Team Member'}
                    </h3>
                    <p className={`text-xs ${styles.textSub}`}>
                      Upload a photo to use this person in AI generations.
                    </p>
                  </div>
                </div>
                <button onClick={resetTeamForm} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} className={styles.textSub} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-6">
                <div className="md:col-span-4">
                  <label className={`block text-xs font-bold ${styles.textSub} mb-2 uppercase tracking-wider`}>Photo</label>
                  <NeuImageUploader
                    currentValue={teamFormState.imageUrl || ''}
                    onUpload={(url) => setTeamFormState(prev => ({ ...prev, imageUrl: url }))}
                    folder="team"
                  />
                </div>
                <div className="md:col-span-8 space-y-4">
                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Full Name</label>
                    <NeuInput
                      placeholder="e.g. Sarah Connor"
                      value={teamFormState.name}
                      onChange={e => setTeamFormState(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Role / Title</label>
                    <NeuInput
                      placeholder="e.g. CEO"
                      value={teamFormState.role}
                      onChange={e => setTeamFormState(prev => ({ ...prev, role: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end border-t pt-6 border-gray-200/10">
                <NeuButton onClick={resetTeamForm}>Cancel</NeuButton>
                <NeuButton variant="primary" onClick={handleSaveTeam}>
                  {editingTeamId ? 'Update Member' : 'Add Member'}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(localBusiness.teamMembers || []).map(member => (
              <NeuCard key={member.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4 relative">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Users size={48} />
                    </div>
                  )}
                </div>

                <h4 className={`font-bold ${styles.textMain} text-lg`}>{member.name}</h4>
                <p className={`text-sm ${styles.textSub}`}>{member.role}</p>

                <div className={`mt-4 pt-4 border-t ${styles.border} flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300`}>
                  <button
                    onClick={() => handleEditTeamClick(member)}
                    className={`text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors`}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(member.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </NeuCard>
            ))}

            {(localBusiness.teamMembers || []).length === 0 && !isTeamFormOpen && (
              <div className={`col-span-1 md:col-span-3 text-center py-20 ${styles.textSub} border-2 border-dashed border-gray-300/20 rounded-3xl bg-black/5`}>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-brand opacity-50" />
                </div>
                <p className="text-xl font-bold mb-2">No Team Members Yet</p>
                <p className="text-sm opacity-70 mb-8 max-w-md mx-auto">
                  Add your team to generate personalized content featuring your real employees.
                </p>
                <NeuButton variant="primary" onClick={() => setIsTeamFormOpen(true)}>
                  <Plus size={18} /> Add Team Member
                </NeuButton>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'locations' && (
        <>
          {isLocationFormOpen && (
            <NeuCard className="animate-fade-in border-2 border-brand/20 ring-4 ring-brand/5 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand/10 rounded-lg">
                    {editingLocationId ? <Edit2 className="text-brand" size={20} /> : <Plus className="text-brand" size={20} />}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${styles.textMain}`}>
                      {editingLocationId ? 'Edit Location' : 'Add Location'}
                    </h3>
                    <p className={`text-xs ${styles.textSub}`}>
                      Upload photos of your storefront or physical space.
                    </p>
                  </div>
                </div>
                <button onClick={resetLocationForm} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={20} className={styles.textSub} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-6">
                <div className="md:col-span-4 space-y-4">
                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-2 uppercase tracking-wider`}>Hero Image</label>
                    <NeuImageUploader
                      currentValue={locationFormState.imageUrl || ''}
                      onUpload={(url) => setLocationFormState(prev => ({ ...prev, imageUrl: url }))}
                      folder="locations"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-2 uppercase tracking-wider`}>
                      Additional Views ({(locationFormState.additionalImages || []).length}/3)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(locationFormState.additionalImages || []).map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10">
                          <img src={url} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeLocationImage(index)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {(locationFormState.additionalImages?.length || 0) < 3 && (
                        <div className="aspect-square">
                          <NeuImageUploader
                            currentValue=""
                            onUpload={addLocationImage}
                            folder="locations/extras"
                            compact
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Location Name</label>
                    <NeuInput
                      placeholder="e.g. Main Store, Downtown Branch"
                      value={locationFormState.name}
                      onChange={e => setLocationFormState(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Description / Vibe</label>
                    <NeuTextArea
                      placeholder="Describe the atmosphere, what makes this space special..."
                      value={locationFormState.description}
                      onChange={e => setLocationFormState(prev => ({ ...prev, description: e.target.value }))}
                      expandable
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end border-t pt-6 border-gray-200/10">
                <NeuButton onClick={resetLocationForm}>Cancel</NeuButton>
                <NeuButton variant="primary" onClick={handleSaveLocation}>
                  {editingLocationId ? 'Update Location' : 'Add Location'}
                </NeuButton>
              </div>
            </NeuCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(localBusiness.locations || []).map(location => (
              <NeuCard key={location.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4 relative">
                  {location.imageUrl ? (
                    <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <MapPin size={48} />
                    </div>
                  )}
                </div>

                <h4 className={`font-bold ${styles.textMain} text-lg`}>{location.name}</h4>
                <p className={`text-sm ${styles.textSub} line-clamp-2`}>{location.description || 'No description'}</p>

                {(location.additionalImages?.length || 0) > 0 && (
                  <div className="flex gap-1 mt-3">
                    {location.additionalImages?.slice(0, 3).map((img, i) => (
                      <div key={i} className="w-10 h-10 rounded overflow-hidden">
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className={`mt-4 pt-4 border-t ${styles.border} flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300`}>
                  <button
                    onClick={() => handleEditLocationClick(location)}
                    className={`text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors`}
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </NeuCard>
            ))}

            {(localBusiness.locations || []).length === 0 && !isLocationFormOpen && (
              <div className={`col-span-1 md:col-span-2 text-center py-20 ${styles.textSub} border-2 border-dashed border-gray-300/20 rounded-3xl bg-black/5`}>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} className="text-brand opacity-50" />
                </div>
                <p className="text-xl font-bold mb-2">No Locations Yet</p>
                <p className="text-sm opacity-70 mb-8 max-w-md mx-auto">
                  Add your storefront or physical locations to generate ads featuring your real space.
                </p>
                <NeuButton variant="primary" onClick={() => setIsLocationFormOpen(true)}>
                  <Plus size={18} /> Add Location
                </NeuButton>
              </div>
            )}
          </div>
        </>
      )}
    </div>

  );
};

export default Offerings;
