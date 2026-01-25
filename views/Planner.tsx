/**
 * Planner - Social Media Command Center
 * 
 * A world-class social media calendar with:
 * - Month / Week / Day views
 * - Thumbnails in all views
 * - Platform and status filters
 * - Quick actions (edit, delete)
 * - Drag-to-reschedule (future)
 * - Content Pillars tab for automated recurring content
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Business, SocialPost, ContentPillar } from '../types';
import { useSocial } from '../context/SocialContext';
import { usePillars } from '../context/PillarContext';
import { NeuTabs, NeuButton, useThemeStyles, NeuCard } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { CalendarView } from '../components/calendar';
import { PostDetailModal } from '../components/PostDetailModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { PillarCard } from '../components/PillarCard';
import { PillarBuilder } from '../components/PillarBuilder';
import { DropBanner, DropOverlay } from '../components/TheDrop';
import { Calendar, Layers, Plus, Sparkles } from 'lucide-react';

interface PlannerProps {
    business: Business;
}

const Planner: React.FC<PlannerProps> = ({ business }) => {
    const { styles } = useThemeStyles();
    const navigate = useNavigate();

    // Tab state
    const [activeTab, setActiveTab] = useState<'calendar' | 'pillars'>('calendar');

    // Use the SocialContext for instant loading
    const {
        posts,
        accounts,
        loading: postsLoading,
        syncing,
        error: postsError,
        lastSyncTime,
        loadPosts,
        syncWithGHL,
        deletePostFromGHL,
    } = useSocial();

    // Use the PillarContext
    const {
        pillars,
        pendingDraftsCount,
        loading: pillarsLoading,
        error: pillarsError,
        loadPillars,
        createPillar,
        updatePillar,
        deletePillar,
        togglePillarActive,
    } = usePillars();

    // Extract connected platform types from accounts
    const connectedPlatforms = accounts.map(acc => acc.platform?.toLowerCase() || '').filter(Boolean);

    // Load data when business changes OR when switching to pillars tab
    useEffect(() => {
        if (business?.id) {
            loadPosts(business.id, true);
        }
    }, [business?.id, loadPosts]);

    // Fetch pillars when tab switches to pillars OR business changes
    useEffect(() => {
        if (business?.id && activeTab === 'pillars') {
            loadPillars(business.id);
        }
    }, [business?.id, activeTab, loadPillars]);

    // State for post detail modal
    const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

    // State for delete confirmation modal
    const [postToDelete, setPostToDelete] = useState<SocialPost | null>(null);

    // State for pillar modals
    const [isPillarModalOpen, setIsPillarModalOpen] = useState(false);
    const [editingPillar, setEditingPillar] = useState<ContentPillar | null>(null);
    const [pillarToDelete, setPillarToDelete] = useState<string | null>(null);

    // State for The Drop (batch approval)
    const [reviewingBatch, setReviewingBatch] = useState<{
        batchId: string;
        startDate: string;
        endDate: string;
    } | null>(null);

    // Check connection status
    const isConnected = !!business.socialConfig?.ghlLocationId;

    // Handle sync button click
    const handleSync = async () => {
        if (business.socialConfig?.ghlLocationId) {
            await syncWithGHL(business.id, business.socialConfig.ghlLocationId);
        }
    };

    // Handle post actions
    const handlePostClick = (post: SocialPost) => {
        setSelectedPost(post);
    };

    const handlePostEdit = (post: SocialPost) => {
        setSelectedPost(post);
    };

    const handlePostDelete = (post: SocialPost) => {
        setPostToDelete(post);
    };

    const confirmDeletePost = async () => {
        if (!postToDelete) return;

        const locationId = business.socialConfig?.ghlLocationId;
        if (locationId) {
            await deletePostFromGHL(postToDelete.id, locationId, postToDelete.ghlPostId);
        }
        setPostToDelete(null);
    };

    const handleDateClick = (date: Date) => {
        console.log('Date clicked:', date);
    };

    // Pillar handlers
    const handleCreatePillar = () => {
        setEditingPillar(null);
        setIsPillarModalOpen(true);
    };

    const handleEditPillar = (pillar: ContentPillar) => {
        setEditingPillar(pillar);
        setIsPillarModalOpen(true);
    };

    const handleSavePillar = async (data: Omit<ContentPillar, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (editingPillar) {
            await updatePillar(editingPillar.id, data);
        } else {
            await createPillar(data);
        }
    };

    const handleDeletePillar = (id: string) => {
        setPillarToDelete(id);
    };

    const confirmDeletePillar = async () => {
        if (pillarToDelete) {
            await deletePillar(pillarToDelete);
            setPillarToDelete(null);
        }
    };

    // Determine loading/error state based on active tab
    const loading = activeTab === 'calendar' ? postsLoading : pillarsLoading;
    const error = activeTab === 'calendar' ? postsError : pillarsError;

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="mb-4 px-4">
                <GalaxyHeading
                    text="Command Center"
                    className="text-4xl md:text-5xl font-extrabold tracking-tight pb-2"
                />
                <p className={styles.textSub}>
                    {business.name}'s Strategic War Room
                    {activeTab === 'calendar' && ` • ${posts.length} posts`}
                    {activeTab === 'pillars' && ` • ${pillars.length} pillars`}
                    {lastSyncTime && activeTab === 'calendar' && (
                        <span className="ml-2 text-xs opacity-50">
                            Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                        </span>
                    )}
                </p>
            </div>

            {/* Tabs */}
            <div className="px-4 mb-6">
                <NeuTabs
                    activeTab={activeTab}
                    onChange={(tab) => setActiveTab(tab as 'calendar' | 'pillars')}
                    tabs={[
                        { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
                        {
                            id: 'pillars',
                            label: 'Pillars',
                            icon: <Layers size={16} />,
                            badge: pendingDraftsCount > 0 ? pendingDraftsCount : undefined,
                        },
                    ]}
                />
            </div>

            {/* Error Banner */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm"
                >
                    {error}
                </motion.div>
            )}

            {/* The Drop Banner */}
            <div className="px-4">
                <DropBanner
                    businessId={business.id}
                    onReviewClick={(batch) => setReviewingBatch(batch)}
                />
            </div>

            {/* Calendar Tab */}
            <AnimatePresence mode="wait">
                {activeTab === 'calendar' && (
                    <motion.div
                        key="calendar"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Loading State */}
                        {loading && posts.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`mx-4 p-16 rounded-2xl ${styles.bg} ${styles.shadowOut} flex flex-col items-center justify-center`}
                            >
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4" />
                                <p className={styles.textSub}>Loading your social calendar...</p>
                            </motion.div>
                        )}

                        {/* Calendar */}
                        {(!loading || posts.length > 0) && (
                            <div className="px-4">
                                <CalendarView
                                    posts={posts}
                                    onPostClick={handlePostClick}
                                    onPostEdit={handlePostEdit}
                                    onPostDelete={handlePostDelete}
                                    onDateClick={handleDateClick}
                                    onSync={handleSync}
                                    onSettingsClick={() => navigate('/social-settings')}
                                    isSyncing={syncing}
                                    isConnected={isConnected}
                                    lastSyncTime={lastSyncTime}
                                />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Pillars Tab */}
                {activeTab === 'pillars' && (
                    <motion.div
                        key="pillars"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="px-4"
                    >
                        {/* Loading State */}
                        {pillarsLoading && pillars.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`p-16 rounded-2xl ${styles.bg} ${styles.shadowOut} flex flex-col items-center justify-center`}
                            >
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mb-4" />
                                <p className={styles.textSub}>Loading your content pillars...</p>
                            </motion.div>
                        )}

                        {/* Empty State */}
                        {!pillarsLoading && pillars.length === 0 && (
                            <NeuCard className="p-12 text-center">
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${styles.bgAccent} flex items-center justify-center`}>
                                    <Sparkles size={32} className="text-brand" />
                                </div>
                                <h3 className={`text-xl font-bold ${styles.textMain} mb-2`}>
                                    No Content Pillars Yet
                                </h3>
                                <p className={`${styles.textSub} mb-6 max-w-md mx-auto`}>
                                    Content Pillars are recurring themes like "Motivation Monday" or "Product Friday".
                                    The AI will auto-draft content for your approval.
                                </p>
                                <NeuButton
                                    variant="primary"
                                    onClick={handleCreatePillar}
                                    className="mx-auto"
                                >
                                    <Plus size={18} className="mr-2" />
                                    Create Your First Pillar
                                </NeuButton>
                            </NeuCard>
                        )}

                        {/* Pillars Grid */}
                        {pillars.length > 0 && (
                            <div className="space-y-4">
                                {/* Header with Add Button */}
                                <div className="flex items-center justify-between">
                                    <h3 className={`font-bold ${styles.textMain}`}>
                                        Your Content Pillars
                                    </h3>
                                    <NeuButton
                                        variant="primary"
                                        onClick={handleCreatePillar}
                                        className="text-sm"
                                    >
                                        <Plus size={16} className="mr-1" />
                                        Add Pillar
                                    </NeuButton>
                                </div>

                                {/* Pillar Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pillars.map((pillar) => (
                                        <PillarCard
                                            key={pillar.id}
                                            pillar={pillar}
                                            onEdit={handleEditPillar}
                                            onToggleActive={togglePillarActive}
                                            onDelete={handleDeletePillar}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Post Detail Modal */}
            <PostDetailModal
                isOpen={!!selectedPost}
                post={selectedPost}
                connectedPlatforms={connectedPlatforms}
                onClose={() => setSelectedPost(null)}
                onSave={async (updatedPost) => {
                    const locationId = business.socialConfig?.ghlLocationId;
                    if (!locationId || !updatedPost.ghlPostId) {
                        throw new Error('Missing location or post data');
                    }

                    const response = await fetch('/api/social/post', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            locationId,
                            ghlPostId: updatedPost.ghlPostId,
                            localPostId: updatedPost.id,
                            caption: updatedPost.summary,
                            scheduledAt: updatedPost.scheduledAt,
                        }),
                    });

                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to save');
                    }

                    loadPosts(business.id, false);
                }}
                onDelete={async (postId) => {
                    const locationId = business.socialConfig?.ghlLocationId;
                    if (locationId && selectedPost) {
                        await deletePostFromGHL(postId, locationId, selectedPost.ghlPostId);
                    }
                }}
            />

            {/* Delete Post Confirmation Modal */}
            <ConfirmModal
                isOpen={!!postToDelete}
                title="Delete Post?"
                message="This will remove the post from all scheduled platforms. This action cannot be undone."
                confirmText="Delete"
                cancelText="Keep Post"
                variant="danger"
                onConfirm={confirmDeletePost}
                onCancel={() => setPostToDelete(null)}
            />

            {/* Pillar Builder (Split-screen chat) */}
            <PillarBuilder
                isOpen={isPillarModalOpen}
                business={business}
                connectedAccounts={accounts}
                existingPillar={editingPillar}
                onClose={() => {
                    setIsPillarModalOpen(false);
                    setEditingPillar(null);
                }}
                onSave={handleSavePillar}
            />

            {/* Delete Pillar Confirmation Modal */}
            <ConfirmModal
                isOpen={!!pillarToDelete}
                title="Delete Pillar?"
                message="This will remove the content pillar and all its pending drafts. This cannot be undone."
                confirmText="Delete"
                cancelText="Keep Pillar"
                variant="danger"
                onConfirm={confirmDeletePillar}
                onCancel={() => setPillarToDelete(null)}
            />

            {/* The Drop Overlay (Batch Review) */}
            <AnimatePresence>
                {reviewingBatch && (
                    <DropOverlay
                        batchId={reviewingBatch.batchId}
                        startDate={reviewingBatch.startDate}
                        endDate={reviewingBatch.endDate}
                        onClose={() => setReviewingBatch(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Planner;
