/**
 * Subscriptions Tab (Admin HQ)
 * 
 * Displays all subscription OWNERS (not team members).
 * Allows admin to:
 * - View user plans and credits
 * - Change plans
 * - Add/set credits
 * - Toggle comped status
 * - View their businesses (expandable)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminService, UserWithSubscription } from '../../services/adminService';
import { useThemeStyles, NeuCard, NeuButton, NeuInput, NeuDropdown, NeuBadge } from '../../components/NeuComponents';
import {
    Users, CreditCard, Zap, ChevronDown, RefreshCw, Search,
    Building2, Share2, AlertCircle, Check
} from 'lucide-react';
import { NeuModal } from '../../components/NeuModal';
import { Business } from '../../types';
import { PlanId } from '../../config/pricing';
import { ExternalLink } from 'lucide-react';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const expandVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: 'auto', opacity: 1 }
};

interface SubscriptionsTabProps {
    styles: any;
    handleRefresh: () => void;
}

const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({ styles: parentStyles, handleRefresh }) => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

    const [users, setUsers] = useState<UserWithSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [savingUserId, setSavingUserId] = useState<string | null>(null);

    // Load users
    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await AdminService.getAllSubscriptionOwners();
            setUsers(data);
        } catch (err) {
            console.error('[SubscriptionsTab] Error loading users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Filter users by search
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.fullName?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
    });

    // Handle plan change
    const handlePlanChange = async (userId: string, planId: PlanId) => {
        setSavingUserId(userId);
        try {
            await AdminService.updateUserPlan(userId, planId);
            setUsers(prev => prev.map(u =>
                u.id === userId
                    ? { ...u, subscription: u.subscription ? { ...u.subscription, planId } : null }
                    : u
            ));
        } catch (err) {
            console.error('Error updating plan:', err);
        } finally {
            setSavingUserId(null);
        }
    };

    // Handle add credits
    const handleAddCredits = async (userId: string, amount: number) => {
        setSavingUserId(userId);
        try {
            const newBalance = await AdminService.addCredits(userId, amount);
            setUsers(prev => prev.map(u =>
                u.id === userId && u.subscription
                    ? { ...u, subscription: { ...u.subscription, creditsRemaining: newBalance } }
                    : u
            ));
        } catch (err) {
            console.error('Error adding credits:', err);
        } finally {
            setSavingUserId(null);
        }
    };

    // Handle toggle comped
    const handleToggleComped = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user?.subscription) return;

        setSavingUserId(userId);
        try {
            const newStatus = await AdminService.toggleCompedStatus(userId, user.subscription.status);
            setUsers(prev => prev.map(u =>
                u.id === userId && u.subscription
                    ? { ...u, subscription: { ...u.subscription, status: newStatus as any } }
                    : u
            ));
        } catch (err) {
            console.error('Error toggling comped:', err);
        } finally {
            setSavingUserId(null);
        }
    };

    // Toggle expand
    const toggleExpand = (userId: string) => {
        setExpandedUserId(prev => prev === userId ? null : userId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                    <RefreshCw className="w-8 h-8 text-brand" />
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <NeuCard className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className={`${styles.textMain} mb-4`}>{error}</p>
                <NeuButton onClick={loadUsers}>Retry</NeuButton>
            </NeuCard>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${styles.bg} ${styles.shadowIn} text-brand`}>
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${styles.textMain}`}>Subscriptions</h3>
                        <p className={`text-xs ${styles.textSub}`}>{users.length} subscription owners</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
                        <Search size={14} className={styles.textSub} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`bg-transparent outline-none text-sm ${styles.textMain} w-32`}
                        />
                    </div>

                    {/* Refresh */}
                    <NeuButton onClick={() => { loadUsers(); handleRefresh(); }}>
                        <RefreshCw size={14} />
                        Refresh
                    </NeuButton>
                </div>
            </div>

            {/* Users List */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
            >
                {filteredUsers.length === 0 ? (
                    <NeuCard className="p-8 text-center">
                        <Users className={`w-12 h-12 mx-auto mb-4 ${styles.textSub}`} />
                        <p className={styles.textSub}>No users found</p>
                    </NeuCard>
                ) : (
                    filteredUsers.map(user => (
                        <UserSubscriptionRow
                            key={user.id}
                            user={user}
                            isExpanded={expandedUserId === user.id}
                            isSaving={savingUserId === user.id}
                            onPlanChange={handlePlanChange}
                            onAddCredits={handleAddCredits}
                            onToggleComped={handleToggleComped}
                            onToggleExpand={() => toggleExpand(user.id)}
                            styles={styles}
                            isDark={isDark}
                        />
                    ))
                )}
            </motion.div>
        </div>
    );
};

