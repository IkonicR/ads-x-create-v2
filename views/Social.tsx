import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { NeuCard, NeuButton, NeuInput, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { Save, Hash, MessageCircle, Users, Info, X, Plus, Settings, CheckSquare, Square, Share2 } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useNotification } from '../context/NotificationContext';
import { useSocial } from '../context/SocialContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectedAccountsCard } from '../components/ConnectedAccountsCard';

interface SocialProps {
    business: Business;
    updateBusiness: (b: Business) => Promise<void>;
}

interface SocialSettings {
    hashtagMode: 'ai_only' | 'brand_only' | 'ai_plus_brand';
    brandHashtags: string[];
    firstCommentDefault: boolean;
    defaultPlatformIds: string[];
}

const DEFAULT_SETTINGS: SocialSettings = {
    hashtagMode: 'ai_plus_brand',
    brandHashtags: [],
    firstCommentDefault: false,
    defaultPlatformIds: [],
};

const Social: React.FC<SocialProps> = ({ business, updateBusiness }) => {
    const { styles } = useThemeStyles();
    const { isDirty, setDirty, registerSaveHandler } = useNavigation();
    const { toast } = useNotification();
    const { accounts } = useSocial();
    const [isSaving, setIsSaving] = useState(false);

    // Local state for settings
    const [settings, setSettings] = useState<SocialSettings>(() => ({
        ...DEFAULT_SETTINGS,
        ...(business.socialSettings || {}),
    }));

    // New hashtag input
    const [newHashtag, setNewHashtag] = useState('');

    // Sync with business prop (including after save when business updates)
    useEffect(() => {
        setSettings({
            ...DEFAULT_SETTINGS,
            ...(business.socialSettings || {}),
        });
    }, [business.id, business.socialSettings]);

    // Track dirty state - merge both sides with defaults to ensure same keys
    useEffect(() => {
        // Merge both with defaults to ensure same shape for comparison
        const normalizedCurrent = { ...DEFAULT_SETTINGS, ...(business.socialSettings || {}) };
        const normalizedLocal = { ...DEFAULT_SETTINGS, ...settings };
        const isChanged = JSON.stringify(normalizedLocal) !== JSON.stringify(normalizedCurrent);
        setDirty(isChanged, 'Social');
    }, [settings, business.socialSettings, setDirty]);

    // Save handler - memoized to prevent infinite loops
    const handleSave = React.useCallback(async () => {
        setIsSaving(true);
        try {
            await updateBusiness({
                ...business,
                socialSettings: settings,
            });
            toast({ title: 'Settings Saved', type: 'success', message: 'Social settings updated.' });
        } catch (e: any) {
            toast({ title: 'Save Failed', type: 'error', message: e.message || 'Could not save settings.' });
        } finally {
            setIsSaving(false);
        }
    }, [business, settings, updateBusiness, toast]);

    // Register save handler with navigation context
    useEffect(() => {
        if (isDirty) {
            registerSaveHandler(handleSave, 'Social');
        } else {
            registerSaveHandler(null, 'Social');
        }
        return () => registerSaveHandler(null, 'Social');
    }, [isDirty, registerSaveHandler, handleSave]);

    // Add hashtag
    const addHashtag = () => {
        const tag = newHashtag.trim().replace(/^#/, '');
        if (tag && !settings.brandHashtags.includes(tag)) {
            setSettings(prev => ({
                ...prev,
                brandHashtags: [...prev.brandHashtags, tag],
            }));
            setNewHashtag('');
        }
    };

    // Remove hashtag
    const removeHashtag = (tag: string) => {
        setSettings(prev => ({
            ...prev,
            brandHashtags: prev.brandHashtags.filter(t => t !== tag),
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <GalaxyHeading
                        text="Social Media"
                        className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 pb-2"
                    />
                    <p className={styles.textSub}>Manage connected accounts and posting defaults</p>
                </div>
                <NeuButton
                    variant={isDirty ? 'primary' : undefined}
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </NeuButton>
            </header>

            {/* Connected Accounts */}
            <ConnectedAccountsCard business={business} onBusinessUpdate={updateBusiness} />

            {/* Hashtag Settings */}
            <NeuCard>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-blue-500`}>
                        <Hash size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${styles.textMain}`}>Hashtag Settings</h3>
                        <p className={`text-xs ${styles.textSub}`}>Control how hashtags are generated and used</p>
                    </div>
                </div>

                {/* Hashtag Mode */}
                <div className="mb-6">
                    <label className={`block text-sm font-bold ${styles.textSub} mb-2`}>Hashtag Mode</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'ai_only', label: 'AI Only', desc: 'Let AI generate all hashtags' },
                            { value: 'brand_only', label: 'Brand Only', desc: 'Use only your brand hashtags' },
                            { value: 'ai_plus_brand', label: 'AI + Brand', desc: 'Combine AI with your hashtags' },
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSettings(prev => ({ ...prev, hashtagMode: option.value as any }))}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${settings.hashtagMode === option.value
                                    ? 'border-brand bg-brand/5'
                                    : `${styles.border} hover:border-brand/50`
                                    }`}
                            >
                                <div className={`text-sm font-bold ${styles.textMain}`}>{option.label}</div>
                                <div className={`text-xs ${styles.textSub} mt-1`}>{option.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Brand Hashtags */}
                <div>
                    <label className={`block text-sm font-bold ${styles.textSub} mb-2`}>
                        Brand Hashtags
                        <span className={`ml-2 text-xs font-normal ${styles.textSub}`}>
                            Always included in posts
                        </span>
                    </label>

                    {/* Tags Display */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <AnimatePresence>
                            {settings.brandHashtags.map(tag => (
                                <motion.span
                                    key={tag}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${styles.bg} ${styles.shadowOut} ${styles.textMain}`}
                                >
                                    #{tag}
                                    <button
                                        onClick={() => removeHashtag(tag)}
                                        className="ml-1 p-0.5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </motion.span>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Add New */}
                    <div className="flex gap-2">
                        <NeuInput
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            placeholder="Add hashtag..."
                            onKeyDown={(e) => e.key === 'Enter' && addHashtag()}
                            className="flex-1"
                        />
                        <NeuButton onClick={addHashtag} disabled={!newHashtag.trim()}>
                            <Plus size={16} />
                        </NeuButton>
                    </div>
                </div>
            </NeuCard>

            {/* First Comment Setting */}
            <NeuCard>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-purple-500`}>
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${styles.textMain}`}>First Comment</h3>
                            <p className={`text-xs ${styles.textSub}`}>Move hashtags to the first comment</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, firstCommentDefault: !prev.firstCommentDefault }))}
                        className={`relative w-14 h-7 rounded-full transition-colors ${settings.firstCommentDefault ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                    >
                        <div
                            className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${settings.firstCommentDefault ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {/* Info Box */}
                <div className={`mt-4 p-4 rounded-xl ${styles.bgAccent} flex gap-3`}>
                    <Info size={16} className="text-brand shrink-0 mt-0.5" />
                    <p className={`text-xs ${styles.textSub}`}>
                        Many influencers put hashtags in the first comment to keep captions clean.
                        The hashtags still help with discoverability, but don't clutter your message.
                        This works on Instagram and LinkedIn.
                    </p>
                </div>
            </NeuCard>

            {/* Default Platforms */}
            <NeuCard>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-green-500`}>
                        <Share2 size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${styles.textMain}`}>Default Platforms</h3>
                        <p className={`text-xs ${styles.textSub}`}>Pre-select accounts for new posts</p>
                    </div>
                </div>

                {accounts.length === 0 ? (
                    <p className={`text-sm ${styles.textSub}`}>
                        No connected accounts. Connect accounts above to set defaults.
                    </p>
                ) : (
                    <div className="grid gap-2">
                        {accounts.map(account => {
                            const isSelected = settings.defaultPlatformIds.includes(account.id);
                            return (
                                <button
                                    key={account.id}
                                    onClick={() => {
                                        setSettings(prev => ({
                                            ...prev,
                                            defaultPlatformIds: isSelected
                                                ? prev.defaultPlatformIds.filter(id => id !== account.id)
                                                : [...prev.defaultPlatformIds, account.id]
                                        }));
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected
                                        ? 'border-brand bg-brand/5'
                                        : `${styles.border} hover:border-brand/50`
                                        }`}
                                >
                                    {isSelected ? (
                                        <CheckSquare size={20} className="text-brand" />
                                    ) : (
                                        <Square size={20} className={styles.textSub} />
                                    )}
                                    <div>
                                        <div className={`text-sm font-medium ${styles.textMain}`}>
                                            {account.name || account.platform}
                                        </div>
                                        <div className={`text-xs ${styles.textSub} capitalize`}>
                                            {account.platform}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Info Box */}
                <div className={`mt-4 p-4 rounded-xl ${styles.bgAccent} flex gap-3`}>
                    <Info size={16} className="text-brand shrink-0 mt-0.5" />
                    <p className={`text-xs ${styles.textSub}`}>
                        When scheduling a new post, these accounts will be pre-selected. You can always change them per post.
                    </p>
                </div>
            </NeuCard>

            {/* Coming Soon: Content Pillars */}
            <NeuCard className="opacity-60">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-orange-500`}>
                        <Settings size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${styles.textMain}`}>Content Pillars</h3>
                        <p className={`text-xs ${styles.textSub}`}>Coming Soon — Auto-generate recurring content themes</p>
                    </div>
                </div>
                <p className={`text-sm ${styles.textSub}`}>
                    Set up "Motivation Monday", "Testimonial Tuesday", and more. The AI will auto-draft content for your approval.
                </p>
            </NeuCard>
        </div>
    );
};

export default Social;
