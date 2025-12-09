import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { NeuCard, NeuInput, NeuButton, NeuDropdown, NeuTextArea, useThemeStyles, NeuTabs, NeuCombobox } from '../components/NeuComponents';
import { LocationSearch } from '../components/LocationSearch';
import { MapPin, Clock, Globe, Mail, Phone, Megaphone, Save, Copy, MessageCircle, Sparkles, Calendar, Target, AlertTriangle, Plus, Settings, Trash2 } from 'lucide-react';
import { formatBusinessHours } from '../utils/formatters';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { getCurrencyFromCountryCode } from '../utils/currency';
import { AnimatePresence, motion } from 'framer-motion';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { INDUSTRY_OPTIONS } from '../constants/industries';
import { OperatingModelSelector } from '../components/OperatingModelSelector';
import { ConnectedAccountsCard } from '../components/ConnectedAccountsCard';
import { Share2 } from 'lucide-react';

interface BusinessProfileProps {
  business: Business;
  updateBusiness: (b: Business) => Promise<void>;
}

const BusinessProfile: React.FC<BusinessProfileProps> = ({ business, updateBusiness }) => {
  const [localBusiness, setLocalBusiness] = useState<Business>(business);
  const { isDirty, setDirty, registerSaveHandler } = useNavigation();
  const { notify } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Contact Hub State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState<Partial<import('../types').ContactMethod>>({ type: 'phone', value: '', label: '', isPrimary: false });

  const { styles } = useThemeStyles();
  const localBusinessRef = React.useRef(localBusiness);

  // --- MIGRATION LOGIC: Legacy -> New Contacts ---
  useEffect(() => {
    if (!localBusiness.profile.contacts || localBusiness.profile.contacts.length === 0) {
      const migrated: import('../types').ContactMethod[] = [];

      if (localBusiness.profile.website) {
        migrated.push({ id: 'legacy_web', type: 'website', value: localBusiness.profile.website, label: 'Main Website', isPrimary: true });
      }
      if (localBusiness.profile.contactPhone) {
        migrated.push({ id: 'legacy_phone', type: 'phone', value: localBusiness.profile.contactPhone, label: 'Main Phone', isPrimary: true });
      }
      if (localBusiness.profile.contactEmail) {
        migrated.push({ id: 'legacy_email', type: 'email', value: localBusiness.profile.contactEmail, label: 'Main Email', isPrimary: true });
      }
      if (localBusiness.profile.address) {
        migrated.push({ id: 'legacy_addr', type: 'address', value: localBusiness.profile.address, label: 'HQ', isPrimary: true });
      }

      if (migrated.length > 0) {
        setLocalBusiness(prev => ({
          ...prev,
          profile: { ...prev.profile, contacts: migrated }
        }));
      }
    }
  }, []); // Run once on mount

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
      notify({ title: 'Profile Saved', type: 'success', message: 'Business information updated.' });
    } catch (e) {
      notify({ title: 'Save Failed', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [updateBusiness, notify]);

  useEffect(() => {
    const isChanged = JSON.stringify(business) !== JSON.stringify(localBusiness);
    setDirty(isChanged);
    registerSaveHandler(isChanged ? handleSave : null);
  }, [business, localBusiness, setDirty, registerSaveHandler, handleSave]);

  const updateProfile = (updates: Partial<typeof localBusiness.profile>) => {
    setLocalBusiness(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates }
    }));
  };

  const updateAdPrefs = (key: keyof typeof localBusiness.adPreferences, value: any) => {
    setLocalBusiness(prev => ({
      ...prev,
      adPreferences: { ...prev.adPreferences, [key]: value }
    }));
  };

  // --- CONTACT HUB ACTIONS ---
  const saveContact = () => {
    if (!newContact.value || !newContact.type) return;

    const contact: import('../types').ContactMethod = {
      id: editingContactId || `contact_${Date.now()}`,
      type: newContact.type as any,
      value: newContact.value,
      label: newContact.label || newContact.type,
      isPrimary: newContact.isPrimary || false,
      formatting: newContact.formatting,
      customFormat: newContact.customFormat,
      displayStyle: newContact.displayStyle || 'standard'
    };

    let updatedContacts = [...(localBusiness.profile.contacts || [])];

    if (editingContactId) {
      updatedContacts = updatedContacts.map(c => c.id === editingContactId ? contact : c);
    } else {
      updatedContacts.push(contact);
    }

    updateProfile({ contacts: updatedContacts });
    setIsAddingContact(false);
    setEditingContactId(null);
    setNewContact({ type: 'phone', value: '', label: '', isPrimary: false });
  };

  const deleteContact = (id: string) => {
    const updated = (localBusiness.profile.contacts || []).filter(c => c.id !== id);
    updateProfile({ contacts: updated });
    // Also remove from Ad Prefs if selected
    const selected = localBusiness.adPreferences.contactIds || [];
    if (selected.includes(id)) {
      updateAdPrefs('contactIds', selected.filter(sid => sid !== id));
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-8 animate-fade-in">

      {/* 1. OPERATING MODEL SELECTOR */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className={`text-lg font-bold ${styles.textMain}`}>How do you operate?</h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">Required</span>
        </div>
        <OperatingModelSelector
          value={localBusiness.profile.operatingMode || 'storefront'}
          onChange={(mode) => updateProfile({ operatingMode: mode })}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. DYNAMIC OPERATIONS CARD */}
        <NeuCard>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-brand`}>
              <Globe size={24} />
            </div>
            <h3 className={`text-lg font-bold ${styles.textMain}`}>
              {localBusiness.profile.operatingMode === 'online' ? 'Online Details' :
                localBusiness.profile.operatingMode === 'appointment' ? 'Booking Details' :
                  'Business Details'}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Identity */}
            <div>
              <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Business Name</label>
              <NeuInput
                value={localBusiness.name}
                onChange={(e) => setLocalBusiness({ ...localBusiness, name: e.target.value })}
              />
            </div>

            <NeuCombobox
              label="Industry"
              value={localBusiness.industry}
              onChange={(val) => setLocalBusiness({ ...localBusiness, industry: val })}
              options={INDUSTRY_OPTIONS}
              placeholder="Select or type your industry..."
            />

            {/* DYNAMIC: Location / Service Area */}
            <AnimatePresence mode="wait">
              {localBusiness.profile.operatingMode === 'storefront' && (
                <motion.div
                  key="storefront"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Physical Address</label>
                  <LocationSearch
                    value={localBusiness.profile.address || ''}
                    onChange={(addr, label) => updateProfile({ address: addr, publicLocationLabel: label })}
                    placeholder="Search Google Maps..."
                  />

                  {/* Hours Section for Storefront */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-3">
                      <label className={`block text-sm font-bold ${styles.textSub}`}>Opening Hours</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Find Monday or use default
                            const mon = (localBusiness.profile.hours || []).find(h => h.day === 'Mon') || { open: '09:00', close: '17:00', closed: false };

                            const newHours = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
                              day,
                              open: mon.open,
                              close: mon.close,
                              closed: mon.closed
                            }));
                            updateProfile({ hours: newHours });
                          }}
                          className="text-[10px] text-brand hover:underline"
                        >
                          Copy Mon to All
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                        const dayData = (localBusiness.profile.hours || []).find(h => h.day === day) || { day, open: '09:00', close: '17:00', closed: day === 'Sat' || day === 'Sun' };
                        return (
                          <div key={day} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-2 text-xs font-bold text-gray-500">{day}</div>
                            <div className="col-span-3">
                              <button
                                onClick={() => {
                                  const newHours = [...(localBusiness.profile.hours || [])];
                                  const idx = newHours.findIndex(h => h.day === day);
                                  if (idx >= 0) newHours[idx] = { ...newHours[idx], closed: !dayData.closed };
                                  else newHours.push({ ...dayData, closed: !dayData.closed });
                                  updateProfile({ hours: newHours });
                                }}
                                className={`w-full text-[10px] py-1 rounded border transition-colors ${dayData.closed ? 'bg-red-100 text-red-600 border-red-200' : 'bg-green-100 text-green-600 border-green-200'}`}
                              >
                                {dayData.closed ? 'Closed' : 'Open'}
                              </button>
                            </div>
                            {!dayData.closed ? (
                              <>
                                <div className="col-span-3"><NeuInput type="time" className="h-8 text-xs py-0 px-2" value={dayData.open} onChange={(e) => {
                                  const newHours = [...(localBusiness.profile.hours || [])];
                                  const idx = newHours.findIndex(h => h.day === day);
                                  if (idx >= 0) newHours[idx] = { ...newHours[idx], open: e.target.value };
                                  updateProfile({ hours: newHours });
                                }} /></div>
                                <div className="col-span-1 text-center text-gray-400 text-xs">-</div>
                                <div className="col-span-3"><NeuInput type="time" className="h-8 text-xs py-0 px-2" value={dayData.close} onChange={(e) => {
                                  const newHours = [...(localBusiness.profile.hours || [])];
                                  const idx = newHours.findIndex(h => h.day === day);
                                  if (idx >= 0) newHours[idx] = { ...newHours[idx], close: e.target.value };
                                  updateProfile({ hours: newHours });
                                }} /></div>
                              </>
                            ) : <div className="col-span-7 text-center text-[10px] text-gray-400 italic">- Closed -</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {localBusiness.profile.operatingMode === 'service' && (
                <motion.div
                  key="service"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Service Area</label>
                  <NeuInput
                    value={localBusiness.profile.serviceArea || ''}
                    onChange={(e) => updateProfile({ serviceArea: e.target.value })}
                    placeholder="e.g. Greater Austin Area, 50-mile radius..."
                  />
                </motion.div>
              )}

              {localBusiness.profile.operatingMode === 'appointment' && (
                <motion.div
                  key="appointment"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Booking Link</label>
                    <NeuInput
                      value={localBusiness.profile.bookingUrl || ''}
                      onChange={(e) => updateProfile({ bookingUrl: e.target.value })}
                      placeholder="https://calendly.com/..."
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Studio/Office Address</label>
                    <LocationSearch
                      value={localBusiness.profile.address || ''}
                      onChange={(addr, label) => updateProfile({ address: addr, publicLocationLabel: label })}
                      placeholder="Search Google Maps..."
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </NeuCard>

        {/* 3. HUMAN CONTACT HUB */}
        <NeuCard>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-green-500`}>
                <Phone size={24} />
              </div>
              <h3 className={`text-lg font-bold ${styles.textMain}`}>Contact Hub</h3>
            </div>
            <NeuButton onClick={() => setIsAddingContact(true)} className="text-xs">
              <Plus size={14} className="mr-1" /> Add
            </NeuButton>
          </div>

          <div className="space-y-3 mb-4">
            {(localBusiness.profile.contacts || []).map(contact => (
              <div key={contact.id} className={`p-3 rounded-xl border ${styles.border} ${styles.bgAccent} flex justify-between items-center group`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${styles.bg} text-gray-500`}>
                    {contact.type === 'phone' && <Phone size={14} />}
                    {contact.type === 'email' && <Mail size={14} />}
                    {contact.type === 'website' && <Globe size={14} />}
                    {contact.type === 'whatsapp' && <MessageCircle size={14} />}
                    {contact.type === 'address' && <MapPin size={14} />}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${styles.textMain} flex items-center gap-2`}>
                      {contact.displayStyle === 'action' && <span className="bg-brand/10 text-brand px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Action Button</span>}
                      {contact.label || contact.type}
                    </div>
                    <div className={`text-sm ${styles.textSub}`}>{contact.value}</div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => deleteContact(contact.id)} className="p-1 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {(localBusiness.profile.contacts || []).length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">No contacts added yet.</div>
            )}
          </div>

          {isAddingContact && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 animate-fade-in">
              <h4 className={`text-xs font-bold ${styles.textMain} mb-3`}>Add Contact Method</h4>

              {/* Step 1: Type */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {[
                  { id: 'phone', icon: Phone, label: 'Phone' },
                  { id: 'email', icon: Mail, label: 'Email' },
                  { id: 'website', icon: Globe, label: 'Link' },
                  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setNewContact({ ...newContact, type: t.id as any })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${newContact.type === t.id
                      ? 'bg-brand text-white border-brand'
                      : `bg-white dark:bg-white/5 border-gray-200 dark:border-gray-700 text-gray-500`
                      }`}
                  >
                    <t.icon size={12} /> {t.label}
                  </button>
                ))}
              </div>

              {/* Step 2: Value */}
              <div className="mb-4">
                <NeuInput
                  placeholder={newContact.type === 'email' ? 'hello@example.com' : '+1 555...'}
                  value={newContact.value || ''}
                  onChange={(e) => setNewContact({ ...newContact, value: e.target.value })}
                  className="text-lg"
                />
              </div>

              {/* Step 3: Visual Style (Cards) */}
              <div className="mb-4">
                <label className={`block text-xs font-bold ${styles.textSub} mb-2`}>How should this look?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { id: 'value_only', label: 'Simple', preview: newContact.value || '+1 555...' },
                    { id: 'standard', label: 'Labeled', preview: `${newContact.type === 'email' ? 'Email' : 'Phone'}: ${newContact.value || '...'}` },
                    { id: 'action', label: 'Action Button', preview: `[Call Now]` }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setNewContact({ ...newContact, displayStyle: style.id as any })}
                      className={`p-3 rounded-lg border text-left transition-all ${(newContact.displayStyle || 'standard') === style.id
                        ? 'border-brand bg-brand/5 ring-1 ring-brand'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase">{style.label}</div>
                      <div className={`text-xs ${styles.textMain} truncate`}>{style.preview}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <NeuButton variant="secondary" onClick={() => setIsAddingContact(false)} className="text-xs">Cancel</NeuButton>
                <NeuButton onClick={saveContact} className="text-xs">Save</NeuButton>
              </div>
            </div>
          )}
        </NeuCard>
      </div>
    </div>
  );

  const renderAdsTab = () => (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* --- SNAPSHOT CARD --- */}
      <NeuCard className="mb-6 border-l-4 border-l-brand bg-brand/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className={`text-sm font-bold ${styles.textMain} flex items-center gap-2`}>
              <Sparkles size={16} className="text-brand" />
              Active Configuration
            </h4>
            <p className={`text-xs ${styles.textSub}`}>This is exactly what the AI will use to generate your ads.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Audience */}
            <div className={`px-3 py-1.5 rounded-lg border ${styles.border} ${styles.bg} flex items-center gap-2`}>
              <Target size={12} className="text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-400">Audience</span>
                <span className={`text-xs font-bold ${styles.textMain}`}>
                  {localBusiness.coreCustomerProfile?.demographics
                    ? (localBusiness.coreCustomerProfile.demographics.length > 20
                      ? localBusiness.coreCustomerProfile.demographics.substring(0, 20) + '...'
                      : localBusiness.coreCustomerProfile.demographics)
                    : 'General'}
                </span>
              </div>
            </div>

            {/* Language */}
            <div className={`px-3 py-1.5 rounded-lg border ${styles.border} ${styles.bg} flex items-center gap-2`}>
              <Globe size={12} className="text-green-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-400">Language</span>
                <span className={`text-xs font-bold ${styles.textMain}`}>
                  {localBusiness.adPreferences.targetLanguage || 'English'}
                </span>
              </div>
            </div>

            {/* Contact (Actual Data from IDs) */}
            <div className={`px-3 py-1.5 rounded-lg border ${styles.border} ${styles.bg} flex items-center gap-2`}>
              <Phone size={12} className="text-purple-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-400">Contact Info</span>
                <span className={`text-xs font-bold ${styles.textMain}`}>
                  {(localBusiness.adPreferences.contactIds || []).map(id => {
                    const contact = (localBusiness.profile.contacts || []).find(c => c.id === id);
                    if (!contact) return null;

                    // Display Style Logic
                    if (contact.displayStyle === 'custom' && contact.customFormat) {
                      return contact.customFormat.replace('{value}', contact.value);
                    }
                    if (contact.displayStyle === 'value_only') {
                      return contact.value;
                    }
                    if (contact.displayStyle === 'action') {
                      const action = contact.type === 'phone' ? 'Call' : contact.type === 'email' ? 'Email' : 'Visit';
                      return `${action}: ${contact.value}`;
                    }

                    // Standard (Label: Value)
                    const label = contact.label || contact.type;
                    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
                    return `${displayLabel}: ${contact.value}`;
                  }).filter(Boolean).join('  •  ') || 'None Selected'}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className={`px-3 py-1.5 rounded-lg border ${styles.border} ${styles.bg} flex items-center gap-2`}>
              <MapPin size={12} className="text-red-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-400">Location</span>
                <span className={`text-xs font-bold ${styles.textMain}`}>
                  {localBusiness.adPreferences.locationDisplay === 'hidden' ? 'Hidden' :
                    localBusiness.adPreferences.locationDisplay === 'online_only' ? 'Online Only' :
                      localBusiness.adPreferences.locationDisplay === 'custom_text' ? (localBusiness.adPreferences.locationText || 'Custom Location') :
                        localBusiness.adPreferences.locationDisplay === 'city_state' ? (localBusiness.profile.publicLocationLabel || 'City, State') :
                          (localBusiness.profile.address || 'Not Set')}
                </span>
              </div>
            </div>

            {/* Hours */}
            <div className={`px-3 py-1.5 rounded-lg border ${styles.border} ${styles.bg} flex items-center gap-2`}>
              <Clock size={12} className="text-amber-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-gray-400">Hours</span>
                <span className={`text-xs font-bold ${styles.textMain}`}>
                  {(() => {
                    const prefs = localBusiness.adPreferences;
                    const hours = localBusiness.profile.hours || [];

                    if (prefs.hoursDisplay === 'hidden') return 'Hidden';
                    if (prefs.hoursDisplay === 'custom_text') return prefs.hoursText || 'Custom Hours';

                    if (prefs.hoursDisplay === 'weekends_only') {
                      // Filter to only Sat/Sun and format
                      const weekendHours = hours.filter(h => ['Sat', 'Sun'].includes(h.day));
                      return formatBusinessHours(weekendHours);
                    }

                    if (prefs.hoursDisplay === 'custom_selection') {
                      // Filter to selected days and format
                      const selectedDays = prefs.hoursDisplayDays || [];
                      const selectedHours = hours.filter(h => selectedDays.includes(h.day));
                      return formatBusinessHours(selectedHours);
                    }

                    // Default: All Hours
                    return formatBusinessHours(hours);
                  })()}
                </span>
              </div>
            </div>

            {/* Holiday Mode (Conditional) */}
            {localBusiness.adPreferences.holidayMode?.isActive && (
              <div className={`px-3 py-1.5 rounded-lg border border-pink-500/30 bg-pink-500/10 flex items-center gap-2`}>
                <Calendar size={12} className="text-pink-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-pink-500/70">Holiday Mode</span>
                  <span className={`text-xs font-bold ${styles.textMain} text-pink-500`}>
                    {localBusiness.adPreferences.holidayMode.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </NeuCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 1. CONTACT VISIBILITY (Left Column) */}
        <div className="space-y-6">
          <NeuCard>
            <h4 className={`text-md font-bold ${styles.textMain} mb-4 flex items-center gap-2`}>
              <Mail size={18} className="text-brand" /> Contact Visibility
            </h4>
            <p className={`text-xs ${styles.textSub} mb-4`}>
              Select which contact methods to display on your ads.
            </p>

            <div className="space-y-3">
              {(localBusiness.profile.contacts || []).map((contact) => {
                const isSelected = (localBusiness.adPreferences.contactIds || []).includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => {
                      const current = localBusiness.adPreferences.contactIds || [];
                      if (isSelected) {
                        updateAdPrefs('contactIds', current.filter(id => id !== contact.id));
                      } else {
                        if (current.length >= 2) {
                          // Queue behavior
                          const [, ...rest] = current;
                          updateAdPrefs('contactIds', [...rest, contact.id]);
                        } else {
                          updateAdPrefs('contactIds', [...current, contact.id]);
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-brand bg-brand/10 text-brand shadow-md scale-[1.02]'
                        : `${styles.border} ${styles.bgAccent} text-gray-400 hover:border-brand/30 hover:text-gray-500`
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {contact.type === 'phone' && <Phone size={16} />}
                      {contact.type === 'email' && <Mail size={16} />}
                      {contact.type === 'website' && <Globe size={16} />}
                      {contact.type === 'whatsapp' && <MessageCircle size={16} />}
                      {contact.type === 'address' && <MapPin size={16} />}
                      <div className="text-left">
                        <div className="text-xs font-bold">{contact.label}</div>
                        <div className="text-[10px] opacity-70">{contact.value}</div>
                      </div>
                    </div>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-brand" />}
                  </button>
                );
              })}
              {(localBusiness.profile.contacts || []).length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-xl text-xs text-gray-400">
                  No contacts found. Go to Profile to add them.
                </div>
              )}
            </div>
          </NeuCard>

          {/* Voice & Legal (Moved here for balance) */}
          <NeuCard>
            <h4 className={`text-md font-bold ${styles.textMain} mb-4`}>Voice & Legal</h4>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Campaign Goal</label>
                <NeuInput
                  value={localBusiness.adPreferences.goals || ''}
                  onChange={e => updateAdPrefs('goals', e.target.value)}
                  placeholder="e.g. Drive sales, Build awareness, Promote event"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Language</label>
                <div className="space-y-2">
                  <NeuDropdown
                    value={
                      ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Afrikaans'].includes(localBusiness.adPreferences.targetLanguage || 'English')
                        ? (localBusiness.adPreferences.targetLanguage || 'English')
                        : 'Custom'
                    }
                    onChange={(val) => {
                      if (val === 'Custom') {
                        updateAdPrefs('targetLanguage', 'Custom');
                      } else {
                        updateAdPrefs('targetLanguage', val);
                      }
                    }}
                    options={[
                      { value: 'English', label: 'English' },
                      { value: 'Afrikaans', label: 'Afrikaans' },
                      { value: 'Spanish', label: 'Spanish' },
                      { value: 'French', label: 'French' },
                      { value: 'German', label: 'German' },
                      { value: 'Italian', label: 'Italian' },
                      { value: 'Portuguese', label: 'Portuguese' },
                      { value: 'Dutch', label: 'Dutch' },
                      { value: 'Custom', label: 'Custom / Other...' }
                    ]}
                  />
                  {(localBusiness.adPreferences.targetLanguage === 'Custom' || !['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Afrikaans'].includes(localBusiness.adPreferences.targetLanguage || 'English')) && (
                    <div className="animate-fade-in">
                      <NeuInput
                        placeholder="Type your language..."
                        value={localBusiness.adPreferences.targetLanguage === 'Custom' ? '' : localBusiness.adPreferences.targetLanguage || ''}
                        onChange={(e) => updateAdPrefs('targetLanguage', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Slogan Usage</label>
                <NeuDropdown
                  value={localBusiness.adPreferences.sloganUsage || 'Always'}
                  onChange={val => updateAdPrefs('sloganUsage', val)}
                  options={[
                    { value: "Always", label: "Always Include" },
                    { value: "Sometimes", label: "Sometimes" },
                    { value: "Never", label: "Never" }
                  ]}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold ${styles.textSub} mb-1`}>Legal Footer</label>
                <NeuInput
                  value={localBusiness.adPreferences.complianceText}
                  onChange={e => updateAdPrefs('complianceText', e.target.value)}
                  placeholder="e.g. T&C Apply."
                />
              </div>
            </div>
          </NeuCard>
        </div>

        {/* 2. LOCATION & HOURS (Right Column) */}
        <div className="space-y-6">
          <NeuCard>
            <h4 className={`text-md font-bold ${styles.textMain} mb-4 flex items-center gap-2`}>
              <MapPin size={18} className="text-brand" /> Location Display
            </h4>
            <div className="space-y-2">
              {[
                { id: 'full_address', label: 'Full Address' },
                { id: 'city_state', label: 'City & State Only' },
                { id: 'online_only', label: 'Online / Global' },
                { id: 'custom_text', label: 'Custom Text' },
                { id: 'hidden', label: 'Hidden' }
              ].map((opt) => (
                <div key={opt.id}>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                          ${localBusiness.adPreferences.locationDisplay === opt.id ? 'border-brand' : 'border-gray-300'}
                          `}>
                      {localBusiness.adPreferences.locationDisplay === opt.id && (
                        <div className="w-2 h-2 rounded-full bg-brand" />
                      )}
                    </div>
                    <span className={`text-sm ${localBusiness.adPreferences.locationDisplay === opt.id ? styles.textMain : styles.textSub} group-hover:text-brand transition-colors`}>
                      {opt.label}
                    </span>
                    <input
                      type="radio"
                      name="locationDisplay"
                      className="hidden"
                      checked={localBusiness.adPreferences.locationDisplay === opt.id}
                      onChange={() => updateAdPrefs('locationDisplay', opt.id)}
                    />
                  </label>

                  {/* Custom Location Input - Only shows when Custom Text is selected */}
                  {opt.id === 'custom_text' && localBusiness.adPreferences.locationDisplay === 'custom_text' && (
                    <div className="ml-7 mt-2 mb-2 animate-fade-in">
                      <div className="flex justify-between items-center mb-1">
                        <label className={`block text-[10px] font-bold ${styles.textSub}`}>Location Text</label>
                        <button
                          onClick={() => updateAdPrefs('locationText', localBusiness.profile.address || '')}
                          className="text-[10px] text-brand hover:underline"
                        >
                          Pre-fill Address
                        </button>
                      </div>
                      <NeuInput
                        value={localBusiness.adPreferences.locationText || ''}
                        onChange={e => updateAdPrefs('locationText', e.target.value)}
                        placeholder="e.g. 123 Main St (Next to Bank)"
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </NeuCard>

          <NeuCard>
            <h4 className={`text-md font-bold ${styles.textMain} mb-4 flex items-center gap-2`}>
              <Clock size={18} className="text-brand" /> Hours Display
            </h4>
            <div className="space-y-4">
              <NeuDropdown
                value={localBusiness.adPreferences.hoursDisplay || 'all_hours'}
                onChange={(val) => updateAdPrefs('hoursDisplay', val)}
                options={[
                  { value: 'all_hours', label: 'Standard (Mon-Fri...)' },
                  { value: 'weekends_only', label: 'Weekends Only' },
                  { value: 'custom_selection', label: 'Select Specific Days' },
                  { value: 'custom_text', label: 'Custom Text' },
                  { value: 'hidden', label: 'Hidden' }
                ]}
              />

              {/* Custom Days Selector */}
              {localBusiness.adPreferences.hoursDisplay === 'custom_selection' && (
                <div className="grid grid-cols-4 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                    const selectedDays = localBusiness.adPreferences.hoursDisplayDays || [];
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          if (isSelected) {
                            updateAdPrefs('hoursDisplayDays', selectedDays.filter(d => d !== day));
                          } else {
                            updateAdPrefs('hoursDisplayDays', [...selectedDays, day]);
                          }
                        }}
                        className={`text-[10px] font-bold py-1 rounded border transition-colors
                                ${isSelected
                            ? 'bg-brand text-white border-brand'
                            : `${styles.bg} ${styles.textSub} border-transparent hover:border-brand/30`
                          }
                            `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Custom Hours Text - Only shows when Custom Text is selected */}
              {localBusiness.adPreferences.hoursDisplay === 'custom_text' && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
                  <div className="flex justify-between items-center mb-1">
                    <label className={`block text-xs font-bold ${styles.textSub}`}>Hours Text (for Ads)</label>
                    <button
                      onClick={() => updateAdPrefs('hoursText', formatBusinessHours(localBusiness.profile.hours))}
                      className="text-[10px] text-brand hover:underline"
                    >
                      Pre-fill from Profile
                    </button>
                  </div>
                  <NeuInput
                    value={localBusiness.adPreferences.hoursText || ''}
                    onChange={e => updateAdPrefs('hoursText', e.target.value)}
                    placeholder="e.g. Mon-Fri 9am - 5pm"
                  />
                </div>
              )}
            </div>
          </NeuCard>
          <NeuCard className="border-2 border-brand/10 relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Sparkles size={100} className="text-brand" />
            </div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h4 className={`text-md font-bold ${styles.textMain} flex items-center gap-2`}>
                  <Calendar size={18} className="text-brand" /> Holiday Mode
                </h4>
                <p className={`text-xs ${styles.textSub}`}>Override standard hours for special events.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${localBusiness.adPreferences.holidayMode?.isActive ? 'text-brand' : 'text-gray-400'}`}>
                  {localBusiness.adPreferences.holidayMode?.isActive ? 'ACTIVE' : 'OFF'}
                </span>
                <button
                  onClick={() => updateAdPrefs('holidayMode', {
                    ...localBusiness.adPreferences.holidayMode,
                    isActive: !localBusiness.adPreferences.holidayMode?.isActive
                  })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${localBusiness.adPreferences.holidayMode?.isActive ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${localBusiness.adPreferences.holidayMode?.isActive ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {localBusiness.adPreferences.holidayMode?.isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 relative z-10 overflow-hidden"
                >
                  <div>
                    <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Event Name</label>
                    <NeuInput
                      value={localBusiness.adPreferences.holidayMode?.name || ''}
                      onChange={e => updateAdPrefs('holidayMode', { ...localBusiness.adPreferences.holidayMode, name: e.target.value })}
                      placeholder="e.g. Black Friday Sale"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Special Hours</label>
                      <NeuInput
                        value={localBusiness.adPreferences.holidayMode?.hours || ''}
                        onChange={e => updateAdPrefs('holidayMode', { ...localBusiness.adPreferences.holidayMode, hours: e.target.value })}
                        placeholder="e.g. Open until Midnight"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold ${styles.textSub} mb-1`}>Special CTA (Optional)</label>
                      <NeuInput
                        value={localBusiness.adPreferences.holidayMode?.cta || ''}
                        onChange={e => updateAdPrefs('holidayMode', { ...localBusiness.adPreferences.holidayMode, cta: e.target.value })}
                        placeholder="e.g. Shop the Sale"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </NeuCard>

          {/* 4. VOICE & LEGAL (With Fixed Language Selector) */}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center sticky top-0 z-20 py-4 bg-opacity-90 backdrop-blur-sm">
        <div>
          <GalaxyHeading
            text="Business Profile"
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-1 pb-2"
          />
          <p className={styles.textSub}>Manage your business identity and ad preferences.</p>
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

      {/* Navigation Tabs */}
      <div className="max-w-2xl">
        <NeuTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'profile', label: 'Profile & Contact', icon: <Globe size={16} /> },
            { id: 'ads', label: 'Ad Preferences', icon: <Megaphone size={16} /> },
            { id: 'social', label: 'Social Accounts', icon: <Share2 size={16} /> },
          ]}
        />
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'ads' && renderAdsTab()}
        {activeTab === 'social' && (
          <div className="space-y-8 animate-fade-in max-w-2xl">
            <ConnectedAccountsCard
              business={localBusiness}
              onBusinessUpdate={(updated) => setLocalBusiness(updated)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessProfile;
