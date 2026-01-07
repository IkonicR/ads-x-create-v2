import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useThemeStyles, NeuButton, NeuCard, NeuDropdown } from '../components/NeuComponents';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { supabase } from '../services/supabase';
import {
    Users,
    UserPlus,
    Crown,
    Shield,
    Pencil,
    Eye,
    Trash2,
    Building2,
    Globe,
    Clock,
    Mail,
    Check,
    X,
    Loader2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface WorkspaceMember {
    id: string;
    userId: string;
    userName: string;
    userEmail?: string;
    avatarUrl?: string;
    role: string;
    accessScope: 'single' | 'all';
    businesses: { id: string; name: string }[];
    createdAt: string;
}

interface PendingInvite {
    id: string;
    email: string;
    role: string;
    businessName: string;
    expiresAt: string;
}

interface WorkspaceTeamProps {
    allBusinesses: { id: string; name: string }[];
    onMembershipChange?: () => void;
}

const WorkspaceTeam: React.FC<WorkspaceTeamProps> = ({
    allBusinesses,
    onMembershipChange
}) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { styles } = useThemeStyles();
    const isDark = theme === 'dark';

    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [invitations, setInvitations] = useState<PendingInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [expandedMember, setExpandedMember] = useState<string | null>(null);

    useEffect(() => {
        loadWorkspaceTeam();
    }, [user?.id, allBusinesses]);

    const loadWorkspaceTeam = async () => {
        if (!user?.id || allBusinesses.length === 0) return;

        setLoading(true);
        try {
            const businessIds = allBusinesses.map(b => b.id);

            // Get all members across all businesses
            const { data: memberships, error: membersError } = await supabase
                .from('business_members')
                .select(`
                    id,
                    user_id,
                    business_id,
                    role,
                    access_scope,
                    created_at,
                    profiles (
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .in('business_id', businessIds)
                .neq('role', 'owner'); // Exclude owners (that's you)

            if (membersError) throw membersError;

            // Group by user_id
            const memberMap = new Map<string, WorkspaceMember>();

            for (const m of memberships || []) {
                const existing = memberMap.get(m.user_id);
                const bizName = allBusinesses.find(b => b.id === m.business_id)?.name || 'Unknown';

                if (existing) {
                    // Add this business to their list
                    if (!existing.businesses.find(b => b.id === m.business_id)) {
                        existing.businesses.push({ id: m.business_id, name: bizName });
                    }
                    // If any membership has 'all' scope, set it
                    if (m.access_scope === 'all') {
                        existing.accessScope = 'all';
                    }
                } else {
                    memberMap.set(m.user_id, {
                        id: m.id,
                        userId: m.user_id,
                        userName: (m.profiles as any)?.full_name || (m.profiles as any)?.username || 'Unknown',
                        avatarUrl: (m.profiles as any)?.avatar_url,
                        role: m.role,
                        accessScope: m.access_scope || 'single',
                        businesses: [{ id: m.business_id, name: bizName }],
                        createdAt: m.created_at
                    });
                }
            }

            setMembers(Array.from(memberMap.values()));

            // Get pending invitations
            const { data: invites, error: inviteError } = await supabase
                .from('invitations')
                .select('id, email, role, business_id, expires_at')
                .in('business_id', businessIds)
                .is('accepted_at', null)
                .gt('expires_at', new Date().toISOString());

            if (!inviteError && invites) {
                setInvitations(invites.map(inv => ({
                    id: inv.id,
                    email: inv.email,
                    role: inv.role,
                    businessName: allBusinesses.find(b => b.id === inv.business_id)?.name || 'Unknown',
                    expiresAt: inv.expires_at
                })));
            }

        } catch (error) {
            console.error('[WorkspaceTeam] Error loading:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (member: WorkspaceMember) => {
        const confirmMsg = member.accessScope === 'all'
            ? `Remove ${member.userName} from ALL businesses?`
            : `Remove ${member.userName} from ${member.businesses.length} business(es)?`;

        if (!confirm(confirmMsg)) return;

        try {
            // Delete all their memberships across your businesses
            const { error } = await supabase
                .from('business_members')
                .delete()
                .eq('user_id', member.userId)
                .in('business_id', allBusinesses.map(b => b.id));

            if (error) throw error;

            loadWorkspaceTeam();
            onMembershipChange?.();
        } catch (err) {
            console.error('Error removing member:', err);
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        try {
            await supabase.from('invitations').delete().eq('id', inviteId);
            loadWorkspaceTeam();
        } catch (err) {
            console.error('Error revoking invite:', err);
        }
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
                        <h2 className={`text-xl font-bold ${styles.textMain}`}>Workspace Team</h2>
                        <p className={`text-sm ${styles.textSub}`}>
                            {members.length} member{members.length !== 1 ? 's' : ''} across {allBusinesses.length} businesses
                        </p>
                    </div>
                </div>

                <NeuButton variant="primary" onClick={() => setShowInviteModal(true)}>
                    <UserPlus size={16} className="mr-2" />
                    Invite
                </NeuButton>
            </div>

            {/* Members List */}
            {members.length === 0 ? (
                <NeuCard className="p-8 text-center">
                    <Users className={`w-12 h-12 mx-auto mb-4 ${styles.textSub}`} />
                    <p className={`text-lg font-bold ${styles.textMain}`}>No team members yet</p>
                    <p className={`text-sm ${styles.textSub} mt-1`}>
                        Invite people to collaborate on your businesses
                    </p>
                </NeuCard>
            ) : (
                <NeuCard className="p-0 overflow-hidden">
                    {members.map((member, index) => (
                        <div key={member.userId}>
                            <div
                                className={`flex items-center justify-between p-4 ${index !== members.length - 1 ? 'border-b border-gray-200/10' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-gray-500`}>
                                        {member.userName?.charAt(0).toUpperCase() || '?'}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <p className={`font-bold ${styles.textMain}`}>{member.userName}</p>
                                        {member.userEmail && (
                                            <p className={`text-xs ${styles.textSub}`}>{member.userEmail}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${getRoleBadgeClass(member.role)}`}>
                                                {getRoleIcon(member.role)}
                                                {member.role}
                                            </span>
                                            {/* Access Scope Badge */}
                                            {member.accessScope === 'all' ? (
                                                <span className="text-xs px-2 py-0.5 rounded-full border bg-brand/10 text-brand border-brand/20 flex items-center gap-1">
                                                    <Globe size={12} />
                                                    All Businesses
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setExpandedMember(
                                                        expandedMember === member.userId ? null : member.userId
                                                    )}
                                                    className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${styles.bg} ${styles.shadowOut} ${styles.textSub}`}
                                                >
                                                    <Building2 size={12} />
                                                    {member.businesses.length} business{member.businesses.length !== 1 ? 'es' : ''}
                                                    {expandedMember === member.userId ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <button
                                    onClick={() => handleRemoveMember(member)}
                                    className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Expanded Business List */}
                            {expandedMember === member.userId && member.accessScope !== 'all' && (
                                <div className={`px-4 pb-4 pl-18 ${index !== members.length - 1 ? 'border-b border-gray-200/10' : ''}`}>
                                    <div className={`p-3 rounded-lg ${styles.bg} ${styles.shadowIn}`}>
                                        <p className={`text-[10px] uppercase font-bold ${styles.textSub} mb-2`}>
                                            Has access to:
                                        </p>
                                        <div className="space-y-1">
                                            {member.businesses.map(biz => (
                                                <div key={biz.id} className={`text-sm ${styles.textMain} flex items-center gap-2`}>
                                                    <Building2 size={12} className={styles.textSub} />
                                                    {biz.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </NeuCard>
            )}

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="space-y-4">
                    <h3 className={`text-lg font-bold ${styles.textMain} flex items-center gap-2`}>
                        <Clock size={18} />
                        Pending Invitations ({invitations.length})
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
                                        <Mail size={16} className={styles.textSub} />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${styles.textMain}`}>{invite.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeClass(invite.role)}`}>
                                                {invite.role}
                                            </span>
                                            <span className={`text-xs ${styles.textSub}`}>
                                                → {invite.businessName}
                                            </span>
                                            <span className={`text-xs ${styles.textSub}`}>
                                                Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRevokeInvite(invite.id)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm`}
                                >
                                    <X size={14} />
                                    Cancel
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
                allBusinesses={allBusinesses}
                onInviteSent={loadWorkspaceTeam}
            />
        </div>
    );
};

export default WorkspaceTeam;
