/**
 * Connected Social Accounts Card
 * Displays and manages social media connections for a business.
 * Uses GHL OAuth to connect platforms.
 */

import React, { useState, useEffect } from 'react';
import { NeuCard, NeuButton, useThemeStyles } from './NeuComponents';
import { Business } from '../types';
import { useSocial } from '../context/SocialContext';
import { Instagram, Facebook, Linkedin, RefreshCw, Check, AlertCircle, ExternalLink, Share2, MapPin, Image, MessageCircle, Cloud, Star } from 'lucide-react';

interface ConnectedAccountsCardProps {
    business: Business;
    onBusinessUpdate?: (business: Business) => void;
}

export const ConnectedAccountsCard: React.FC<ConnectedAccountsCardProps> = ({
    business,
    onBusinessUpdate
}) => {
    const { styles } = useThemeStyles();
    // Use SocialContext for centralized account caching
    const { accounts, accountsLoading, loadAccounts, refreshAccounts } = useSocial();
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState<string | null>(null);

    const hasSocialConfig = !!(
        business?.socialConfig?.ghlLocationId
    );

    // Load accounts on mount if configured (will use cache if available)
    useEffect(() => {
        if (hasSocialConfig && business.socialConfig?.ghlLocationId) {
            loadAccounts(business.socialConfig.ghlLocationId);
        }
    }, [business.socialConfig?.ghlLocationId, hasSocialConfig, loadAccounts]);

    // Listen for OAuth completion message from popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // GHL sends this message when social OAuth completes
            if (event.data && event.data.page === 'social_media_posting') {
                console.log('[ConnectedAccountsCard] OAuth Success via postMessage:', event.data);
                setIsConnecting(null);
                // Force refresh after new connection
                if (business.socialConfig?.ghlLocationId) {
                    refreshAccounts(business.socialConfig.ghlLocationId);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [business.socialConfig?.ghlLocationId, refreshAccounts]);

    // Refresh handler for the button
    const handleRefresh = () => {
        if (business.socialConfig?.ghlLocationId) {
            refreshAccounts(business.socialConfig.ghlLocationId);
        }
    };

    const handleConnect = async (platform: 'facebook' | 'instagram' | 'linkedin' | 'google') => {
        if (!business?.socialConfig?.ghlLocationId) return;

        setIsConnecting(platform);
        setError(null);

        try {
            // Call our backend proxy to get the OAuth URL
            const response = await fetch('/api/social/social-oauth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locationId: business.socialConfig.ghlLocationId,
                    platform,
                }),
            });

            const data = await response.json();

            if (data.url) {
                // Open OAuth popup
                const popup = window.open(data.url, 'oauth_popup', 'width=600,height=700');

                // Poll for popup close as fallback
                const pollTimer = setInterval(() => {
                    if (popup?.closed) {
                        clearInterval(pollTimer);
                        setIsConnecting(null);
                        // Refresh accounts after OAuth (postMessage might have already triggered this)
                        if (business.socialConfig?.ghlLocationId) {
                            refreshAccounts(business.socialConfig.ghlLocationId);
                        }
                    }
                }, 1000);
            } else {
                setError(data.error || 'Could not get OAuth URL');
                setIsConnecting(null);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to start OAuth');
            setIsConnecting(null);
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return <Instagram size={20} />;
            case 'facebook': return <Facebook size={20} />;
            case 'linkedin': return <Linkedin size={20} />;
            case 'google': return <MapPin size={20} />;
            case 'pinterest': return <Image size={20} />;
            case 'threads': return <MessageCircle size={20} />;
            case 'bluesky': return <Cloud size={20} />;
            default: return <Share2 size={20} />;
        }
    };

    const getPlatformColor = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return 'text-pink-500';
            case 'facebook': return 'text-blue-600';
            case 'linkedin': return 'text-blue-500';
            case 'google': return 'text-red-500';
            case 'pinterest': return 'text-red-600';
            case 'threads': return 'text-gray-800 dark:text-gray-200';
            case 'bluesky': return 'text-sky-500';
            default: return 'text-gray-500';
        }
    };

    // Available platforms to connect
    const availablePlatforms = [
        { id: 'facebook', name: 'Facebook', icon: Facebook },
        { id: 'instagram', name: 'Instagram', icon: Instagram },
        { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
        { id: 'google', name: 'Google Business', icon: MapPin },
        { id: 'pinterest', name: 'Pinterest', icon: Image },
        { id: 'threads', name: 'Threads', icon: MessageCircle },
        { id: 'bluesky', name: 'Bluesky', icon: Cloud },
    ];


    // Not configured state - show Contact Support message
    if (!hasSocialConfig) {
        return (
            <NeuCard>
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowIn}`}>
                        <Share2 size={24} className="text-gray-400" />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${styles.textMain}`}>Connected Accounts</h3>
                        <p className={`text-xs ${styles.textSub}`}>Social media scheduling</p>
                    </div>
                </div>

                <div className="flex flex-col items-center py-6">
                    <div className={`w-16 h-16 rounded-2xl ${styles.shadowIn} flex items-center justify-center mb-4`}>
                        <AlertCircle size={28} className={styles.textSub} />
                    </div>
                    <h4 className={`text-sm font-bold ${styles.textMain} mb-1`}>Not Yet Enabled</h4>
                    <p className={`text-xs ${styles.textSub} text-center max-w-[240px] mb-6 leading-relaxed`}>
                        Contact your account manager to activate social media scheduling for this business.
                    </p>
                    <div className={`px-4 py-2 rounded-xl ${styles.shadowIn} ${styles.textSub} text-xs font-bold`}>
                        Awaiting Setup
                    </div>
                </div>
            </NeuCard>
        );
    }

    return (
        <NeuCard>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-brand`}>
                        <Share2 size={24} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${styles.textMain}`}>Connected Accounts</h3>
                        <p className={`text-xs ${styles.textSub}`}>Link your social media for scheduling</p>
                    </div>
                </div>
                <NeuButton onClick={handleRefresh} disabled={accountsLoading} className="text-xs">
                    <RefreshCw size={14} className={accountsLoading ? 'animate-spin' : ''} />
                </NeuButton>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Connected Accounts List */}
            <div className="space-y-3 mb-6">
                {accountsLoading ? (
                    <div className={`text-center py-8 ${styles.textSub} text-sm`}>
                        Loading accounts...
                    </div>
                ) : accounts.length > 0 ? (
                    accounts.map((account) => {
                        const isDefault = business.socialSettings?.defaultPlatformIds?.includes(account.id);

                        // Toggle default handler
                        const toggleDefault = async (e: React.MouseEvent) => {
                            e.stopPropagation();
                            const currentDefaults = business.socialSettings?.defaultPlatformIds || [];
                            const newDefaults = isDefault
                                ? currentDefaults.filter(id => id !== account.id)
                                : [...currentDefaults, account.id];

                            // Update via onBusinessUpdate
                            if (onBusinessUpdate) {
                                onBusinessUpdate({
                                    ...business,
                                    socialSettings: {
                                        ...business.socialSettings,
                                        defaultPlatformIds: newDefaults,
                                    },
                                });
                            }
                        };

                        return (
                            <div
                                key={account.id}
                                className={`flex items-center gap-3 p-3 rounded-xl ${styles.shadowIn}`}
                            >
                                <div className={`p-2 rounded-full ${styles.bg} ${styles.shadowOut} ${getPlatformColor(account.platform)}`}>
                                    {getPlatformIcon(account.platform)}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${styles.textMain}`}>{account.name}</p>
                                    <p className={`text-xs ${styles.textSub} capitalize`}>{account.platform} {account.type && `• ${account.type}`}</p>
                                </div>
                                {/* Star button for default toggle */}
                                <button
                                    onClick={toggleDefault}
                                    title={isDefault ? 'Remove from defaults' : 'Set as default'}
                                    className={`p-2 rounded-full transition-all hover:scale-110 ${isDefault
                                            ? 'text-amber-400'
                                            : `${styles.textSub} hover:text-amber-400 opacity-40 hover:opacity-100`
                                        }`}
                                >
                                    <Star size={16} fill={isDefault ? 'currentColor' : 'none'} />
                                </button>
                                <div className="flex items-center gap-1 text-xs text-green-500 font-bold">
                                    <Check size={14} /> Connected
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={`text-center py-6 ${styles.textSub} text-sm`}>
                        No accounts connected yet
                    </div>
                )}
            </div>

            {/* Connect New Account Buttons */}
            <div className="border-t border-white/5 pt-4">
                <p className={`text-xs font-bold ${styles.textSub} uppercase tracking-wider mb-3`}>
                    Connect Account
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {availablePlatforms.map((platform) => {
                        const isConnected = accounts.some(a => a.platform === platform.id);
                        const isConnectingThis = isConnecting === platform.id;

                        return (
                            <button
                                key={platform.id}
                                onClick={() => handleConnect(platform.id as any)}
                                disabled={isConnectingThis || isConnected}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${isConnected
                                    ? `${styles.shadowIn} opacity-50 cursor-not-allowed`
                                    : `${styles.shadowOut} hover:scale-[1.02] active:scale-95`
                                    }`}
                            >
                                <platform.icon size={24} className={getPlatformColor(platform.id)} />
                                <span className={`text-xs font-bold ${styles.textMain}`}>
                                    {isConnectingThis ? 'Connecting...' : isConnected ? 'Connected' : platform.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Help Text */}
            <div className={`mt-4 pt-4 border-t border-white/5 text-center`}>
                <p className={`text-[10px] ${styles.textSub} opacity-60`}>
                    Clicking a platform will open a secure login popup.
                    Your credentials are processed directly by the platform, not stored here.
                </p>
            </div>
        </NeuCard>
    );
};
