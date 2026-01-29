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
  // Used for: Website Extraction, Social Captions, Server-side Chat
  // Updated Jan 28, 2026: -preview removed (deprecated on Gateway)
  text: 'google/gemini-3-flash' as const,

  // TEXT GENERATION (Direct Google SDK - Client-side)
  // Used for: Browser chat, client-side AI calls
  // Note: Direct SDK requires model name WITHOUT 'google/' prefix
  textDirect: 'gemini-3-flash-preview' as const,

  // IMAGE GENERATION (Direct Google GenAI SDK)
  // Used for: Ad Studio, Image Generator
  // DO NOT CHANGE: This specific preview model requires the direct SDK implementation
  image: 'gemini-3-pro-image-preview' as const,
} as const;

export type AIModelType = typeof AI_MODELS;
