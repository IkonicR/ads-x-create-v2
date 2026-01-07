
import { Business, ProductionPresetConfig, GenerationStrategy } from '../types';
import { StorageService } from './storage';
import { formatBusinessHours } from '../utils/formatters';

// ============================================================================
// V2 GOD-TIER PROMPT WEAVER
// Translates Production Preset Config into Shot Description Language (SDL)
// ============================================================================

/**
 * THE PROMPT WEAVER
 * Converts V2 God-Tier config into precise visual instructions for the AI.
 * Simply passes through whatever values the user entered.
 */
function buildConfigBlock(config: ProductionPresetConfig): string {
  const lines: string[] = [];
  const mc = config.mediumController;
  const ed = mc.executionDetails || {};
  const vp = config.viewpoint;
  const ba = config.brandApplication;
  const lt = config.lighting;
  const ae = config.aesthetics;

  // 1. MEDIUM CONTROLLER
  if (mc.medium) {
    lines.push(`MEDIUM: ${mc.medium}.`);
  }
  // Execution details - include whichever fields are set
  if (ed.cameraSystem) lines.push(`CAMERA SYSTEM: ${ed.cameraSystem}.`);
  if (ed.shotStyle) lines.push(`SHOT STYLE: ${ed.shotStyle}.`);
  if (ed.renderEngine) lines.push(`RENDER ENGINE: ${ed.renderEngine}.`);
  if (ed.style) lines.push(`RENDER STYLE: ${ed.style}.`);
  if (ed.technique) lines.push(`TECHNIQUE: ${ed.technique}.`);
  if (ed.brushwork) lines.push(`BRUSHWORK: ${ed.brushwork}.`);
  if (ed.vectorStyle) lines.push(`VECTOR STYLE: ${ed.vectorStyle}.`);
  if (ed.complexity) lines.push(`COMPLEXITY: ${ed.complexity}.`);

  // 2. VIEWPOINT
  if (vp?.shotType) lines.push(`SHOT TYPE: ${vp.shotType}.`);
  if (vp?.angle) lines.push(`CAMERA ANGLE: ${vp.angle}.`);
  if (vp?.perspective) lines.push(`PERSPECTIVE: ${vp.perspective}.`);
  if (vp?.depthOfField) lines.push(`DEPTH OF FIELD: ${vp.depthOfField}.`);
  if (vp?.framingRule) lines.push(`COMPOSITION: ${vp.framingRule}.`);

  // 3. BRAND APPLICATION (Logo)
  if (ba?.integrationMethod) lines.push(`LOGO INTEGRATION: ${ba.integrationMethod}.`);
  if (ba?.materiality) lines.push(`LOGO MATERIAL: ${ba.materiality}.`);
  if (ba?.lightingInteraction) lines.push(`LOGO LIGHTING: ${ba.lightingInteraction}.`);
  if (ba?.prominence) lines.push(`LOGO PROMINENCE: ${ba.prominence}.`);

  // 4. LIGHTING
  if (lt?.style) lines.push(`LIGHTING STYLE: ${lt.style}.`);
  if (lt?.quality) lines.push(`LIGHT QUALITY: ${lt.quality}.`);
  if (lt?.contrast) lines.push(`CONTRAST: ${lt.contrast}.`);
  if (lt?.temperature) lines.push(`COLOR TEMPERATURE: ${lt.temperature}.`);
  if (lt?.atmospherics) lines.push(`ATMOSPHERICS: ${lt.atmospherics}.`);

  // 5. AESTHETICS
  if (ae?.colorGrade) lines.push(`COLOR GRADE: ${ae.colorGrade}.`);
  if (ae?.clarity) lines.push(`CLARITY: ${ae.clarity}.`);
  if (ae?.textureOverlay) lines.push(`TEXTURE: ${ae.textureOverlay}.`);
  if (ae?.primarySurfaceMaterial) lines.push(`SURFACE MATERIAL: ${ae.primarySurfaceMaterial}.`);

  if (lines.length === 0) return '';

  return `\n/// V2 PRODUCTION PRESET ///\n${lines.join('\n')}\n`;
}

// ============================================================================
// V3.2 PROMPT ENGINE HELPERS
// Dynamic block builders for modular prompt construction
// ============================================================================

/**
 * CONFIG WEAVER - Translates V2 JSON → Natural Language SDL
 */
