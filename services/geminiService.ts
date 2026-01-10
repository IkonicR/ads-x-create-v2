import { GoogleGenAI, GenerateContentResponse, Chat, FunctionDeclaration, Type, Part } from "@google/genai";
import { Business, StylePreset, GenerationStrategy } from '../types';
import { PromptFactory } from './prompts';
import { getSymbolFromCurrency } from '../utils/currency';
import { supabase } from './supabase';

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
    const model = 'gemini-2.5-flash';
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



export const generateTaskSuggestions = async (businessDescription: string): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) {
    return ["Review Q3 Marketing Plan", "Update Social Media Assets", "Launch New Product Campaign"];
  }

  try {
    const prompt = await PromptFactory.createTaskSuggestionPrompt(businessDescription);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error(e);
    return ["Check Analytics", "Draft Newsletter"];
  }
}

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
  thinkingMode?: 'LOW' | 'HIGH' // NEW: Optional thinking mode
): Promise<{ jobId: string; status: string }> => {
  console.log(`[GeminiService] Initializing generation for business: ${business.id}`, { prompt, modelTier, aspectRatio });

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
      thinkingMode, // NEW: Pass thinking mode to server
      strategy,
      subjectContext,
      stylePreset
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
      model: 'gemini-2.5-flash',
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
  history: { role: 'user' | 'ai'; text: string }[],
  newMessage: string,
  subjectContext?: { id: string; name: string; type: 'product' | 'person'; imageUrl?: string }
): Promise<{ text: string; image?: string }> => {
  const ai = getAiClient();

  if (!ai) {
    return { text: "Please select an API key to start chatting." };
  }

  try {
    const systemInstruction = await PromptFactory.createChatSystemInstruction(business);

    const imageGenTool: FunctionDeclaration = {
      name: 'generate_marketing_image',
      description: 'Generates a visual ad image based on a prompt.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          prompt: {
            type: Type.STRING,
            description: 'The visual description of the image to generate.',
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

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [imageGenTool] }],
      },
      history: history.map(h => ({
        role: h.role === 'ai' ? 'model' : 'user',
        parts: [{ text: h.text }]
      }))
    });

    const response = await chat.sendMessage({
      message: contextMessage
    });

    const functionCalls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call && call.name === 'generate_marketing_image') {
        // @ts-ignore
        const imagePrompt = call.args['prompt'] as string;

        // Use the job-based generateImage - returns job ID, not base64
        const { jobId } = await generateImage(
          imagePrompt,
          business,
          undefined, // No style preset for chat yet
          imageGenContext, // Pass the hydrated context
          '1:1',
          'pro'
        );

        // Return a message with the job ID - UI can poll for completion
        return {
          text: `I'm generating that image for you based on: "${imagePrompt}". Head to the Generator tab to see it when it's ready!`,
          image: undefined // No immediate image - job is processing
        };
      }
    }

    return { text: response.text || "I'm out of ideas right now." };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I'm having trouble connecting to the creative server." };
  }
};