// User Row Component
interface UserSubscriptionRowProps {
    user: UserWithSubscription;
    isExpanded: boolean;
    isSaving: boolean;
    onPlanChange: (userId: string, plan: PlanId) => void;
    onAddCredits: (userId: string, amount: number) => void;
    onToggleComped: (userId: string) => void;
    onToggleExpand: () => void;
    styles: any;
    isDark: boolean;
}

const UserSubscriptionRow: React.FC<UserSubscriptionRowProps> = ({
    user, isExpanded, isSaving, onPlanChange, onAddCredits, onToggleComped, onToggleExpand, styles, isDark
}) => {
    const plan = AdminService.getPlanInfo(user.subscription?.planId || 'creator');
    const maxBusinesses = plan.features.businesses + (user.subscription?.extraBusinesses || 0);

    return (
        <motion.div variants={itemVariants} layout>
            <NeuCard className="overflow-hidden">
                {/* Main Row */}
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                        {/* Avatar + Name (col-span-3) */}
                        <div className="col-span-3 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-brand to-purple-600 
                                            flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                {user.fullName?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                                <h4 className={`font-bold ${styles.textMain} truncate`}>
                                    {user.fullName || 'Unnamed User'}
                                </h4>
                                <p className={`text-xs ${styles.textSub} truncate`}>
                                    {user.email || 'No email'}
                                </p>
                            </div>
                        </div>

                        {/* Plan Dropdown (col-span-2) */}
                        <div className="col-span-2">
                            <NeuDropdown
                                value={user.subscription?.planId || 'creator'}
                                onChange={(val) => onPlanChange(user.id, val as PlanId)}
                                options={[
                                    { label: 'Creator', value: 'creator' },
                                    { label: 'Growth', value: 'growth' },
                                    { label: 'Agency', value: 'agency' },
                                ]}
                            />
                        </div>

                        {/* Credits (col-span-3) */}
                        <div className="col-span-3 flex items-center gap-2 flex-wrap">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
                                <Zap size={14} className="text-brand" />
                                <span className={`font-mono font-bold ${styles.textMain}`}>
                                    {user.subscription?.creditsRemaining || 0}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                {[50, 100, 500].map(amt => (
                                    <motion.button
                                        key={amt}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onAddCredits(user.id, amt)}
                                        disabled={isSaving}
                                        className={`px-2 py-1 rounded-lg text-xs font-bold ${styles.bg} ${styles.shadowOut} 
                                                   hover:text-brand transition-colors disabled:opacity-50`}
                                    >
                                        +{amt}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Business Count (col-span-2) */}
                        <div className="col-span-2 text-center">
                            <p className={`text-sm font-bold ${styles.textMain}`}>
                                {user.businessCount} / {maxBusinesses}
                            </p>
                            <p className={`text-xs ${styles.textSub}`}>businesses</p>
                        </div>

                        {/* Status + Expand (col-span-2) */}
                        <div className="col-span-2 flex items-center justify-end gap-2">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onToggleComped(user.id)}
                                disabled={isSaving}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${user.subscription?.status === 'comped'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}
                            >
                                {user.subscription?.status === 'comped' ? 'COMPED' : 'ACTIVE'}
                            </motion.button>

                            <motion.button
                                onClick={onToggleExpand}
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                className={`p-2 rounded-lg ${styles.bg} ${styles.shadowOut}`}
                            >
                                <ChevronDown size={16} />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Expandable Section: User's Businesses */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            variants={expandVariants}
                            className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}
                        >
                            <div className="p-4">
                                <h5 className={`text-xs font-bold uppercase ${styles.textSub} mb-3`}>
                                    Owned Businesses
                                </h5>
                                <BusinessGrid userId={user.id} styles={styles} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </NeuCard>
        </motion.div>
    );
};

