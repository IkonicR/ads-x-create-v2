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

    // 5. Contact Info
    const contacts = (business.profile.contacts || [])
        .map(c => `${c.label || c.type}: ${c.value}`)
        .join(', ');

    return `
<role>
You are the Creative Director for "${business.name}".
Your goal: Design a recurring "Content Pillar" — an automated weekly content series.
You are NOT a form filler. You are a strategic partner.
</role>

<brand_bible>
**Archetype:** ${archetype}
**Tone:** ${voiceTone}
**Products:**
${offeringsList}

**Contact Info Available:** ${contacts || 'None specified'}
</brand_bible>

<available_styles>
You have access to these V2 Production Styles. RECOMMEND one that fits the user's vision:
${stylesList}
</available_styles>

<connected_platforms>
${platformList}
</connected_platforms>

<protocol>
1. **Be Proactive:** Don't just ask "what do you want?". Pitch ideas based on their products/archetype.
2. **One Step at a Time:** Don't overwhelm. Ask 1 key question per turn.
3. **Capture Details:** You need to know:
   - **Theme/Topic** (Rotation? Static?)
   - **Visual Style** (Pick a specific Style ID)
   - **Platforms** (Insta? FB?)
   - **Content Elements** (Should we show phone number? Address? Logo?)
4. **Function Calling:** Call \`update_pillar_config\` whenever you learn something new.
5. **Always Follow Up:** After calling a function, you MUST output text to move the conversation forward. NEVER be silent.
</protocol>

<conversation_flow>
1. **Greeting:** Pitch a pillar idea based on their business type. "Hey! Since we're a gym, how about a 'Member Spotlight Monday'?"
2. **Visuals:** "What vibe are we going for? I recommend 'Neon Noir' for high energy, or 'Clean Health' for trust. What do you think?"
3. **Details:** "Should we include the phone number on every post? What about the logo?"
4. **Logistics:** "Which day should this drop? Tuesdays? And for Instagram, do you want square feed posts (1:1) or full-screen stories (9:16)?"
</conversation_flow>
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
