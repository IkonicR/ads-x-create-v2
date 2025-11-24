
import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { NeuCard, NeuInput, NeuButton, NeuSelect, NeuTextArea, useThemeStyles } from '../components/NeuComponents';
import { LocationSearch } from '../components/LocationSearch';
import { MapPin, Clock, Globe, Mail, Phone, Megaphone, Save, Copy } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';

interface BusinessProfileProps {
  business: Business;
  updateBusiness: (b: Business) => Promise<void>;
}

const BusinessProfile: React.FC<BusinessProfileProps> = ({ business, updateBusiness }) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'hours' | 'ads'>('identity');
  const [localBusiness, setLocalBusiness] = useState<Business>(business);
  const { isDirty, setDirty } = useNavigation();
  const { notify } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const { styles } = useThemeStyles();

  // Sync with external updates (e.g. changing business in sidebar)
  useEffect(() => {
    setLocalBusiness(business);
  }, [business]);

  // Smart Dirty Checking
  useEffect(() => {
    const isChanged = JSON.stringify(business) !== JSON.stringify(localBusiness);
    setDirty(isChanged);
  }, [business, localBusiness, setDirty]);

  // Ensure Hours are initialized
  useEffect(() => {
    if (!localBusiness.profile.hours || localBusiness.profile.hours.length === 0) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const defaultHours = days.map(day => ({
        day,
        open: '09:00',
        close: '17:00',
        closed: day === 'Saturday' || day === 'Sunday'
      }));
      updateProfile('hours', defaultHours);
    }
  }, [localBusiness.profile.hours]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBusiness(localBusiness);
      // Note: The parent update will trigger the useEffect above to reset dirty state
      notify({ title: 'Profile Updated', type: 'success', message: 'Your business details have been saved.' });
    } catch (e) {
      notify({ title: 'Save Failed', type: 'error', message: 'Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocal = (updates: Partial<Business>) => {
    setLocalBusiness(prev => ({ ...prev, ...updates }));
  };

  const updateProfile = (key: string, value: any) => {
    setLocalBusiness(prev => ({
      ...prev,
      profile: { ...prev.profile, [key]: value }
    }));
  };

  const updateAdPrefs = (key: string, value: any) => {
    setLocalBusiness(prev => ({
      ...prev,
      adPreferences: { ...prev.adPreferences, [key]: value }
    }));
  };

  const updateDay = (index: number, field: 'open' | 'close' | 'closed', value: any) => {
    const newHours = [...localBusiness.profile.hours];
    newHours[index] = { ...newHours[index], [field]: value };
    updateProfile('hours', newHours);
  };

  const setOperatingMode = (mode: 'standard' | 'always_open' | 'appointment_only') => {
    updateProfile('operatingMode', mode);
  };

  const copyToAll = (sourceIndex: number) => {
    const source = localBusiness.profile.hours[sourceIndex];
    const newHours = localBusiness.profile.hours.map(h => ({
      ...h,
      open: source.open,
      close: source.close,
      closed: source.closed
    }));
    updateProfile('hours', newHours);
    notify({ title: 'Schedule Updated', message: `Applied ${source.day}'s hours to all days.`, type: 'success' });
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex justify-between items-center sticky top-0 z-10 py-4 bg-opacity-90 backdrop-blur-sm">
        <div>
          <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tighter text-galaxy mb-2`}>Business Profile</h2>
          <p className={styles.textSub}>Manage core details and ad preferences for {localBusiness.name}.</p>
        </div>
        
        <NeuButton 
          variant={isDirty ? 'primary' : 'secondary'} 
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </NeuButton>
      </header>

      {/* Tab Switcher */}
      <div className={`flex p-1 ${styles.bg} rounded-xl ${styles.shadowIn} max-w-lg`}>
        {[
          { id: 'identity', label: 'Identity & Contact' },
          { id: 'hours', label: 'Hours & Location' },
          { id: 'ads', label: 'Ad Preferences' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id
                ? `${styles.bg} ${styles.shadowOut} text-[#6D5DFC]`
                : `${styles.textSub} hover:${styles.textMain}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <NeuCard>
            <h3 className={`text-lg font-bold ${styles.textMain} mb-6 flex items-center gap-2`}><Globe size={20}/> Basic Info</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Business Name</label>
                <NeuInput value={localBusiness.name} onChange={e => updateLocal({ name: e.target.value })} />
              </div>
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Description</label>
                <NeuTextArea value={localBusiness.description} onChange={e => updateLocal({ description: e.target.value })} />
              </div>
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Website</label>
                <NeuInput value={localBusiness.website} onChange={e => updateLocal({ website: e.target.value })} />
              </div>
            </div>
          </NeuCard>

          <NeuCard>
            <h3 className={`text-lg font-bold ${styles.textMain} mb-6 flex items-center gap-2`}><Mail size={20}/> Contact Channels</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Email</label>
                <NeuInput value={localBusiness.profile.contactEmail} onChange={e => updateProfile('contactEmail', e.target.value)} />
              </div>
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Phone</label>
                <NeuInput value={localBusiness.profile.contactPhone} onChange={e => updateProfile('contactPhone', e.target.value)} />
              </div>
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Primary Social Handle</label>
                <NeuInput 
                   placeholder="@handle" 
                   value={localBusiness.profile.socials[0]?.handle || ''} 
                   onChange={e => {
                     const newSocials = [...localBusiness.profile.socials];
                     if (newSocials.length === 0) newSocials.push({ platform: 'Instagram', handle: '' });
                     newSocials[0].handle = e.target.value;
                     updateProfile('socials', newSocials);
                   }} 
                />
              </div>
            </div>
          </NeuCard>
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
           <NeuCard>
            <h3 className={`text-lg font-bold ${styles.textMain} mb-6 flex items-center gap-2`}><MapPin size={20}/> Location</h3>
             <div className="space-y-6">
               <div>
                  <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Official Address (Internal)</label>
                  <LocationSearch 
                    value={localBusiness.profile.address}
                    onChange={(addr, label) => {
                      updateProfile('address', addr);
                      
                      // Smart Auto-Fill based on Business Type
                      if (label && !localBusiness.profile.publicLocationLabel) {
                        let smartLabel = label;
                        
                        if (localBusiness.type === 'E-Commerce') {
                          smartLabel = `Based in ${label}, Shipping Worldwide`;
                        } else if (localBusiness.type === 'Service') {
                          smartLabel = `Serving ${label}`;
                        }
                        
                        updateProfile('publicLocationLabel', smartLabel);
                      }
                    }}
                    placeholder="Search address (Include City/Country for best results)"
                  />
               </div>

               <div>
                  <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Public Location Label</label>
                  <NeuInput 
                    value={localBusiness.profile.publicLocationLabel || ''} 
                    onChange={e => updateProfile('publicLocationLabel', e.target.value)} 
                    placeholder="e.g. 'Downtown Austin' or 'Serving NYC'"
                  />
                  <p className={`text-xs ${styles.textSub} mt-2`}>
                    This is what the AI will use in generated content. <br/>
                    <em>Example: Use "Serving the Bay Area" to keep your home address private.</em>
                  </p>
               </div>
             </div>
           </NeuCard>

           <NeuCard>
             <h3 className={`text-lg font-bold ${styles.textMain} mb-6 flex items-center gap-2`}><Clock size={20}/> Availability</h3>
             
             {/* Common Settings: Timezone */}
             <div className="mb-6">
               <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Timezone</label>
               <div className="relative">
                 <select
                    className={`w-full bg-transparent border-none outline-none p-3 rounded-xl ${styles.shadowIn} ${styles.textMain} appearance-none`}
                    value={localBusiness.profile.timezone || 'UTC'}
                    onChange={(e) => updateProfile('timezone', e.target.value)}
                 >
                   <option value="UTC">UTC (Universal Time)</option>
                   <option value="America/New_York">Eastern Time (US & Canada)</option>
                   <option value="America/Chicago">Central Time (US & Canada)</option>
                   <option value="America/Denver">Mountain Time (US & Canada)</option>
                   <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                   <option value="Europe/London">London</option>
                   <option value="Europe/Paris">Paris</option>
                   <option value="Asia/Tokyo">Tokyo</option>
                   <option value="Australia/Sydney">Sydney</option>
                 </select>
                 <div className="absolute right-4 top-3.5 pointer-events-none text-gray-400">▼</div>
               </div>
             </div>

             {/* Mode Selector */}
             <div className="flex gap-2 mb-6">
                {[
                  { id: 'standard', label: 'Standard Hours' },
                  { id: 'always_open', label: '24/7 Online' },
                  { id: 'appointment_only', label: 'By Appointment' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setOperatingMode(mode.id as any)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                      (localBusiness.profile.operatingMode || 'standard') === mode.id
                        ? `${styles.bg} ${styles.shadowIn} border-transparent text-[#6D5DFC]`
                        : `border-transparent hover:bg-black/5 text-gray-500`
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
             </div>

             {/* 24/7 MODE */}
             {(localBusiness.profile.operatingMode === 'always_open') && (
               <div className={`p-6 rounded-xl ${styles.bg} ${styles.shadowOut} text-center animate-fade-in`}>
                  <Globe size={32} className="mx-auto text-[#6D5DFC] mb-3" />
                  <div className="text-[#6D5DFC] font-bold text-lg mb-2">Always Open</div>
                  <p className={`text-sm ${styles.textSub}`}>
                    Your business is set to <strong>Online / 24/7</strong>. <br/>
                    The AI will emphasize convenience and instant access in your ads.
                  </p>
               </div>
             )}

             {/* APPOINTMENT MODE */}
             {(localBusiness.profile.operatingMode === 'appointment_only') && (
               <div className="space-y-4 animate-fade-in">
                 <div className={`p-4 rounded-xl ${styles.bg} border border-[#6D5DFC]/20 text-center mb-4`}>
                    <p className={`text-sm ${styles.textSub}`}>
                      We will optimize your ads to drive traffic to your <strong>Booking Page</strong>.
                    </p>
                 </div>
                 <div>
                   <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Booking / Calendar Link</label>
                   <NeuInput 
                      placeholder="https://calendly.com/..." 
                      value={localBusiness.profile.bookingUrl || ''}
                      onChange={(e) => updateProfile('bookingUrl', e.target.value)}
                   />
                 </div>
               </div>
             )}

             {/* STANDARD MODE */}
             {(!localBusiness.profile.operatingMode || localBusiness.profile.operatingMode === 'standard') && (
               <div className="space-y-3 animate-fade-in">
                 <div className="grid grid-cols-[80px_1fr_50px] gap-4 mb-2 text-xs font-bold text-gray-400 px-2">
                    <span>Day</span>
                    <span className="text-center">Hours</span>
                    <span className="text-right">Status</span>
                 </div>
                 {localBusiness.profile.hours.map((h, idx) => (
                   <div key={h.day} className={`flex items-center justify-between p-2 rounded-lg ${h.closed ? 'opacity-60' : ''} hover:bg-black/5 transition-colors`}>
                     
                     {/* Day Name */}
                     <span className={`font-bold w-20 ${styles.textMain}`}>{h.day}</span>
                     
                     {/* Hours Inputs */}
                     {!h.closed ? (
                       <div className="flex items-center gap-2 flex-1 justify-center">
                         <input 
                            type="time"
                            className={`bg-transparent ${styles.shadowIn} rounded-md px-2 py-1 text-sm ${styles.textMain} focus:outline-none focus:ring-1 focus:ring-[#6D5DFC]`} 
                            value={h.open} 
                            onChange={(e) => updateDay(idx, 'open', e.target.value)}
                         />
                         <span className={styles.textSub}>to</span>
                         <input 
                            type="time"
                            className={`bg-transparent ${styles.shadowIn} rounded-md px-2 py-1 text-sm ${styles.textMain} focus:outline-none focus:ring-1 focus:ring-[#6D5DFC]`} 
                            value={h.close} 
                            onChange={(e) => updateDay(idx, 'close', e.target.value)}
                         />
                         
                         {/* Copy Button */}
                         <button
                           onClick={() => copyToAll(idx)}
                           className={`ml-2 p-2 rounded-full hover:bg-black/10 text-gray-400 hover:text-[#6D5DFC] transition-colors`}
                           title="Copy these hours to all days"
                         >
                           <Copy size={14} />
                         </button>
                       </div>
                     ) : (
                       <div className="flex-1 text-center text-sm text-gray-400 italic">
                         Closed
                       </div>
                     )}

                     {/* Closed Toggle */}
                     <div className="w-12 flex justify-end">
                       <button 
                         onClick={() => updateDay(idx, 'closed', !h.closed)}
                         className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                           !h.closed 
                             ? `${styles.bg} ${styles.shadowOut} text-green-500` 
                             : `${styles.shadowIn} text-red-400`
                         }`}
                         title={h.closed ? "Mark as Open" : "Mark as Closed"}
                       >
                         {h.closed ? "✕" : "✓"}
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </NeuCard>
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="animate-fade-in max-w-3xl">
          <NeuCard>
             <div className="flex items-center gap-3 mb-6">
               <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-[#6D5DFC]`}>
                 <Megaphone size={24} />
               </div>
               <div>
                 <h3 className={`text-lg font-bold ${styles.textMain}`}>Marketing Strategy</h3>
                 <p className={`text-xs ${styles.textSub}`}>Configure how the AI sells your product.</p>
               </div>
             </div>

             <div className="space-y-8">
               
               {/* 1. Primary Goal Selector */}
               <div>
                 <label className={`block text-sm font-bold ${styles.textSub} mb-3`}>Primary Goal</label>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {[
                     { id: 'Awareness', label: 'Brand Awareness', desc: 'Reach new people. Tell a story.' },
                     { id: 'Traffic', label: 'Traffic & Leads', desc: 'Drive clicks. Get signups.' },
                     { id: 'Sales', label: 'Direct Sales', desc: 'Urgent. Buy Now focus.' }
                   ].map((goal) => (
                     <button
                       key={goal.id}
                       onClick={() => updateAdPrefs('goals', goal.id)}
                       className={`p-4 rounded-xl text-left transition-all border-2 ${
                         localBusiness.adPreferences.goals === goal.id
                           ? `${styles.bg} ${styles.shadowIn} border-[#6D5DFC] text-[#6D5DFC]`
                           : `border-transparent ${styles.bg} ${styles.shadowOut} hover:scale-[1.02] opacity-80 hover:opacity-100`
                       }`}
                     >
                       <div className="font-bold text-sm mb-1">{goal.label}</div>
                       <div className="text-[10px] opacity-70">{goal.desc}</div>
                     </button>
                   ))}
                 </div>
               </div>

               {/* 2. Audience Builder */}
               <div>
                 <label className={`block text-sm font-bold ${styles.textSub} mb-3`}>Target Audience</label>
                 
                 {/* Quick Add Pills */}
                 <div className="flex flex-wrap gap-2 mb-3">
                   {['Young Adults', 'Parents', 'Tech Savvy', 'Budget Conscious', 'Luxury Shoppers', 'Local Community'].map(tag => (
                     <button
                       key={tag}
                       onClick={() => {
                         const current = localBusiness.adPreferences.targetAudience || '';
                         if (!current.includes(tag)) {
                           updateAdPrefs('targetAudience', current ? `${current}, ${tag}` : tag);
                         }
                       }}
                       className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-transform active:scale-95 ${styles.bg} ${styles.shadowOut} text-gray-500 hover:text-[#6D5DFC]`}
                     >
                       + {tag}
                     </button>
                   ))}
                 </div>

                 <NeuTextArea 
                   value={localBusiness.adPreferences.targetAudience}
                   onChange={e => updateAdPrefs('targetAudience', e.target.value)}
                   placeholder="Describe your ideal customer in detail..."
                   rows={3}
                 />
               </div>

               {/* 3. Tone & Legal */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Default CTA</label>
                   <NeuInput 
                      value={localBusiness.adPreferences.preferredCta}
                      onChange={e => updateAdPrefs('preferredCta', e.target.value)}
                      placeholder="e.g. Shop Now, Learn More"
                   />
                 </div>
                 <div>
                   <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Slogan Usage</label>
                   <NeuSelect 
                      value={localBusiness.adPreferences.sloganUsage}
                      onChange={e => updateAdPrefs('sloganUsage', e.target.value)}
                   >
                     <option value="Always">Always Include</option>
                     <option value="Sometimes">Sometimes</option>
                     <option value="Never">Never</option>
                   </NeuSelect>
                 </div>
               </div>

               <div>
                 <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Legal Footer / Disclaimers</label>
                 <NeuInput 
                    value={localBusiness.adPreferences.complianceText}
                    onChange={e => updateAdPrefs('complianceText', e.target.value)}
                    placeholder="e.g. T&C Apply. 18+ only."
                 />
               </div>
             </div>
          </NeuCard>
        </div>
      )}
    </div>
  );
};

export default BusinessProfile;
