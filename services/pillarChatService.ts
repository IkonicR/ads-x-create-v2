/**
 * Pillar Chat Service - AI-guided pillar creation
 * 
 * Uses Gemini 3 Flash with function calling to extract structured pillar data
 * from natural language conversation.
 * 
 * UPGRADE (Phase 3): 
 * - Injects full business context (Voice, Archetype, Contact Info)
 * - Injects V2 God-Tier Styles
 * - Extracts styleId and contact preferences
 * - Forces follow-up questions
 */

import { GoogleGenAI, FunctionDeclaration, Type, Part } from "@google/genai";
import { Business, SocialAccount, StylePreset } from '../types';
import { AI_MODELS } from '../config/ai-models';
import { PillarDraft } from '../components/PillarBuilder';

// Get the AI client
const getAiClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

// Conversation message type
export interface PillarChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Platform configuration for AI context
const PLATFORM_INFO: Record<string, { name: string; aspectRatio: string; captionLimit: number }> = {
    instagram_feed: { name: 'Instagram Feed', aspectRatio: '1:1', captionLimit: 2200 },
    instagram_story: { name: 'Instagram Story', aspectRatio: '9:16', captionLimit: 150 },
    facebook: { name: 'Facebook', aspectRatio: '1.91:1', captionLimit: 63206 },
    linkedin: { name: 'LinkedIn', aspectRatio: '1.91:1', captionLimit: 3000 },
    twitter: { name: 'Twitter/X', aspectRatio: '16:9', captionLimit: 280 },
    tiktok: { name: 'TikTok', aspectRatio: '9:16', captionLimit: 2200 },
};

// Function declaration for pillar extraction
const updatePillarTool: FunctionDeclaration = {
    name: 'update_pillar_config',
    description: 'Extract and update pillar configuration from the user\'s message. Call this whenever the user provides information about their content pillar.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: 'A catchy name for the pillar (e.g., "Motivation Monday", "Product Spotlight Friday")',
            },
            theme: {
                type: Type.STRING,
                description: 'Content theme: "motivation", "product", "team", "testimonial", "educational", or "custom"',
            },
            dayOfWeek: {
                type: Type.NUMBER,
                description: 'Day of the week (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)',
            },
            subjectMode: {
                type: Type.STRING,
                enum: ['static', 'rotate_offerings', 'rotate_team', 'rotate_locations'],
                description: 'How to select content: "static" (same every time), "rotate_offerings" (cycle through products), "rotate_team" (cycle through team members), "rotate_locations" (cycle through locations)',
            },
            platforms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of platforms to post to (e.g., ["instagram_feed", "facebook"])',
            },
            instructions: {
                type: Type.STRING,
                description: 'Custom instructions for content generation (capture the user\'s vision in their own words)',
            },
            generateImage: {
                type: Type.BOOLEAN,
                description: 'Whether to auto-generate images for this pillar',
            },
            styleId: {
                type: Type.STRING,
                description: 'The ID of the Visual Style Preset to use (from the available styles list)',
            },
            // Content Preferences
            showBusinessName: { type: Type.BOOLEAN, description: 'Include business name on the creative?' },
            showContactInfo: { type: Type.BOOLEAN, description: 'Include contact info on the creative?' },
            sloganProminence: {
                type: Type.STRING,
                enum: ['hidden', 'subtle', 'standard', 'prominent'],
                description: 'How prominent should the slogan be?'
            },
            // NEW: Aspect Ratio, Hashtag Mode, Caption Mode
            aspectRatio: {
                type: Type.STRING,
                enum: ['1:1', '9:16', '16:9', '4:5', '2:3', '3:2', '3:4', '4:3', '5:4', '21:9'],
                description: 'Aspect ratio for generated images (e.g., 1:1 for square, 9:16 for stories)',
            },
            hashtagMode: {
                type: Type.STRING,
                enum: ['inherit', 'ai_only', 'brand_only', 'ai_plus_brand'],
                description: 'Hashtag strategy for this pillar. "inherit" uses business default settings.',
            },
            captionMode: {
                type: Type.STRING,
                enum: ['same', 'tailored'],
                description: 'Caption strategy: "same" for identical captions everywhere, "tailored" for platform-optimized versions.',
            },
            logoVariant: {
                type: Type.STRING,
                enum: ['main', 'wordmark', 'dark', 'light'],
                description: 'Which logo variant to use if multiple are available.',
            },
            // Offering Rotation (Phase 2H)
            offeringRotationFrequency: {
                type: Type.STRING,
                enum: ['never', 'every_post', 'every_2nd', 'every_3rd', 'every_4th', 'occasionally'],
                description: 'How often to feature products/services in posts. "every_3rd" = include offering in every 3rd post. "occasionally" = AI decides based on context.',
            },
            preferredTime: {
                type: Type.STRING,
                description: 'Preferred posting time in HH:MM format (e.g., "12:00" for midday, "08:00" for morning)',
            },
        },
        required: [],
    },
};

