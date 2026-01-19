import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeuModal } from './NeuModal';
import { useThemeStyles, NeuButton, NeuInput, NeuDropdown } from './NeuComponents';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Mail, Link, Copy, Check, Send, UserPlus, Loader2, Building2, CheckSquare, Square } from 'lucide-react';

interface Business {
    id: string;
    name: string;
}

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Legacy: single business (backward compatible)
    businessId?: string;
    businessName?: string;
    // New: multi-business mode
    allBusinesses?: Business[];
    onInviteSent?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
    isOpen,
    onClose,
    businessId,
    businessName,
    allBusinesses = [],
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

    // Multi-business state
    const isMultiMode = allBusinesses.length > 1;
    const [accessScope, setAccessScope] = useState<'all' | 'selected'>('all');
    const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>(
        businessId ? [businessId] : allBusinesses.map(b => b.id)
    );

    const toggleBusiness = (id: string) => {
        setSelectedBusinessIds(prev =>
            prev.includes(id)
                ? prev.filter(bid => bid !== id)
                : [...prev, id]
        );
    };

    const selectAll = () => setSelectedBusinessIds(allBusinesses.map(b => b.id));
    const selectNone = () => setSelectedBusinessIds([]);

    // Get the business IDs to send based on mode
    const getBusinessIds = () => {
        if (!isMultiMode) {
            return businessId ? [businessId] : [];
        }
        return accessScope === 'all' ? allBusinesses.map(b => b.id) : selectedBusinessIds;
    };

    const handleGenerateLink = async () => {
        const businessIds = getBusinessIds();
        if (businessIds.length === 0) {
            setError('Please select at least one business');
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
                    businessIds,
                    accessScope: isMultiMode ? accessScope : 'single',
                    role,
                    sendEmail: false
                })
            });

            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error(`Server error (${response.status})`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate invite link');
            }

            setInviteLink(data.inviteLink);
            toast({
                type: 'success',
                title: 'Invite Link Created',
                message: `Link generated for ${role}. Expires in 7 days.`
            });
            // Don't auto-close here - user can copy link and then close
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

        const businessIds = getBusinessIds();
        if (businessIds.length === 0) {
            setError('Please select at least one business');
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
                    businessIds,
                    accessScope: isMultiMode ? accessScope : 'single',
                    email: email.trim(),
                    role,
                    sendEmail: true
                })
            });

            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error(`Server error (${response.status})`);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            setEmailSent(true);
            setInviteLink(data.inviteLink);
            toast({
                type: 'success',
                title: 'Invite Sent!',
                message: `Email sent to ${email.trim()}. Expires in 7 days.`
            });
            // Close modal after a brief moment to show success state
            setTimeout(() => {
                onInviteSent?.();
                handleClose();
            }, 800);
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
        setAccessScope('all');
        setSelectedBusinessIds(businessId ? [businessId] : allBusinesses.map(b => b.id));
        onClose();
    };

    // Display name for what we're inviting to
    const getInviteTargetText = () => {
        if (!isMultiMode) return businessName || 'Business';
        if (accessScope === 'all') return `All Businesses (${allBusinesses.length})`;
        if (selectedBusinessIds.length === 0) return 'No businesses selected';
        if (selectedBusinessIds.length === 1) {
            return allBusinesses.find(b => b.id === selectedBusinessIds[0])?.name || '1 Business';
        }
        return `${selectedBusinessIds.length} Businesses`;
    };

    return (
        <NeuModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Invite Team Member"
            className="max-w-md"
        >
            <div className="space-y-6">
                {/* Business Selection */}
                {isMultiMode ? (
                    <div className="space-y-3">
                        {/* Access Scope Toggle */}
                        <div className={`p-3 rounded-xl ${styles.bg} ${styles.shadowIn}`}>
                            <p className={`text-[10px] uppercase font-bold ${styles.textSub} mb-2`}>
                                Business Access
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setAccessScope('all')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${accessScope === 'all'
                                        ? 'bg-brand text-white ' + styles.shadowIn
                                        : styles.bg + ' ' + styles.shadowOut + ' ' + styles.textMain
                                        }`}
                                >
                                    All ({allBusinesses.length})
                                </button>
                                <button
                                    onClick={() => setAccessScope('selected')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${accessScope === 'selected'
                                        ? 'bg-brand text-white ' + styles.shadowIn
                                        : styles.bg + ' ' + styles.shadowOut + ' ' + styles.textMain
                                        }`}
                                >
                                    Select Specific
                                </button>
                            </div>
                        </div>

                        {/* Business Checklist (only when selecting specific) */}
                        <AnimatePresence mode="wait">
                            {accessScope === 'selected' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`p-3 rounded-xl ${styles.bg} ${styles.shadowIn} max-h-48 overflow-y-auto`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className={`text-[10px] uppercase font-bold ${styles.textSub}`}>
                                            Select Businesses
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={selectAll} className={`text-[10px] ${styles.textSub} hover:text-brand`}>
                                                All
                                            </button>
                                            <button onClick={selectNone} className={`text-[10px] ${styles.textSub} hover:text-brand`}>
                                                None
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {allBusinesses.map(biz => (
                                            <button
                                                key={biz.id}
                                                onClick={() => toggleBusiness(biz.id)}
                                                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${selectedBusinessIds.includes(biz.id)
                                                    ? 'bg-brand/10 text-brand'
                                                    : styles.textMain + ' hover:bg-white/5'
                                                    }`}
                                            >
                                                {selectedBusinessIds.includes(biz.id)
                                                    ? <CheckSquare size={16} />
                                                    : <Square size={16} className={styles.textSub} />
                                                }
                                                {biz.name}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Summary Badge */}
                        <div className={`p-3 rounded-xl ${styles.bg} ${styles.shadowOut} flex items-center gap-3`}>
                            <div className={`p-2 rounded-lg ${styles.bg} ${styles.shadowIn}`}>
                                <Building2 size={16} className="text-brand" />
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase font-bold ${styles.textSub}`}>Inviting to</p>
                                <p className={`font-bold ${styles.textMain} leading-none`}>{getInviteTargetText()}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Single Business Mode (legacy) */
                    <div className={`p-3 rounded-xl ${styles.bg} ${styles.shadowIn} flex items-center gap-3`}>
                        <div className={`p-2 rounded-lg ${styles.bg} ${styles.shadowOut}`}>
                            <UserPlus size={16} className="text-brand" />
                        </div>
                        <div>
                            <p className={`text-[10px] uppercase font-bold ${styles.textSub}`}>Inviting to</p>
                            <p className={`font-bold ${styles.textMain} leading-none`}>{businessName}</p>
                        </div>
                    </div>
                )}

                {/* Role Selector */}
                <div>
                    <NeuDropdown
                        label="Role"
                        value={role}
                        onChange={(val) => setRole(val as any)}
                        options={[
                            { label: 'Admin — Can manage team & settings', value: 'admin' },
                            { label: 'Editor — Can create & edit content', value: 'editor' },
                            { label: 'Viewer — Read-only access', value: 'viewer' },
                        ]}
                    />
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