// Business Grid (Expandable Section)
const BusinessGrid: React.FC<{ userId: string; styles: any }> = ({ userId, styles }) => {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [configuringBusiness, setConfiguringBusiness] = useState<Business | null>(null);

    const loadBusinesses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await AdminService.getUserBusinesses(userId);
            setBusinesses(data);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadBusinesses();
    }, [loadBusinesses]);

    const handleSaveSocialConfig = async (locationId: string, accessToken: string) => {
        if (!configuringBusiness) return;

        await AdminService.updateBusinessSocialConfig(configuringBusiness.id, locationId, accessToken);

        // Refresh businesses to show updated status
        await loadBusinesses();
        setConfiguringBusiness(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <RefreshCw className="w-5 h-5 text-brand" />
                </motion.div>
            </div>
        );
    }

    if (businesses.length === 0) {
        return (
            <p className={`text-sm ${styles.textSub} text-center py-4`}>
                No businesses yet
            </p>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {businesses.map(biz => (
                    <motion.div
                        key={biz.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-3 rounded-xl ${styles.bg} ${styles.shadowIn}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-brand/20 text-brand 
                                            flex items-center justify-center text-xs font-bold shrink-0`}>
                                {biz.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm truncate ${styles.textMain}`}>{biz.name}</p>
                                <p className={`text-xs ${styles.textSub}`}>{biz.industry || 'No industry'}</p>
                            </div>

                            {/* Social Status Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setConfiguringBusiness(biz)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${biz.socialConfig?.ghlLocationId
                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                    : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                    }`}
                            >
                                <Share2 size={10} />
                                {biz.socialConfig?.ghlLocationId ? 'GHL' : 'Connect'}
                            </motion.button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Social Config Modal */}
            {configuringBusiness && (
                <SocialConfigModal
                    business={configuringBusiness}
                    onClose={() => setConfiguringBusiness(null)}
                    onSave={handleSaveSocialConfig}
                    styles={styles}
                />
            )}
        </>
    );
};

// Social Config Modal Component
const SocialConfigModal: React.FC<{
    business: Business;
    onClose: () => void;
    onSave: (locationId: string, accessToken: string) => Promise<void>;
    styles: any;
}> = ({ business, onClose, onSave, styles }) => {
    const [locationId, setLocationId] = useState(business.socialConfig?.ghlLocationId || '');
    const [accessToken, setAccessToken] = useState(business.socialConfig?.ghlAccessToken || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!locationId.trim() || !accessToken.trim()) {
            setError('Both Location ID and Access Token are required');
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            await onSave(locationId.trim(), accessToken.trim());
        } catch (e: any) {
            setError(e.message || 'Failed to save');
            setIsSaving(false);
        }
    };

    return (
        <NeuModal
            isOpen={true}
            onClose={onClose}
            title="Configure Social"
            className="max-w-md w-full"
        >
            <div className="space-y-6">
                {/* Business Info Badge */}
                <div className={`p-3 rounded-xl ${styles.bg} ${styles.shadowIn} flex items-center gap-3`}>
                    <div className={`p-1.5 rounded-lg ${styles.bg} ${styles.shadowOut}`}>
                        <Share2 size={16} className="text-brand" />
                    </div>
                    <div>
                        <p className={`text-[10px] uppercase font-bold ${styles.textSub}`}>Target Business</p>
                        <p className={`font-bold ${styles.textMain} leading-none`}>{business.name}</p>
                    </div>
                </div>

                {/* Connect App Section */}
                <div className={`p-4 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
                    <h4 className={`text-sm font-bold ${styles.textMain} mb-2`}>Connect Sub-Account</h4>
                    <p className={`text-xs ${styles.textSub} mb-4`}>
                        Install the Ads x Create app on the client's GoHighLevel sub-account to enable social posting.
                    </p>
                    <NeuButton
                        variant="primary"
                        className="w-full justify-center"
                        onClick={() => {
                            const url = `/api/social/install?businessId=${business.id}`;
                            window.open(url, 'ghl_install', 'width=600,height=800');
                        }}
                    >
                        <ExternalLink size={16} className="mr-2" />
                        Connect GHL Sub-Account
                    </NeuButton>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className={`px-2 text-[10px] uppercase font-bold ${styles.textSub} ${styles.bg}`}>Or Configure Manually</span>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    <div>
                        <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>
                            GHL Location ID
                        </label>
                        <NeuInput
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            placeholder="e.g. abc123xyz..."
                        />
                        <p className={`text-[10px] ${styles.textSub} mt-1 opacity-60`}>
                            Found in GHL → Sub-Account → Settings
                        </p>
                    </div>

                    <div>
                        <label className={`text-xs font-bold ${styles.textSub} mb-1 block`}>
                            Access Token (Private Integration)
                        </label>
                        <NeuInput
                            type="password"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="pit-xxxx-xxxx-xxxx..."
                        />
                        <p className={`text-[10px] ${styles.textSub} mt-1 opacity-60`}>
                            Create in GHL → Sub-Account → Settings → Private Integrations
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-xs p-2 rounded-lg bg-red-500/10">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <NeuButton onClick={onClose} disabled={isSaving}>
                        Cancel
                    </NeuButton>
                    <NeuButton variant="primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </NeuButton>
                </div>
            </div>
        </NeuModal>
    );
};

export default SubscriptionsTab;
