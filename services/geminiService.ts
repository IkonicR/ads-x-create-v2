import { GoogleGenAI, GenerateContentResponse, Chat, FunctionDeclaration, Type, Part } from "@google/genai";
import { Business, StylePreset, GenerationStrategy } from '../types';
import { PromptFactory } from './prompts';
import { getSymbolFromCurrency } from '../utils/currency';
import { supabase } from './supabase';
import { AI_MODELS } from '../config/ai-models';

// Helper to get the client.
const getAiClient = () => {
  // Fallback for VITE_ prefix or standard
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') return null;
  return new GoogleGenAI({ apiKey });
};

// Helper: Fetch image from URL and convert to Base64
const urlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to fetch image for context:", e);
    return null;
  }
};

export const generateAdCopy = async (
  businessName: string,
  productName: string,
  tone: string,
  keywords: string[]
): Promise<string> => {
  const ai = getAiClient();

  if (!ai) {
    return `(Simulated) Magic copy for ${productName} by ${businessName}.`;
  }

  try {
    const model = AI_MODELS.textDirect;
    const prompt = `
      Write a short, punchy ad copy for a business named "${businessName}".
      Product: "${productName}".
      Tone: "${tone}".
      Keywords to include: ${keywords.join(', ')}.
      Keep it under 200 characters.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Could not generate text.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content.";
  }
};

// NOTE: generateTaskSuggestions was removed - Tasks page now uses manual task management.
// AI task suggestions are handled by the Chat CMO assistant if needed.

/**
 * Generate a concise chat title from the first user message
 */
export const generateChatTitle = async (message: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return message.slice(0, 40);

  try {
    const response = await ai.models.generateContent({
      model: AI_MODELS.textDirect,
      contents: `Generate a concise 3-6 word title for this chat request. Be descriptive but brief. No quotes or punctuation at the end.

User message: "${message.slice(0, 200)}"

Title:`,
    });

    const title = response.text?.trim().replace(/^["']|["']$/g, '').slice(0, 60);
    return title || message.slice(0, 40);
  } catch {
    return message.slice(0, 40);
  }
};

export const generateImage = async (
  prompt: string,
  business: Business,
  stylePreset?: StylePreset,
  subjectContext?: {
    type: string;
    name?: string;
    imageUrl: string;
    preserveLikeness: boolean;
    promotion?: string;
    benefits?: string[];
    targetAudience?: string;
    price?: string;
  },
  aspectRatio: string = "1:1",
  modelTier: 'flash' | 'pro' | 'ultra' = 'pro',
  strategy?: GenerationStrategy,
  thinkingMode?: 'LOW' | 'HIGH',
  isFreedomMode?: boolean // NEW: Freedom Mode flag
): Promise<{ jobId: string; status: string }> => {
  console.log(`[GeminiService] Initializing generation for business: ${business.id}`, { prompt, modelTier, aspectRatio, isFreedomMode });

  // Call the server-side API instead of generating client-side
  // This enables job persistence across page refreshes
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: business.id,
      prompt,
      aspectRatio,
      styleId: stylePreset?.id,
      subjectId: subjectContext ? undefined : undefined, // Will be passed via subjectContext
      modelTier,
      thinkingMode,
      strategy,
      subjectContext,
      stylePreset,
      isFreedomMode // NEW: Pass freedom mode to server
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
    console.error(`[GeminiService] \u274C API Error:`, errorData);
    throw new Error(errorData.error || 'Generation failed');
  }

  const data = await response.json();
  console.log(`[GeminiService] \u2705 Generation job created:`, data.jobId);
  return data;
};

// Poll for job completion
export const pollJobStatus = async (jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  asset?: any;
  errorMessage?: string;
}> => {
  const response = await fetch(`/api/generate-image/status/${jobId}`);
  if (!response.ok) {
    console.error(`[GeminiService] Status poll failed for job: ${jobId}`);
    throw new Error('Failed to fetch job status');
  }
  const data = await response.json();
  return data;
};

// Get pending jobs for a business (for page load recovery)
export const getPendingJobs = async (businessId: string): Promise<any[]> => {
  const response = await fetch(`/api/generate-image/pending/${businessId}`);
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.jobs || [];
};

// killJob - forcefully remove a stuck job
export const killJob = async (jobId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/generate-image/job/${jobId}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (error) {
    console.error('[GeminiService] Failed to kill job:', error);
    return false;
  }
};


export const enhanceOffering = async (
  name: string,
  price: string,
  category: string,
  description: string
): Promise<{ description: string, targetAudience: string, benefits: string[], features: string[], promotion: string }> => {

  const ai = getAiClient();
  if (!ai) throw new Error("No API Key");

  const prompt = `
    You are a masterful marketing copywriter.
    Enhance the product strategy for: "${name}" (${category}).
    Price: ${price}.
    Current Description: "${description}".

    Output a valid JSON object with these fields:
    {
      "description": "A compelling, persuasive description (max 2 sentences)",
      "targetAudience": "The ideal buyer persona",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "promotion": "A catchy, realistic promotion idea (e.g. 'Limited Time 20% Off')"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODELS.textDirect,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      description: description,
      targetAudience: "General Public",
      benefits: ["High Quality", "Great Value"],
      features: ["Premium Materials"],
      promotion: "New Arrival"
    };
  }
}

