import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStyles, NeuButton, NeuInput, NeuCloseButton } from './NeuComponents';
import { Copy, Link2, Mail, Check, Trash2, Clock, Download, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface Share {
    id: string;
    token: string;
    url: string;
    recipientEmail?: string;
    expiresAt: string | null;
    isActive: boolean;
    downloadCount: number;
    createdAt: string;
}

interface ShareModalProps {
    assetId: string;
    businessId: string;
    isOpen: boolean;
    onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ShareModal: React.FC<ShareModalProps> = ({
    assetId,
    businessId,
    isOpen,
    onClose,
}) => {
    const { styles, theme } = useThemeStyles();
    const isDark = theme === 'dark';

    // State
    const [shares, setShares] = useState<Share[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [expiryDays, setExpiryDays] = useState<number | null>(30);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Email mode
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [email, setEmail] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Load existing shares
    useEffect(() => {
        if (isOpen && assetId) {
            loadShares();
        }
    }, [isOpen, assetId]);

    const loadShares = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(`/api/share/list?assetId=${assetId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (!response.ok) throw new Error('Failed to load shares');

            const data = await response.json();
            setShares(data.shares || []);
        } catch (e: any) {
            setError(e.message);
        }
        setIsLoading(false);
    };

    const createShare = async () => {
        setIsCreating(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch('/api/share/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    assetId,
                    expiresInDays: expiryDays,
                }),
            });

            if (!response.ok) throw new Error('Failed to create share');

            const data = await response.json();

            // Copy to clipboard immediately
            await navigator.clipboard.writeText(data.url);
            setCopiedId(data.id);
            setTimeout(() => setCopiedId(null), 2000);

            // Reload shares
            await loadShares();
        } catch (e: any) {
            setError(e.message);
        }
        setIsCreating(false);
    };

    const revokeShare = async (shareId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch('/api/share/revoke', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ shareId }),
            });

            if (!response.ok) throw new Error('Failed to revoke share');

            await loadShares();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const copyToClipboard = async (url: string, id: string) => {
        await navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const sendEmail = async (shareId: string) => {
        if (!email.trim()) return;
        setIsSendingEmail(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch('/api/share/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    shareId,
                    recipientEmail: email.trim(),
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to send email');
            }

            setEmailSent(true);
            setEmail('');
            setShowEmailInput(false);
            setTimeout(() => setEmailSent(false), 3000);
            await loadShares();
        } catch (e: any) {
            setError(e.message);
        }
        setIsSendingEmail(false);
    };

    const formatExpiry = (expiresAt: string | null) => {
        if (!expiresAt) return 'Never expires';
        const date = new Date(expiresAt);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Expired';
        if (diffDays === 0) return 'Expires today';
        if (diffDays === 1) return 'Expires tomorrow';
        return `Expires in ${diffDays} days`;
    };

    if (!isOpen) return null;

    // Render via portal to ensure it appears above AssetViewer
    return ReactDOM.createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                    className={`w-full max-w-md rounded-3xl p-6 ${styles.bg} ${styles.shadowOut}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-lg font-bold ${styles.textMain}`}>
                            Share to Printer
                        </h3>
                        <NeuCloseButton onClick={onClose} />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Create New Share */}
                    <div className={`p-4 rounded-2xl mb-4 ${styles.shadowIn}`}>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${styles.textSub}`}>
                            Create New Link
                        </h4>

                        {/* Expiry Options */}
                        <div className="flex gap-2 mb-4">
                            {[7, 30, null].map((days) => (
                                <button
                                    key={days ?? 'never'}
                                    onClick={() => setExpiryDays(days)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${expiryDays === days
                                        ? 'bg-brand text-white'
                                        : `${styles.shadowOut} ${styles.textSub}`
                                        }`}
                                >
                                    {days === null ? 'Never' : `${days} Days`}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <NeuButton
                                className="flex-1 py-3"
                                variant="primary"
                                onClick={createShare}
                                disabled={isCreating}
                            >
                                {isCreating ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Link2 size={16} />
                                        Generate Link
                                    </>
                                )}
                            </NeuButton>

                        </div>

                        {/* Email to existing share */}
                        {shares.filter(s => s.isActive).length > 0 && (
                            <div className="mt-4">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Send link via email..."
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`flex-1 px-4 py-2 rounded-xl text-sm ${styles.shadowIn} ${styles.textMain} bg-transparent`}
                                    />
                                    <NeuButton
                                        className="py-2 px-4"
                                        onClick={() => {
                                            const activeShare = shares.find(s => s.isActive);
                                            if (activeShare) sendEmail(activeShare.id);
                                        }}
                                        disabled={!email.trim() || isSendingEmail}
                                    >
                                        {isSendingEmail ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : emailSent ? (
                                            <Check size={16} className="text-green-500" />
                                        ) : (
                                            <>
                                                <Mail size={16} />
                                                Send
                                            </>
                                        )}
                                    </NeuButton>
                                </div>
                                {emailSent && (
                                    <p className="text-xs text-green-500 mt-2">Email sent successfully!</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Existing Shares */}
                    <div>
                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${styles.textSub}`}>
                            Active Links
                        </h4>

                        {isLoading ? (
                            <div className={`p-4 text-center ${styles.textSub}`}>
                                <Loader2 size={20} className="animate-spin mx-auto" />
                            </div>
                        ) : shares.filter(s => s.isActive).length === 0 ? (
                            <div className={`p-4 rounded-xl ${styles.shadowIn} text-center ${styles.textSub} text-sm`}>
                                No active share links yet
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {shares.filter(s => s.isActive).map((share) => (
                                    <div
                                        key={share.id}
                                        className={`p-3 rounded-xl ${styles.shadowIn} flex items-center gap-3`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-mono truncate ${styles.textMain}`}>
                                                {share.url.split('/').pop()}
                                            </div>
                                            <div className={`text-xs flex items-center gap-3 ${styles.textSub}`}>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {formatExpiry(share.expiresAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Download size={10} />
                                                    {share.downloadCount}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(share.url, share.id)}
                                            className={`p-2 rounded-lg ${styles.shadowOut} ${copiedId === share.id ? 'text-green-500' : styles.textSub
                                                }`}
                                        >
                                            {copiedId === share.id ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                        <button
                                            onClick={() => revokeShare(share.id)}
                                            className={`p-2 rounded-lg ${styles.shadowOut} ${styles.textSub} hover:text-red-500`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};
