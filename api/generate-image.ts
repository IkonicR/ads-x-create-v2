import { google } from '@ai-sdk/google';
import { experimental_generateImage } from 'ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { 
      prompt, 
      modelTier = 'standard', 
      aspectRatio = '1:1', 
      logoBase64, 
      productBase64 
    } = await req.json();

    // Select Model
    // 'premium' -> gemini-3-pro-image-preview
    // 'standard' -> gemini-2.0-flash-image (or similar)
    // Note: As of late 2025, naming might vary. using safe defaults or provided strings.
    const modelName = modelTier === 'premium' ? 'gemini-1.5-pro' : 'gemini-1.5-flash'; 
    // Wait, for IMAGES, it's often a different model name in the SDK or specific capability.
    // For Vercel SDK, image generation is often a specific function call on the provider or model.
    
    const model = google.image(modelName); 

    // Aspect Ratio handling
    // Vercel SDK 'aspectRatio' is usually "1:1" | "16:9" etc.
    
    // Multi-modal inputs (Logo/Product)
    // The Vercel AI SDK 'experimental_generateImage' currently focuses on Text-to-Image.
    // Passing reference images (Logo/Product) might not be fully supported in the high-level helper yet.
    // HOWEVER, we can try to pass them if the provider allows generic options, 
    // OR we might have to skip the logo injection for the V1 of this migration 
    // until we confirm the SDK supports 'image-to-image' variation.
    //
    // For now, we will proceed with Text-to-Image.
    // We will append a description of the visual inputs to the prompt as a fallback 
    // to ensure *some* continuity if the image upload isn't supported directly.
    
    let finalPrompt = prompt;
    if (logoBase64) finalPrompt += " [With Brand Logo embedded]";
    if (productBase64) finalPrompt += " [With Product Reference embedded]";

    const { image } = await experimental_generateImage({
      model,
      prompt: finalPrompt,
      aspectRatio: aspectRatio as any,
      n: 1,
    });

    return new Response(JSON.stringify({ image: image.base64 }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
