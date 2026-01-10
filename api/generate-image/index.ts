import { waitUntil } from '@vercel/functions';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { PromptFactory } from '../../services/prompts';

// Config: Use Edge Runtime for better waitUntil support and performance
// Note: If using standard Node.js runtime, waitUntil is still supported in newer versions
export const config = {
    maxDuration: 60, // Extend to 60s for image generation
};

// Helper: Resolve relative artifact URLs to absolute URLs
function resolveUrl(url: string, host: string): string {
    if (url.startsWith('/artifacts/')) {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        return `${protocol}://${host}${url}`;
    }
    return url;
}

// Helper: Convert URL to Base64 with MimeType detection
async function urlToBase64WithMime(url: string, host: string): Promise<{ base64: string, mimeType: string } | null> {
    try {
        const resolvedUrl = resolveUrl(url, host);
        const response = await fetch(resolvedUrl);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/png';

        return { base64, mimeType };
    } catch (e) {
        console.error("[Generate] Failed to fetch image:", e);
        return null;
    }
}

// Helper: Upload base64 to Supabase Storage
async function uploadToStorage(base64Data: string, businessId: string, supabase: any): Promise<string | null> {
    try {
        // Data URL to Buffer
        const base64Content = base64Data.split(',')[1];
        const buffer = Buffer.from(base64Content, 'base64');

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

// ============================================================================
// WEB STANDARD API HANDLERS
// ============================================================================

export async function GET(req: Request) {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const host = req.headers.get('host') || 'localhost:5173';

    // api/generate-image/status/{jobId}
    if (pathParts[2] === 'status' && pathParts[3]) {
        return handleStatusCheck(pathParts[3]);
    }

    // api/generate-image/pending/{businessId}
    if (pathParts[2] === 'pending' && pathParts[3]) {
        return handlePendingJobs(pathParts[3]);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}

export async function POST(req: Request) {
    console.log('[Generate] Image Generation Request Received (Web API)');
    const host = req.headers.get('host') || 'localhost:5173';

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

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
    } = body;

    if (!businessId || !prompt) {
        return new Response(JSON.stringify({ error: 'businessId and prompt are required' }), { status: 400 });
    }

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
            return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 });
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

        // 2. Fetch System Prompts (using secret key avoids RLS issues in background)
        const { data: systemPrompts } = await supabase
            .from('system_prompts')
            .select('*')
            .single();

        // 3. Create Job Record
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
                strategy: strategy || null,
                error_message: 'Initializing...' // Milestone marker
            })
            .select()
            .single();

        if (jobError) {
            console.error('[Generate] Failed to create job:', jobError);
            return new Response(JSON.stringify({ error: 'Failed to create job' }), { status: 500 });
        }

        console.log('[Generate] Job created:', job.id);

        // FIRE-AND-FORGET PATTERN - waitUntil is broken for Vite/React projects
        // We start the promise but DO NOT await it - return immediately
        // The function will continue running (hopefully) until Vercel's maxDuration
        console.log('[Generate] Starting generation (fire-and-forget, no waitUntil)...');

        // Start the promise - DO NOT AWAIT
        runGeneration(
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
            supabase,
            host,
            systemPrompts
        ).catch((genError: any) => {
            console.error('[Generate] Generation FAILED:', genError);
        });

        console.log('[Generate] Returning job ID immediately...');

        // Return job ID immediately
        return new Response(JSON.stringify({ jobId: job.id, status: 'processing' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });



    } catch (error: any) {
        console.error('[Generate] Critical Handler Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // api/generate-image/job/{jobId}
    if (pathParts[2] === 'job' && pathParts[3]) {
        const jobId = pathParts[3];
        console.log(`[Generate] Vercel: Killing job: ${jobId}`);

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        );

        const { error } = await supabase
            .from('generation_jobs')
            .delete()
            .eq('id', jobId);

        if (error) {
            console.error('[Generate] Failed to delete job:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}

// Background generation task
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
    supabase: any,
    host: string,
    systemPrompts: any
) {
    // IMMEDIATE STARTUP MARKER - This runs FIRST to prove the function started
    console.log(`[Trace] [Job:${jobId}] 🚀 Background Task LAUNCHED`);

    // Write startup marker to DB immediately - if this doesn't appear, waitUntil is failing
    const supabaseForStartup = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );
    await supabaseForStartup.from('generation_jobs').update({
        error_message: '🚀 Background worker STARTED'
    }).eq('id', jobId);

    console.log(`[Trace] [Job:${jobId}] 📌 Startup marker written to DB`);
    const traceId = jobId.substring(0, 4);

    try {
        // Milestone 1: Building Prompt
        console.log(`[Trace] [${traceId}] Building visual prompt...`);
        await supabase.from('generation_jobs').update({ error_message: 'Building prompt...' }).eq('id', jobId);


        // Build robust prompt using PromptFactory
        let visualPrompt = prompt;
        if (subjectContext) {
            visualPrompt += `\nPRIMARY SUBJECT: ${subjectContext.type}. ${subjectContext.preserveLikeness ? 'Maintain strict visual likeness.' : ''}`;
        }

        const finalPrompt = await PromptFactory.createImagePrompt(
            mappedBusiness as any,
            visualPrompt,
            mappedBusiness.voice.keywords || [],
            (stylePreset?.avoid || []).join(', '),
            undefined,
            undefined,
            subjectContext?.promotion,
            subjectContext?.benefits,
            subjectContext?.targetAudience || mappedBusiness.adPreferences?.targetAudience,
            subjectContext?.preserveLikeness || false,
            stylePreset,
            subjectContext?.price,
            subjectContext?.name,
            strategy,
            subjectContext?.isFree,
            subjectContext?.termsAndConditions,
            systemPrompts // Injected
        );

        // Milestone 2: Fetching Refs
        console.log(`[Trace] [${traceId}] Prompt Built. Fetching reference images...`);
        await supabase.from('generation_jobs').update({ error_message: 'Fetching images...' }).eq('id', jobId);

        // DEBUG BYPASS
        if (prompt.toLowerCase().startsWith('debug:')) {
            console.log(`[Trace] [${traceId}] \uD83D\uDEE0 DEBUG BYPASS DETECTED.`);
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

            console.log(`[Trace] [${traceId}] \u2705 DEBUG Job completed successfully.`);
            return;
        }

        // Build message content with images
        const contentParts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
            { type: 'text', text: finalPrompt }
        ];

        // Add subject image
        if (subjectContext?.imageUrl) {
            console.log(`[Trace] [${traceId}] Fetching subject image...`);
            const subjectResult = await urlToBase64WithMime(subjectContext.imageUrl, host);
            if (subjectResult) {
                contentParts.push({ type: 'image', image: `data:${subjectResult.mimeType};base64,${subjectResult.base64}` });
                contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE 1: MAIN PRODUCT] ' });
            }
        }

        // Add logo
        if (mappedBusiness.logoUrl) {
            console.log(`[Trace] [${traceId}] Fetching logo...`);
            const logoResult = await urlToBase64WithMime(mappedBusiness.logoUrl, host);
            if (logoResult) {
                contentParts.push({ type: 'image', image: `data:${logoResult.mimeType};base64,${logoResult.base64}` });
                contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE: BUSINESS LOGO \u2014 PRESERVE ALL TEXT/LETTERING EXACTLY] ' });
            }
        }

        // Add style references
        if (stylePreset?.referenceImages?.length > 0) {
            const activeRefs = stylePreset.referenceImages.filter((r: any) => {
                if (typeof r === 'object' && r !== null && 'isActive' in r) {
                    return r.isActive === true;
                }
                return typeof r === 'string';
            });

            for (const ref of activeRefs) {
                const url = typeof ref === 'string' ? ref : (ref.url || ref);
                const styleResult = await urlToBase64WithMime(url, host);
                if (styleResult) {
                    contentParts.push({ type: 'image', image: `data:${styleResult.mimeType};base64,${styleResult.base64}` });
                }
            }
        } else if (stylePreset?.imageUrl) {
            const styleResult = await urlToBase64WithMime(stylePreset.imageUrl, host);
            if (styleResult) {
                contentParts.push({ type: 'image', image: `data:${styleResult.mimeType};base64,${styleResult.base64}` });
            }
        }

        // Milestone 3: AI Generation (Heavy Lift)
        console.log(`[Trace] [${traceId}] INITIALIZING GOOGLE AI CALL...`);
        await supabase.from('generation_jobs').update({ error_message: 'AI Generation in progress...' }).eq('id', jobId);

        const googleClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

        // Convert contentParts to Google format
        const googleParts: any[] = [];
        for (const part of contentParts) {
            if (part.type === 'text') {
                googleParts.push({ text: part.text });
            } else if (part.type === 'image' && typeof part.image === 'string') {
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

        // ADD TIMEOUT SAFETY: 40s (Max duration is 60s)
        const generatePromise = googleClient.models.generateContent({
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

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI generation timed out (40s)')), 40000)
        );

        const result: any = await Promise.race([generatePromise, timeoutPromise]);

        // Milestone 4: Storage
        console.log(`[Trace] [${traceId}] AI Reponse Received. Uploading...`);
        await supabase.from('generation_jobs').update({ error_message: 'Uploading result...' }).eq('id', jobId);

        const parts = result.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

        if (!imagePart?.inlineData) {
            throw new Error('No image in response');
        }

        const resultImage = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

        // Upload to storage
        const publicUrl = await uploadToStorage(resultImage, businessId, supabase);
        if (!publicUrl) {
            throw new Error('Storage failure');
        }

        // Milestone 5: Completion
        console.log(`[Trace] [${traceId}] SUCCESS! Finalizing...`);
        await supabase.from('generation_jobs').update({ error_message: 'Finalizing database...' }).eq('id', jobId);

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
                error_message: null, // Clear milestones on success
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId);

        console.log(`[Trace] [${traceId}] \u2705 FULLY COMPLETED! Job: ${jobId}`);

    } catch (error: any) {
        console.error(`[Trace] [${traceId}] \u274C FATAL:`, error.message);
        await supabase
            .from('generation_jobs')
            .update({
                status: 'failed',
                error_message: error.message || 'Background failure',
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .catch((e: any) => console.error("Could not persist fail state", e));
    }
}


// Status check handler
async function handleStatusCheck(jobId: string) {
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
        return new Response(JSON.stringify({ error: 'Job not found' }), { status: 404 });
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

    return new Response(JSON.stringify({
        id: job.id,
        status: job.status,
        errorMessage: job.error_message,
        resultAssetId: job.result_asset_id,
        asset,
        createdAt: job.created_at,
        updatedAt: job.updated_at
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// Pending jobs handler
async function handlePendingJobs(businessId: string) {
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
        return new Response(JSON.stringify({ error: 'Failed to fetch jobs' }), { status: 500 });
    }

    return new Response(JSON.stringify({ jobs: jobs || [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
