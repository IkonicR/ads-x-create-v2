/**
 * TEST ENDPOINT: Vercel AI Gateway + Google Gemini 3 Pro Image
 * 
 * This is an isolated test to verify the Vercel AI Gateway integration.
 * If this works, we can replace our existing Google SDK calls.
 * 
 * Usage: POST /api/test-vercel-ai
 * Body: { "prompt": "A cute cat wearing sunglasses" }
 */

import { generateText } from 'ai';
import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt = 'A cute cat wearing sunglasses on a beach' } = req.body || {};

    console.log('[test-vercel-ai] Starting test with prompt:', prompt);
    console.log('[test-vercel-ai] AI_GATEWAY_API_KEY present:', !!process.env.AI_GATEWAY_API_KEY);

    try {
        // Using generateText (NOT generateImage) - Gemini 3 Pro returns images as file attachments
        const result = await generateText({
            model: 'google/gemini-3-pro-image',
            prompt: prompt,
        });

        console.log('[test-vercel-ai] Raw result:', JSON.stringify(result, null, 2));

        // The image comes back in the files array, not as text
        const imageFiles = result.files?.filter((file: any) =>
            file.mediaType?.startsWith('image/')
        );

        if (!imageFiles || imageFiles.length === 0) {
            console.log('[test-vercel-ai] No image files found in response');
            console.log('[test-vercel-ai] Text response:', result.text);
            console.log('[test-vercel-ai] Files array:', result.files);

            return res.status(500).json({
                error: 'No image was generated',
                textResponse: result.text,
                filesFound: result.files?.length || 0
            });
        }

        // Convert to data URL
        const image = imageFiles[0];
        const dataUrl = `data:${image.mediaType};base64,${image.base64}`;

        console.log('[test-vercel-ai] SUCCESS! Generated image of type:', image.mediaType);

        return res.status(200).json({
            success: true,
            image: dataUrl,
            explanation: result.text,
            mediaType: image.mediaType
        });

    } catch (error: any) {
        console.error('[test-vercel-ai] ERROR:', error);

        return res.status(500).json({
            error: 'Failed to generate image',
            message: error.message,
            details: error.cause || error.stack
        });
    }
}
