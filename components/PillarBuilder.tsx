/**
 * PillarBuilder - Split-screen container for chat-driven pillar creation
 * 
 * Layout:
 * - Desktop: Chat (left) | Preview (right)
 * - Mobile: Full-screen chat with preview accessible via toggle
 */

import React, { useState, useCallback, useEffect } from 'react';
// import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentPillar, Business, SocialAccount } from '../types';
import { PillarBuilderChat } from './PillarBuilderChat';
import { PillarBuilderPreview } from './PillarBuilderPreview';
import { useThemeStyles, NeuIconButton, NeuCloseButton, NeuButton } from './NeuComponents';
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
    contactProminence?: 'prominent' | 'subtle' | 'none';
    sloganProminence?: 'hidden' | 'subtle' | 'standard' | 'prominent';
    // Visual & Content Settings (Phase 2H)
    aspectRatio?: '1:1' | '9:16' | '16:9' | '4:5' | '2:3' | '3:2' | '3:4' | '4:3' | '5:4' | '21:9';
    captionMode?: 'same' | 'tailored';
    hashtagMode?: 'inherit' | 'ai_only' | 'brand_only' | 'ai_plus_brand';
    logoVariant?: 'main' | 'wordmark' | 'dark' | 'light';
    offeringRotationFrequency?: 'never' | 'every_post' | 'every_2nd' | 'every_3rd' | 'every_4th' | 'occasionally';
    preferredTime?: string; // e.g., "12:00" for midday
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

    // ============================================================================
    // SESSION PERSISTENCE (localStorage)
    // ============================================================================
    const STORAGE_KEY_DRAFT = `pillar_draft_${business.id}`;
    const STORAGE_KEY_CHAT = `pillar_chat_${business.id}`;
    const STORAGE_KEY_SESSION = `pillar_session_${business.id}`;
    const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

    // Helper to clear session
    const clearPillarSession = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY_DRAFT);
        localStorage.removeItem(STORAGE_KEY_CHAT);
        localStorage.removeItem(STORAGE_KEY_SESSION);
    }, [STORAGE_KEY_DRAFT, STORAGE_KEY_CHAT, STORAGE_KEY_SESSION]);

    // Initialize draft from localStorage (if resumable)
    const [draft, setDraft] = useState<PillarDraft>(() => {
        // Skip if editing existing pillar
        if (existingPillar) return {};
        
        try {
            const storedSession = localStorage.getItem(STORAGE_KEY_SESSION);
            if (storedSession) {
                const age = Date.now() - parseInt(storedSession);
                if (age < SESSION_MAX_AGE_MS) {
                    const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
                    if (savedDraft) {
                        return JSON.parse(savedDraft);
                    }
                } else {
                    // Stale - clear in next tick to avoid state issues
                    setTimeout(() => {
                        localStorage.removeItem(STORAGE_KEY_DRAFT);
                        localStorage.removeItem(STORAGE_KEY_CHAT);
                        localStorage.removeItem(STORAGE_KEY_SESSION);
                    }, 0);
                }
            }
        } catch { /* ignore */ }
        return {};
    });

    // Resume prompt state
    const [showResumePrompt, setShowResumePrompt] = useState(() => {
        if (existingPillar) return false;
        try {
            const storedSession = localStorage.getItem(STORAGE_KEY_SESSION);
            if (storedSession) {
                const age = Date.now() - parseInt(storedSession);
                const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
                return age < SESSION_MAX_AGE_MS && !!savedDraft;
            }
        } catch { /* ignore */ }
        return false;
    });

    // Auto-save draft to localStorage on change
    useEffect(() => {
        if (existingPillar) return; // Don't save when editing existing
        if (Object.keys(draft).length > 0) {
            localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(draft));
            localStorage.setItem(STORAGE_KEY_SESSION, Date.now().toString());
        }
    }, [draft, existingPillar, STORAGE_KEY_DRAFT, STORAGE_KEY_SESSION]);

    // Mobile: toggle between chat and preview
    const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat');

    // Saving state
    const [isSaving, setIsSaving] = useState(false);

    // Update draft from chat
    const handleDraftUpdate = useCallback((updates: Partial<PillarDraft>) => {
        setDraft(prev => ({ ...prev, ...updates }));
    }, []);

    // Handle start fresh
    const handleStartFresh = useCallback(() => {
        clearPillarSession();
        setDraft({});
        setShowResumePrompt(false);
    }, [clearPillarSession]);

    // Handle save
    const handleSave = async () => {
        if (!draft.name) return;

        // Validate subjectMode against allowed values (defensive check)
        const VALID_SUBJECT_MODES = ['static', 'rotate_offerings', 'rotate_team', 'rotate_locations'];
        const normalizedSubjectMode = VALID_SUBJECT_MODES.includes(draft.subjectMode || '')
            ? draft.subjectMode
            : 'static';

        setIsSaving(true);
        try {
            await onSave({
                businessId: business.id,
                name: draft.name,
                theme: (draft.theme as any) || 'custom',
                scheduleType: draft.scheduleType || 'weekly',
                dayOfWeek: draft.dayOfWeek,
                dayOfMonth: draft.dayOfMonth,
                subjectMode: normalizedSubjectMode as any,
                staticSubjectId: draft.staticSubjectId,
                stylePresetId: draft.stylePresetId,
                promptTemplate: draft.instructions,
                generateImage: draft.generateImage ?? true,
                platforms: draft.platforms || [],
                isActive: true,
            });
            // Clear localStorage on successful save
            clearPillarSession();
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
            <NeuCloseButton
                onClick={onClose}
                className="absolute top-4 right-4 z-20"
            />

            {/* Resume Draft Prompt */}
            <AnimatePresence>
                {showResumePrompt && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute top-4 left-4 right-16 z-30 p-3 rounded-xl ${themeStyles.shadowOut} ${isDark ? 'bg-brand/20 border border-brand/30' : 'bg-brand/10 border border-brand/20'} flex items-center justify-between gap-4 backdrop-blur-sm`}
                    >
                        <span className={`text-sm font-medium ${themeStyles.textMain}`}>
                            You have an unsaved draft
                        </span>
                        <div className="flex gap-2">
                            <NeuButton size="sm" onClick={handleStartFresh}>
                                Start Fresh
                            </NeuButton>
                            <NeuButton size="sm" variant="primary" onClick={() => setShowResumePrompt(false)}>
                                Continue
                            </NeuButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    business={business}
                    canSave={canSave}
                    isSaving={isSaving}
                    onSave={handleSave}
                    onEdit={(field) => {
                        setMobileView('chat');
                    }}
                    onFieldChange={(field, value) => {
                        setDraft(prev => ({ ...prev, [field]: value }));
                    }}
                />
            </div>
        </div>
    );
};

export default PillarBuilder;
