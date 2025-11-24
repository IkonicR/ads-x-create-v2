
import { Business } from '../types';
import { StorageService } from './storage';

export const DEFAULT_IMAGE_PROMPT = `
      You are an expert digital artist and commercial graphic designer.
      Create a high-end professional visual for the following business.
      
      BRAND IDENTITY:
      - Business Name: {{BUSINESS_NAME}}
      - Industry: {{INDUSTRY}}
      - Brand Colors: Primary {{COLOR_PRIMARY}}, Secondary {{COLOR_SECONDARY}}, Accent {{COLOR_ACCENT}}.
      - Visual Vibe: {{TONE}}
      
      STRICT VISUAL RULES:
      1. Do NOT invent features that are not described in the prompt.
      2. TEXT HANDLING: 
         - Generally, minimize random text to avoid gibberish.
         - HOWEVER, if the user prompt asks for "Text", "Copy", "Infographic", "Sign", or "Typography", you MUST render the text clearly.
         - When rendering text, prioritize the Business Name, Slogan, or USPs listed above.
         - Ensure perfect spelling.
      3. Incorporate the brand colors subtly into the lighting, background, or objects.
      4. LOGO INTEGRATION (IF PROVIDED):
         - Treat the logo as a PHYSICAL OBJECT in the scene, not a digital overlay.
         - Apply material properties: Embossed, Neon, Matte Print, Metallic Foil, or Engraved depending on the style.
         - Match the scene's lighting, shadows, and perspective.
      
      SCENE DESCRIPTION (USER REQUEST):
      {{VISUAL_PROMPT}}
      
      KEYWORDS TO VISUALIZE:
      {{KEYWORDS}}
      
      NEGATIVE CONSTRAINTS (DO NOT INCLUDE):
      {{NEGATIVE_CONSTRAINTS}}
      
      Technical Specs: Cinematic lighting, 4k resolution, highly detailed, commercial photography or high-end vector art.
`;

export const DEFAULT_CHAT_PROMPT = `
      You are the Chief Marketing Officer (CMO) and Creative Director for "{{BUSINESS_NAME}}".
      
      CURRENT REALITY:
      - Date: {{DATE}}
      - Business Type: {{BUSINESS_TYPE}}
      - Industry: {{INDUSTRY}}
      - Location Context: {{LOCATION}}
      - Availability: {{AVAILABILITY_CONTEXT}}
      - Target Audience: {{TARGET_AUDIENCE}}
      - Brand Tone: {{TONE}}
      - Key Products: {{PRODUCTS}}
      
      YOUR MANDATES:
      1. Be proactive. Suggest ad ideas based on the current season/holidays if relevant.
      2. Write punchy, sales-oriented copy.
      3. Always stay within the brand's tone.
      4. Do not act like a generic AI. Act like a partner in the business.
      5. If the user asks for an ad, format it clearly with Headline, Body, and CTA.
      6. If the user asks for an image, use the 'generate_marketing_image' tool.
      
      Keep responses concise and actionable.
`;

export const DEFAULT_TASK_PROMPT = `
      You are a strategic marketing consultant.
      Based on the following business description: "{{BUSINESS_DESCRIPTION}}",
      suggest 5 specific, actionable marketing tasks for the next week.
      
      Return a JSON array of strings. Example: ["Post on Instagram", "Email Newsletter"].
`;

