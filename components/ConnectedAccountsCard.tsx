/**
 * Connected Social Accounts Card
 * Displays and manages social media connections for a business.
 * Uses GHL OAuth to connect platforms.
 */

import React, { useState, useEffect } from 'react';
import { NeuCard, NeuButton, useThemeStyles } from './NeuComponents';
import { Business } from '../types';
import { SocialService, ConnectedAccount } from '../services/socialService';
import { Instagram, Facebook, Linkedin, RefreshCw, Check, AlertCircle, ExternalLink, Share2 } from 'lucide-react';

interface ConnectedAccountsCardProps {
    business: Business;
    onBusinessUpdate?: (business: Business) => void;
}

export const ConnectedAccountsCard: React.FC<ConnectedAccountsCardProps> = ({
    business,
    onBusinessUpdate
}) => {
    const { styles } = useThemeStyles();
    const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState<string | null>(null);

    const hasSocialConfig = !!(
        business?.socialConfig?.ghlLocationId
    );

    // Load accounts on mount if configured
    useEffect(() => {
        if (hasSocialConfig) {
            loadAccounts();
        }
    }, [business.socialConfig?.ghlLocationId]);

    // Listen for OAuth completion message from popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // GHL sends this message when social OAuth completes
            if (event.data && event.data.page === 'social_media_posting') {
                console.log('[ConnectedAccountsCard] OAuth Success via postMessage:', event.data);
                setIsConnecting(null);
                loadAccounts();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const loadAccounts = async () => {
        if (!business?.socialConfig?.ghlLocationId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/ghl/accounts?locationId=${business.socialConfig.ghlLocationId}`);
            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                setAccounts(data.accounts || []);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load accounts');
        }

        setIsLoading(false);
    };

    const handleConnect = async (platform: 'facebook' | 'instagram' | 'linkedin' | 'google') => {
        if (!business?.socialConfig?.ghlLocationId) return;

        setIsConnecting(platform);
        setError(null);

        try {
            // Call our backend proxy to get the OAuth URL
            const response = await fetch('/api/ghl/social-oauth', {
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
                        loadAccounts();
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
            default: return <Share2 size={20} />;
        }
    };

    const getPlatformColor = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram': return 'text-pink-500';
            case 'facebook': return 'text-blue-600';
            case 'linkedin': return 'text-blue-500';
            case 'google': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    // Available platforms to connect
    const availablePlatforms = [
        { id: 'facebook', name: 'Facebook', icon: Facebook },
        { id: 'instagram', name: 'Instagram', icon: Instagram },
        { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
    ];

    // Handle GHL App Installation
    const handleInstallGHL = async () => {
        setIsConnecting('ghl');
        setError(null);

        try {
            const response = await fetch(`/api/ghl/install?businessId=${business.id}`);
            const data = await response.json();

            if (data.url) {
                // Redirect to GHL OAuth
                window.location.href = data.url;
            } else {
                setError(data.error || 'Could not start GHL installation');
                setIsConnecting(null);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to start GHL installation');
            setIsConnecting(null);
        }
    };

    // Not configured state - show Install button
    if (!hasSocialConfig) {
        return (
            <NeuCard>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut} text-brand`}>
                        <Share2 size={24} />
                    </div>
                    <h3 className={`text-lg font-bold ${styles.textMain}`}>Connected Accounts</h3>
                </div>
                <div className="text-center py-6">
                    <p className={`text-sm ${styles.textSub} mb-4`}>
                        Connect your social media accounts to schedule posts directly from your generated assets.
                    </p>
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm flex items-center justify-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    <NeuButton
                        onClick={handleInstallGHL}
                        disabled={isConnecting === 'ghl'}
                        className="mx-auto"
                    >
                        {isConnecting === 'ghl' ? (
                            <>
                                <RefreshCw size={16} className="animate-spin mr-2" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <ExternalLink size={16} className="mr-2" />
                                Connect Social Media
                            </>
                        )}
                    </NeuButton>
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
                <NeuButton onClick={loadAccounts} disabled={isLoading} className="text-xs">
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
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
                {isLoading ? (
                    <div className={`text-center py-8 ${styles.textSub} text-sm`}>
                        Loading accounts...
                    </div>
                ) : accounts.length > 0 ? (
                    accounts.map((account) => (
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
                            <div className="flex items-center gap-1 text-xs text-green-500 font-bold">
                                <Check size={14} /> Connected
                            </div>
                        </div>
                    ))
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
