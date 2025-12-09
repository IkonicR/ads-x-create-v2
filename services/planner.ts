
import { GoogleGenAI, Type } from "@google/genai";
import { Business, StylePreset } from '../types';
import { getSymbolFromCurrency } from '../utils/currency';

// Define the Output Schema for the Planner
const PLANNER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    visual_scene: {
      type: Type.STRING,
      description: "Detailed visual description of the scene, lighting, and subject. Must be purely visual.",
    },
    headline: {
      type: Type.STRING,
      description: "The main headline text to render. Must be short and punchy.",
    },
    subhead: {
      type: Type.STRING,
      description: "Supporting text or a list of items (if requested). Keep it concise.",
    },
    cta: {
      type: Type.STRING,
      description: "Call to action text (e.g. 'Shop Now').",
    },
    text_placement_instruction: {
      type: Type.STRING,
      description: "Specific instructions on WHERE and HOW to render the text based on the Preset rules.",
    },
    logo_instruction: {
      type: Type.STRING,
      description: "Specific instruction on how to integrate the logo physically (material, surface).",
    }
  },
  required: ["visual_scene", "headline", "text_placement_instruction"],
};

export const PlannerService = {
  /**
   * THE STRATEGIC BRAIN (Gemini 2.5 Flash)
   * Takes User Intent + Preset Rules -> Outputs a Strict Execution Plan.
   */
  planAd: async (
    business: Business,
    userPrompt: string,
    preset: StylePreset | undefined,
    marketingContext?: { promotion?: string; targetAudience?: string }
  ) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });

    // 1. Context Construction
    const currency = getSymbolFromCurrency(business.currency || 'USD');
    const presetRules = preset?.config ? JSON.stringify(preset.config) : "NO_PRESET_SELECTED (Use Commercial Best Practices)";

    const systemPrompt = `
      ROLE: You are the Creative Director for "${business.name}" (${business.industry}).
      GOAL: Plan a high-conversion ad asset based on the User Request and the Strict Preset Rules.

      INPUTS:
      - User Request: "${userPrompt}"
      - Brand Tone: "${business.voice.tone}"
      - Brand Slogan: "${business.voice.slogan}"
      - Target Audience: "${marketingContext?.targetAudience || 'General'}"
      - Promotion: "${marketingContext?.promotion || 'None'}"
      
      STRICT PRESET BLUEPRINT (DO NOT DEVIATE):
      ${presetRules}

      INSTRUCTIONS:
      1. VISUAL SCENE: Write a vivid description of the image. Match the Lighting/Camera rules from the Preset.
      2. COPYWRITING: Write the Headline and Subhead. 
         - If the User Request implies a list (e.g. "5 tips"), write the tips in the 'subhead' field.
         - If the Preset has specific text slots, fill them.
      3. PLACEMENT: Combine the Preset's 'layout' and 'text_slots' into a clear instruction for the artist (e.g. "Headline goes Top Left in Bold Sans").
    `;

    // 2. Execute Planner
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: PLANNER_SCHEMA,
        }
      });

      const plan = JSON.parse(response.text || "{}");
      console.log("[Planner] Success:", plan);
      return plan;

    } catch (error) {
      console.error("[Planner] Failed:", error);
      // Fallback: Return a basic plan if the AI fails
      return {
        visual_scene: userPrompt,
        headline: business.name,
        text_placement_instruction: "Center the subject.",
        logo_instruction: "Place logo naturally."
      };
    }
  }
};