export const PromptFactory = {
  getDefaultImagePrompt: () => DEFAULT_IMAGE_PROMPT,
  getDefaultChatPrompt: () => DEFAULT_CHAT_PROMPT,
  getDefaultTaskPrompt: () => DEFAULT_TASK_PROMPT,

  /**
   * THE CMO AGENT
   * Controls the "Chat" personality.
   */
  createChatSystemInstruction: async (business: Business): Promise<string> => {
    const customPrompts = await StorageService.getSystemPrompts();
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    let availability = "Standard Business Hours";
    const mode = business.profile.operatingMode || 'standard';
    const timezone = business.profile.timezone ? ` (${business.profile.timezone})` : '';

    if (mode === 'always_open') {
      availability = `Operates 24/7 Online${timezone}. Emphasize 'shop anytime' convenience.`;
    } else if (mode === 'appointment_only') {
      const bookingLink = business.profile.bookingUrl ? ` Booking Link: ${business.profile.bookingUrl}` : '';
      availability = `By Appointment Only${timezone}.${bookingLink} Emphasize booking and scheduling.`;
    } else {
      // Format standard hours
      const hoursList = business.profile.hours
        .map(h => `${h.day}: ${h.closed ? 'Closed' : `${h.open}-${h.close}`}`)
        .join(', ');
      availability = `Physical Location Open: ${hoursList}${timezone}`;
    }

    const location = business.profile.publicLocationLabel || business.profile.address || "Online/Global";

    let template = customPrompts?.chatPersona || DEFAULT_CHAT_PROMPT;

    // Hydrate Template
    return template
      .replace('{{BUSINESS_NAME}}', business.name)
      .replace('{{DATE}}', today)
      .replace('{{BUSINESS_TYPE}}', business.type)
      .replace('{{INDUSTRY}}', business.industry)
      .replace('{{LOCATION}}', location)
      .replace('{{AVAILABILITY_CONTEXT}}', availability)
      .replace('{{TARGET_AUDIENCE}}', business.adPreferences.targetAudience)
      .replace('{{TONE}}', business.voice.tone)
      .replace('{{PRODUCTS}}', business.offerings.map(o => o.name).join(', '));
  },

  /**
   * THE ART DIRECTOR
   * Controls Image Generation.
   */
  createImagePrompt: async (business: Business, visualPrompt: string, keywords: string[], negativePrompt: string = '', logoMaterial?: string, logoPlacement?: string): Promise<string> => {
    const customPrompts = await StorageService.getSystemPrompts();
    
    // 1. Use Custom Prompt if available, otherwise use Default
    let template = customPrompts?.imageGenRules || DEFAULT_IMAGE_PROMPT;
    
    // 2. Hydrate Placeholders
    let hydrated = template
      .replace('{{BUSINESS_NAME}}', business.name)
      .replace('{{INDUSTRY}}', business.industry)
      .replace('{{COLOR_PRIMARY}}', business.colors.primary)
      .replace('{{COLOR_SECONDARY}}', business.colors.secondary)
      .replace('{{COLOR_ACCENT}}', business.colors.accent)
      .replace('{{TONE}}', business.voice.tone)
      .replace('{{VISUAL_PROMPT}}', visualPrompt)
      .replace('{{KEYWORDS}}', keywords.join(', '))
      .replace('{{NEGATIVE_CONSTRAINTS}}', negativePrompt + ', ' + (business.voice.negativeKeywords || []).join(', '));

    // 3. Append Logo Instruction if URL exists
    if (business.logoUrl) {
      hydrated += `
      
      CRITICAL LOGO INSTRUCTION:
      The first image provided is the BRAND LOGO.
      INTEGRATE IT NATURALLY. Do not just paste it flat.
      `;

      if (logoPlacement) {
        hydrated += `- PLACEMENT/COMPOSITION: ${logoPlacement}\n`;
      } else {
        hydrated += `- Place it naturally within the composition (e.g., on product packaging, as a watermark, or on a sign).\n`;
      }

      if (logoMaterial) {
        hydrated += `- MATERIAL/INTEGRATION: ${logoMaterial}\n`;
      } else {
        // Fallback heuristics if no material specified
        hydrated += `
      - If the style is NEON/CYBER: The logo must be a glowing light source.
      - If the style is LUXURY: The logo must be gold/silver foil or embossed.
      - If the style is NATURAL: The logo must be engraved or printed on matte paper.
      `;
      }
      
      hydrated += `- Ensure perspective alignment with the surface it is on.
      `;
    }

    return hydrated;
  },

  /**
   * THE STRATEGIST
   * Controls Task Suggestion.
   */
  createTaskSuggestionPrompt: async (businessDescription: string): Promise<string> => {
    const customPrompts = await StorageService.getSystemPrompts();
    
    let template = customPrompts?.taskGenRules || DEFAULT_TASK_PROMPT;
    
    return template.replace('{{BUSINESS_DESCRIPTION}}', businessDescription);
  }
};
