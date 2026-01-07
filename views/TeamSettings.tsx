import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { TeamService, TeamMember, Invitation } from '../services/teamService';
import { useThemeStyles, NeuButton, NeuCard, NeuDropdown } from '../components/NeuComponents';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { Business } from '../types';
import {
    Users,
    UserPlus,
    Crown,
    Shield,
    Pencil,
    Eye,
    Trash2,
    LogOut,
    Copy,
    Clock,
    Mail,
    Link,
    Check,
    Save,
    Loader2
} from 'lucide-react';

interface TeamSettingsProps {
    business: Business;
    onMembershipChange?: () => void;
}

const TeamSettings: React.FC<TeamSettingsProps> = ({
    business,
    onMembershipChange
}) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { styles } = useThemeStyles();
    const { setDirty, registerSaveHandler } = useNavigation();
    const isDark = theme === 'dark';

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    // Track pending role changes per member: { memberId: newRole }
    const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
    const [savingMemberId, setSavingMemberId] = useState<string | null>(null);

    const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';
    const isOwner = currentUserRole === 'owner';

    useEffect(() => {
        loadTeamData();
    }, [business.id, user?.id]);

    const loadTeamData = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const [membersList, invitesList, role] = await Promise.all([
                TeamService.getBusinessMembers(business.id),
                canManageTeam ? TeamService.getBusinessInvitations(business.id) : Promise.resolve([]),
                TeamService.getMemberRole(business.id, user.id)
            ]);

            setMembers(membersList);
            setInvitations(invitesList);
            setCurrentUserRole(role);
        } catch (error) {
            console.error('Error loading team data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Track dirty state for navigation blocking
    const hasPendingChanges = Object.keys(pendingChanges).length > 0;

    useEffect(() => {
        setDirty(hasPendingChanges, 'Team Member Roles');
    }, [hasPendingChanges, setDirty]);

    // Register save handler for "Save & Exit" modal
    const handleSaveAll = React.useCallback(async () => {
        for (const [memberId, newRole] of Object.entries(pendingChanges) as [string, string][]) {
            await TeamService.updateMemberRole(memberId, newRole);
        }
        setPendingChanges({});
    }, [pendingChanges]);

    useEffect(() => {
        if (hasPendingChanges) {
            registerSaveHandler(handleSaveAll, 'Team Member Roles');
        } else {
            registerSaveHandler(null, 'Team Member Roles');
        }
    }, [hasPendingChanges, registerSaveHandler, handleSaveAll]);

    // Track pending change (don't save yet)
    const handleRoleChange = (memberId: string, newRole: string) => {
        const originalMember = members.find(m => m.id === memberId);
        if (originalMember?.role === newRole) {
            // User reverted to original, remove from pending
            const { [memberId]: _, ...rest } = pendingChanges;
            setPendingChanges(rest);
        } else {
            setPendingChanges(prev => ({ ...prev, [memberId]: newRole }));
        }
    };

    // Save a single member's role change
    const handleSaveRole = async (memberId: string) => {
        const newRole = pendingChanges[memberId];
        if (!newRole) return;

        setSavingMemberId(memberId);
        try {
            const success = await TeamService.updateMemberRole(memberId, newRole);
            if (success) {
                // Update local state and clear pending
                setMembers(prev => prev.map(m =>
                    m.id === memberId ? { ...m, role: newRole as any } : m
                ));
                const { [memberId]: _, ...rest } = pendingChanges;
                setPendingChanges(rest);
            }
        } finally {
            setSavingMemberId(null);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this team member?')) return;

        const success = await TeamService.removeMember(memberId);
        if (success) {
            setMembers(prev => prev.filter(m => m.id !== memberId));
            onMembershipChange?.();
        }
    };

    const handleLeaveTeam = async () => {
        if (!user?.id) return;
        if (!confirm('Are you sure you want to leave this team? You will lose access to this business.')) return;

        const success = await TeamService.leaveBusiness(business.id, user.id);
        if (success) {
            onMembershipChange?.();
        }
    };

    const handleCopyLink = async (token: string) => {
        const link = `${window.location.origin}/invite/${token}`;
        await navigator.clipboard.writeText(link);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown size={14} className="text-yellow-500" />;
            case 'admin': return <Shield size={14} className="text-brand" />;
            case 'editor': return <Pencil size={14} className="text-green-500" />;
            case 'viewer': return <Eye size={14} className="text-gray-400" />;
            default: return null;
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'admin': return 'bg-brand/10 text-brand border-brand/20';
            case 'editor': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'viewer': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-pulse flex flex-col items-center">
                    <Users className="w-8 h-8 text-brand mb-3" />
                    <p className={styles.textSub}>Loading team...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${styles.bg} ${styles.shadowOut}`}>
                        <Users className="text-brand" size={20} />
                    </div>
                    <div>
                        <h2 className={`text-xl font-bold ${styles.textMain}`}>Team Members</h2>
                        <p className={`text-sm ${styles.textSub}`}>{members.length} member{members.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {canManageTeam && (
                    <NeuButton variant="primary" onClick={() => setShowInviteModal(true)}>
                        <UserPlus size={16} className="mr-2" />
                        Invite
                    </NeuButton>
                )}
            </div>

            {/* Members List */}
            <NeuCard className="p-0 overflow-hidden">
                {members.map((member, index) => (
                    <div
                        key={member.id}
                        className={`flex items-center justify-between p-4 ${index !== members.length - 1 ? 'border-b border-gray-200/10' : ''
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${member.userId === user?.id ? 'bg-brand' : 'bg-gray-500'
                                }`}>
                                {member.userName?.charAt(0).toUpperCase() || '?'}
                            </div>

                            {/* Info */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${styles.textMain}`}>
                                        {member.userName}
                                        {member.userId === user?.id && (
                                            <span className={`ml-2 text-xs ${styles.textSub}`}>(You)</span>
                                        )}
                                    </span>
                                </div>
                                {/* Email - show if available */}
                                {member.userEmail && (
                                    <p className={`text-xs ${styles.textSub} mt-0.5`}>
                                        {member.userEmail}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    {/* Static role badge for everyone */}
                                    <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${getRoleBadgeClass(member.role)}`}>
                                        {getRoleIcon(member.role)}
                                        {member.role}
                                    </span>
                                    {/* Join date */}
                                    <span className={`text-xs ${styles.textSub}`}>
                                        Joined {new Date(member.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Role dropdown + Save + Remove button (for admins editing non-owners) */}
                            {canManageTeam && member.role !== 'owner' && member.userId !== user?.id && (
                                <>
                                    <NeuDropdown
                                        value={pendingChanges[member.id] ?? member.role}
                                        onChange={(val) => handleRoleChange(member.id, val)}
                                        options={[
                                            { label: 'Admin', value: 'admin' },
                                            { label: 'Editor', value: 'editor' },
                                            { label: 'Viewer', value: 'viewer' },
                                        ]}
                                        className="min-w-[110px]"
                                    />
                                    {/* Inline Save button - only shows when this member has pending change */}
                                    {pendingChanges[member.id] && (
                                        <NeuButton
                                            variant="primary"
                                            onClick={() => handleSaveRole(member.id)}
                                            disabled={savingMemberId === member.id}
                                            className="!px-3 !py-2"
                                        >
                                            {savingMemberId === member.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Save size={16} />
                                            )}
                                        </NeuButton>
                                    )}
                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className={`p-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/10`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}

                            {/* Leave button for non-owners */}
                            {member.userId === user?.id && member.role !== 'owner' && (
                                <button
                                    onClick={handleLeaveTeam}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                                >
                                    <LogOut size={14} />
                                    Leave
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </NeuCard>

            {/* Pending Invitations */}
            {canManageTeam && invitations.length > 0 && (
                <div className="space-y-4">
                    <h3 className={`text-lg font-bold ${styles.textMain} flex items-center gap-2`}>
                        <Clock size={18} />
                        Pending Invitations
                    </h3>

                    <NeuCard className="p-0 overflow-hidden">
                        {invitations.map((invite, index) => (
                            <div
                                key={invite.id}
                                className={`flex items-center justify-between p-4 ${index !== invitations.length - 1 ? 'border-b border-gray-200/10' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${styles.bg} ${styles.shadowIn}`}>
                                        {invite.email ? <Mail size={16} className={styles.textSub} /> : <Link size={16} className={styles.textSub} />}
                                    </div>
                                    <div>
                                        <p className={`font-medium ${styles.textMain}`}>
                                            {invite.email || 'Shareable Link'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeClass(invite.role)}`}>
                                                {invite.role}
                                            </span>
                                            <span className={`text-xs ${styles.textSub}`}>
                                                Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleCopyLink(invite.token)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${copiedToken === invite.token
                                        ? 'bg-green-500/10 text-green-500'
                                        : `${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'} ${styles.textSub}`
                                        }`}
                                >
                                    {copiedToken === invite.token ? <Check size={14} /> : <Copy size={14} />}
                                    {copiedToken === invite.token ? 'Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        ))}
                    </NeuCard>
                </div>
            )}

            {/* Invite Modal */}
            <InviteMemberModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                businessId={business.id}
                businessName={business.name}
                onInviteSent={loadTeamData}
            />
        </div>
    );
};

export default TeamSettings;
