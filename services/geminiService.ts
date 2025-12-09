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
    name?: string; // Product/Person name
    imageUrl: string;
    preserveLikeness: boolean;
    promotion?: string;
    benefits?: string[];
    targetAudience?: string;
    price?: string;
  },
  aspectRatio: string = "1:1",
  modelTier: 'flash' | 'pro' | 'ultra' = 'pro',
  strategy?: GenerationStrategy // NEW: Strategy override
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) throw new Error("Gemini API Key not found");

  // 1. Prepare Prompt Inputs
  let visualPrompt = prompt;
  if (subjectContext) {
    visualPrompt += `\nPRIMARY SUBJECT: ${subjectContext.type}. ${subjectContext.preserveLikeness ? 'Maintain strict visual likeness.' : ''}`;
  }

  // 2. Generate the "Job Ticket" Prompt
  const finalPrompt = await PromptFactory.createImagePrompt(
    business,
    visualPrompt,
    business.voice.keywords || [],
    (stylePreset?.avoid || []).join(', '),
    undefined, // logoMaterial - now handled by config.brandApplication
    undefined, // logoPlacement - now handled by config.brandApplication
    subjectContext?.promotion, // Promotion
    subjectContext?.benefits, // Benefits
    subjectContext?.targetAudience || business.adPreferences?.targetAudience, // Target Audience
    subjectContext?.preserveLikeness || false, // Preserve Likeness
    stylePreset,
    subjectContext?.price, // Price
    subjectContext?.name, // Product/Person Name
    strategy // Strategy override
  );

  console.log("[Gemini] Strategy Override:", strategy);
  console.log("[Gemini] Generated Prompt:", finalPrompt);

  // DEBUG BYPASS: Skip API call if prompt starts with 'debug:'
  if (prompt.toLowerCase().startsWith('debug:')) {
    console.log("[Gemini] DEBUG MODE: Skipping Image Generation");
    return "https://placehold.co/1024x1024/png?text=DEBUG+MODE";
  }

  // 3. Select Model
  let modelName = 'gemini-3-pro-image-preview'; // Default to Pro
  // if (modelTier === 'ultra') modelName = 'gemini-3-pro-image-preview'; // Placeholder for Ultra
  // if (modelTier === 'flash') modelName = 'gemini-2.5-flash-image'; // Placeholder for Flash

  // 4. Call Gemini
  try {
    // Log the attempt
    await supabase.from('generation_logs').insert({
      business_id: business.id,
      prompt: prompt,
      model: modelName,
      status: 'started',
      metadata: { aspectRatio, mega_prompt: finalPrompt }
    });

    // Prepare Parts
    const parts: Part[] = [{ text: finalPrompt }];

    // --- ATTACHMENT ORDER: PRODUCT -> LOGO -> STYLE ---

    // 1. Product / Subject (Image #1 if present)
    if (subjectContext?.imageUrl) {
      const subjectImagePart = await urlToBase64(subjectContext.imageUrl);
      if (subjectImagePart) {
        parts.push({ inlineData: { mimeType: "image/png", data: subjectImagePart } });
        parts.push({ text: " [REFERENCE IMAGE 1: MAIN PRODUCT] " });
      }
    }

    // 2. Logo (Image #2 or #1)
    if (business.logoUrl) {
      const logoPart = await urlToBase64(business.logoUrl);
      if (logoPart) {
        parts.push({ inlineData: { mimeType: "image/png", data: logoPart } });
        parts.push({ text: " [REFERENCE IMAGE: LOGO] " });
      }
    }

    // 3. Style Reference (Image #3 or #2 or #1)
    if (stylePreset?.referenceImages && stylePreset.referenceImages.length > 0) {
      // Filter for ACTIVE images only
      const activeRefs = stylePreset.referenceImages.filter(r => {
        // Handle legacy string array if mixed (though storage service should map it)
        if (typeof r === 'string') return true;
        return r.isActive;
      });

      if (activeRefs.length > 0) {
        // Use the first ACTIVE one as the primary anchor for now
        // Or loop if model supports multiple style inputs well.
        // For the "Job Ticket" logic, it expects one main style anchor, but we could potentially send more.
        // Let's stick to the first active one for the main reference to avoid token overload/confusion.
        const firstRef = activeRefs[0];
        const refUrl = typeof firstRef === 'string' ? firstRef : firstRef.url;

        const styleImagePart = await urlToBase64(refUrl);
        if (styleImagePart) {
          parts.push({ inlineData: { mimeType: "image/png", data: styleImagePart } });
          parts.push({ text: " [REFERENCE IMAGE: STYLE] " });
        }
      }
    } else if (stylePreset?.imageUrl) {
      const styleImagePart = await urlToBase64(stylePreset.imageUrl);
      if (styleImagePart) {
        parts.push({ inlineData: { mimeType: "image/png", data: styleImagePart } });
        parts.push({ text: " [REFERENCE IMAGE: STYLE] " });
      }
    }

    // Wait, Type definition says contents: Content[] | string | Part[]
    // If I pass Part[], it might be interpreted as a single Content with those parts?
    // Let's try wrapping it in a Content object.

    // Actually, let's look at how I did it before.
    // contents: [{ role: 'user', parts }]
    // That seems correct for the API.

    // RE-EDITING THE CALL BELOW TO WRAP IN CONTENT OBJECT
    const result = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: parts }],
      config: {
        temperature: 0.7,
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '2K' // Bonus: High resolution
        }
      }
    });

    // PARSE IMAGE RESPONSE (Gemini 3 Pro returns inlineData, not text)
    const response = result; // The result IS the response in this SDK version
    const candidate = response.candidates?.[0];

    let resultImage = "";
    let thoughts = "";

    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
      }
      // @ts-ignore - 'thought' property might not be in the strict type definition yet
      if (part.thought) {
        // Thoughts can be text
        if (part.text) {
          thoughts += part.text + "\n";
        }
      }
    }

    if (!resultImage) {
      // Fallback if no image found (maybe text error?)
      const text = response.text || "";
      console.warn("[Gemini] No image found. Text response:", text);
      if (text.startsWith('http')) return text;
      return "https://placehold.co/1024x1024/png?text=Gemini+Generation+Failed";
    }

    // Log Success
    await supabase.from('generation_logs').insert({
      business_id: business.id,
      prompt: finalPrompt,
      model: modelName,
      status: 'success',
      image_url: '(base64 data)',
      metadata: {
        finishReason: candidate?.finishReason,
        aspectRatio,
        stylePresetId: stylePreset?.id,
        subjectContext,
        modelTier,
        thoughts: thoughts.trim() // Capture the thoughts
      }
    });

    return resultImage;

  } catch (error: any) {
    console.error("Gemini Generation Failed:", error);
    // DEBUG: List models if 404 to help diagnose
    if (error.message && error.message.includes('404')) {
      try {
        console.log("[Gemini-Debug] Listing available models...");
        const models = await ai.models.list();
        console.log("[Gemini-Debug] Available Models:", models);
      } catch (listErr) {
        console.error("[Gemini-Debug] Failed to list models:", listErr);
      }
    }

    // Log Failure
    await supabase.from('generation_logs').insert({
      business_id: business.id,
      prompt: finalPrompt,
      model: modelName,
      status: 'error',
      metadata: { error: error.message || error }
    });
    throw error;
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

        // Use the new generateImage signature
        const generatedImageBase64 = await generateImage(
          imagePrompt,
          business,
          undefined, // No style preset for chat yet
          imageGenContext, // Pass the hydrated context
          '1:1',
          'pro'
        );

        return {
          text: `I've generated that image for you based on: "${imagePrompt}"`,
          image: generatedImageBase64
        };
      }
    }

    return { text: response.text || "I'm out of ideas right now." };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I'm having trouble connecting to the creative server." };
  }
};