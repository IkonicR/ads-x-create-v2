/**
 * Planner - Social Media Command Center
 * 
 * A world-class social media calendar with:
 * - Month / Week / Day views
 * - Thumbnails in all views
 * - Platform and status filters
 * - Quick actions (edit, delete)
 * - Drag-to-reschedule (future)
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Business, SocialPost } from '../types';
import { useSocial } from '../context/SocialContext';
import { useThemeStyles } from '../components/NeuComponents';
import { GalaxyHeading } from '../components/GalaxyHeading';
import { CalendarView } from '../components/calendar';
import { PostDetailModal } from '../components/PostDetailModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface PlannerProps {
    business: Business;
}

const Planner: React.FC<PlannerProps> = ({ business }) => {
    const { styles } = useThemeStyles();
    const navigate = useNavigate();

    // Use the SocialContext for instant loading
    const {
        posts,
        accounts,
        loading,
        syncing,
        error,
        lastSyncTime,
        loadPosts,
        syncWithGHL,
        deletePostFromGHL,
    } = useSocial();

    // Extract connected platform types from accounts
    const connectedPlatforms = accounts.map(acc => acc.platform?.toLowerCase() || '').filter(Boolean);

    // Load posts when business changes (instant from localStorage cache)
    useEffect(() => {
        if (business?.id) {
            loadPosts(business.id, true);
        }
    }, [business?.id, loadPosts]);

    // State for post detail modal
    const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

    // State for delete confirmation modal
    const [postToDelete, setPostToDelete] = useState<SocialPost | null>(null);

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
        // Show custom confirmation modal instead of window.confirm
        setPostToDelete(post);
    };

    const confirmDelete = async () => {
        if (!postToDelete) return;

        const locationId = business.socialConfig?.ghlLocationId;
        if (locationId) {
            await deletePostFromGHL(postToDelete.id, locationId, postToDelete.ghlPostId);
        }
        setPostToDelete(null);
    };

    const handleDateClick = (date: Date) => {
        // TODO: Open new post scheduler for this date
        console.log('Date clicked:', date);
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="mb-6 px-4">
                <GalaxyHeading
                    text="Social Command Center"
                    className="text-4xl md:text-5xl font-extrabold tracking-tight pb-2"
                />
                <p className={styles.textSub}>
                    {business.name}'s Strategic War Room • {posts.length} posts
                    {lastSyncTime && (
                        <span className="ml-2 text-xs opacity-50">
                            Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                        </span>
                    )}
                </p>
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

            {/* Loading State - Only show if no cached data */}
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

                    // Refresh posts after save
                    loadPosts(business.id, false);
                }}
                onDelete={async (postId) => {
                    const locationId = business.socialConfig?.ghlLocationId;
                    if (locationId && selectedPost) {
                        await deletePostFromGHL(postId, locationId, selectedPost.ghlPostId);
                    }
                }}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!postToDelete}
                title="Delete Post?"
                message="This will remove the post from all scheduled platforms. This action cannot be undone."
                confirmText="Delete"
                cancelText="Keep Post"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setPostToDelete(null)}
            />
        </div>
    );
};

export default Planner;