/**
 * Build System Prompt with Full Context
 */
const buildSystemPrompt = (
    business: Business,
    connectedAccounts: SocialAccount[],
    availableStyles: StylePreset[] = []
): string => {
    // 1. Platform Context
    const platformList = connectedAccounts.length > 0
        ? connectedAccounts.map(a => `- ${a.platform} (${a.name})`).join('\n')
        : 'No platforms connected yet';

    // 2. Product Context
    const offeringsList = business.offerings?.length > 0
        ? business.offerings.map(o => `- ${o.name} (${o.category || 'Product'})`).join('\n')
        : 'No products/services added yet';

    // 3. Style Context (V2 God-Tier)
    const stylesList = availableStyles.length > 0
        ? availableStyles.map(s => `- "${s.name}" (ID: ${s.id}): ${s.description}`).join('\n')
        : 'No specific styles available. Ask for general vibe.';

    // 4. Voice & Archetype
    const archetype = business.voice?.archetype || 'Professional';
    const voiceTone = business.voice?.tone || 'Helpful and authoritative';
    const slogan = business.voice?.slogan || '';

    // 5. Contact Info
    const contacts = (business.profile.contacts || [])
        .map(c => `${c.label || c.type}: ${c.value}`)
        .join(', ');

    // 6. Logo Variants
    const logoVariants = [
        business.logoUrl && 'Main Logo',
        business.logoVariants?.wordmark && 'Wordmark',
        business.logoVariants?.dark && 'Dark Version',
        business.logoVariants?.light && 'Light Version',
    ].filter(Boolean);
    const logoStatus = logoVariants.length > 0 ? logoVariants.join(', ') : 'No logo uploaded';

    // 7. Ad Preferences
    const adPrefs = business.adPreferences;
    const adPrefsContext = adPrefs ? `
- Location Display: ${adPrefs.locationDisplay || 'hidden'}${adPrefs.locationText ? ` (Custom: "${adPrefs.locationText}")` : ''}
- Hours Display: ${adPrefs.hoursDisplay || 'hidden'}
- Show Business Name: ${adPrefs.showBusinessName ?? true}
- Slogan Prominence: ${adPrefs.sloganProminence || 'standard'}
- Contact Prominence: ${adPrefs.contactProminence || 'standard'}` : 'Not configured';

    // 8. Social Settings (Hashtags)
    const socialSettings = business.socialSettings as { hashtagMode?: string; brandHashtags?: string[] } | undefined;
    const hashtagMode = socialSettings?.hashtagMode || 'ai_plus_brand';
    const brandHashtags = socialSettings?.brandHashtags?.length 
        ? socialSettings.brandHashtags.map(t => `#${t}`).join(', ')
        : 'None set';

    // 9. Brand Colors (Phase 2I)
    const colors = business.colors as { brand?: string; secondary?: string; accent?: string } | undefined;
    const primaryColor = colors?.brand || 'Not specified';
    const secondaryColor = colors?.secondary || 'Not specified';
    const accentColor = colors?.accent || 'Not specified';
    const hasColors = colors?.brand || colors?.secondary || colors?.accent;

    // 10. Current Date & Season (Phase 2H - Season Awareness)
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const saSeasons: Record<string, number[]> = {
        Summer: [11, 0, 1],    // Dec, Jan, Feb
        Autumn: [2, 3, 4],     // Mar, Apr, May
        Winter: [5, 6, 7],     // Jun, Jul, Aug
        Spring: [8, 9, 10]     // Sep, Oct, Nov
    };
    const currentSeason = Object.entries(saSeasons).find(([_, months]) => months.includes(month))?.[0] || 'Summer';
    const dateString = now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return `
<role>
You are the Creative Director for "${business.name}".
Your goal: Design a recurring "Content Pillar" — an automated weekly content series.
You are NOT a form filler. You are a strategic partner.
</role>

<brand_bible>
**Archetype:** ${archetype}
**Tone:** ${voiceTone}
**Slogan:** ${slogan || 'None set'}

**Products:**
${offeringsList}

**Contact Info Available:** ${contacts || 'None specified'}
**Logo Variants:** ${logoStatus}

**Brand Colors:**${hasColors ? `
- Primary: ${primaryColor}
- Secondary: ${secondaryColor}
- Accent: ${accentColor}` : ' Not specified — ask if they want custom colors or you have creative freedom'}

**Ad Preferences:**
${adPrefsContext}

**Hashtag Settings:**
- Mode: ${hashtagMode} (ai_only = AI generates, brand_only = only brand tags, ai_plus_brand = both)
- Brand Hashtags: ${brandHashtags}
</brand_bible>

<available_styles>
You have access to these V2 Production Styles. RECOMMEND one that fits the user's vision:
${stylesList}
</available_styles>

<connected_platforms>
${platformList}
</connected_platforms>

<current_context>
**Today's Date:** ${dateString}
**Current South African Season:** ${currentSeason}
Note: South Africa is in the Southern Hemisphere, so seasons are OPPOSITE to Europe/US.
- December-February = Summer (hot, holiday season)
- March-May = Autumn (cooler, back to school)
- June-August = Winter (cold, cozy indoor vibes)
- September-November = Spring (renewal, outdoor activities)
Use this context when suggesting seasonal themes or timing for the pillar.
</current_context>

<critical_rules>
## YOU HAVE THE DATA — ASK IF TO INCLUDE, NOT WHAT IT IS:
- You KNOW the slogan is "${slogan || 'not set'}". Ask: "Should I include the slogan?" NOT "What's your slogan?"
- You KNOW the address/location settings. Ask: "Should this pillar show location?" NOT "What's your address?"
- You KNOW the contact info. Ask: "Should we display contact details?" NOT "What's your phone number?"

## LOGO VARIANT SELECTION:
${logoVariants.length > 1 ? `Multiple logos available (${logoVariants.join(', ')}). Ask which version to use.` : 'Use the main logo if available.'}

## HASHTAGS:
Brand hashtags are: ${brandHashtags}. Ask:
- "Should I use your brand hashtags or generate fresh ones for this pillar?"
- "Override the default hashtag mode (${hashtagMode}) for this pillar?"

## CAPTION TAILORING:
Always ask: "Same caption for all platforms, or tailored per platform (shorter for Twitter, emoji-rich for Instagram)?"

## OFFERING ROTATION:
Ask: "How often should we feature your products/services? Every post, every 3rd post, or let me decide based on context?"
</critical_rules>

<conversation_pacing>
🚨 **MAXIMUM 2 QUESTIONS PER MESSAGE.** This is NON-NEGOTIABLE.
- Users forget answers when asked too many at once.
- If you have 3+ things to ask, pick the 2 most important and save the rest for the next turn.
- Prioritize: (1) Core concept, (2) Visual decisions, (3) Content strategy, (4) Technical details.
- **NEVER list more than 2 numbered questions in a single message.**
- Example of GOOD: "What day should this post? And should we post at morning or midday?"
- Example of BAD: "1. What day? 2. What time? 3. What style? 4. What platforms?"
</conversation_pacing>

<protocol>
1. **Be Proactive:** Don't just ask "what do you want?". Pitch ideas based on their products/archetype and the current season (${currentSeason}).
2. **One Step at a Time:** Don't overwhelm. Ask MAXIMUM 1-2 key questions per turn.
3. **Capture Details:** You need to know:
   - **Theme/Topic** (Rotation? Static?)
   - **Visual Style** (Pick a specific Style ID)
   - **Platforms** (Insta? FB?)
   - **Aspect Ratio** (1:1, 9:16, 16:9, etc.)
   - **Caption Mode** (Same everywhere, or tailored per platform?)
   - **Hashtag Mode** (Inherit from settings, AI only, brand only, or combined?)
   - **Content Elements** (Logo version? Slogan? Contact info?)
   - **Offering Rotation** (How often to feature products/services?)
4. **Function Calling:** Call \`update_pillar_config\` whenever you learn something new.
5. **Always Follow Up:** After calling a function, you MUST output text to move the conversation forward. NEVER be silent.
</protocol>

<conversation_flow>
1. **Greeting:** Pitch a pillar idea based on their business type. "Hey! Since we're a gym, how about a 'Member Spotlight Monday'?"
2. **Visuals:** "What vibe are we going for? I recommend 'Neon Noir' for high energy, or 'Clean Health' for trust. What aspect ratio — square for feed (1:1) or vertical for stories (9:16)?"
3. **Details:** "Should we include your slogan '${slogan || '[no slogan]'}' on every post? What about the logo — main or wordmark?"
4. **Captions:** "Want captions tailored per platform, or identical everywhere? And for hashtags, should I use your brand tags (${brandHashtags}) or generate fresh ones?"
5. **Logistics:** "Which day should this drop? And what time?"
</conversation_flow>

<completion_awareness>
🚨 **REQUIRED FIELDS** (user cannot save until these are set):
- Name ✓
- Day of week ✓  
- At least 1 platform ✓

**OPTIONAL FIELDS** (nice-to-have but not blocking):
- Instructions (captured from chat), Time, Style ID, Aspect ratio, Caption mode, Hashtag mode, Offering rotation, Contact info, Slogan, Logo variant

## CRITICAL HONESTY RULES:
1. **NEVER say "final questions" unless you have NO MORE questions to ask.**
2. **NEVER promise you're done and then immediately ask more questions.**
3. If you have 4+ topics left to cover, say: "Let me get a few more details..."
4. If you have 2-3 topics left, say: "Almost there! Just need to confirm..."
5. If you have 1 topic left, say: "Last thing—"
6. If you have 0 topics left, say: "All set! Ready to save when you are." — then STOP ASKING.

## WRAP-UP TRIGGER:
After the required fields are set AND you've covered 3+ optional areas, proactively offer:
"We've got everything we need! Ready to save this pillar, or did you want to tweak anything?"

DO NOT ask about metrics, analytics, or topics you didn't get to. Just wrap up cleanly.
</completion_awareness>
    `.trim();
};

