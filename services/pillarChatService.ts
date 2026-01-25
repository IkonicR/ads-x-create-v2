/**
 * Pillar Chat Service - AI-guided pillar creation
 * 
 * Uses Gemini 3 Flash with function calling to extract structured pillar data
 * from natural language conversation.
 */

import { GoogleGenAI, FunctionDeclaration, Type, Part } from "@google/genai";
import { Business, SocialAccount } from '../types';
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
const PLATFORM_INFO = {
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
        },
        required: [],
    },
};

// Build system prompt for pillar creation
const buildSystemPrompt = (business: Business, connectedAccounts: SocialAccount[]): string => {
    const platformList = connectedAccounts.length > 0
        ? connectedAccounts.map(a => `- ${a.platform} (${a.name})`).join('\n')
        : 'No platforms connected yet';

    const offeringsList = business.offerings?.length > 0
        ? business.offerings.map(o => `- ${o.name}`).join('\n')
        : 'No products/services added yet';

    const teamList = business.teamMembers?.length > 0
        ? business.teamMembers.map(t => `- ${t.name} (${t.role})`).join('\n')
        : 'No team members added yet';

    return `You are a Content Strategy Assistant helping create a recurring content pillar for "${business.name}".

## YOUR ROLE
Guide the user through setting up a content pillar — a recurring, automated content series. Be friendly, conversational, and helpful. Ask one question at a time.

## WHAT YOU NEED TO DISCOVER
Through conversation, learn:
1. **What type of content?** (motivation, product spotlight, team feature, tips, testimonials, custom)
2. **Which day of the week?** (Monday through Sunday)
3. **Which platforms?** (based on what they have connected)
4. **What to feature?** (rotate through products? same thing each time? rotate team?)
5. **Any specific style or vibe?**

## FUNCTION CALLING
IMPORTANT: Call \`update_pillar_config\` whenever the user provides information. Extract structured data from their message. You can call it with partial data — you'll build up the config over multiple turns.

## BUSINESS CONTEXT
**Business:** ${business.name}

**Connected Platforms:**
${platformList}

**Products/Services:**
${offeringsList}

**Team Members:**
${teamList}

## CONVERSATION FLOW
1. Start by understanding what they want to post about
2. Ask what day of the week
3. Ask which platforms
4. Ask about rotation (same product or different each week?)
5. Capture any special instructions
6. Confirm the configuration

## STYLE
- Be warm and encouraging
- Use their business name when relevant
- Keep responses concise (2-3 sentences)
- Ask ONE question at a time
- When you have enough info, let them know the pillar is ready to save`;
};

/**
 * Send a message in the pillar creation conversation
 */
export const sendPillarChatMessage = async (
    business: Business,
    connectedAccounts: SocialAccount[],
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
        const systemPrompt = buildSystemPrompt(business, connectedAccounts);

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
            ? `${newMessage}\n\n[Current pillar config: ${JSON.stringify(currentDraft)}]`
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

                if (args.name) updates.name = args.name;
                if (args.theme) updates.theme = args.theme;
                if (args.dayOfWeek !== undefined) updates.dayOfWeek = args.dayOfWeek;
                if (args.subjectMode) updates.subjectMode = args.subjectMode;
                if (args.platforms) updates.platforms = args.platforms;
                if (args.instructions) updates.instructions = args.instructions;
                if (args.generateImage !== undefined) updates.generateImage = args.generateImage;

                console.log('[PillarChatService] Extracted updates:', updates);
            }
        }

        // Fallback if no text response
        if (!responseText.trim()) {
            responseText = Object.keys(updates).length > 0
                ? "Got it! I've updated the pillar configuration. What else would you like to add?"
                : "I understand. Can you tell me more about what kind of content you'd like to create?";
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
 * Get initial greeting message
 */
export const getInitialGreeting = (business: Business): string => {
    return `Hey! Let's create a recurring content pillar for ${business.name}. What kind of content do you want to post regularly? You can pick a suggestion below or describe your own idea.`;
};
