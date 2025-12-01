
import { Business } from '../types';
import { StorageService } from './storage';

export const DEFAULT_IMAGE_PROMPT = `
/// CREATIVE BRIEF - JOB TICKET #{{TIMESTAMP}} ///
You are the Lead Creative at a top Ad Agency.
Your Mission: Create a high-performing ad for the goal: "{{GOAL}}".
Target Audience: {{TARGET_AUDIENCE}}.

/// PART 1: SOURCE MATERIAL (The Facts) ///
*   **Client:** "{{BUSINESS_NAME}}" ({{INDUSTRY}}).
*   **Slogan:** "{{SLOGAN}}" ({{USAGE_RULE}}).
*   **USPs:** {{USP_1}}, {{USP_2}}, {{USP_3}}.
*   **Contact Info:** {{WEBSITE}} | {{PHONE}}.
*   **User Request:** "{{VISUAL_PROMPT}}".
*   **Keywords:** {{KEYWORDS}}.
*   **Brand Palette:** {{COLOR_PRIMARY}} (Primary), {{COLOR_SECONDARY}} (Secondary).
*   **Tone:** {{TONE}}.
*   **Negative Constraints:** {{NEGATIVE_KEYWORDS}}.

/// PART 2: THE MISSING PIECES (You Must Write These) ///
*   **HEADLINE:** [MISSING] -> Write a short, powerful headline based on the User Request and Goal.
*   **SUB-HEADER:** [MISSING] -> Write a single punchy sentence to support the headline.
*   **BODY COPY:** [MISSING] -> Write relevant ad copy based on the request. If it's a list or infographic, organize the text in the most effective way for the format. Keep it concise.
*   **CONTACT INFO:** [MISSING] -> Format the contact details cleanly.
*   **PROMO TAG:** [MISSING] -> Incorporate the deal "{{PROMOTION}}" creatively.
*   **KEY BENEFITS:** [MISSING] -> Highlight these key selling points: {{BENEFITS_LIST}}.
*   **CTA:** [MISSING] -> Use the preferred CTA: "{{CTA}}".

/// PART 3: VISUAL EXECUTION (The Render) ///
*   **Mandate:** You MUST render the text you wrote in PART 2 into the scene.
*   **Text Integration:** Text must be PHYSICAL and match the style material: "Physical and integrated (e.g. printed, embossed, neon)". NO flat overlays.
*   **Slogan Rule:** Use the slogan "{{SLOGAN}}" if it fits the layout naturally.
*   **Subject:** {{SUBJECT_INSTRUCTION}}
    // IF PRODUCT (Strict): "Use Reference Image 1 (Product). Use the real product image exactly as provided. Blend it into the scene with realistic lighting."
    // IF PERSON (Team): "Use Reference Image 1 (Product). Use the real product image exactly as provided..."
    // IF GENERIC: "Invent a Hero Subject relevant to the industry."
*   **Logo:** Place Reference Image 2 naturally in the scene.
*   **Legal/Compliance:** You MUST include the text "{{COMPLIANCE_TEXT}}" in small, legible print at the bottom.
*   **Style Reference:** Use Reference Image 3 as the VISUAL ANCHOR. Mimic its lighting, texture, and mood exactly.
*   **Composition:** Use a commercial, high-end layout. If text is long, ensure there is negative space or a surface to hold it.
*   **Layout Adaptability:** If the user requests an infographic, chart, or specific layout, prioritize that structure over a standard ad layout.
*   **Lighting:** Cinematic, High-Key, or Moody (match the requested vibe).

/// GENERATE ///
Execute. Photorealistic. 8k.
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
      5. If the user asks for an ad, format it clearly. If they ask for an infographic or specific structure, adapt the format accordingly.
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
   * THE ART DIRECTOR (V2 JOB TICKET MODE - DATA RICH)
   * Structure: "Job Ticket" with [MISSING] fields for Gemini to fill.
   * Goal: Force Copywriting + Visual Synthesis in one pass.
   */
  createImagePrompt: async (
    business: Business,
    visualPrompt: string,
    keywords: string[],
    negativePrompt: string = '',
    logoMaterial?: string,
    logoPlacement?: string,
    // New Marketing Context
    promotion?: string,
    benefits?: string[],
    targetAudience?: string,
    preserveLikeness: boolean = false,
    stylePreset?: any // Using any to avoid circular dependency or strict type issues for now, or import StylePreset
  ): Promise<string> => {
    const customPrompts = await StorageService.getSystemPrompts();

    // Legacy Override Check
    // Legacy Override Check (Now supports V2 Job Ticket Variables)
    if (customPrompts?.imageGenRules && customPrompts.imageGenRules.length > 10) {
      // Pre-calculate complex variables to match the default logic
      const goal = business.adPreferences?.goals || 'Brand Awareness';
      const audience = business.adPreferences?.targetAudience || 'General Audience';
      const cta = business.adPreferences?.preferredCta || 'Learn More';
      const compliance = business.adPreferences?.complianceText || '';
      const sloganUsage = business.adPreferences?.sloganUsage || 'Sometimes';

      let sloganInstruction = "";
      if (sloganUsage === 'Always') {
        sloganInstruction = `MANDATORY: You MUST include the slogan "${business.voice.slogan}" prominently.`;
      } else if (sloganUsage === 'Never') {
        sloganInstruction = `DO NOT use the slogan.`;
      } else {
        sloganInstruction = `Use the slogan "${business.voice.slogan}" if it fits the layout naturally.`;
      }

      const textMat = stylePreset?.textMaterial || "Physical and integrated (e.g. printed, embossed, neon)";

      const colorList = [
        business.colors.primary ? `${business.colors.primary} (Primary)` : null,
        business.colors.secondary ? `${business.colors.secondary} (Secondary)` : null,
        business.colors.accent ? `${business.colors.accent} (Accent)` : null
      ].filter(Boolean).join(', ');

      const hasProduct = visualPrompt.includes("PRIMARY SUBJECT:");
      const hasLogo = !!business.logoUrl;

      const subjectInstruction = hasProduct
        ? (preserveLikeness ? "Use Reference Image 1 (Product). Use the real product image exactly as provided. Blend it into the scene with realistic lighting." : "Use Reference Image 1 (Product). You may stylize this image to match the artistic direction.")
        : "Invent a Hero Subject relevant to the industry.";

      return customPrompts.imageGenRules
        .replace('{{TIMESTAMP}}', Date.now().toString().slice(-4))
        .replace('{{GOAL}}', goal)
        .replace('{{TARGET_AUDIENCE}}', audience)
        .replace('{{BUSINESS_NAME}}', business.name)
        .replace('{{INDUSTRY}}', business.industry)
        .replace('{{SLOGAN}}', business.voice.slogan || '')
        .replace('{{USAGE_RULE}}', sloganUsage)
        .replace('{{USP_1}}', business.usps?.[0] || '')
        .replace('{{USP_2}}', business.usps?.[1] || '')
        .replace('{{USP_3}}', business.usps?.[2] || '')
        .replace('{{WEBSITE}}', business.profile.website || '')
        .replace('{{PHONE}}', business.profile.contactPhone || '')
        .replace('{{VISUAL_PROMPT}}', visualPrompt)
        .replace('{{KEYWORDS}}', keywords.join(', '))
        .replace('{{COLOR_PRIMARY}}', business.colors.primary)
        .replace('{{COLOR_SECONDARY}}', business.colors.secondary)
        .replace('{{TONE}}', business.voice.tone || 'Professional')
        .replace('{{NEGATIVE_KEYWORDS}}', negativePrompt + (business.voice.negativeKeywords?.join(', ') || ''))
        .replace('{{PROMOTION}}', promotion || '')
        .replace('{{BENEFITS_LIST}}', benefits?.join(', ') || '')
        .replace('{{CTA}}', cta)
        .replace('{{SUBJECT_INSTRUCTION}}', subjectInstruction)
        .replace('{{COMPLIANCE_TEXT}}', compliance);
    }

    // --- 1. INTELLIGENT DATA PARSING ---
    const hasLogo = !!business.logoUrl;
    const hasProduct = visualPrompt.includes("PRIMARY SUBJECT:");

    // Ad Preferences Logic
    const prefs = business.adPreferences;
    const goal = prefs?.goals || 'Brand Awareness';

    // --- CONSOLIDATION: AUDIENCE SOURCE OF TRUTH ---
    // Primary: Brand Kit (Core Customer Profile)
    // Fallback: Ad Preferences (Legacy)
    let audience = "General Audience";
    if (business.coreCustomerProfile?.demographics) {
      audience = `${business.coreCustomerProfile.demographics}. ${business.coreCustomerProfile.psychographics || ''}`;
      // Append pain points for context if available
      if (business.coreCustomerProfile.painPoints?.length) {
        audience += ` Key Pain Points: ${business.coreCustomerProfile.painPoints.join(', ')}.`;
      }
    } else if (prefs?.targetAudience) {
      audience = prefs.targetAudience;
    }

    const cta = prefs?.preferredCta || 'Learn More';
    const compliance = prefs?.complianceText || '';
    const sloganUsage = prefs?.sloganUsage || 'Sometimes';

    // --- NEW: CONTACT INFO LOGIC ---
    let contactInfo = "";
    // New Way: Use contactIds to pick specific contacts from the hub
    const contactIds = prefs?.contactIds || [];
    const allContacts = business.profile.contacts || [];
    const parts: string[] = [];

    if (contactIds.length > 0) {
      // Use selected contacts
      contactIds.forEach(id => {
        const contact = allContacts.find(c => c.id === id);
        if (contact && contact.value) {
          // Format: "Label: Value" or just "Value" if label is generic
          let label = contact.label || contact.type;
          // Capitalize label
          label = label.charAt(0).toUpperCase() + label.slice(1);
          parts.push(`${label}: ${contact.value}`);
        }
      });
    } else {
      // Fallback: Use legacy fields if no specific contacts selected (Migration safety)
      if (business.profile.website) parts.push(`Website: ${business.profile.website}`);
      if (business.profile.contactPhone) parts.push(`Phone: ${business.profile.contactPhone}`);
    }

    contactInfo = parts.join(' | ');

    // --- NEW: LOCATION LOGIC ---
    let locationLabel = business.profile.publicLocationLabel || business.profile.address || "Online";
    if (prefs?.locationDisplay === 'city_state') {
      // Simple heuristic: try to extract city/state if possible, or just use the label
      // For now, we rely on the user having set a good "publicLocationLabel" in the UI
      locationLabel = business.profile.publicLocationLabel || "Check website for location";
    } else if (prefs?.locationDisplay === 'online_only') {
      locationLabel = "Online / Global Shipping";
    } else if (prefs?.locationDisplay === 'hidden') {
      locationLabel = "";
    }

    // --- NEW: HOURS LOGIC ---
    let hoursLabel = "";
    if (prefs?.holidayMode?.isActive) {
      hoursLabel = `SPECIAL EVENT: ${prefs.holidayMode.name} (${prefs.holidayMode.hours})`;
    } else {
      switch (prefs?.hoursDisplay) {
        case 'all_hours':
          hoursLabel = "Standard Business Hours";
          break;
        case 'weekends_only':
          hoursLabel = "Open Weekends";
          break;
        case 'custom_selection':
          hoursLabel = `Open ${prefs.hoursDisplayDays?.join(', ') || 'Selected Days'}`;
          break;
        case 'hidden':
          hoursLabel = "";
          break;
        default:
          hoursLabel = "Standard Hours";
      }
    }

    // Slogan Logic
    let sloganInstruction = "";
    if (sloganUsage === 'Always') {
      sloganInstruction = `MANDATORY: You MUST include the slogan "${business.voice.slogan}" prominently.`;
    } else if (sloganUsage === 'Never') {
      sloganInstruction = `DO NOT use the slogan.`;
    } else {
      sloganInstruction = `Use the slogan "${business.voice.slogan}" if it fits the layout naturally.`;
    }

    // Text Material Logic
    const textMat = stylePreset?.textMaterial || "Physical and integrated (e.g. printed, embossed, neon)";

    // Heuristic: Dynamic Color Loop
    const colorList = [
      business.colors.primary ? `${business.colors.primary} (Primary)` : null,
      business.colors.secondary ? `${business.colors.secondary} (Secondary)` : null,
      business.colors.accent ? `${business.colors.accent} (Accent)` : null
    ].filter(Boolean).join(', ');

    // Heuristic: Listicle Detection
    const listMatch = visualPrompt.match(/(\d+)\s+(tips|ways|reasons|steps)/i);
    const isListicle = !!listMatch;
    const listCount = listMatch ? listMatch[1] : "some";

    // --- 2. THE JOB TICKET ARCHITECTURE ---

    const HEADER_BLOCK = `
