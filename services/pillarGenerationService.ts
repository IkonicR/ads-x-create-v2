/**
 * Pillar Generation Service
 * 
 * Handles the core logic for generating content from pillars:
 * - Subject rotation
 * - Content memory (topic history)
 * - Caption/image generation
 */

import { ContentPillar, PillarDraft, Business, BusinessImage } from '../types';
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

// ============================================================================
// SUBJECT RESOLUTION
// ============================================================================

interface ResolvedSubject {
    type: 'offering' | 'team' | 'location' | 'custom';
    id?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    price?: string | number;  // Offerings store price as string
    currency?: string;
}

/**
 * Resolve the subject for a pillar based on its mode
 */
export function resolveSubject(
    pillar: ContentPillar,
    business: Business
): ResolvedSubject | null {
    switch (pillar.subjectMode) {
        case 'static':
            // Use the specific static subject
            if (pillar.staticSubjectId && business.offerings) {
                const offering = business.offerings.find(o => o.id === pillar.staticSubjectId);
                if (offering) {
                    return {
                        type: 'offering',
                        id: offering.id,
                        name: offering.name,
                        description: offering.description,
                        imageUrl: offering.imageUrl,
                        price: offering.price,
                        currency: business.currency,
                    };
                }
            }
            return null;

        case 'rotate_offerings':
            if (!business.offerings?.length) return null;
            const offeringIndex = (pillar.lastRotatedIndex || 0) % business.offerings.length;
            const offering = business.offerings[offeringIndex];
            return {
                type: 'offering',
                id: offering.id,
                name: offering.name,
                description: offering.description,
                imageUrl: offering.imageUrl,
                price: offering.price,
                currency: business.currency,
            };

        case 'rotate_team':
            if (!business.teamMembers?.length) return null;
            const teamIndex = (pillar.lastRotatedIndex || 0) % business.teamMembers.length;
            const member = business.teamMembers[teamIndex];
            return {
                type: 'team',
                id: member.id,
                name: member.name,
                description: member.role,
                imageUrl: member.imageUrl,
            };

        case 'rotate_locations':
            // Note: Business uses businessImages for location photos
            // For true multi-location support, we'd need a locations array
            // For now, fall through to custom
            return {
                type: 'custom',
                name: pillar.theme,
            };

        default:
            // Custom/open-ended pillar (no specific subject)
            return {
                type: 'custom',
                name: pillar.theme,
            };
    }
}

/**
 * Advance the rotation index for a pillar
 */
export function getNextRotationIndex(pillar: ContentPillar, business: Business): number {
    const currentIndex = pillar.lastRotatedIndex || 0;
    let maxItems = 1;

    switch (pillar.subjectMode) {
        case 'rotate_offerings':
            maxItems = business.offerings?.length || 1;
            break;
        case 'rotate_team':
            maxItems = business.teamMembers?.length || 1;
            break;
        case 'rotate_locations':
            // Future: Add dedicated locations array
            maxItems = 1;
            break;
    }

    return (currentIndex + 1) % maxItems;
}

// ============================================================================
// CONTENT MEMORY
// ============================================================================

/**
 * Build the topic history context for the AI prompt
 */
export function buildTopicHistoryContext(pillar: ContentPillar): string {
    if (!pillar.topicHistory?.length) {
        return '';
    }

    const recentTopics = pillar.topicHistory.slice(-20); // Last 20 topics
    const topicList = recentTopics
        .map(t => `- ${t.date}: ${t.summary}`)
        .join('\n');

    return `
## CONTENT MEMORY (Do NOT Repeat These Topics)
The following topics have already been covered. Generate something NEW and DIFFERENT:
${topicList}
`;
}

// ============================================================================
// CAPTION GENERATION
// ============================================================================

/**
 * Generate a caption for a pillar draft
 */
export async function generatePillarCaption(
    pillar: ContentPillar,
    subject: ResolvedSubject | null,
    business: Business,
    platform: string
): Promise<{ caption: string; topicSummary: string }> {
    const topicHistoryContext = buildTopicHistoryContext(pillar);

    const systemPrompt = `You are a social media content creator for ${business.name}.
Your task is to create engaging ${platform} content for their "${pillar.name}" content pillar.

BRAND VOICE: ${business.voice?.tone || 'professional'}, ${business.voice?.archetype || 'Hero'}

${pillar.instructions ? `PILLAR INSTRUCTIONS: ${pillar.instructions}` : ''}

${topicHistoryContext}

PLATFORM GUIDELINES:
- Instagram: 1-3 sentences, use emojis, include hashtags
- Facebook: 2-4 sentences, conversational, can be longer
- LinkedIn: Professional, insightful, thought leadership
- Twitter/X: Under 280 characters, punchy

Respond in JSON format:
{
  "caption": "The full caption text",
  "topicSummary": "A 3-5 word summary of this post's topic for memory tracking"
}`;

    let userPrompt = `Generate a ${platform} post for the "${pillar.name}" pillar (theme: ${pillar.theme}).`;

    if (subject && subject.type !== 'custom') {
        userPrompt += `\n\nFeaturing: ${subject.name}`;
        if (subject.description) userPrompt += `\nDescription: ${subject.description}`;
        if (subject.price && subject.currency) {
            userPrompt += `\nPrice: ${subject.currency} ${subject.price}`;
        }
    }

    try {
        const response = await generateText({
            model: gateway('google/gemini-2.5-flash'),
            system: systemPrompt,
            prompt: userPrompt,
        });

        // Parse JSON response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                caption: parsed.caption || '',
                topicSummary: parsed.topicSummary || pillar.theme,
            };
        }

        return { caption: response.text, topicSummary: pillar.theme };
    } catch (error) {
        console.error('[pillarGenerationService] Caption generation failed:', error);
        throw error;
    }
}

// ============================================================================
// SCHEDULING HELPERS
// ============================================================================

/**
 * Get pillars that should be generated for a specific date
 */
export function isPillarDueOnDate(pillar: ContentPillar, date: Date): boolean {
    if (!pillar.isActive) return false;

    const dayOfWeek = date.getDay(); // 0 = Sunday
    const dayOfMonth = date.getDate();

    if (pillar.scheduleType === 'weekly') {
        return pillar.dayOfWeek === dayOfWeek;
    } else if (pillar.scheduleType === 'monthly') {
        return pillar.dayOfMonth === dayOfMonth;
    }

    return false;
}

/**
 * Build the scheduled datetime from date + preferred time + timezone
 */
export function buildScheduledDatetime(
    date: Date,
    preferredTime: string | undefined,
    timezone: string | undefined
): string {
    const time = preferredTime || '09:00'; // Default 9 AM
    const [hours, minutes] = time.split(':').map(Number);

    const scheduled = new Date(date);
    scheduled.setHours(hours, minutes, 0, 0);

    return scheduled.toISOString();
}

/**
 * Get dates for the upcoming period based on approval cadence
 */
export function getUpcomingDates(
    cadence: 'weekly' | 'biweekly' | 'monthly',
    startDate: Date
): Date[] {
    const dates: Date[] = [];
    let days = 7; // Default weekly

    if (cadence === 'biweekly') days = 14;
    if (cadence === 'monthly') days = 28; // Approximate

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
    }

    return dates;
}
