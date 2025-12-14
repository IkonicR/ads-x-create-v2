import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TeamService, Invitation } from '../services/teamService';
import { useThemeStyles, NeuButton } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { Check, Clock, Shield, User, AlertCircle, Loader2 } from 'lucide-react';

const AcceptInvite: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { session, user } = useAuth();
    const { styles } = useThemeStyles();
    const isDark = theme === 'dark';

    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link');
            setLoading(false);
            return;
        }

        const loadInvitation = async () => {
            try {
                const invite = await TeamService.getInvitationByToken(token);
                if (!invite) {
                    setError('Invitation not found or has expired');
                } else if (invite.acceptedAt) {
                    // Already accepted - check if current user is a member
                    if (user) {
                        const role = await TeamService.getMemberRole(invite.businessId, user.id);
                        if (role) {
                            // User is already a member, redirect to dashboard
                            navigate('/dashboard');
                            return;
                        }
                    }
                    setError('This invitation has already been used');
                } else if (new Date(invite.expiresAt) < new Date()) {
                    setError('This invitation has expired');
                } else {
                    // Check if user is already a member of this business
                    if (user) {
                        const role = await TeamService.getMemberRole(invite.businessId, user.id);
                        if (role) {
                            // Already a member, redirect to dashboard
                            navigate('/dashboard');
                            return;
                        }
                    }
                    setInvitation(invite);
                }
            } catch {
                setError('Failed to load invitation');
            } finally {
                setLoading(false);
            }
        };

        loadInvitation();
    }, [token, user, navigate]);

    const handleAccept = async () => {
        if (!session?.access_token || !token) return;

        setAccepting(true);
        setError('');

        try {
            const response = await fetch('/api/team/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ inviteToken: token })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAccepting(false);
        }
    };

    const getRoleDescription = (role: string) => {
        switch (role) {
            case 'admin': return 'Manage team members and business settings';
            case 'editor': return 'Create and edit content, but cannot manage team';
            case 'viewer': return 'View content only, cannot make changes';
            default: return '';
        }
    };

    // Show login prompt if not authenticated
    if (!user && !loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neu-dark' : 'bg-neu-light'} p-4`}>
                <div className={`w-full max-w-md p-8 rounded-3xl ${styles.bg} ${styles.shadowOut}`}>
                    <div className="text-center mb-8">
                        <GalaxyHeading text="You're Invited!" className="text-2xl" />
                        {invitation ? (
                            <>
                                <p className={`mt-4 ${styles.textMain} font-bold text-lg`}>
                                    Join {invitation.businessName}
                                </p>
                                <p className={`mt-2 ${styles.textSub}`}>
                                    as <span className="capitalize font-bold text-brand">{invitation.role}</span>
                                </p>
                                {invitation.inviterName && (
                                    <p className={`mt-2 text-xs ${styles.textSub}`}>
                                        Invited by {invitation.inviterName}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className={`mt-4 ${styles.textSub}`}>
                                Sign in to view this invitation
                            </p>
                        )}
                    </div>
                    <NeuButton
                        variant="primary"
                        onClick={() => navigate('/login', { state: { returnTo: `/invite/${token}` } })}
                        className="w-full justify-center"
                    >
                        Sign In to Accept
                    </NeuButton>
                    <p className={`text-center text-xs ${styles.textSub} mt-4`}>
                        Don't have an account? You can create one after clicking sign in.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neu-dark' : 'bg-neu-light'}`}>
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neu-dark' : 'bg-neu-light'} p-4`}>
                <div className={`w-full max-w-md p-8 rounded-3xl ${styles.bg} ${styles.shadowOut} text-center`}>
                    <div className={`w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6`}>
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className={`text-xl font-bold mb-3 ${styles.textMain}`}>Invitation Error</h2>
                    <p className={`${styles.textSub} mb-6`}>{error}</p>
                    <NeuButton onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </NeuButton>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neu-dark' : 'bg-neu-light'} p-4`}>
                <div className={`w-full max-w-md p-8 rounded-3xl ${styles.bg} ${styles.shadowOut} text-center`}>
                    <div className={`w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6`}>
                        <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className={`text-xl font-bold mb-3 ${styles.textMain}`}>Welcome to the Team! 🎉</h2>
                    <p className={`${styles.textSub} mb-6`}>
                        You've joined <strong>{invitation?.businessName}</strong> as {invitation?.role}
                    </p>
                    <p className={`text-xs ${styles.textSub}`}>
                        Redirecting to dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-neu-dark' : 'bg-neu-light'} p-4`}>
            <div className={`w-full max-w-md p-8 rounded-3xl ${styles.bg} ${styles.shadowOut}`}>
                {/* Header */}
                <div className="text-center mb-8">
                    <GalaxyHeading text="You're Invited!" className="text-2xl mb-2" />
                    <p className={`${styles.textSub}`}>
                        Join {invitation?.businessName}
                    </p>
                </div>

                {/* Invite Details */}
                <div className="space-y-4 mb-8">
                    {/* Inviter */}
                    <div className={`p-4 rounded-xl ${styles.bg} ${styles.shadowIn} flex items-center gap-4`}>
                        <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut}`}>
                            <User size={20} className="text-brand" />
                        </div>
                        <div>
                            <p className={`text-xs ${styles.textSub}`}>Invited by</p>
                            <p className={`font-bold ${styles.textMain}`}>{invitation?.inviterName || 'Team Admin'}</p>
                        </div>
                    </div>

                    {/* Role */}
                    <div className={`p-4 rounded-xl ${styles.bg} ${styles.shadowIn} flex items-center gap-4`}>
                        <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut}`}>
                            <Shield size={20} className="text-brand" />
                        </div>
                        <div>
                            <p className={`text-xs ${styles.textSub}`}>Your Role</p>
                            <p className={`font-bold ${styles.textMain} capitalize`}>{invitation?.role}</p>
                            <p className={`text-xs ${styles.textSub} mt-1`}>{getRoleDescription(invitation?.role || '')}</p>
                        </div>
                    </div>

                    {/* Expiry */}
                    <div className={`p-4 rounded-xl ${styles.bg} ${styles.shadowIn} flex items-center gap-4`}>
                        <div className={`p-3 rounded-full ${styles.bg} ${styles.shadowOut}`}>
                            <Clock size={20} className="text-brand" />
                        </div>
                        <div>
                            <p className={`text-xs ${styles.textSub}`}>Expires</p>
                            <p className={`font-bold ${styles.textMain}`}>
                                {new Date(invitation?.expiresAt || '').toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <NeuButton
                        variant="primary"
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full justify-center py-4 text-lg font-bold"
                    >
                        {accepting ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Check className="w-5 h-5 mr-2" />
                        )}
                        {accepting ? 'Joining...' : 'Accept Invitation'}
                    </NeuButton>

                    <NeuButton
                        onClick={() => navigate('/dashboard')}
                        className="w-full justify-center"
                    >
                        Decline
                    </NeuButton>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvite;