const ConfigWeaver = {
  medium: (config: ProductionPresetConfig): string => {
    const mc = config.mediumController;
    const ed = mc?.executionDetails || {};
    if (!mc?.medium) return '';

    let result = `**Medium:** ${mc.medium}`;
    if (ed.cameraSystem) result += ` shot with ${ed.cameraSystem}`;
    if (ed.shotStyle) result += `, ${ed.shotStyle} style`;
    if (ed.renderEngine) result += ` rendered in ${ed.renderEngine}`;
    if (ed.technique) result += `, ${ed.technique} technique`;
    return result + '.';
  },

  viewpoint: (config: ProductionPresetConfig): string => {
    const vp = config.viewpoint;
    if (!vp) return '';

    const parts: string[] = [];
    if (vp.shotType) parts.push(vp.shotType);
    if (vp.angle) parts.push(`${vp.angle} angle`);
    if (vp.perspective) parts.push(`${vp.perspective} perspective`);
    if (vp.depthOfField) parts.push(`${vp.depthOfField} DOF`);
    if (vp.framingRule) parts.push(`${vp.framingRule} composition`);

    return parts.length ? `**Viewpoint:** ${parts.join(', ')}.` : '';
  },

  lighting: (config: ProductionPresetConfig): string => {
    const lt = config.lighting;
    if (!lt) return '';

    const parts: string[] = [];
    if (lt.style) parts.push(`${lt.style} lighting`);
    if (lt.quality) parts.push(lt.quality);
    if (lt.contrast) parts.push(`${lt.contrast} contrast`);
    if (lt.temperature) parts.push(`${lt.temperature} temperature`);
    if (lt.atmospherics) parts.push(lt.atmospherics);

    return parts.length ? `**Lighting:** ${parts.join(', ')}.` : '';
  },

  logo: (config: ProductionPresetConfig): string => {
    const ba = config.brandApplication;
    if (!ba) return '';

    const parts: string[] = [];
    if (ba.prominence) parts.push(ba.prominence);
    if (ba.integrationMethod) parts.push(ba.integrationMethod);
    if (ba.materiality) parts.push(`rendered as ${ba.materiality}`);
    if (ba.lightingInteraction) parts.push(`with ${ba.lightingInteraction} lighting`);

    return parts.length ? `Integrate the Logo as ${parts.join(', ')}.` : 'Place logo naturally in scene.';
  },

  textMaterial: (config: ProductionPresetConfig): string => {
    const medium = config.mediumController?.medium?.toLowerCase() || '';

    if (medium.includes('3d') || medium.includes('render')) {
      return '3D geometry with physical weight, ambient occlusion, and realistic shadows';
    } else if (medium.includes('photo')) {
      return 'Printed matter on surfaces (labels, walls) or physical signage (neon, metal cutout)';
    } else if (medium.includes('illust')) {
      return 'Hand-drawn lettering matching the brush strokes and medium';
    }
    return 'Physical and integrated (printed, embossed, neon)';
  },

  aesthetics: (config: ProductionPresetConfig): string => {
    const ae = config.aesthetics;
    if (!ae) return '';

    const parts: string[] = [];
    if (ae.colorGrade) parts.push(`${ae.colorGrade} color grade`);
    if (ae.clarity) parts.push(ae.clarity);
    if (ae.textureOverlay) parts.push(`${ae.textureOverlay} texture`);
    if (ae.primarySurfaceMaterial) parts.push(`${ae.primarySurfaceMaterial} surfaces`);

    return parts.length ? `**Aesthetics:** ${parts.join(', ')}.` : '';
  }
};

/**
 * Build Slogan Block based on sloganProminence preference
 */
function buildSloganBlock(prominence: string, slogan: string): string {
  if (!slogan || prominence === 'hidden') return '';
  return slogan;
}

/**
 * Build Mandatory Elements Block (Contact, Location, Hours) with prominence
 */
function buildMandatoryElementsBlock(
  slogan: string,
  contactValue: string,
  locationLabel: string,
  hoursLabel: string,
  showBusinessName: boolean,
  business: Business,
  prominence: {
    businessName: string;
    contact: string;
    location: string;
    hours: string;
  }
): string {
  const lines: string[] = [];

  // Helper to get prominence hint
  const getHint = (level: string) => {
    if (level === 'prominent') return ' (featured)';
    if (level === 'subtle') return ' (secondary)';
    return '';
  };

  if (slogan) {
    lines.push(`    *   ${slogan}`);
  }
  if (locationLabel && prominence.location !== 'hidden') {
    lines.push(`    *   **Location${getHint(prominence.location)}:** ${locationLabel}`);
  }
  if (hoursLabel && prominence.hours !== 'hidden') {
    lines.push(`    *   **Hours${getHint(prominence.hours)}:** ${hoursLabel}`);
  }
  if (contactValue && prominence.contact !== 'hidden') {
    lines.push(`    *   **Contact${getHint(prominence.contact)}:** ${contactValue}`);
  }
  if (showBusinessName && prominence.businessName !== 'hidden') {
    lines.push(`    *   **Branding${getHint(prominence.businessName)}:** Include "${business.name}"`);
  }

  return lines.join('\n');
}

