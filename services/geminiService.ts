
import { Business } from '../types';
import { PromptFactory } from './prompts';

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
  try {
    const prompt = `
      Write a short, punchy ad copy for a business named "${businessName}".
      Product: "${productName}".
      Tone: "${tone}".
      Keywords to include: ${keywords.join(', ')}.
      Keep it under 200 characters.
    `;

    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        modelTier: 'standard'
      })
    });

    if (!response.ok) throw new Error('Failed to generate text');
    const data = await response.json();
    return data.text || "Could not generate text.";
  } catch (error) {
    console.error("API Error:", error);
    return "Error generating content.";
  }
};

export const generateImage = async (
  business: Business,
  visualPrompt: string,
  tone: string,
  keywords: string[],
  negativePrompt?: string,
  modelTier: 'flash' | 'pro' | 'ultra' = 'pro',
  aspectRatio: string = '1:1',
  subjectContext?: { 
    name: string; 
    type: 'product' | 'person'; 
    imageUrl?: string; 
    price?: string; 
    description?: string; 
    preserveLikeness?: boolean;
    logoMaterial?: string;
    logoPlacement?: string;
  }
): Promise<string> => {
  try {
    let enhancedPrompt = visualPrompt;
    
    // Inject Subject Context
    if (subjectContext) {
      enhancedPrompt += `\n\nIMPORTANT - PRIMARY SUBJECT: ${subjectContext.name}.`;
      
      if (subjectContext.price) {
        enhancedPrompt += ` The product price is ${subjectContext.price}.`;
      }
      if (subjectContext.description) {
        enhancedPrompt += ` Product Details: ${subjectContext.description}.`;
      }

      if (subjectContext.type === 'person') {
        enhancedPrompt += ` The person is a ${subjectContext.name}, key team member. Render them professionally.`;
      } else {
        enhancedPrompt += ` The product is ${subjectContext.name}. Focus on it clearly.`;
      }

      if (subjectContext.preserveLikeness) {
        enhancedPrompt += `\n\nCRITICAL: PRESERVE VISUAL IDENTITY. The product in the reference image must be maintained exactly. Do not alter the packaging, label, logo, or shape. This is a compliance requirement.`;
      }
    }

    const strictPrompt = await PromptFactory.createImagePrompt(
      business, 
      enhancedPrompt, 
      keywords, 
      negativePrompt, 
      subjectContext?.logoMaterial,
      subjectContext?.logoPlacement
    );
    
    // Map model tiers to backend expectation
    const backendTier = modelTier === 'flash' ? 'standard' : 'premium';

    // Prepare Images (Logo / Product)
    let logoBase64: string | undefined;
    if (business.logoUrl) {
      const b64 = await urlToBase64(business.logoUrl);
      if (b64) logoBase64 = b64;
    }

    let productBase64: string | undefined;
    if (subjectContext?.imageUrl) {
      const b64 = await urlToBase64(subjectContext.imageUrl);
      if (b64) productBase64 = b64;
    }

    const startTime = Date.now();
    console.log(`[Gemini-Vercel] Generating Image...`, { tier: backendTier });

    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: strictPrompt,
        modelTier: backendTier,
        aspectRatio,
        logoBase64,
        productBase64
      })
    });

    console.log(`[Gemini-Vercel] Response received (${Date.now() - startTime}ms)`);

    if (!response.ok) return "";
    const data = await response.json();
    
    // The backend returns { image: base64 }
    if (data.image) {
       return `data:image/png;base64,${data.image}`;
    }
    return "";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export const generateTaskSuggestions = async (businessDescription: string): Promise<string[]> => {
   try {
    const prompt = await PromptFactory.createTaskSuggestionPrompt(businessDescription);
    
    // We ask for JSON format in the prompt usually, but let's ensure the backend knows or we parse the text.
    // Simplest is to just ask for text and parse it here as before.
    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        modelTier: 'standard' // Tasks are simple
      })
    });

    if (!response.ok) return ["Check Analytics", "Draft Newsletter"];
    const data = await response.json();
    
    // Attempt to parse JSON from the text response
    try {
      // Clean up markdown code blocks if present
      let text = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (e) {
      console.warn("Failed to parse task JSON", e);
      return ["Review Strategy", "Update Content"];
    }
   } catch (e) {
     console.error(e);
     return ["Check Analytics", "Draft Newsletter"];
   }
}

// CHAT SERVICE
export const sendChatMessage = async (
  business: Business,
  history: { role: 'user' | 'ai'; text: string }[],
  newMessage: string
): Promise<{ text: string; image?: string }> => {
  try {
    const systemInstruction = await PromptFactory.createChatSystemInstruction(business);
    
    // Convert history to Vercel SDK format (user/assistant)
    // Note: 'ai' role in our app maps to 'assistant' in SDK/OpenAI format usually, 
    // but Google provider uses 'model'. Vercel SDK normalizes this to 'assistant'.
    const messages = history.map(h => ({
      role: h.role === 'ai' ? 'assistant' : 'user',
      content: h.text
    }));

    // Add the new message
    messages.push({ role: 'user', content: newMessage });

    const response = await fetch('/api/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        system: systemInstruction,
        modelTier: 'standard' // Chat is usually fast
      })
    });

    if (!response.ok) return { text: "I'm having trouble connecting." };
    const data = await response.json();

    // Note: Image generation tool call handling would need to be moved to the backend 
    // or handled by the client interpreting a specific response.
    // For now, we return the text. 
    // If we want to restore Tool Use (Image Gen inside Chat), 
    // we would need to implement 'tool calling' in the backend function.
    
    return { text: data.text || "I'm out of ideas right now." };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "I'm having trouble connecting to the creative server." };
  }
};

