/**
 * AI Caption Generator API
 * Uses Gemini via Vercel AI Gateway
 * 
 * Usage: POST /api/social/generate-caption
 * Body: { assetPrompt: string, business: { name, industry, voice, targetAudience } }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';

// NOTE: Do not import from config/ai-models - causes Vercel bundler crash
// Model ID hardcoded: google/gemini-3-flash (stable production model)

interface CaptionRequest {
    assetPrompt: string;
    business: {
        name: string;
        industry?: string;
        voice?: {
            archetype?: string;
            tonePills?: string[];
            slogan?: string;
        };
        targetAudience?: string;
    };
    platform?: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'general';
    hashtagMode?: 'ai_only' | 'brand_only' | 'ai_plus_brand';
    brandHashtags?: string[];
}

// Build dynamic hashtag instructions based on mode
function buildHashtagInstruction(hashtagMode: string = 'ai_plus_brand', brandHashtags: string[] = []): string {
    const brandTagsFormatted = brandHashtags.length > 0
        ? brandHashtags.map(t => `#${t.replace(/^#/, '')}`).join(' ')
        : '';

    switch (hashtagMode) {
        case 'brand_only':
            if (!brandTagsFormatted) {
                return 'No brand hashtags provided. Add 3-5 relevant industry hashtags.';
            }
            return `Use ONLY these brand hashtags at the end: ${brandTagsFormatted}. Do NOT add any other hashtags.`;

        case 'ai_only':
            return 'Generate 3-5 relevant hashtags based on the content and industry. Do NOT use any provided brand hashtags.';

        case 'ai_plus_brand':
        default:
            if (brandTagsFormatted) {
                return `Always include these brand hashtags: ${brandTagsFormatted}. You may add 1-2 additional relevant hashtags.`;
            }
            return 'Generate 3-5 relevant hashtags based on the content and industry.';
    }
}

const CAPTION_SYSTEM_PROMPT = `You are an expert social media copywriter. Given context about a business and an image description, write an engaging social media caption.

RULES:
1. Keep it concise (2-4 sentences max for Instagram, 1-2 for Twitter)
2. Match the brand voice and tone
3. Include a clear call-to-action when appropriate
4. Follow the HASHTAG RULES provided in each request
5. Use emojis sparingly and tastefully (1-3 max)
6. Never be generic - make it specific to THIS business

PLATFORM NUANCES:
- Instagram: Storytelling, lifestyle, emojis welcome
- LinkedIn: Professional, value-focused, minimal emojis
- Facebook: Conversational, community-focused
- Twitter: Punchy, witty, under 280 chars

Return ONLY the caption text. No explanations.`;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<void> {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { assetPrompt, business, platform = 'general', hashtagMode = 'ai_plus_brand', brandHashtags = [] } = req.body as CaptionRequest;

    if (!assetPrompt || !business?.name) {
        res.status(400).json({ error: 'Missing required fields: assetPrompt, business.name' });
        return;
    }

    try {
        // Build context for the AI
        const voiceContext = business.voice
            ? `Brand Voice: ${business.voice.archetype || 'Professional'}. Tone: ${business.voice.tonePills?.join(', ') || 'Engaging'}. ${business.voice.slogan ? `Slogan: "${business.voice.slogan}"` : ''}`
            : 'Brand Voice: Professional and engaging.';

        // Build hashtag instructions based on mode
        const hashtagInstruction = buildHashtagInstruction(hashtagMode, brandHashtags);

        const userPrompt = `
BUSINESS: ${business.name}
INDUSTRY: ${business.industry || 'General'}
TARGET AUDIENCE: ${business.targetAudience || 'General audience'}
${voiceContext}
PLATFORM: ${platform}

HASHTAG RULES: ${hashtagInstruction}

IMAGE/CONTENT DESCRIPTION:
${assetPrompt}

Write the caption now:`;

        console.log('[Caption API] Generating via Vercel Gateway...');

        // Use Vercel AI Gateway (Gemini 3 Flash)
        // Note: AI SDK v5+ accepts model IDs directly as strings (NO gateway() wrapper)
        const result = await generateText({
            model: 'google/gemini-3-flash',
            system: CAPTION_SYSTEM_PROMPT,
            prompt: userPrompt,
            temperature: 0.7,
        });

        const caption = result.text?.trim();

        if (!caption) {
            res.status(500).json({ error: 'No caption generated' });
            return;
        }

        console.log('[Caption API] Caption generated successfully');
        res.status(200).json({ caption });

    } catch (error: any) {
        console.error('[Caption API] Error:', error);
        res.status(500).json({ error: 'Failed to generate caption', details: error.message });
    }
}
