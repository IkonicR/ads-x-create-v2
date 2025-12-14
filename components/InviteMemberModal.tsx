import React, { useState } from 'react';
import { NeuModal } from './NeuModal';
import { useThemeStyles, NeuButton, NeuInput, NeuSelect } from './NeuComponents';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Mail, Link, Copy, Check, Send, UserPlus, Loader2 } from 'lucide-react';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    businessName: string;
    onInviteSent?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
    isOpen,
    onClose,
    businessId,
    businessName,
    onInviteSent
}) => {
    const { styles } = useThemeStyles();
    const { session } = useAuth();
    const { toast } = useNotification();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [inviteLink, setInviteLink] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleGenerateLink = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/team/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    businessId,
                    role,
                    sendEmail: false
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate invite link');
            }

            setInviteLink(data.inviteLink);
            toast({
                type: 'success',
                title: 'Invite Link Created',
                message: `Link generated for ${role}. Expires in 7 days.`
            });
            // Auto-close modal after 2s
            setTimeout(() => handleClose(), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!email.trim()) {
            setError('Please enter an email address');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/team/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    businessId,
                    email: email.trim(),
                    role,
                    sendEmail: true
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            setEmailSent(true);
            setInviteLink(data.inviteLink);
            onInviteSent?.();
            toast({
                type: 'success',
                title: 'Invite Sent!',
                message: `Email sent to ${email.trim()}. Expires in 7 days.`
            });
            // Auto-close modal after 2s
            setTimeout(() => handleClose(), 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            setError('Failed to copy link');
        }
    };

    const handleClose = () => {
        setEmail('');
        setRole('editor');
        setError('');
        setInviteLink('');
        setLinkCopied(false);
        setEmailSent(false);
        onClose();
    };

    return (
        <NeuModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Invite Team Member"
            className="max-w-md"
        >
            <div className="space-y-6">
                {/* Business Badge */}
                <div className={`p-3 rounded-xl ${styles.bg} ${styles.shadowIn} flex items-center gap-3`}>
                    <div className={`p-2 rounded-lg ${styles.bg} ${styles.shadowOut}`}>
                        <UserPlus size={16} className="text-brand" />
                    </div>
                    <div>
                        <p className={`text-[10px] uppercase font-bold ${styles.textSub}`}>Inviting to</p>
                        <p className={`font-bold ${styles.textMain} leading-none`}>{businessName}</p>
                    </div>
                </div>

                {/* Role Selector */}
                <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${styles.textSub}`}>
                        Role
                    </label>
                    <NeuSelect
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                    >
                        <option value="admin">Admin — Can manage team & settings</option>
                        <option value="editor">Editor — Can create & edit content</option>
                        <option value="viewer">Viewer — Read-only access</option>
                    </NeuSelect>
                </div>

                {/* Email Invite Section */}
                <div className={`p-4 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Mail size={14} className="text-brand" />
                        <span className={`text-sm font-bold ${styles.textMain}`}>Send Email Invite</span>
                    </div>
                    <div className="flex gap-2">
                        <NeuInput
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="teammate@company.com"
                            className="flex-1"
                            disabled={emailSent}
                        />
                        <NeuButton
                            variant="primary"
                            onClick={handleSendEmail}
                            disabled={isLoading || emailSent}
                            className="shrink-0"
                        >
                            {emailSent ? <Check size={16} /> : <Send size={16} />}
                        </NeuButton>
                    </div>
                    {emailSent && (
                        <p className="text-green-500 text-xs mt-2 font-bold">
                            ✓ Invitation sent to {email}
                        </p>
                    )}
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200/10"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className={`px-3 text-xs uppercase font-bold ${styles.textSub} ${styles.bg}`}>
                            Or
                        </span>
                    </div>
                </div>

                {/* Shareable Link Section */}
                <div className={`p-4 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Link size={14} className="text-brand" />
                        <span className={`text-sm font-bold ${styles.textMain}`}>Shareable Link</span>
                    </div>

                    {inviteLink ? (
                        <div className="space-y-2">
                            <div className={`flex items-center gap-2 p-2 rounded-lg ${styles.bg} ${styles.shadowOut}`}>
                                <input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className={`flex-1 bg-transparent text-xs font-mono ${styles.textSub} truncate`}
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className={`p-2 rounded-lg transition-colors ${linkCopied ? 'bg-green-500/20 text-green-500' : 'hover:bg-white/10'}`}
                                >
                                    {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <p className={`text-[10px] ${styles.textSub}`}>
                                Link expires in 7 days. Single use only.
                            </p>
                        </div>
                    ) : (
                        <NeuButton
                            onClick={handleGenerateLink}
                            disabled={isLoading}
                            className="w-full justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={14} className="mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Link size={14} className="mr-2" />
                                    Generate Invite Link
                                </>
                            )}
                        </NeuButton>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-red-400 text-xs font-bold">{error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end pt-2">
                    <NeuButton onClick={handleClose}>
                        Done
                    </NeuButton>
                </div>
            </div>
        </NeuModal>
    );
};
