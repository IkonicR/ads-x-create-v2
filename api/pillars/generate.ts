/**
 * Pillar Generation Cron Endpoint
 * 
 * GET/POST /api/pillars/generate
 * 
 * Generates content drafts for all active pillars based on their schedule.
 * Runs based on business approval_cadence (weekly/biweekly/monthly).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
    resolveSubject,
    getNextRotationIndex,
    generatePillarCaption,
    isPillarDueOnDate,
    buildScheduledDatetime,
    getUpcomingDates
} from '../../services/pillarGenerationService';
import type { ContentPillar, Business } from '../../types';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

interface PillarSettings {
    approval_cadence: 'weekly' | 'biweekly' | 'monthly';
    generation_lead_days: number;
    default_posting_time: string;
    timezone: string;
    auto_approve: boolean;
}

interface GenerationResult {
    businessId: string;
    businessName: string;
    draftsCreated: number;
    errors: string[];
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Security check
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[pillar-generate] Starting cron job...');

    try {
        const today = new Date();
        const results: GenerationResult[] = [];

        // 1. Get all businesses with pillar_settings
        const { data: businesses, error: bizError } = await supabase
            .from('businesses')
            .select('id, name, pillar_settings, offerings, team_members, locations, voice, currency');

        if (bizError) throw bizError;
        if (!businesses?.length) {
            return res.status(200).json({ message: 'No businesses found', results: [] });
        }

        // 2. Process each business
        for (const business of businesses) {
            const result: GenerationResult = {
                businessId: business.id,
                businessName: business.name,
                draftsCreated: 0,
                errors: [],
            };

            try {
                const settings: PillarSettings = business.pillar_settings || {
                    approval_cadence: 'weekly',
                    generation_lead_days: 7,
                    default_posting_time: '09:00',
                    timezone: 'UTC',
                    auto_approve: false,
                };

                // Check if today is a generation day for this business
                if (!isGenerationDay(today, settings.approval_cadence)) {
                    console.log(`[pillar-generate] Skipping ${business.name} - not generation day`);
                    continue;
                }

                // 3. Get active pillars for this business
                const { data: pillars, error: pillarError } = await supabase
                    .from('content_pillars')
                    .select('*')
                    .eq('business_id', business.id)
                    .eq('is_active', true);

                if (pillarError) throw pillarError;
                if (!pillars?.length) continue;

                // Create batch ID for this generation run
                const batchId = uuidv4();

                // Get upcoming dates based on cadence
                const upcomingDates = getUpcomingDates(settings.approval_cadence, today);

                // 4. For each pillar, generate drafts for each matching date
                for (const pillarRow of pillars) {
                    const pillar = mapPillarFromDB(pillarRow);

                    for (const targetDate of upcomingDates) {
                        if (!isPillarDueOnDate(pillar, targetDate)) continue;

                        // Check if draft already exists for this date
                        const dateStr = targetDate.toISOString().split('T')[0];
                        const { data: existing } = await supabase
                            .from('pillar_drafts')
                            .select('id')
                            .eq('pillar_id', pillar.id)
                            .eq('scheduled_for', dateStr)
                            .single();

                        if (existing) {
                            console.log(`[pillar-generate] Draft already exists for ${pillar.name} on ${dateStr}`);
                            continue;
                        }

                        try {
                            // Resolve subject (rotation or static)
                            const subject = resolveSubject(pillar, business as unknown as Business);

                            // Generate caption
                            const primaryPlatform = pillar.platforms?.[0] || 'instagram';
                            const { caption, topicSummary } = await generatePillarCaption(
                                pillar,
                                subject,
                                business as unknown as Business,
                                primaryPlatform
                            );

                            // Build scheduled datetime
                            const scheduledDatetime = buildScheduledDatetime(
                                targetDate,
                                pillar.preferredTime || settings.default_posting_time,
                                pillar.pillarTimezone || settings.timezone
                            );

                            // Insert draft
                            const { error: insertError } = await supabase
                                .from('pillar_drafts')
                                .insert({
                                    pillar_id: pillar.id,
                                    business_id: business.id,
                                    caption,
                                    scheduled_for: dateStr,
                                    scheduled_datetime: scheduledDatetime,
                                    platforms: pillar.platforms,
                                    status: settings.auto_approve ? 'approved' : 'pending',
                                    approval_batch_id: batchId,
                                    topic_summary: topicSummary,
                                    subject_type: subject?.type === 'custom' ? null : subject?.type,
                                    subject_id: subject?.id,
                                });

                            if (insertError) throw insertError;

                            result.draftsCreated++;
                            console.log(`[pillar-generate] Created draft for ${pillar.name} on ${dateStr}`);

                            // Update rotation index if rotating
                            if (pillar.subjectMode.startsWith('rotate_')) {
                                const nextIndex = getNextRotationIndex(pillar, business as unknown as Business);
                                await supabase
                                    .from('content_pillars')
                                    .update({ last_rotated_index: nextIndex })
                                    .eq('id', pillar.id);
                            }

                            // Update topic history for open-ended pillars
                            if (pillar.subjectMode === 'static' && !pillar.staticSubjectId) {
                                const newHistory = [...(pillar.topicHistory || []), { date: dateStr, summary: topicSummary }];
                                await supabase
                                    .from('content_pillars')
                                    .update({ topic_history: newHistory })
                                    .eq('id', pillar.id);
                            }

                        } catch (genError: any) {
                            result.errors.push(`${pillar.name} (${dateStr}): ${genError.message}`);
                            console.error(`[pillar-generate] Error generating for ${pillar.name}:`, genError);
                        }
                    }
                }

            } catch (bizProcessError: any) {
                result.errors.push(bizProcessError.message);
            }

            if (result.draftsCreated > 0 || result.errors.length > 0) {
                results.push(result);
            }
        }

        console.log(`[pillar-generate] Completed. Total businesses processed: ${results.length}`);
        return res.status(200).json({
            message: 'Generation completed',
            results,
            summary: {
                totalDrafts: results.reduce((sum, r) => sum + r.draftsCreated, 0),
                totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
            }
        });

    } catch (error: any) {
        console.error('[pillar-generate] Cron job failed:', error);
        return res.status(500).json({ error: error.message });
    }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if today is a generation day based on cadence
 */
