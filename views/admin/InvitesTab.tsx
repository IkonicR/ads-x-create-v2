import React, { useState, useEffect } from 'react';
import { NeuCard, NeuButton, NeuInput, useThemeStyles, NeuDropdown } from '../../components/NeuComponents';
import { Ticket, Plus, RefreshCw, Copy, Check, XCircle, Loader2, Calendar, Hash, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

interface InviteCode {
    id: string;
    code: string;
    created_by: string | null;
    max_uses: number | null;
    current_uses: number;
    expires_at: string | null;
    is_active: boolean;
    note: string | null;
    created_at: string;
}

interface InvitesTabProps {
    styles: ReturnType<typeof useThemeStyles>['styles'];
}

export const InvitesTab: React.FC<InvitesTabProps> = ({ styles }) => {
    const { session } = useAuth();
    const [codes, setCodes] = useState<InviteCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Create form state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPrefix, setNewPrefix] = useState('BETA');
    const [newMaxUses, setNewMaxUses] = useState('1');
    const [newExpiresInDays, setNewExpiresInDays] = useState('');
    const [newNote, setNewNote] = useState('');

    const fetchCodes = async () => {
        if (!session?.access_token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/invite/list', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const data = await res.json();
            setCodes(data.codes || []);
        } catch (e) {
            console.error('Failed to fetch invite codes:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, [session?.access_token]);

    const handleCreate = async () => {
        if (!session?.access_token) return;
        setCreating(true);
        try {
            const res = await fetch('/api/invite/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    prefix: newPrefix,
                    maxUses: parseInt(newMaxUses) || 1,
                    expiresInDays: newExpiresInDays ? parseInt(newExpiresInDays) : undefined,
                    note: newNote || undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                setCodes(prev => [data.code, ...prev]);
                setShowCreateForm(false);
                setNewPrefix('BETA');
                setNewMaxUses('1');
                setNewExpiresInDays('');
                setNewNote('');
            }
        } catch (e) {
            console.error('Failed to create code:', e);
        } finally {
            setCreating(false);
        }
    };

    const handleDeactivate = async (codeId: string) => {
        if (!session?.access_token) return;
        try {
            await fetch('/api/invite/deactivate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ codeId })
            });
            setCodes(prev => prev.map(c => c.id === codeId ? { ...c, is_active: false } : c));
        } catch (e) {
            console.error('Failed to deactivate code:', e);
        }
    };

    const copyToClipboard = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className={`text-lg font-bold ${styles.textMain}`}>Platform Access Codes</h3>
                    <p className={`text-sm ${styles.textSub}`}>Generate invite codes for new users</p>
                </div>
                <div className="flex gap-2">
                    <NeuButton onClick={fetchCodes} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </NeuButton>
                    <NeuButton variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                        <Plus size={16} /> New Code
                    </NeuButton>
                </div>
            </div>

            {/* Create Form - Simplified */}
            {showCreateForm && (
                <NeuCard className="p-6 space-y-4 border-2 border-brand/30">
                    <h4 className={`font-bold ${styles.textMain}`}>Generate New Invite Code</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-500 uppercase">Max Uses</label>
                            <NeuInput
                                type="number"
                                value={newMaxUses}
                                onChange={(e) => setNewMaxUses(e.target.value)}
                                placeholder="1"
                            />
                            <p className="text-xs text-gray-600 mt-1">Leave blank for unlimited</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-500 uppercase">Expires In (Days)</label>
                            <NeuInput
                                type="number"
                                value={newExpiresInDays}
                                onChange={(e) => setNewExpiresInDays(e.target.value)}
                                placeholder="Never"
                            />
                            <p className="text-xs text-gray-600 mt-1">Leave blank for no expiry</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-500 uppercase">Internal Note</label>
                            <NeuInput
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="e.g. For Beta testers"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <NeuButton onClick={() => setShowCreateForm(false)}>Cancel</NeuButton>
                        <NeuButton variant="primary" onClick={handleCreate} disabled={creating}>
                            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Generate Code
                        </NeuButton>
                    </div>
                </NeuCard>
            )}

            {/* Codes List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-gray-500" />
                </div>
            ) : codes.length === 0 ? (
                <NeuCard className="p-12 text-center">
                    <Ticket size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className={styles.textSub}>No invite codes yet. Create your first one!</p>
                </NeuCard>
            ) : (
                <div className="space-y-3">
                    {codes.map((code) => (
                        <NeuCard
                            key={code.id}
                            className={`p-4 flex items-center justify-between gap-4 ${!code.is_active ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`p-3 rounded-lg ${code.is_active ? 'bg-brand/10 text-brand' : 'bg-gray-800 text-gray-500'}`}>
                                    <Ticket size={20} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <code className={`text-lg font-mono font-bold ${styles.textMain}`}>{code.code}</code>
                                        <button
                                            onClick={() => copyToClipboard(code.code, code.id)}
                                            className="p-1 rounded hover:bg-gray-700 transition-colors"
                                        >
                                            {copiedId === code.id ? (
                                                <Check size={14} className="text-green-400" />
                                            ) : (
                                                <Copy size={14} className="text-gray-500" />
                                            )}
                                        </button>
                                        {!code.is_active && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                                                Deactivated
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Hash size={12} />
                                            {code.current_uses}/{code.max_uses || '∞'} uses
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {code.expires_at ? formatDate(code.expires_at) : 'Never expires'}
                                        </span>
                                        {code.note && (
                                            <span className="truncate max-w-[200px]" title={code.note}>
                                                📝 {code.note}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {code.is_active && (
                                <NeuButton
                                    onClick={() => handleDeactivate(code.id)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <XCircle size={16} /> Revoke
                                </NeuButton>
                            )}
                        </NeuCard>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InvitesTab;