/// CREATIVE BRIEF - JOB TICKET #${Date.now().toString().slice(-4)} ///
You are the Lead Creative at a top Ad Agency.
Your Mission: Create a high-performing ad for the goal: "${goal}".
Target Audience: ${audience}.
`;

    // PART 1: THE TRUTH (Raw Data)
    const SOURCE_BLOCK = `
/// PART 1: SOURCE MATERIAL (The Facts) ///
*   **Client:** "${business.name}" (${business.industry}).
*   **Slogan:** "${business.voice.slogan || ''}" (${sloganUsage || 'Sometimes'}).
*   **USPs:** ${(business.usps || []).join(', ')}.
*   **Contact Info:** ${contactInfo}.
*   **Location:** ${locationLabel}.
*   **Hours/Availability:** ${hoursLabel}.
*   **User Request:** "${visualPrompt.replace(/\n/g, ' ')}".
*   **Keywords:** ${keywords.join(', ')}.
*   **Brand Palette:** ${colorList}.
*   **Tone:** ${business.voice.tone || 'Professional'}.
*   **Negative Constraints:** ${negativePrompt} ${business.voice.negativeKeywords?.join(', ') || ''}.
`;

    // PART 2: THE GAPS (Gemini as Copywriter)
    let CREATIVE_GAPS = `
