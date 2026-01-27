/**
 * PillarBuilder - Split-screen container for chat-driven pillar creation
 * 
 * Layout:
 * - Desktop: Chat (left) | Preview (right)
 * - Mobile: Full-screen chat with preview accessible via toggle
 */

import React, { useState, useCallback } from 'react';
// import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentPillar, Business, SocialAccount } from '../types';
import { PillarBuilderChat } from './PillarBuilderChat';
import { PillarBuilderPreview } from './PillarBuilderPreview';
import { useThemeStyles, NeuIconButton } from './NeuComponents';
import { X, Eye, MessageSquare } from 'lucide-react';

interface PillarBuilderProps {
    isOpen: boolean;
    business: Business;
    connectedAccounts: SocialAccount[];
    existingPillar?: ContentPillar | null; // For editing
    onClose: () => void;
    onSave: (pillar: Omit<ContentPillar, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

// Partial pillar state during building
export interface PillarDraft {
    name?: string;
    theme?: string;
    scheduleType?: 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    subjectMode?: string;
    platforms?: string[];
    instructions?: string;
    generateImage?: boolean;
    styleId?: string;
    showBusinessName?: boolean;
    showContactInfo?: boolean;
    sloganProminence?: 'hidden' | 'subtle' | 'standard' | 'prominent';
}

export const PillarBuilder: React.FC<PillarBuilderProps> = ({
    isOpen,
    business,
    connectedAccounts,
    existingPillar,
    onClose,
    onSave,
}) => {
    const { styles: themeStyles, theme } = useThemeStyles();
    const availableStyles: any[] = []; // TODO: Fetch styles from database
    const isDark = theme === 'dark';

    // The pillar being built
    const [draft, setDraft] = useState<PillarDraft>({});

    // Mobile: toggle between chat and preview
    const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat');

    // Saving state
    const [isSaving, setIsSaving] = useState(false);

    // Update draft from chat
    const handleDraftUpdate = useCallback((updates: Partial<PillarDraft>) => {
        setDraft(prev => ({ ...prev, ...updates }));
    }, []);

    // Handle save
    const handleSave = async () => {
        if (!draft.name) return;

        setIsSaving(true);
        try {
            await onSave({
                businessId: business.id,
                name: draft.name,
                theme: (draft.theme as any) || 'custom',
                scheduleType: draft.scheduleType || 'weekly',
                dayOfWeek: draft.dayOfWeek,
                dayOfMonth: draft.dayOfMonth,
                subjectMode: (draft.subjectMode as any) || 'static',
                staticSubjectId: draft.staticSubjectId,
                stylePresetId: draft.stylePresetId,
                promptTemplate: draft.instructions,
                generateImage: draft.generateImage ?? true,
                platforms: draft.platforms || [],
                isActive: true,
            });
            onClose();
        } catch (err) {
            console.error('[PillarBuilder] Save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Check if draft is complete enough to save
    const canSave = !!draft.name && !!draft.dayOfWeek !== undefined;

    if (!isOpen) return null;

    return (
        <div
            className={`w-full h-[calc(100vh-140px)] flex rounded-2xl overflow-hidden border relative ${isDark ? 'bg-neu-dark border-white/5' : 'bg-neu-light border-black/5'
                } ${themeStyles.shadowOut}`}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className={`absolute top-4 right-4 z-20 p-2 rounded-xl transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'
                    }`}
            >
                <X size={20} />
            </button>

            {/* Mobile View Toggle */}
            <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 p-1 rounded-xl bg-black/20 backdrop-blur-sm">
                <button
                    onClick={() => setMobileView('chat')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${mobileView === 'chat' ? 'bg-brand text-white' : 'text-white/70 hover:text-white'
                        }`}
                >
                    <MessageSquare size={16} />
                    Chat
                </button>
                <button
                    onClick={() => setMobileView('preview')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${mobileView === 'preview' ? 'bg-brand text-white' : 'text-white/70 hover:text-white'
                        }`}
                >
                    <Eye size={16} />
                    Preview
                </button>
            </div>

            {/* Left: Chat */}
            <div className={`
                    flex-1 flex flex-col
                    md:border-r ${isDark ? 'md:border-white/10' : 'md:border-black/10'}
                    ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}
                `}>
                <PillarBuilderChat
                    business={business}
                    connectedAccounts={connectedAccounts}
                    availableStyles={availableStyles}
                    draft={draft}
                    onDraftUpdate={handleDraftUpdate}
                    existingPillar={existingPillar}
                />
            </div>

            {/* Right: Preview */}
            <div className={`
                    w-full md:w-[400px] lg:w-[450px] flex flex-col bg-opacity-50
                    ${mobileView === 'preview' ? 'flex' : 'hidden md:flex'}
                `}>
                <PillarBuilderPreview
                    draft={draft}
                    canSave={canSave}
                    isSaving={isSaving}
                    onSave={handleSave}
                    onEdit={(field) => {
                        setMobileView('chat');
                    }}
                />
            </div>
        </div>
    );
};

export default PillarBuilder;
