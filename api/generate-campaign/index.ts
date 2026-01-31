import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

// Config: Extended duration for sequential campaign generation
export const config = {
    maxDuration: 300, // 5 minute max for full campaign
};

// ============================================================================
// CAMPAIGN GENERATION API
// Orchestrates sequential image generation with anchor-based consistency
// ============================================================================

export async function POST(req: Request) {
    console.log('[Campaign] Campaign Generation Request Received');
    const host = req.headers.get('host') || 'localhost:5173';

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    const {
        businessId,
        prompts,  // Array of prompts
        aspectRatio = '1:1',
        styleId,
        modelTier = 'pro',
        isFreedomMode = true  // Default to freedom mode for campaigns
    } = body;

    // Validation
    if (!businessId) {
        return new Response(JSON.stringify({ error: 'businessId is required' }), { status: 400 });
    }
    if (!prompts || !Array.isArray(prompts) || prompts.length < 2) {
        return new Response(JSON.stringify({ error: 'prompts must be an array with at least 2 items' }), { status: 400 });
    }

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    try {
        // 1. Generate unique campaign ID
        const campaignId = uuidv4();
        console.log(`[Campaign] Starting campaign: ${campaignId} with ${prompts.length} images`);

        // 2. Fetch Business Data
        const { data: business, error: bizError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .single();

        if (bizError || !business) {
            return new Response(JSON.stringify({ error: 'Business not found' }), { status: 404 });
        }

        // 3. Create Campaign Record
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .insert({
                id: campaignId,
                business_id: businessId,
                status: 'processing',
                total_images: prompts.length,
                completed_images: 0,
                prompts: prompts,
                aspect_ratio: aspectRatio,
                style_id: styleId,
                model_tier: modelTier
            })
            .select()
            .single();

        if (campaignError) {
            console.error('[Campaign] Failed to create campaign:', campaignError);
            return new Response(JSON.stringify({ error: 'Failed to create campaign' }), { status: 500 });
        }

        // Map business for generation
        const mappedBusiness = {
            id: business.id,
            name: business.name,
            type: business.type,
            industry: business.industry,
            description: business.description,
            website: business.website,
            currency: business.currency || 'USD',
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

        // Fetch system prompts
        const { data: systemPrompts } = await supabase
            .from('system_prompts')
            .select('*')
            .single();

        // 4. Process sequentially
        const assetIds: string[] = [];
        let anchorUrl: string | undefined;

        for (let i = 0; i < prompts.length; i++) {
            const prompt = prompts[i];
            const isAnchor = i === 0;
            
            console.log(`[Campaign] Generating image ${i + 1}/${prompts.length}${isAnchor ? ' (ANCHOR)' : ''}`);

            // Update campaign progress
            await supabase
                .from('campaigns')
                .update({ completed_images: i })
                .eq('id', campaignId);

            try {
                // Create job record
                const { data: job, error: jobError } = await supabase
                    .from('generation_jobs')
                    .insert({
                        business_id: businessId,
                        status: 'processing',
                        prompt,
                        aspect_ratio: aspectRatio,
                        style_id: styleId,
                        model_tier: modelTier,
                        error_message: isAnchor 
                            ? 'Creating campaign anchor...' 
                            : `Generating image ${i + 1}/${prompts.length} with campaign style...`
                    })
                    .select()
                    .single();

                if (jobError) throw new Error(`Failed to create job: ${jobError.message}`);

                // Generate image
                const result = await generateSingleImage(
                    job.id,
                    businessId,
                    prompt,
                    aspectRatio,
                    styleId,
                    modelTier,
                    mappedBusiness,
                    supabase,
                    host,
                    systemPrompts,
                    isFreedomMode,
                    isAnchor ? undefined : anchorUrl,  // Pass anchor for non-first images
                    campaignId,
                    isAnchor
                );

                if (result.success && result.assetId) {
                    assetIds.push(result.assetId);
                    
                    // Capture anchor URL from first image
                    if (isAnchor && result.assetUrl) {
                        anchorUrl = result.assetUrl;
                        await supabase
                            .from('campaigns')
                            .update({ anchor_url: anchorUrl })
                            .eq('id', campaignId);
                        console.log(`[Campaign] ✅ Anchor captured: ${anchorUrl.substring(0, 80)}...`);
                    }
                } else {
                    console.error(`[Campaign] Image ${i + 1} failed:`, result.error);
                }

            } catch (imgError: any) {
                console.error(`[Campaign] Error generating image ${i + 1}:`, imgError);
                // Continue with remaining images even if one fails
            }
        }

        // 5. Mark campaign complete
        await supabase
            .from('campaigns')
            .update({
                status: assetIds.length === prompts.length ? 'complete' : 'failed',
                completed_images: assetIds.length,
                completed_at: new Date().toISOString(),
                error: assetIds.length < prompts.length 
                    ? `Only ${assetIds.length}/${prompts.length} images generated`
                    : null
            })
            .eq('id', campaignId);

        console.log(`[Campaign] ✅ Campaign complete: ${assetIds.length}/${prompts.length} images`);

        return new Response(JSON.stringify({
            campaignId,
            status: assetIds.length === prompts.length ? 'complete' : 'partial',
            totalImages: prompts.length,
            completedImages: assetIds.length,
            assetIds,
            anchorUrl
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[Campaign] Critical Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function GET(req: Request) {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // api/generate-campaign/status/{campaignId}
    if (pathParts[2] === 'status' && pathParts[3]) {
        const campaignId = pathParts[3];

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        );

        const { data: campaign, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (error || !campaign) {
            return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 });
        }

        // Get asset IDs for this campaign
        const { data: assets } = await supabase
            .from('assets')
            .select('id, content')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: true });

        return new Response(JSON.stringify({
            campaignId: campaign.id,
            status: campaign.status,
            totalImages: campaign.total_images,
            completedImages: campaign.completed_images,
            anchorUrl: campaign.anchor_url,
            assetIds: assets?.map(a => a.id) || [],
            assetUrls: assets?.map(a => a.content) || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
}

// ============================================================================
// SINGLE IMAGE GENERATION (Extracted from generate-image)
// ============================================================================

async function generateSingleImage(
    jobId: string,
    businessId: string,
    prompt: string,
    aspectRatio: string,
    styleId: string | undefined,
    modelTier: string,
    mappedBusiness: any,
    supabase: any,
    host: string,
    systemPrompts: any,
    isFreedomMode: boolean,
    campaignAnchorUrl?: string,
    campaignId?: string,
    isAnchor?: boolean
): Promise<{ success: boolean; assetId?: string; assetUrl?: string; error?: string }> {
    
    try {
        // Build prompt
        let finalPrompt = '';
        
        const businessName = mappedBusiness.name || 'Brand';
        const brandColors = mappedBusiness.colors?.palette?.join(', ') || '';

        // Add campaign consistency instruction for non-anchor images
        const campaignConsistencyNote = campaignAnchorUrl 
            ? `\n\n=== CAMPAIGN CONSISTENCY ===
A reference image is provided showing the established visual style.
MATCH THIS STYLE EXACTLY:
- Same color grading and lighting
- Same composition approach
- Same typographic treatment
- Same overall aesthetic
The reference image defines the campaign's visual DNA.`
            : '';

        finalPrompt = `## CREATIVE FREEDOM MODE

You are generating a creative visual for ${businessName}.

### USER'S VISION
${prompt}

### BRAND CONTEXT
- **Color Palette:** ${brandColors || 'Use suitable colors'}
- **Logo:** Brand logo is provided as an input image.
${campaignConsistencyNote}

### GUIDELINES
- **Aspect ratio:** ${aspectRatio}
- **Logo integration:** The logo must look like part of the design — not pasted on afterwards. Match the visual treatment (color grading, texture, lighting) of the rest of the piece.
- All text must be diegetic (part of the scene) and spelled correctly.
- The user's prompt is the priority.
- **Be smart about copy:** Include bold headlines, taglines, or CTAs when appropriate — this is creative marketing, not abstract art (unless explicitly requested). Skip compliance text (contact info, hours, address) but keep punchy marketing copy.`;

        console.log('[Campaign] Final prompt length:', finalPrompt.length);
        console.log('[Campaign] === PROMPT ===');
        console.log(finalPrompt);
        console.log('[Campaign] === END PROMPT ===');

        await supabase.from('generation_jobs').update({ error_message: 'Fetching images...' }).eq('id', jobId);

        // Build content parts
        const contentParts: any[] = [];

        // CAMPAIGN ANCHOR INJECTION (Slot 1 - Highest priority)
        if (campaignAnchorUrl) {
            const anchorImage = await urlToBase64WithMime(campaignAnchorUrl, host);
            if (anchorImage) {
                contentParts.push({
                    inlineData: {
                        mimeType: anchorImage.mimeType,
                        data: anchorImage.base64
                    }
                });
                console.log('[Campaign] ✓ Anchor image injected as style reference');
            }
        }

        // Logo image
        if (mappedBusiness.logoUrl) {
            const logoImage = await urlToBase64WithMime(mappedBusiness.logoUrl, host);
            if (logoImage) {
                contentParts.push({
                    inlineData: {
                        mimeType: logoImage.mimeType,
                        data: logoImage.base64
                    }
                });
                console.log('[Campaign] ✓ Logo loaded');
            }
        }

        // Prompt text
        contentParts.push({ text: finalPrompt });

        // Log payload size
        const payloadSize = JSON.stringify(contentParts).length / (1024 * 1024);
        console.log(`\n============================================================`);
        console.log('[Campaign] === FINAL PAYLOAD SUMMARY ===');
        console.log(`[Campaign] Prompt length: ${finalPrompt.length} chars`);
        console.log(`[Campaign] Images included: ${contentParts.filter(p => p.inlineData).length}`);
        console.log(`[Campaign] Aspect ratio: ${aspectRatio}`);
        console.log(`[Campaign] Payload Size: ${payloadSize.toFixed(2)} MB`);
        console.log(`[Campaign] Has campaign anchor: ${!!campaignAnchorUrl}`);
        console.log('============================================================\n');

        await supabase.from('generation_jobs').update({ error_message: 'Calling Gemini...' }).eq('id', jobId);

        // Call Gemini 3 Pro Image
        const genAI = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY! });
        const model = 'gemini-2.0-flash-exp-image-generation';

        const generationConfig = {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
                aspectRatio,
                imageSize: modelTier === 'ultra' ? '4K' : '2K'
            }
        };

        console.log('[Campaign] Calling Gemini 3 Pro Image...');
        const startTime = Date.now();

        const response = await genAI.models.generateContent({
            model,
            contents: [{ role: 'user', parts: contentParts }],
            config: generationConfig
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[Campaign] ⏱️ AI Generation took: ${elapsed}s`);

        // Extract image from response
        const parts = response.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

        if (!imagePart?.inlineData) {
            // Update job with failure
            await supabase
                .from('generation_jobs')
                .update({ status: 'failed', error_message: 'No image returned by AI' })
                .eq('id', jobId);
            return { success: false, error: 'No image returned by AI' };
        }

        // Upload to storage
        const base64DataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        const publicUrl = await uploadToStorage(base64DataUrl, businessId, supabase);

        if (!publicUrl) {
            await supabase
                .from('generation_jobs')
                .update({ status: 'failed', error_message: 'Upload to storage failed' })
                .eq('id', jobId);
            return { success: false, error: 'Failed to upload image' };
        }

        // Create asset record
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const { error: assetError } = await supabase.from('assets').insert({
            id: assetId,
            business_id: businessId,
            type: 'image',
            prompt,
            content: publicUrl,
            style_id: styleId,
            aspect_ratio: aspectRatio,
            campaign_id: campaignId,
            is_campaign_anchor: isAnchor || false
        });

        if (assetError) {
            console.error('[Campaign] Asset insert error:', assetError);
        }

        // Update job to complete
        await supabase
            .from('generation_jobs')
            .update({
                status: 'completed',
                result_asset_id: assetId,
                error_message: null
            })
            .eq('id', jobId);

        console.log(`[Campaign] Job completed: ${jobId} -> Asset: ${assetId}`);

        return { success: true, assetId, assetUrl: publicUrl };

    } catch (error: any) {
        console.error('[Campaign] Generation error:', error);
        await supabase
            .from('generation_jobs')
            .update({ status: 'failed', error_message: error.message })
            .eq('id', jobId);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// HELPERS
// ============================================================================

async function urlToBase64WithMime(url: string, host: string): Promise<{ base64: string, mimeType: string } | null> {
    try {
        const resolvedUrl = url.startsWith('/artifacts/') 
            ? `${host.includes('localhost') ? 'http' : 'https'}://${host}${url}`
            : url;
            
        const response = await fetch(resolvedUrl);
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/png';

        return { base64, mimeType };
    } catch (e) {
        console.error("[Campaign] Failed to fetch image:", e);
        return null;
    }
}

async function uploadToStorage(base64Data: string, businessId: string, supabase: any): Promise<string | null> {
    try {
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
        console.error('[Campaign] Upload failed:', error);
        return null;
    }
}