function isGenerationDay(date: Date, cadence: 'weekly' | 'biweekly' | 'monthly'): boolean {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();

    switch (cadence) {
        case 'weekly':
            return dayOfWeek === 0; // Every Sunday
        case 'biweekly':
            // Every other Sunday (weeks 1, 3, 5... of month)
            const weekOfMonth = Math.ceil(dayOfMonth / 7);
            return dayOfWeek === 0 && weekOfMonth % 2 === 1;
        case 'monthly':
            return dayOfMonth === 1; // 1st of each month
        default:
            return false;
    }
}

/**
 * Map database row to ContentPillar type
 */
function mapPillarFromDB(row: any): ContentPillar {
    return {
        id: row.id,
        businessId: row.business_id,
        name: row.name,
        theme: row.theme,
        scheduleType: row.schedule_type,
        dayOfWeek: row.day_of_week,
        dayOfMonth: row.day_of_month,
        subjectMode: row.subject_mode,
        staticSubjectId: row.static_subject_id,
        lastRotatedIndex: row.last_rotated_index,
        stylePresetId: row.style_preset_id,
        promptTemplate: row.prompt_template,
        generateImage: row.generate_image ?? true,
        platforms: row.platforms || [],
        instructions: row.instructions,
        platformOutputs: row.platform_outputs,
        styleRotation: row.style_rotation,
        preferredTime: row.preferred_time,
        pillarTimezone: row.pillar_timezone,
        topicHistory: row.topic_history || [],
        optimalTimes: row.optimal_times,
        useOptimalTimes: row.use_optimal_times ?? false,
        isActive: row.is_active ?? true,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