/**
 * Build Subject Context Block (Product vs Service vs Person vs Location vs Generic)
 */
function buildSubjectContextBlock(
  subjectType: 'product' | 'service' | 'person' | 'location' | 'none',
  subjectData: {
    name?: string;
    description?: string;
    benefits?: string[];
    promotion?: string;
    price?: string;
    role?: string;
    preserveLikeness?: boolean;
  }
): string {
  if (subjectType === 'product' && subjectData.name) {
    const lines = [`    *   **Offer:** ${subjectData.name}.`];
    if (subjectData.price) {
      lines.push(`    *   **Price:** ${subjectData.price}.`);
    }
    if (subjectData.benefits?.length) {
      lines.push(`    *   **Key Benefits:** ${subjectData.benefits.join(', ')}.`);
    }
    if (subjectData.promotion) {
      lines.push(`    *   **Promotion:** ${subjectData.promotion}.`);
    }
    lines.push(`    *   **Directive:** Focus on product fidelity and desirability.`);
    return lines.join('\n');
  } else if (subjectType === 'service' && subjectData.name) {
    const lines = [`    *   **Service:** ${subjectData.name}.`];
    if (subjectData.description) {
      lines.push(`    *   **What it delivers:** ${subjectData.description}.`);
    }
    if (subjectData.benefits?.length) {
      lines.push(`    *   **Key Benefits:** ${subjectData.benefits.join(', ')}.`);
    }
    if (subjectData.price) {
      lines.push(`    *   **Price:** ${subjectData.price}.`);
    }
    if (subjectData.promotion) {
      lines.push(`    *   **Promotion:** ${subjectData.promotion}.`);
    }
    lines.push(`    *   **Directive:** Focus on the outcome, transformation, or experience the service delivers.`);
    return lines.join('\n');
  } else if (subjectType === 'person' && subjectData.name) {
    return `    *   **Subject:** ${subjectData.name} (${subjectData.role || 'Team Member'}).
    *   **Context:** ${subjectData.description || 'Representative of the brand'}.
    *   **Directive:** Capture personality, trust, and professionalism.`;
  } else if (subjectType === 'location' && subjectData.name) {
    const lines = [`    *   **Location:** ${subjectData.name}.`];
    if (subjectData.description) {
      lines.push(`    *   **Atmosphere:** ${subjectData.description}.`);
    }
    lines.push(`    *   **Directive:** Showcase the space as inviting, atmospheric, and on-brand. Use the location image as the main environment.`);
    return lines.join('\n');
  }
  return `    *   **Directive:** Create a relevant scene for the industry.`;
}

/**
 * Build Asset Scene Mapping for multi-asset support
 */
function buildAssetMapping(
  assets: Array<{ type: 'subject' | 'logo' | 'style'; label: string; preserveLikeness?: boolean }>
): string {
  if (!assets.length) return '';

  return assets.map((asset, index) => {
    const refId = index + 1;
    if (asset.type === 'logo') {
      return `    *   **[Ref Image ${refId}]:** LOGO. Apply logo integration rules.`;
    } else if (asset.type === 'style') {
      return `    *   **[Ref Image ${refId}]:** STYLE. Use for lighting/texture reference only.`;
    } else {
      const instruction = asset.preserveLikeness
        ? 'Preserve likeness exactly.'
        : 'May stylize to match direction.';
      return `    *   **[Ref Image ${refId}]:** Main Subject (${asset.label}). ${instruction}`;
    }
  }).join('\n');
}

/**
 * Build Input Assets List for prompt footer
 */
function buildInputAssetsList(
  assets: Array<{ type: 'subject' | 'logo' | 'style'; label: string }>
): string {
  if (!assets.length) return '';

  return assets.map((asset, index) => {
    const refId = index + 1;
    const typeLabel = asset.type === 'logo' ? 'LOGO' : asset.type === 'style' ? 'STYLE' : 'SUBJECT';
    return `*   [Ref Image ${refId}: ${typeLabel} - ${asset.label}]`;
  }).join('\n');
}

/**
 * Build Composition Directive based on asset count
 */
function buildCompositionDirective(subjectCount: number): string {
  if (subjectCount === 0) {
    return 'Create a visually compelling scene relevant to the industry.';
  } else if (subjectCount === 1) {
    return 'Focus on the Main Subject [Ref Image 1].';
  } else {
    return `Arrange the ${subjectCount} subjects in a balanced commercial composition.`;
  }
}

