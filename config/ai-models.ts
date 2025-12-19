/**
 * AI Model Configuration
 * Centralized source of truth for all AI models used in the application.
 * 
 * ARCHITECTURE NOTE:
 * - Text Models: Accessed via Vercel AI Gateway (@ai-sdk/gateway)
 * - Image Models: Accessed via Google GenAI SDK direct (@google/genai)
 */

export const AI_MODELS = {
  // TEXT GENERATION (Vercel AI Gateway)
  // Used for: Website Extraction, Social Captions, Chat
  text: 'google/gemini-3-flash' as const,

  // IMAGE GENERATION (Direct Google GenAI SDK)
  // Used for: Ad Studio, Image Generator
  // DO NOT CHANGE: This specific preview model requires the direct SDK implementation
  image: 'gemini-3-pro-image-preview' as const, 
} as const;

export type AIModelType = typeof AI_MODELS;
