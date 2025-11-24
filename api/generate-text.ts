import { google } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { messages, prompt, system, modelTier = 'standard', stream = false } = await req.json();

    // Select Model based on Tier
    // 'premium' -> gemini-3-pro-preview (or whatever the latest identifier is)
    // 'standard' -> gemini-2.0-flash
    const modelName = modelTier === 'premium' ? 'gemini-1.5-pro' : 'gemini-2.0-flash'; 
    // Note: Vercel SDK might map 'gemini-1.5-pro' to the latest available. 
    // Keeping it safe with known models for now, can be updated to 'gemini-3-pro-preview' if supported by provider key.
    
    const model = google(modelName);

    if (stream) {
      const result = streamText({
        model,
        messages: messages || [{ role: 'user', content: prompt }],
        system,
      });
      return result.toDataStreamResponse();
    } else {
      const result = await generateText({
        model,
        messages: messages || [{ role: 'user', content: prompt }],
        system,
      });
      return new Response(JSON.stringify({ text: result.text }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate text' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