// CHAT SERVICE WITH TOOLS
export const sendChatMessage = async (
  business: Business,
  history: { role: 'user' | 'ai'; text: string; imageUrl?: string }[],
  newMessage: string,
  subjectContext?: { id: string; name: string; type: 'product' | 'person'; imageUrl?: string },
  recentImageUrl?: string
): Promise<{ text: string; image?: string; jobId?: string; jobIds?: string[] }> => {
  const ai = getAiClient();

  if (!ai) {
    return { text: "Please select an API key to start chatting." };
  }

  try {
    // Fetch available styles for AI context (Phase 2)
    const { data: stylesData } = await supabase
      .from('styles')
      .select('id, name, description')
      .limit(15);

    const availableStyles = stylesData || [];

    const systemInstruction = await PromptFactory.createChatSystemInstruction(
      business,
      availableStyles
    );

    const imageGenTool: FunctionDeclaration = {
      name: 'generate_marketing_image',
      description: 'Generates a visual ad image with full control over style, format, and quality. Use when the user wants an image created.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          prompt: {
            type: Type.STRING,
            description: 'Detailed visual description of the ad image to generate.',
          },
          styleId: {
            type: Type.STRING,
            description: 'Optional. The style preset ID. If the user mentions a style name, match it to an ID. Otherwise omit.',
          },
          aspectRatio: {
            type: Type.STRING,
            description: 'Optional. Format options: "1:1" (square/Instagram), "9:16" (story/reel/TikTok), "16:9" (wide/YouTube), "4:5" (IG feed). Default: 1:1',
          },
          modelTier: {
            type: Type.STRING,
            description: 'Optional. "pro" for standard quality (1 credit), "ultra" for 4K print-ready (2 credits). Default: pro',
          },
          isEdit: {
            type: Type.BOOLEAN,
            description: 'Set to true if this is an edit of a previous image in the conversation.',
          },
        },
        required: ['prompt'],
      },
    };

    // Prepare Context for the AI
    let contextMessage = newMessage;
    let imageGenContext: any = undefined;

    if (subjectContext) {
      contextMessage += `\n\n[User attached context: ${subjectContext.type.toUpperCase()} - ${subjectContext.name}]`;

      // Hydrate context for image generation
      imageGenContext = {
        type: subjectContext.type,
        imageUrl: subjectContext.imageUrl || '',
        preserveLikeness: subjectContext.type === 'person', // Default strict for people
      };

      // If Product, try to find details
      if (subjectContext.type === 'product') {
        const offering = business.offerings.find(o => o.id === subjectContext.id);
        if (offering) {
          imageGenContext.promotion = offering.promotion;
          imageGenContext.benefits = offering.benefits;
          imageGenContext.targetAudience = offering.targetAudience;
          imageGenContext.preserveLikeness = offering.preserveLikeness;
        }
      }
    }

    // Build multimodal history
    const multimodalHistory = await Promise.all(history.map(async h => {
      const parts: Part[] = [{ text: h.text }];

      // If this message has an associated image, include it
      if (h.imageUrl) {
        try {
          const imageBase64 = await urlToBase64(h.imageUrl);
          if (imageBase64) {
            parts.push({
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64
              }
            });
          }
        } catch (e) {
          console.warn('Failed to load image for history:', e);
        }
      }

      return {
        role: h.role === 'ai' ? 'model' : 'user',
        parts
      };
    }));

    // If there's a recent image context, add it to current message
    let messageParts: Part[] = [{ text: contextMessage }];
    if (recentImageUrl) {
      const imageBase64 = await urlToBase64(recentImageUrl);
      if (imageBase64) {
        messageParts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageBase64
          }
        });
      }
    }

    const chat = ai.chats.create({
      model: AI_MODELS.textDirect,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [imageGenTool] }],
      },
      history: multimodalHistory
    });

    // @ts-ignore - The SDK types might be slightly off for the beta 'message' param with parts
    const response = await chat.sendMessage({
      message: messageParts
    });

    const functionCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      // Phase 5: Filter for all image generation calls
      const imageGenCalls = functionCalls.filter(c => c?.name === 'generate_marketing_image');

      if (imageGenCalls.length > 0) {
        const jobIds: string[] = [];
        const descriptions: string[] = [];

        // Process ALL image generation calls (not just the first)
        for (const call of imageGenCalls) {
          // @ts-ignore - Extract all parameters from function call
          const imagePrompt = call.args['prompt'] as string;
          const styleId = call.args['styleId'] as string | undefined;
          const aspectRatio = (call.args['aspectRatio'] as string) || '1:1';
          const modelTier = (call.args['modelTier'] as 'pro' | 'ultra') || 'pro';

          // Fetch style preset if AI specified one
          let stylePreset: StylePreset | undefined;
          if (styleId) {
            const { data } = await supabase
              .from('styles')
              .select('*')
              .eq('id', styleId)
              .single();
            if (data) stylePreset = data as StylePreset;
          }

          // Use the job-based generateImage with AI-selected parameters
          const { jobId } = await generateImage(
            imagePrompt,
            business,
            stylePreset,
            imageGenContext,
            aspectRatio,
            modelTier
          );

          jobIds.push(jobId);
          descriptions.push(stylePreset?.name || `${aspectRatio} image`);
        }

        // Build response based on single vs multiple images
        const isBatch = jobIds.length > 1;
        const headerText = isBatch
          ? `Creating ${jobIds.length} images now...`
          : `Creating your image now...`;

        const descList = isBatch
          ? '\n\n' + descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')
          : descriptions[0] ? ` in **${descriptions[0]}**` : '';

        // Return with jobId (single) or jobIds (batch)
        return {
          text: `${headerText}${descList}`,
          image: undefined,
          jobId: isBatch ? undefined : jobIds[0],
          jobIds: isBatch ? jobIds : undefined
        };
      }
    }

    return { text: response.text || "I'm out of ideas right now." };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I'm having trouble connecting to the creative server." };
  }
};