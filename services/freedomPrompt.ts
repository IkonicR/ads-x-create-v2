/**
 * FREEDOM MODE PROMPT
 * 
 * A simplified prompt for creative freedom - brand colors and logo only.
 * No mandatory business info (contact, hours, address, compliance).
 * 
 * This is SEPARATE from the main prompts.ts to avoid touching production code.
 */

import { Business } from '../types';

/**
 * Build a simplified color palette string
 */
const buildPaletteString = (colors: { primary?: string; secondary?: string; accent?: string }): string => {
    const parts: string[] = [];
    if (colors.primary) parts.push(colors.primary);
    if (colors.secondary) parts.push(colors.secondary);
    if (colors.accent) parts.push(colors.accent);
    return parts.length > 0 ? parts.join(', ') : 'modern brand colors';
};

/**
 * Create a Freedom Mode prompt - brand alignment without mandatory business info
 * 
 * @param userPrompt - The user's creative prompt
 * @param business - The business for brand context
 * @param aspectRatio - The target aspect ratio
 * @returns The complete prompt string
 */
export const createFreedomModePrompt = (
    userPrompt: string,
    business: Business,
    aspectRatio: string = '1:1'
): string => {
    // Extract brand colors
    const palette = buildPaletteString(business.colors || {});

    // Build the prompt
    const prompt = `
## CREATIVE FREEDOM MODE

You are generating a creative visual for ${business.name || 'a brand'}.

### USER'S VISION
${userPrompt}

### BRAND CONTEXT
- **Color Palette:** ${palette}
${business.logoUrl ? `- **Logo:** Brand logo is provided as an input image.` : ''}

### GUIDELINES
- **Aspect ratio:** ${aspectRatio}
- **Logo integration:** The logo must look like part of the design — not pasted on afterwards. Match the visual treatment (color grading, texture, lighting) of the rest of the piece.
- All text must be diegetic (part of the scene) and spelled correctly.
- The user's prompt is the priority.
- No contact info, business hours, address, slogan, or compliance text unless the user explicitly asks for it.
`.trim();

    return prompt;
};

/**
 * Check if a generation should use Freedom Mode
 */
export const isFreedomModeGeneration = (mode?: boolean): boolean => {
    return mode === true;
};
