import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Helper: Convert URL to Base64
async function urlToBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return base64;
    } catch (e) {
        console.error("[Generate] Failed to fetch image:", e);
        return null;
    }
}

// Helper: Upload base64 to Supabase Storage
async function uploadToStorage(base64Data: string, businessId: string, supabase: any): Promise<string | null> {
    try {
        const base64Response = await fetch(base64Data);
        const blob = await base64Response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileName = `${businessId}/generated/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

        const { error: uploadError } = await supabase.storage
            .from('business-assets')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('business-assets')
            .getPublicUrl(fileName);

        return data.publicUrl;
    } catch (error) {
        console.error('[Generate] Upload failed:', error);
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle different methods
    if (req.method === 'GET') {
        // Parse path for status or pending endpoints
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const pathParts = url.pathname.split('/').filter(Boolean);

        // api/generate-image/status/{jobId}
        if (pathParts[2] === 'status' && pathParts[3]) {
            return handleStatusCheck(req, res, pathParts[3]);
        }

        // api/generate-image/pending/{businessId}
        if (pathParts[2] === 'pending' && pathParts[3]) {
            return handlePendingJobs(req, res, pathParts[3]);
        }

        return res.status(404).json({ error: 'Not found' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Generate] Image Generation Request Received');

    const {
        businessId,
        prompt,
        aspectRatio = '1:1',
        styleId,
        subjectId,
        modelTier = 'pro',
        strategy,
        subjectContext,
        stylePreset
    } = req.body;

    if (!businessId || !prompt) {
        return res.status(400).json({ error: 'businessId and prompt are required' });
    }

    // Vercel AI Gateway uses AI_GATEWAY_API_KEY (set automatically)

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    try {
        // 1. Fetch Business Data
        const { data: business, error: bizError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .single();

        if (bizError || !business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Map DB business to app format
        const mappedBusiness = {
            id: business.id,
            name: business.name,
            type: business.type,
            industry: business.industry,
            description: business.description,
            website: business.website,
            currency: business.currency || 'USD',
            credits: business.credits,
            colors: business.colors || {},
            voice: business.voice || {},
            profile: business.profile || {},
            adPreferences: business.ad_preferences || {},
            offerings: business.offerings || [],
            teamMembers: business.team_members || [],
            logoUrl: business.logo_url,
            typography: business.typography || {},
            visualMotifs: business.visual_motifs || [],
            locations: business.locations || []
        };

        // 2. Create Job Record
        const { data: job, error: jobError } = await supabase
            .from('generation_jobs')
            .insert({
                business_id: businessId,
                status: 'processing',
                prompt,
                aspect_ratio: aspectRatio,
                style_id: styleId,
                subject_id: subjectId,
                model_tier: modelTier,
                strategy: strategy || null
            })
            .select()
            .single();

        if (jobError) {
            console.error('[Generate] Failed to create job:', jobError);
            return res.status(500).json({ error: 'Failed to create job' });
        }

        console.log('[Generate] Job created:', job.id);

        // Return job ID immediately
        res.json({ jobId: job.id, status: 'processing' });

        // 3. Run Generation in Background (after response sent)
        // Use waitUntil to keep the function running until generation completes
        waitUntil(runGeneration(
            job.id,
            businessId,
            prompt,
            aspectRatio,
            styleId,
            subjectId,
            modelTier,
            subjectContext,
            stylePreset,
            strategy,
            mappedBusiness,
            supabase
        ));

    } catch (error: any) {
        console.error('[Generate] Error:', error);
        return res.status(500).json({ error: 'Generation failed', details: error.message });
    }
}

// Background generation function
async function runGeneration(
    jobId: string,
    businessId: string,
    prompt: string,
    aspectRatio: string,
    styleId: string | undefined,
    subjectId: string | undefined,
    modelTier: string,
    subjectContext: any,
    stylePreset: any,
    strategy: any,
    mappedBusiness: any,
    supabase: any
) {
    try {
        // Build prompt
        let visualPrompt = prompt;
        if (subjectContext) {
            visualPrompt += `\nPRIMARY SUBJECT: ${subjectContext.type}. ${subjectContext.preserveLikeness ? 'Maintain strict visual likeness.' : ''}`;
        }

        const finalPrompt = visualPrompt;

        console.log('[Generate] Final prompt length:', finalPrompt.length);

        // DEBUG BYPASS
        if (prompt.toLowerCase().startsWith('debug:')) {
            console.log('=== DEBUG MODE: FULL PROMPT ===');
            console.log(finalPrompt);
            console.log('=== END PROMPT ===');

            const debugUrl = "https://placehold.co/1024x1024/png?text=DEBUG+MODE";
            const assetId = `asset_${Date.now()}`;

            await supabase.from('assets').insert({
                id: assetId,
                business_id: businessId,
                type: 'image',
                content: debugUrl,
                prompt: prompt,
                aspect_ratio: aspectRatio,
                style_id: styleId,
                subject_id: subjectId,
                model_tier: modelTier
            });

            await supabase
                .from('generation_jobs')
                .update({ status: 'completed', result_asset_id: assetId, updated_at: new Date().toISOString() })
                .eq('id', jobId);

            console.log('[Generate] DEBUG: Job completed');
            return;
        }

        // Build message content with images
        const contentParts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
            { type: 'text', text: finalPrompt }
        ];

        // Add subject image
        if (subjectContext?.imageUrl) {
            const subjectImage = await urlToBase64(subjectContext.imageUrl);
            if (subjectImage) {
                contentParts.push({ type: 'image', image: `data:image/png;base64,${subjectImage}` });
                contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE 1: MAIN PRODUCT] ' });
            }
        }

        // Add logo
        if (mappedBusiness.logoUrl) {
            const logoImage = await urlToBase64(mappedBusiness.logoUrl);
            if (logoImage) {
                contentParts.push({ type: 'image', image: `data:image/png;base64,${logoImage}` });
                contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE: LOGO] ' });
            }
        }

        // Add style reference
        if (stylePreset?.referenceImages?.length > 0) {
            const activeRef = stylePreset.referenceImages.find((r: any) => r.isActive !== false);
            if (activeRef) {
                const styleImage = await urlToBase64(activeRef.url || activeRef);
                if (styleImage) {
                    contentParts.push({ type: 'image', image: `data:image/png;base64,${styleImage}` });
                    contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE: STYLE] ' });
                }
            }
        } else if (stylePreset?.imageUrl) {
            const styleImage = await urlToBase64(stylePreset.imageUrl);
            if (styleImage) {
                contentParts.push({ type: 'image', image: `data:image/png;base64,${styleImage}` });
                contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE: STYLE] ' });
            }
        }

        console.log('[Generate] Calling Gemini 3 Pro Image via Direct Google API with aspectRatio:', aspectRatio);
        const genStartTime = Date.now();

        // Initialize Google AI client
        const googleClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

        // Convert contentParts to Google format
        const googleParts: any[] = [];
        for (const part of contentParts) {
            if (part.type === 'text') {
                googleParts.push({ text: part.text });
            } else if (part.type === 'image' && typeof part.image === 'string') {
                // Extract base64 from data URL
                const base64Match = part.image.match(/^data:([^;]+);base64,(.+)$/);
                if (base64Match) {
                    googleParts.push({
                        inlineData: {
                            mimeType: base64Match[1],
                            data: base64Match[2]
                        }
                    });
                }
            }
        }

        // Call Gemini 3 Pro Image directly
        const result = await googleClient.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{ role: 'user', parts: googleParts }],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: modelTier === 'ultra' ? '4K' : '2K',
                },
            } as any,
        });

        const genEndTime = Date.now();
        console.log(`[Generate] ⏱️ AI Generation took: ${((genEndTime - genStartTime) / 1000).toFixed(2)}s`);

        // Extract image from response
        const parts = result.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

        if (!imagePart?.inlineData) {
            throw new Error('No image in response');
        }

        const resultImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

        // Upload to storage
        const publicUrl = await uploadToStorage(resultImage, businessId, supabase);
        if (!publicUrl) {
            throw new Error('Failed to upload to storage');
        }

        // Create asset
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await supabase.from('assets').insert({
            id: assetId,
            business_id: businessId,
            type: 'image',
            content: publicUrl,
            prompt: prompt,
            aspect_ratio: aspectRatio,
            style_preset: stylePreset?.name,
            style_id: styleId,
            subject_id: subjectId,
            model_tier: modelTier
        });

        // Update job
        await supabase
            .from('generation_jobs')
            .update({
                status: 'completed',
                result_asset_id: assetId,
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

        console.log('[Generate] Job completed:', jobId, '-> Asset:', assetId);

    } catch (error: any) {
        console.error('[Generate] Generation failed:', error);

        await supabase
            .from('generation_jobs')
            .update({
                status: 'failed',
                error_message: error.message || 'Unknown error',
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);
    }
}

// Status check handler
async function handleStatusCheck(req: VercelRequest, res: VercelResponse, jobId: string) {
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    const { data: job, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (error || !job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    let asset = null;
    if (job.status === 'completed' && job.result_asset_id) {
        const { data: assetData } = await supabase
            .from('assets')
            .select('*')
            .eq('id', job.result_asset_id)
            .single();

        if (assetData) {
            asset = {
                id: assetData.id,
                type: assetData.type,
                content: assetData.content,
                prompt: assetData.prompt,
                createdAt: assetData.created_at,
                stylePreset: assetData.style_preset,
                aspectRatio: assetData.aspect_ratio
            };
        }
    }

    return res.json({
        id: job.id,
        status: job.status,
        errorMessage: job.error_message,
        resultAssetId: job.result_asset_id,
        asset,
        createdAt: job.created_at,
        updatedAt: job.updated_at
    });
}

// Pending jobs handler
async function handlePendingJobs(req: VercelRequest, res: VercelResponse, businessId: string) {
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    const { data: jobs, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('business_id', businessId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    return res.json({ jobs: jobs || [] });
}