/// PART 2: THE MISSING PIECES (You Must Write These) ///
*   **HEADLINE:** [MISSING] -> Write a short, powerful headline based on the User Request and Goal (${goal}).
*   **SUB-HEADER:** [MISSING] -> Write a single punchy sentence to support the headline.
*   **BODY COPY:** [MISSING] -> Write relevant ad copy based on the request. If it's a list or infographic, organize the text in the most effective way for the format (e.g., short points, steps, or data labels). Keep it concise.
*   **CONTACT INFO:** [MISSING] -> Format the contact details (${business.profile.website || ''} ${business.profile.contactPhone || ''}) cleanly.
`;

    if (promotion) {
      CREATIVE_GAPS += `*   **PROMO TAG:** [MISSING] -> Incorporate the deal "${promotion}" creatively.
`;
    }

    if (benefits && benefits.length > 0) {
      CREATIVE_GAPS += `*   **KEY BENEFITS:** [MISSING] -> Highlight these key selling points: ${benefits.join(', ')}.
`;
    }

    // CTA & Slogan & Legal
    CREATIVE_GAPS += `*   **CTA:** [MISSING] -> Use the preferred CTA: "${cta}".
`;

    // PART 3: THE VISUAL EXECUTION (Gemini as Photographer)
    let EXECUTION_BLOCK = `
