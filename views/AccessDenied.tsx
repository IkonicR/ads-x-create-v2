import React, { useState } from 'react';
import { NeuCard, NeuButton, NeuInput, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { GalaxyCanvas } from '../components/GalaxyCanvas';
import { useAuth } from '../context/AuthContext';
import { Lock, Ticket, CheckCircle2, XCircle, Loader2, LogOut, Mail } from 'lucide-react';

interface AccessDeniedProps {
    onAccessGranted: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ onAccessGranted }) => {
    const { styles } = useThemeStyles();
    const { user, session, signOut } = useAuth();

    const [inviteCode, setInviteCode] = useState('');
    const [validating, setValidating] = useState(false);
    const [codeValid, setCodeValid] = useState<boolean | null>(null);
    const [error, setError] = useState('');

    // Auto-format invite code input
    const handleCodeChange = (value: string) => {
        let cleaned = value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
        if (cleaned.length > 4 && !cleaned.includes('-')) {
            cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
        }
        cleaned = cleaned.slice(0, 9);
        setInviteCode(cleaned);
        setCodeValid(null);
        setError('');
    };

    const handleValidateAndContinue = async () => {
        if (!inviteCode || inviteCode.length < 6) {
            setError('Please enter a valid invite code');
            return;
        }

        setValidating(true);
        setError('');

        try {
            // First validate the code
            const validateRes = await fetch('/api/invite/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inviteCode })
            });

            const validateData = await validateRes.json();

            if (validateRes.status === 429) {
                setCodeValid(false);
                setError('Too many attempts. Please wait a minute and try again.');
                setValidating(false);
                return;
            }

            if (!validateData.valid) {
                setCodeValid(false);
                setError(validateData.error || 'Invalid invite code');
                setValidating(false);
                return;
            }

            // Code is valid - consume it
            const useRes = await fetch('/api/invite/use', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ code: inviteCode })
            });

            if (!useRes.ok) {
                const useData = await useRes.json();
                if (useRes.status === 429) {
                    setError('Too many attempts. Please wait a minute and try again.');
                } else {
                    setError(useData.error || 'Failed to use invite code');
                }
                setValidating(false);
                return;
            }

            setCodeValid(true);

            // Notify parent that access was granted
            setTimeout(() => {
                onAccessGranted();
            }, 500);

        } catch (err) {
            setError('Failed to validate code. Please try again.');
            setCodeValid(false);
        } finally {
            setValidating(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 animate-fade-in relative overflow-hidden">
            {/* Galaxy Background */}
            <div className="absolute inset-0 z-0">
                <GalaxyCanvas />
            </div>

            <NeuCard
                className="p-8 max-w-md w-full flex flex-col gap-6 items-center relative z-10"
                forceTheme="dark"
            >
                {/* Lock Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                    <Lock size={32} />
                </div>

                {/* Header */}
                <div className="text-center">
                    <GalaxyHeading
                        text="Access Required"
                        className="text-2xl mb-2"
                        mode="light-on-dark"
                    />
                    <p className="text-gray-400 text-sm">
                        This platform requires an invitation to access.
                    </p>
                </div>

                {/* Signed in as */}
                <div className={`w-full p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3`}>
                    <div className="p-2 rounded-full bg-white/10">
                        <Mail size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                    </div>
                </div>

                {/* Invite Code Input */}
                <div className="w-full space-y-3">
                    <div className="relative">
                        <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <NeuInput
                            value={inviteCode}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            placeholder="BETA-XXXX"
                            className="pl-10 w-full text-center font-mono tracking-widest uppercase"
                            forceTheme="dark"
                            onKeyDown={(e) => e.key === 'Enter' && handleValidateAndContinue()}
                        />
                        {codeValid !== null && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {codeValid ? (
                                    <CheckCircle2 size={18} className="text-green-400" />
                                ) : (
                                    <XCircle size={18} className="text-red-400" />
                                )}
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs text-center">{error}</p>
                    )}

                    <NeuButton
                        onClick={handleValidateAndContinue}
                        disabled={validating || inviteCode.length < 6}
                        className="w-full flex items-center justify-center gap-3 py-4 text-base font-bold"
                        variant="primary"
                        forceTheme="dark"
                    >
                        {validating ? (
                            <>
                                <Loader2 size={20} className="animate-spin" /> Validating...
                            </>
                        ) : codeValid ? (
                            <>
                                <CheckCircle2 size={20} /> Access Granted!
                            </>
                        ) : (
                            'Validate & Continue'
                        )}
                    </NeuButton>
                </div>

                {/* Divider */}
                <div className="w-full flex items-center gap-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-gray-500">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Actions */}
                <div className="w-full flex gap-3">
                    <NeuButton
                        onClick={handleSignOut}
                        className="flex-1 flex items-center justify-center gap-2"
                        forceTheme="dark"
                    >
                        <LogOut size={16} /> Sign Out
                    </NeuButton>
                    <NeuButton
                        onClick={() => window.open('mailto:team@xcreate.io?subject=Access%20Request', '_blank')}
                        className="flex-1"
                        forceTheme="dark"
                    >
                        Request Access
                    </NeuButton>
                </div>

                <p className="text-xs text-gray-500 text-center">
                    Don't have an invite code? Contact us for access.
                </p>
            </NeuCard>

            <div className="absolute bottom-8 text-xs opacity-40 font-mono">
                v2.0.0 • Celestial Neumorphism
            </div>
        </div>
    );
};

export default AccessDenied;
