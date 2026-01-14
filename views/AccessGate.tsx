import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TeamService, Invitation } from '../services/teamService';
import GlobalLoader from '../components/GlobalLoader';
import AccessDenied from './AccessDenied';
import PendingInvitesPrompt from './PendingInvitesPrompt';
import UserOnboarding from './UserOnboarding';

/**
 * AccessGate Component
 * 
 * Determines if a newly authenticated user has valid access to the platform.
 * Checks in order:
 * 1. Pending invite code in localStorage (pre-auth entry)
 * 2. Pending team invites for their email
 * 3. No access → AccessDenied screen
 */
const AccessGate: React.FC = () => {
    const { user, session, refreshProfile } = useAuth();

    const [checking, setChecking] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkAccess = async () => {
            if (!user?.email || !session?.access_token) {
                setChecking(false);
                return;
            }

            try {
                // Check 1: Pending invite code in localStorage
                const pendingCode = localStorage.getItem('pending_invite_code');
                if (pendingCode) {
                    console.log('[AccessGate] Found pending invite code, attempting to use...');

                    // Validate first
                    const validateRes = await fetch('/api/invite/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: pendingCode })
                    });

                    const validateData = await validateRes.json();

                    if (validateData.valid) {
                        // Consume the code
                        const useRes = await fetch('/api/invite/use', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({ code: pendingCode })
                        });

                        if (useRes.ok) {
                            console.log('[AccessGate] Invite code consumed successfully');
                            localStorage.removeItem('pending_invite_code');
                            setHasAccess(true);
                            setChecking(false);
                            return;
                        }
                    }

                    // Code was invalid or failed to use - remove it
                    localStorage.removeItem('pending_invite_code');
                }

                // Check 2: Pending team invites for their email
                console.log('[AccessGate] Checking for pending team invites...');
                const invites = await TeamService.getPendingInvitesForEmail(user.email);

                if (invites.length > 0) {
                    console.log('[AccessGate] Found pending team invites:', invites.length);
                    setPendingInvites(invites);
                    setChecking(false);
                    return;
                }

                // No valid access found
                console.log('[AccessGate] No valid access found');
                setChecking(false);

            } catch (err) {
                console.error('[AccessGate] Error checking access:', err);
                setError('Failed to check access. Please try again.');
                setChecking(false);
            }
        };

        checkAccess();
    }, [user?.email, session?.access_token]);

    const handleAccessGranted = async () => {
        // Refresh profile to pick up any changes (like invite_code_used)
        await refreshProfile();
        setHasAccess(true);
    };

    // Loading state
    if (checking) {
        return <GlobalLoader />;
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neu-dark">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-brand underline"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Has access → proceed to onboarding
    if (hasAccess) {
        return <UserOnboarding />;
    }

    // Has pending team invites → show prompt
    if (pendingInvites.length > 0) {
        return <PendingInvitesPrompt invites={pendingInvites} />;
    }

    // No access → show access denied
    return <AccessDenied onAccessGranted={handleAccessGranted} />;
};

export default AccessGate;
