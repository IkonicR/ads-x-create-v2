import React, { useState } from 'react';
import { NeuCard, NeuButton, useThemeStyles } from '../../components/NeuComponents';
import { Mail, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface EmailsTabProps {
    styles: ReturnType<typeof useThemeStyles>['styles'];
}

export const EmailsTab: React.FC<EmailsTabProps> = ({ styles }) => {
    const { session } = useAuth();
    const { toast } = useNotification();
    const [sending, setSending] = useState<string | null>(null);

    const handleSendTest = async (type: 'invite' | 'share') => {
        if (!session?.access_token) {
            toast({ type: 'error', title: 'Not Authenticated', message: 'Please log in again.' });
            return;
        }

        setSending(type);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
            const res = await fetch(`${baseUrl}/api/admin/test-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ type })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to send');
            }

            toast({
                type: 'success',
                title: 'Test Email Sent',
                message: `Check your inbox for the ${type} email template.`
            });
        } catch (error: any) {
            console.error(error);
            toast({
                type: 'error',
                title: 'Failed to Send',
                message: error.message || 'Could not send test email.'
            });
        } finally {
            setSending(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Invite Email Card */}
                <NeuCard className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-brand/10 rounded-xl text-brand">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Team Invitation</h3>
                            <p className={styles.textSub}>Standard invite template for new members</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-black/5 dark:border-white/5 text-sm space-y-2">
                        <p><strong>Subject:</strong> You're Invited! 🎉</p>
                        <p><strong>Trigger:</strong> Admin adds user to team</p>
                    </div>

                    <div className="mt-auto pt-2">
                        <NeuButton
                            className="w-full"
                            onClick={() => handleSendTest('invite')}
                            disabled={!!sending}
                        >
                            {sending === 'invite' ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                            Send Test to Me
                        </NeuButton>
                    </div>
                </NeuCard>

                {/* Asset Share Card */}
                <NeuCard className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-brand/10 rounded-xl text-brand">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Asset Share</h3>
                            <p className={styles.textSub}>Print-ready asset download link</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-black/20 border border-black/5 dark:border-white/5 text-sm space-y-2">
                        <p><strong>Subject:</strong> Print-Ready Asset from [Business]</p>
                        <p><strong>Trigger:</strong> User shares asset via email</p>
                    </div>

                    <div className="mt-auto pt-2">
                        <NeuButton
                            className="w-full"
                            onClick={() => handleSendTest('share')}
                            disabled={!!sending}
                        >
                            {sending === 'share' ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                            Send Test to Me
                        </NeuButton>
                    </div>
                </NeuCard>

            </div>
        </div>
    );
};