/**
 * Build Color Palette String (dynamic 1-3 colors)
 */
function buildPaletteString(colors: { primary?: string; secondary?: string; accent?: string }): string {
  const parts: string[] = [];
  if (colors.primary) parts.push(`${colors.primary} (Primary)`);
  if (colors.secondary) parts.push(`${colors.secondary} (Secondary)`);
  if (colors.accent) parts.push(`${colors.accent} (Accent)`);
  return parts.length ? parts.join(', ') : 'Use brand-appropriate colors';
}

/**
 * Map font name to descriptive style
 */
function mapFontToDescription(fontName: string): string {
  const font = fontName?.toLowerCase() || '';
  if (font.includes('inter') || font.includes('roboto') || font.includes('helvetica') || font.includes('arial')) {
    return 'Modern, Clean, Geometric Sans-Serif';
  } else if (font.includes('playfair') || font.includes('merriweather') || font.includes('georgia') || font.includes('times')) {
    return 'Elegant, High-Contrast Serif';
  } else if (font.includes('montserrat') || font.includes('poppins') || font.includes('outfit')) {
    return 'Contemporary, Friendly Sans-Serif';
  } else if (font.includes('bebas') || font.includes('impact') || font.includes('oswald')) {
    return 'Bold, Condensed Display';
  }
  return fontName || 'Professional typography';
}


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

    if ((mode as string) === 'always_open') {
      availability = `Operates 24/7 Online${timezone}. Emphasize 'shop anytime' convenience.`;
    } else if ((mode as string) === 'appointment_only') {
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
    stylePreset?: any,
    price?: string,
    subjectName?: string, // Product/Person Name
    strategy?: GenerationStrategy, // Strategy override
    isFree?: boolean, // NEW: Free offering flag
    termsAndConditions?: string // NEW: Per-offering T&Cs
  ): Promise<string> => {
    const customPrompts = await StorageService.getSystemPrompts();

    // --- 1. INTELLIGENT DATA PARSING & PREPARATION ---
    const hasLogo = !!business.logoUrl;
    const hasProduct = visualPrompt.includes("PRIMARY SUBJECT:");

    // Ad Preferences Logic
    const prefs = business.adPreferences;

    // --- GOAL: Strategy mode overrides Ad Preferences ---
    // Map campaign preset mode to goal text
    const modeToGoal: Record<string, string> = {
      flash_sale: 'Drive Urgent Sales',
      awareness: 'Brand Awareness',
      local: 'Drive Local Foot Traffic',
      educational: 'Educate & Build Trust',
      custom: prefs?.goals || 'Brand Awareness'
    };
    const goal = strategy?.mode ? modeToGoal[strategy.mode] || prefs?.goals || 'Brand Awareness' : prefs?.goals || 'Brand Awareness';

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

    const cta = prefs?.preferredCta || ''; // Empty = let AI decide
    const globalCompliance = prefs?.complianceText || '';
    // Combine per-offering T&Cs with global compliance
    const compliance = [termsAndConditions, globalCompliance].filter(Boolean).join('. ');
    const sloganProminence = prefs?.sloganProminence || 'standard';

    // --- STRATEGY OVERRIDES ---
    // If strategy is set, use its values. Otherwise, fall back to defaults.
    const effectiveShowPrice = strategy?.showPrice !== undefined ? strategy.showPrice : true;
    const effectiveShowPromo = strategy?.showPromo !== undefined ? strategy.showPromo : true;
    // Custom CTA: use strategy's if it has a value (not empty string), otherwise fall back to Ad Preferences
    let effectiveCta = (strategy?.customCta && strategy.customCta.trim() !== '') ? strategy.customCta : cta;
    if (effectiveCta.toLowerCase() === 'learn more') {
      effectiveCta = '';
    }
    const effectiveFraming = strategy?.productFraming || 'hero'; // Default to hero
    const effectiveTeamFraming = strategy?.teamFraming || 'portrait';
    const effectiveStrictLikeness = strategy?.strictLikeness !== undefined ? strategy.strictLikeness : preserveLikeness;

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
      // Fallback: Check for "isPrimary" contacts in the new hub
      const primaryContacts = allContacts.filter(c => c.isPrimary);
      primaryContacts.forEach(contact => {
        if (contact.value) {
          let label = contact.label || contact.type;
          label = label.charAt(0).toUpperCase() + label.slice(1);
          parts.push(`${label}: ${contact.value}`);
        }
      });
      // No legacy fallback - Contact Hub is the only source
    }

    contactInfo = parts.join(' | ');

    // --- NEW: LANGUAGE LOGIC ---
    const targetLanguage = prefs?.targetLanguage || 'English';

    // --- NEW: LOCATION LOGIC ---
    let locationLabel = business.profile.publicLocationLabel || business.profile.address || "Online";
    if (prefs?.locationDisplay === 'custom_text' && prefs?.locationText) {
      locationLabel = prefs.locationText;
    } else if (prefs?.locationDisplay === 'city_state') {
      locationLabel = business.profile.publicLocationLabel || "Check website for location";
    } else if (prefs?.locationDisplay === 'online_only') {
      locationLabel = "Online / Global Shipping";
    } else if (prefs?.locationDisplay === 'hidden') {
      locationLabel = "";
    }

    // --- HOURS LOGIC ---
    let hoursLabel = "";

    // For non-storefront modes, respect the showHours toggle
    const isStorefront = business.profile.operatingMode === 'storefront' || !business.profile.operatingMode;
    const shouldShowHours = isStorefront || business.profile.showHours === true;

    if (!shouldShowHours) {
      hoursLabel = ""; // Toggle is OFF - no hours in prompt
    } else if (prefs?.holidayMode?.isActive) {
      hoursLabel = `SPECIAL EVENT: ${prefs.holidayMode.name} (${prefs.holidayMode.hours})`;
    } else {
      // Hardened Login: Check for hidden FIRST
      if (prefs?.hoursDisplay === 'hidden') {
        hoursLabel = ""; // Strict hidden
      } else {
        switch (prefs?.hoursDisplay) {
          case 'custom_text':
            hoursLabel = prefs.hoursText || "Contact for hours";
            break;
          case 'all_hours':
            hoursLabel = formatBusinessHours(business.profile.hours);
            break;
          case 'weekends_only':
            // Filter to only Sat/Sun and format
            const weekendHours = (business.profile.hours || []).filter(h => ['Sat', 'Sun'].includes(h.day));
            hoursLabel = formatBusinessHours(weekendHours, { includeClosed: true });
            break;
          case 'custom_selection':
            const selectedDays = prefs.hoursDisplayDays || [];
            const selectedHours = (business.profile.hours || []).filter(h => selectedDays.includes(h.day));
            hoursLabel = formatBusinessHours(selectedHours, { includeClosed: true });
            break;
          default:
            // Fallback only if undefined or unknown (safest default)
            hoursLabel = formatBusinessHours(business.profile.hours);
        }
      }
    }

    let sloganInstruction = "";
    if (sloganProminence !== 'hidden' && business.voice.slogan) {
      if (sloganProminence === 'prominent') {
        sloganInstruction = `Brand Slogan (featured): "${business.voice.slogan}"`;
      } else if (sloganProminence === 'subtle') {
        sloganInstruction = `Brand Slogan (secondary): "${business.voice.slogan}"`;
      } else {
        sloganInstruction = `Brand Slogan: "${business.voice.slogan}"`;
      }
    }

    // Text Material Logic
    const textMat = stylePreset?.textMaterial || "Physical and integrated (e.g. printed, embossed, neon)";

    // Brand Palette
    const colorList = [
      business.colors.primary ? `${business.colors.primary} (Primary)` : null,
      business.colors.secondary ? `${business.colors.secondary} (Secondary)` : null,
      business.colors.accent ? `${business.colors.accent} (Accent)` : null
    ].filter(Boolean).join(', ');

    // Subject Instruction
    const subjectInstruction = hasProduct
      ? (preserveLikeness ? "Use Reference Image 1 (Product). Use the real product image exactly as provided. Blend it into the scene with realistic lighting." : "Use Reference Image 1 (Product). You may stylize this image to match the artistic direction.")
      : "Invent a Hero Subject relevant to the industry.";

    // Keywords
    const keywordsString = keywords.join(', ');
    const negativeKeywordsString = negativePrompt + (business.voice.negativeKeywords?.join(', ') || '');

    // --- 2. HYBRID INJECTION (THE MERGER) ---
    // Check for DB Override ("Template")
    if (customPrompts?.imageGenRules && customPrompts.imageGenRules.length > 10) {
      let template = customPrompts.imageGenRules;

      // A. Standard Token Replacement
      template = template
        .replace('{{TIMESTAMP}}', Date.now().toString().slice(-4))
        .replace('{{GOAL}}', goal)
        .replace('{{TARGET_AUDIENCE}}', audience)
        .replace('{{BUSINESS_NAME}}', business.name)
        .replace('{{INDUSTRY}}', business.industry)
        .replace('{{SLOGAN}}', business.voice.slogan || '')
        .replace('{{USAGE_RULE}}', sloganProminence)
        .replace('{{USP_1}}', business.usps?.[0] || '') // Legacy support
        .replace('{{USP_2}}', business.usps?.[1] || '') // Legacy support
        .replace('{{USP_3}}', business.usps?.[2] || '') // Legacy support
        .replace('{{USPS}}', (business.usps || []).join(', ')) // New Token
        .replace('{{WEBSITE}}', business.profile.website || '')
        .replace('{{PHONE}}', business.profile.contactPhone || '') // Legacy Token
        .replace('{{CONTACT_INFO}}', contactInfo) // New Token
        .replace('{{LOCATION}}', locationLabel) // New Token
        .replace('{{HOURS}}', hoursLabel) // New Token
        .replace('{{VISUAL_PROMPT}}', visualPrompt)
        .replace('{{KEYWORDS}}', keywordsString)
        .replace('{{COLOR_PRIMARY}}', business.colors.primary)
        .replace('{{COLOR_SECONDARY}}', business.colors.secondary)
        .replace('{{TONE}}', business.voice.tone || 'Professional')
        .replace('{{NEGATIVE_KEYWORDS}}', negativeKeywordsString)
        .replace('{{PROMOTION}}', promotion || '')
        .replace('{{BENEFITS_LIST}}', benefits?.join(', ') || '')
        .replace('{{CTA}}', cta)
        .replace('{{SUBJECT_INSTRUCTION}}', subjectInstruction)
        .replace('{{COMPLIANCE_TEXT}}', compliance)
        .replace('{{LANGUAGE}}', targetLanguage); // New Token

      // B. Smart Append (Safety Net)
      // If critical tokens were missing from the template, append them as mandates.

      // Language Mandate
      if (!customPrompts.imageGenRules.includes('{{LANGUAGE}}')) {
        template += `\n\nSYSTEM MANDATE: Write ALL copy in ${targetLanguage}.`;
      }

      // Contact Info Mandate (if not using the specific token or the legacy phone token)
      if (!customPrompts.imageGenRules.includes('{{CONTACT_INFO}}') && !customPrompts.imageGenRules.includes('{{PHONE}}')) {
        // Only append if we actually have contact info to show
        if (contactInfo) {
          template += `\n\nSYSTEM MANDATE: Contact Details: ${contactInfo}`;
        }
      }

      // Subject Instruction Mandate (Critical for product rendering)
      if (!customPrompts.imageGenRules.includes('{{SUBJECT_INSTRUCTION}}')) {
        template += `\n\nSYSTEM MANDATE: Subject Handling: ${subjectInstruction}`;
      }

      // Compliance Mandate
      if (compliance && !customPrompts.imageGenRules.includes('{{COMPLIANCE_TEXT}}')) {
        template += `\n\nSYSTEM MANDATE: Legal Requirement: Include text "${compliance}".`;
      }

      return template;
    }

    // --- 3. V3.2 DEFAULT TEMPLATE ---
    // Modular block architecture with conditional injection

    // Determine subject type from visualPrompt (includes "PRIMARY SUBJECT: <type>")
    // Note: Supports product, service, person, location, or none
    let subjectType: 'product' | 'service' | 'person' | 'location' | 'none' = 'none';
    if (visualPrompt.includes('PRIMARY SUBJECT: product')) {
      subjectType = 'product';
    } else if (visualPrompt.includes('PRIMARY SUBJECT: service')) {
      subjectType = 'service';
    } else if (visualPrompt.includes('PRIMARY SUBJECT: person')) {
      subjectType = 'person';
    } else if (visualPrompt.includes('PRIMARY SUBJECT: location')) {
      subjectType = 'location';
    }

    const showBusinessName = prefs?.showBusinessName !== false; // Default true
    const negativeConstraints = !showBusinessName ? `Do NOT include the text "${business.name}" in the image.` : '';

    // Build dynamic blocks using V3.2 helpers
    const paletteString = buildPaletteString(business.colors);
    const fontDesc = mapFontToDescription(business.typography?.headingFont || '');
    const sloganBlock = buildSloganBlock(sloganProminence, business.voice.slogan || '');
    const mandatoryElementsBlock = buildMandatoryElementsBlock(
      sloganInstruction,
      contactInfo,
      locationLabel,
      hoursLabel,
      showBusinessName,
      business,
      {
        businessName: prefs?.businessNameProminence || 'standard',
        contact: prefs?.contactProminence || 'standard',
        location: prefs?.locationProminence || 'standard',
        hours: prefs?.hoursProminence || 'standard'
      }
    );

    // Format price with currency symbol (or "Free" if isFree)
    const currencySymbol = business.currency === 'ZAR' ? 'R'
      : business.currency === 'USD' ? '$'
        : business.currency === 'EUR' ? '€'
          : business.currency === 'GBP' ? '£'
            : business.currency || '';
    const formattedPrice = isFree ? 'Free' : (price ? `${currencySymbol}${parseFloat(price).toFixed(2)}` : '');

    // STRATEGY: Only include if showPrice is true, UNLESS it's free (Free is always a good hook)
    const shouldShowPrice = isFree || effectiveShowPrice;

    const subjectContextBlock = buildSubjectContextBlock(subjectType, {
      name: subjectName || 'Featured Product', // Use actual product name
      benefits: benefits,
      promotion: effectiveShowPromo ? promotion : undefined, // STRATEGY: Only include if showPromo is true
      price: shouldShowPrice ? formattedPrice : undefined,
      preserveLikeness: effectiveStrictLikeness
    });

    // Framing directive (from strategy)
    let framingDirective = '';
    if (subjectType === 'product') {
      framingDirective = effectiveFraming === 'lifestyle'
        ? '*   **Framing:** Show the product in a real-world context, being used or in a lifestyle setting.'
        : '*   **Framing:** Focus on the product itself, dramatic spotlight, studio-quality hero shot.';
    } else if (subjectType === 'person') {
      framingDirective = effectiveTeamFraming === 'action'
        ? '*   **Framing:** Show the person in action, dynamic, doing their job.'
        : '*   **Framing:** Professional portrait, approachable, trust-building.';
    } else if (subjectType === 'service') {
      const serviceFraming = strategy?.serviceFraming || 'in_action';
      if (serviceFraming === 'in_action') {
        framingDirective = '*   **Framing:** Show the service being performed, human interaction, the process in motion.';
      } else if (serviceFraming === 'outcome') {
        framingDirective = '*   **Framing:** Focus on the result/transformation after the service, the happy outcome.';
      } else if (serviceFraming === 'abstract') {
        framingDirective = '*   **Framing:** Conceptual, symbolic representation of the service value and benefits.';
      }
    } else if (subjectType === 'location') {
      const locationFraming = strategy?.locationFraming || 'exterior';
      if (locationFraming === 'exterior') {
        framingDirective = '*   **Framing:** Showcase the storefront facade, inviting entrance, curb appeal.';
      } else if (locationFraming === 'interior') {
        framingDirective = '*   **Framing:** Warm interior atmosphere, welcoming space, cozy ambiance.';
      } else if (locationFraming === 'detail') {
        framingDirective = '*   **Framing:** Architectural details, craftsmanship, textures, ambiance close-ups.';
      } else if (locationFraming === 'crowd') {
        framingDirective = '*   **Framing:** Show activity, customers enjoying the space, community vibe.';
      }
    }

    // Pain point (conditionally included)
    const painPointLine = business.coreCustomerProfile?.painPoints?.[0]
      ? `*   **Psych Hook:** "${business.coreCustomerProfile.painPoints[0]}" (Visualise the solution).`
      : '';

    // Holiday context (conditionally included)
    const holidayContext = prefs?.holidayMode?.isActive
      ? `${prefs.holidayMode.name}: ${prefs.holidayMode.hours}`
      : '';

    // --- BRAND SIGNATURES (Visual Motifs) ---
    // Simple keywords the AI can creatively incorporate (respecting prominence)
    const motifs = (business.visualMotifs || [])
      .filter(m => m.prominence !== 'hidden')
      .map(m => {
        if (m.prominence === 'prominent') return `${m.name} (featured)`;
        if (m.prominence === 'subtle') return `${m.name} (secondary)`;
        return m.name;
      });

    const brandSignaturesLine = motifs.length
      ? `*   **Brand Signatures:** Creatively incorporate: ${motifs.join(', ')}.`
      : '';   // Build asset list for reference
    const assets: Array<{ type: 'subject' | 'logo' | 'style'; label: string; preserveLikeness?: boolean }> = [];
    if (hasProduct) {
      assets.push({ type: 'subject', label: 'Product', preserveLikeness });
    }
    if (hasLogo) {
      assets.push({ type: 'logo', label: business.name });
    }
    // Multi-image style references (use active ones from referenceImages[], fallback to imageUrl)
    const activeStyleImages = (stylePreset?.referenceImages || [])
      .filter((img: any) => img.isActive && img.url)
      .map((img: any, idx: number) => ({
        type: 'style' as const,
        label: `${stylePreset?.name || 'Style'} ${idx + 1}`
      }));
    if (activeStyleImages.length > 0) {
      assets.push(...activeStyleImages);
    } else if (stylePreset?.imageUrl) {
      // Legacy fallback: single image
      assets.push({ type: 'style', label: stylePreset?.name || 'Style Reference' });
    }

    const assetMapping = buildAssetMapping(assets);
    const inputAssetsList = buildInputAssetsList(assets);
    const compositionDirective = buildCompositionDirective(hasProduct ? 1 : 0);

    // V2 Config SDL (if available)
    let v2ProductionBlock = '';
    if (stylePreset?.config?.schemaVersion === '3.0') {
      const config = stylePreset.config;
      const mediumSDL = ConfigWeaver.medium(config);
      const viewpointSDL = ConfigWeaver.viewpoint(config);
      const lightingSDL = ConfigWeaver.lighting(config);
      const aestheticsSDL = ConfigWeaver.aesthetics(config);
      const logoSDL = ConfigWeaver.logo(config);
      const textMaterialSDL = ConfigWeaver.textMaterial(config);

      v2ProductionBlock = `
/// SECTION 4: VISUAL PRODUCTION (V2 God-Tier) ///
${mediumSDL}
${viewpointSDL}
${lightingSDL}
${aestheticsSDL}
*   **LOGO:** ${logoSDL}
*   **Text Materiality:** ${textMaterialSDL}.
`;
    } else {
      // Fallback for non-V2 styles
      v2ProductionBlock = `
/// SECTION 4: VISUAL PRODUCTION ///
*   **Style:** ${stylePreset?.promptModifier || 'Commercial, high-end aesthetic'}.
*   **Text Materiality:** ${textMat}.
`;
    }

    // --- THE V3.2 TEMPLATE ---
    const V3_2_PROMPT = `
/// SYSTEM: VIRTUAL PRODUCTION BRIEF ///
**ROLE:** Elite Creative Director & Lead CGI Artist.
**MISSION:** Synthesize a high-performance commercial image adhering to the following brief.

/// SECTION 1: THE BRAND IDENTITY (Immutable) ///
*   **Brand:** ${business.name} (${business.industry}).
*   **Archetype:** ${business.voice.archetype || 'Professional'} (${(business.voice.tonePills || []).join(', ') || business.voice.tone || 'Quality-focused'}).
*   **Visual Identity:**
    *   **Palette:** ${paletteString}.
    *   **Typography:** ${fontDesc}.

/// SECTION 2: THE STRATEGY (Context) ///
*   **User Request:** "${visualPrompt.replace(/\n/g, ' ')}".
*   **Goal:** ${goal}.
*   **Audience:** ${audience}.
${painPointLine}
*   **Context:**
${subjectContextBlock}
${framingDirective}
${holidayContext ? `    *   **Seasonality:** ${holidayContext} (Incorporate without overriding brand identity).` : ''}
${brandSignaturesLine}

/// SECTION 3: CREATIVE COPYWRITING ///
*   **Instruction:** Write high-impact copy. Adapt length/format to the User Request.
*   **Language:** ${targetLanguage}.
*   **HEADLINE:** [MISSING] -> Address the Hook/User Request.
*   **BODY COPY:** [MISSING] -> Supporting text (keep legible).
*   **CTA:** ${effectiveCta ? `"${effectiveCta}"` : '[MISSING] -> Write a high-converting, specific CTA.'}.
*   **MANDATORY ELEMENTS:**
${sloganBlock}
${mandatoryElementsBlock}
${compliance ? `*   **COMPLIANCE:** "${compliance}" (Legal footer, small print).` : ''}
${v2ProductionBlock}
/// SECTION 5: TECHNICAL MANDATES ///
1.  **DIEGETIC TEXT (CRITICAL):**
    *   **Rule:** Text must be PHYSICALLY INTEGRATED. NO flat digital overlays.
    *   **Physics:** Text must cast shadows, reflect scene lighting, and respect perspective.
2.  **LOGO TEXT FIDELITY (CRITICAL):**
    *   **Rule:** The logo reference image contains the exact brand name and lettering.
    *   **Mandate:** Reproduce ALL text from the logo EXACTLY as shown. Do NOT invent, substitute, or modify any words.
    *   **Allow:** Stylize the logo's material, color, and integration per style rules — but the TEXT must remain identical.
3.  **ASSET HANDLING:**
${assetMapping || '    *   No specific assets. Create a relevant scene.'}
4.  **COMPOSITION:** ${compositionDirective}
${negativeConstraints ? `5.  **NEGATIVE CONSTRAINTS:** ${negativeConstraints}` : ''}

/// GENERATE ///
Execute. High fidelity. 8k resolution.
`;

    return V3_2_PROMPT;
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