/**
 * Send a message in the pillar creation conversation
 */
export const sendPillarChatMessage = async (
    business: Business,
    connectedAccounts: SocialAccount[],
    availableStyles: StylePreset[],
    history: PillarChatMessage[],
    newMessage: string,
    currentDraft: PillarDraft
): Promise<{
    response: string;
    updates: Partial<PillarDraft>;
}> => {
    const ai = getAiClient();

    if (!ai) {
        return {
            response: "AI service is not available. Please check your API configuration.",
            updates: {},
        };
    }

    try {
        const systemPrompt = buildSystemPrompt(business, connectedAccounts, availableStyles);

        // Build conversation history
        const conversationHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }] as Part[],
        }));

        // Create chat with function calling
        const chat = ai.chats.create({
            model: AI_MODELS.textDirect,
            config: {
                systemInstruction: systemPrompt,
                tools: [{ functionDeclarations: [updatePillarTool] }],
            },
            history: conversationHistory,
        });

        // Include current draft state so AI knows what's already configured
        const contextMessage = currentDraft && Object.keys(currentDraft).length > 0
            ? `${newMessage}\n\n[System Note: Current config: ${JSON.stringify(currentDraft)}. Ask the next logical missing question.]`
            : newMessage;

        // Send message
        // @ts-ignore - SDK typing issue
        const response = await chat.sendMessage({
            message: [{ text: contextMessage }],
        });

        // Extract function calls and text
        const parts = response.candidates?.[0]?.content?.parts || [];

        let responseText = '';
        let updates: Partial<PillarDraft> = {};

        for (const part of parts) {
            // Text response
            if (part.text) {
                responseText += part.text;
            }

            // Function call - extract pillar updates
            if (part.functionCall?.name === 'update_pillar_config') {
                const args = part.functionCall.args as Record<string, any>;

                // Map fields
                if (args.name) updates.name = args.name;
                if (args.theme) updates.theme = args.theme;
                if (args.dayOfWeek !== undefined) updates.dayOfWeek = args.dayOfWeek;
                if (args.subjectMode) updates.subjectMode = args.subjectMode;
                if (args.platforms) updates.platforms = args.platforms;
                if (args.instructions) updates.instructions = args.instructions;
                if (args.generateImage !== undefined) updates.generateImage = args.generateImage;

                // New Fields (Phase 3)
                if (args.styleId) updates.styleId = args.styleId;
                if (args.showBusinessName !== undefined) updates.showBusinessName = args.showBusinessName;
                if (args.showContactInfo !== undefined) updates.showContactInfo = args.showContactInfo;
                if (args.sloganProminence) updates.sloganProminence = args.sloganProminence;

                console.log('[PillarChatService] Extracted updates:', updates);
            }
        }

        /**
         * CRITICAL FIX: If AI called a function but returned no text, 
         * we must force a follow-up generation to keep the chat alive.
         */
        if (!responseText.trim() && Object.keys(updates).length > 0) {
            console.log('[PillarChatService] Function called but no text. Forcing follow-up...');

            // We can't re-use the same chat object easily for a strictly "next turn", 
            // but we can simulate it or just return a generic prompt if specific logic is hard.
            // Better approach: Ask it to generate the response text now.

            const followUp = await chat.sendMessage({
                message: [{ text: "System: You updated the config. Now, confirm what you changed and ask the next logical question to the user. Do not call functions this time." }]
            });

            const followUpText = followUp.candidates?.[0]?.content?.parts?.[0]?.text;
            if (followUpText) {
                responseText = followUpText;
            }
        }

        // Final Fallback
        if (!responseText.trim()) {
            responseText = "I've updated the pillar preferences. What else should we adjust?";
        }

        return {
            response: responseText.trim(),
            updates,
        };

    } catch (error) {
        console.error('[PillarChatService] Error:', error);
        return {
            response: "Sorry, I'm having trouble processing that. Could you try again?",
            updates: {},
        };
    }
};

/**
 * Get initial greeting message (Enhanced)
 */
export const getInitialGreeting = (business: Business): string => {
    const archetype = business.voice?.archetype || '';
    return `Hey! I'm ready to design a new content pillar for ${business.name}. ${archetype ? `Keeping our "${archetype}" vibe in mind, ` : ''}what kind of recurring content should we create?`;
};
