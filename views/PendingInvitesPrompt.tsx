import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuCard, NeuButton, useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { GalaxyCanvas } from '../components/GalaxyCanvas';
import { Invitation } from '../services/teamService';
import { PartyPopper, Building2, Shield, ArrowRight } from 'lucide-react';

interface PendingInvitesPromptProps {
    invites: Invitation[];
}

const PendingInvitesPrompt: React.FC<PendingInvitesPromptProps> = ({ invites }) => {
    const { styles } = useThemeStyles();
    const navigate = useNavigate();

    const handleAcceptInvite = (token: string) => {
        navigate(`/invite/${token}`);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'text-purple-400';
            case 'editor': return 'text-blue-400';
            case 'viewer': return 'text-gray-400';
            default: return 'text-gray-400';
        }
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
                {/* Party Icon */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                    <PartyPopper size={32} />
                </div>

                {/* Header */}
                <div className="text-center">
                    <GalaxyHeading
                        text="You've Been Invited!"
                        className="text-2xl mb-2"
                        mode="light-on-dark"
                    />
                    <p className="text-gray-400 text-sm">
                        You have {invites.length} pending workspace invitation{invites.length > 1 ? 's' : ''}.
                    </p>
                </div>

                {/* Invites List */}
                <div className="w-full space-y-3">
                    {invites.map((invite) => (
                        <div
                            key={invite.id}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4"
                        >
                            <div className="p-3 rounded-xl bg-white/10">
                                <Building2 size={20} className="text-brand" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold truncate">
                                    {invite.businessName}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Shield size={12} className={getRoleColor(invite.role)} />
                                    <p className={`text-xs capitalize ${getRoleColor(invite.role)}`}>
                                        {invite.role}
                                    </p>
                                </div>
                            </div>
                            <NeuButton
                                onClick={() => handleAcceptInvite(invite.token)}
                                variant="primary"
                                className="px-4 py-2 text-sm"
                                forceTheme="dark"
                            >
                                Accept <ArrowRight size={14} className="ml-1" />
                            </NeuButton>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-500 text-center">
                    Accept an invitation to get started with your team.
                </p>
            </NeuCard>

            <div className="absolute bottom-8 text-xs opacity-40 font-mono">
                v2.0.0 • Celestial Neumorphism
            </div>
        </div>
    );
};

export default PendingInvitesPrompt;