/// PART 3: VISUAL EXECUTION (The Render) ///
*   **Mandate:** You MUST render the text you wrote in PART 2 into the scene.
*   **Text Integration:** Text must be PHYSICAL and match the style material: "${textMat}". NO flat overlays.
*   **Slogan Rule:** ${sloganInstruction}
*   **Subject:** ${hasProduct ? (preserveLikeness ? "Use Reference Image 1 (Product). Use the real product image exactly as provided. Blend it into the scene with realistic lighting." : "Use Reference Image 1 (Product). You may stylize this image to match the artistic direction.") : "Invent a Hero Subject relevant to the industry."}
*   **Logo:** ${hasLogo ? `Place Reference Image ${hasProduct ? '2' : '1'} naturally in the scene.` : "Render the Business Name as a logo."}
`;

    if (compliance) {
      EXECUTION_BLOCK += `*   **Legal/Compliance:** You MUST include the text "${compliance}" in small, legible print at the bottom.\n`;
    }

    if (stylePreset?.imageUrl) {
      EXECUTION_BLOCK += `*   **Style Reference:** Use Reference Image ${hasProduct && hasLogo ? '3' : (hasProduct || hasLogo ? '2' : '1')} as the VISUAL ANCHOR. Mimic its lighting, texture, and mood exactly.\n`;
    }

    if (stylePreset?.promptModifier) {
      EXECUTION_BLOCK += `*   **Style Directive:** ${stylePreset.promptModifier}\n`;
    }

    EXECUTION_BLOCK += `*   **Composition:** Use a commercial, high-end layout. If text is long, ensure there is negative space or a surface to hold it.
