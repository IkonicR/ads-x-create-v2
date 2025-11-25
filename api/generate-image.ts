import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

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
    // 'premium' -> gemini-3-pro-image
    // 'standard' -> gemini-2.5-flash-image
    // Note: These are the specific IDs for Gemini Image generation via Vercel SDK
    const modelName = modelTier === 'premium' ? 'gemini-3-pro-image' : 'gemini-2.5-flash-image'; 
    
    const model = google(modelName); 

    let finalPrompt = prompt;
    if (logoBase64) finalPrompt += " [With Brand Logo embedded]";
    if (productBase64) finalPrompt += " [With Product Reference embedded]";

    // USE generateText (Gemini Pattern)
    // Gemini returns images as 'files' in the response for these models
    const result = await generateText({
      model,
      prompt: finalPrompt,
    });

    // Extract Image from Response
    // The images are returned in the 'files' property (or steps in some versions)
    // @ts-ignore
    const files = result.files || (result.steps?.[0]?.output?.files) || [];
    
    if (files && files.length > 0) {
      const file = files[0];
      let base64 = '';
      
      // Handle different data shapes (Uint8Array vs base64 string)
      if (typeof file.data === 'string') {
        base64 = file.data;
      } else if (file.uint8Array) {
         base64 = Buffer.from(file.uint8Array).toString('base64');
      } else if (file.data) {
         // Fallback if data is a buffer/array
         base64 = Buffer.from(file.data).toString('base64');
      }

      if (base64) {
        return new Response(JSON.stringify({ image: base64 }), {
            headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    console.warn("No image generated:", result.text);
    return new Response(JSON.stringify({ error: 'No image returned by model' }), {
      status: 500,
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
