/**
 * Pillar Service - CRUD operations for Content Pillars
 * 
 * Handles all database operations for pillars and drafts.
 */

import { supabase } from './supabase';
import { ContentPillar, PillarDraft, PillarTheme, PillarScheduleType, PillarSubjectMode } from '../types';

// ============================================================================
// DB -> TypeScript Mappers
// ============================================================================

function mapPillarFromDB(row: any): ContentPillar {
    return {
        id: row.id,
        businessId: row.business_id,
        name: row.name,
        theme: row.theme as PillarTheme,
        scheduleType: row.schedule_type as PillarScheduleType,
        dayOfWeek: row.day_of_week,
        dayOfMonth: row.day_of_month,
        subjectMode: row.subject_mode as PillarSubjectMode,
        staticSubjectId: row.static_subject_id,
        lastRotatedIndex: row.last_rotated_index,
        stylePresetId: row.style_preset_id,
        promptTemplate: row.prompt_template,
        generateImage: row.generate_image ?? true,
        platforms: row.platforms || [],
        // V2 fields
        instructions: row.instructions,
        platformOutputs: row.platform_outputs,
        styleRotation: row.style_rotation,
        isActive: row.is_active ?? true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

function mapPillarToDB(pillar: Partial<ContentPillar>): Record<string, any> {
    const dbRecord: Record<string, any> = {};

    if (pillar.businessId !== undefined) dbRecord.business_id = pillar.businessId;
    if (pillar.name !== undefined) dbRecord.name = pillar.name;
    if (pillar.theme !== undefined) dbRecord.theme = pillar.theme;
    if (pillar.scheduleType !== undefined) dbRecord.schedule_type = pillar.scheduleType;
    if (pillar.dayOfWeek !== undefined) dbRecord.day_of_week = pillar.dayOfWeek;
    if (pillar.dayOfMonth !== undefined) dbRecord.day_of_month = pillar.dayOfMonth;
    if (pillar.subjectMode !== undefined) dbRecord.subject_mode = pillar.subjectMode;
    if (pillar.staticSubjectId !== undefined) dbRecord.static_subject_id = pillar.staticSubjectId;
    if (pillar.lastRotatedIndex !== undefined) dbRecord.last_rotated_index = pillar.lastRotatedIndex;
    if (pillar.stylePresetId !== undefined) dbRecord.style_preset_id = pillar.stylePresetId;
    if (pillar.promptTemplate !== undefined) dbRecord.prompt_template = pillar.promptTemplate;
    if (pillar.generateImage !== undefined) dbRecord.generate_image = pillar.generateImage;
    if (pillar.platforms !== undefined) dbRecord.platforms = pillar.platforms;
    // V2 fields
    if (pillar.instructions !== undefined) dbRecord.instructions = pillar.instructions;
    if (pillar.platformOutputs !== undefined) dbRecord.platform_outputs = pillar.platformOutputs;
    if (pillar.styleRotation !== undefined) dbRecord.style_rotation = pillar.styleRotation;
    if (pillar.isActive !== undefined) dbRecord.is_active = pillar.isActive;

    return dbRecord;
}

function mapDraftFromDB(row: any): PillarDraft {
    return {
        id: row.id,
        pillarId: row.pillar_id,
        businessId: row.business_id,
        caption: row.caption || '',
        imageAssetId: row.image_asset_id,
        imageUrl: row.image_url,
        scheduledFor: row.scheduled_for,
        platforms: row.platforms || [],
        status: row.status,
        approvedAt: row.approved_at,
        postedAt: row.posted_at,
        subjectType: row.subject_type,
        subjectId: row.subject_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ============================================================================
// PILLAR CRUD
// ============================================================================

export const PillarService = {
    /**
     * Get all pillars for a business
     */
    async getPillars(businessId: string): Promise<ContentPillar[]> {
        const { data, error } = await supabase
            .from('content_pillars')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[PillarService] Error fetching pillars:', error);
            throw error;
        }

        return (data || []).map(mapPillarFromDB);
    },

    /**
     * Get a single pillar by ID
     */
    async getPillar(id: string): Promise<ContentPillar | null> {
        const { data, error } = await supabase
            .from('content_pillars')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('[PillarService] Error fetching pillar:', error);
            throw error;
        }

        return data ? mapPillarFromDB(data) : null;
    },

    /**
     * Create a new pillar
     */
    async createPillar(pillar: Omit<ContentPillar, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentPillar> {
        const dbRecord = mapPillarToDB(pillar);

        const { data, error } = await supabase
            .from('content_pillars')
            .insert(dbRecord)
            .select()
            .single();

        if (error) {
            console.error('[PillarService] Error creating pillar:', error);
            throw error;
        }

        return mapPillarFromDB(data);
    },

    /**
     * Update an existing pillar
     */
    async updatePillar(id: string, updates: Partial<ContentPillar>): Promise<ContentPillar> {
        const dbRecord = mapPillarToDB(updates);
        dbRecord.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('content_pillars')
            .update(dbRecord)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PillarService] Error updating pillar:', error);
            throw error;
        }

        return mapPillarFromDB(data);
    },

    /**
     * Delete a pillar (cascades to drafts)
     */
    async deletePillar(id: string): Promise<void> {
        const { error } = await supabase
            .from('content_pillars')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[PillarService] Error deleting pillar:', error);
            throw error;
        }
    },

    /**
     * Toggle pillar active state
     */
    async togglePillarActive(id: string, isActive: boolean): Promise<ContentPillar> {
        return this.updatePillar(id, { isActive });
    },

    // =========================================================================
    // DRAFTS
    // =========================================================================

    /**
     * Get drafts for a business, optionally filtered by status
     */
    async getDrafts(businessId: string, status?: PillarDraft['status']): Promise<PillarDraft[]> {
        let query = supabase
            .from('pillar_drafts')
            .select('*')
            .eq('business_id', businessId)
            .order('scheduled_for', { ascending: true });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[PillarService] Error fetching drafts:', error);
            throw error;
        }

        return (data || []).map(mapDraftFromDB);
    },

    /**
     * Get pending drafts count (for badges/notifications)
     */
    async getPendingDraftsCount(businessId: string): Promise<number> {
        const { count, error } = await supabase
            .from('pillar_drafts')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('status', 'pending');

        if (error) {
            console.error('[PillarService] Error counting drafts:', error);
            return 0;
        }

        return count || 0;
    },

    /**
     * Update draft status
     */
    async updateDraftStatus(id: string, status: PillarDraft['status']): Promise<PillarDraft> {
        const updates: Record<string, any> = {
            status,
            updated_at: new Date().toISOString(),
        };

        if (status === 'approved') {
            updates.approved_at = new Date().toISOString();
        } else if (status === 'posted') {
            updates.posted_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('pillar_drafts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PillarService] Error updating draft:', error);
            throw error;
        }

        return mapDraftFromDB(data);
    },

    /**
     * Update draft caption
     */
    async updateDraftCaption(id: string, caption: string): Promise<PillarDraft> {
        const { data, error } = await supabase
            .from('pillar_drafts')
            .update({ caption, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PillarService] Error updating draft caption:', error);
            throw error;
        }

        return mapDraftFromDB(data);
    },

    /**
     * Delete a draft
     */
    async deleteDraft(id: string): Promise<void> {
        const { error } = await supabase
            .from('pillar_drafts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[PillarService] Error deleting draft:', error);
            throw error;
        }
    },
};