*   **Layout Adaptability:** If the user requests an infographic, chart, or specific layout, prioritize that structure over a standard ad layout.
*   **Lighting:** Cinematic, High-Key, or Moody (match the requested vibe).

/// GENERATE ///
Execute. Photorealistic. 8k.
`;

    return HEADER_BLOCK + SOURCE_BLOCK + CREATIVE_GAPS + EXECUTION_BLOCK;
  },

  /**
   * THE EXECUTOR (V3 PLANNED MODE)
   * Takes a STRICT PLAN from the PlannerService and formats it for the Image Model.
   * No thinking, just executing.
   */
  createPlannedImagePrompt: async (
    business: Business,
    plan: any, // The output from PlannerService
    hasProduct: boolean,
    hasLogo: boolean,
    stylePreset?: any // StylePreset
  ): Promise<string> => {

    // Heuristic: Dynamic Color Loop
    const colorList = [
      business.colors.primary ? `${business.colors.primary} (Primary)` : null,
      business.colors.secondary ? `${business.colors.secondary} (Secondary)` : null,
      business.colors.accent ? `${business.colors.accent} (Accent)` : null
    ].filter(Boolean).join(', ');

    return `
/// EXECUTION DIRECTIVE - AUTHORIZED PLAN ///
You are the Lead CGI Artist. You have received a STRICT BLUEPRINT from the Creative Director.
Your job is to EXECUTE this plan with photorealistic fidelity. Do not deviate.

/// 1. THE SCENE (VISUALS) ///
*   **Visual Description:** ${plan.visual_scene}
*   **Lighting & Atmosphere:** ${stylePreset?.promptModifier ? stylePreset.promptModifier : 'Match the description above.'} Use 8k commercial rendering.
*   **Color Palette:** Use ${colorList}.

/// 2. THE CONTENT (TEXT & LOGOS) ///
*   **HEADLINE:** "${plan.headline}"
*   **SUB-TEXT:** "${plan.subhead || ''}"
*   **CTA:** "${plan.cta || ''}"
*   **PLACEMENT:** ${plan.text_placement_instruction}
    -> *Constraint:* Text must be PHYSICAL (neon, printed, embossed). NO flat overlays.

/// 3. THE ASSETS ///
${hasProduct ? `*   **Subject:** Use [Reference Image 1] (Product). Preserve identity exactly.` : `*   **Subject:** Render the subject described in the Visual Scene.`}
${hasLogo ? `*   **Logo:** Use [Reference Image ${hasProduct ? '2' : '1'}]. ${stylePreset?.logoMaterial ? `Render as ${stylePreset.logoMaterial}.` : plan.logo_instruction}` : `*   **Logo:** Render "${business.name}" as a logotype.`}
${stylePreset?.imageUrl ? `*   **Style Ref:** Use Reference Image ${hasProduct && hasLogo ? '3' : (hasProduct || hasLogo ? '2' : '1')} for texture/lighting reference.` : ''}

/// GENERATE ///
Execute Plan. 8k Resolution.
`;
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
