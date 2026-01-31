
import { createClient } from '@supabase/supabase-js';
import { generateSingleImage } from './utils';

// POST /api/generate-campaign/reject
// Regenerates the anchor image based on feedback
export async function POST(req: Request) {
    console.log('[Campaign] Reject/Regenerate Request Received');
    const host = req.headers.get('host') || 'localhost:5173';

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    const { campaignId, adjustedPrompt } = body;

    if (!campaignId) {
        return new Response(JSON.stringify({ error: 'campaignId is required' }), { status: 400 });
    }

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    try {
        const { data: campaign } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 });

        // Fetch business
        const { data: business } = await supabase.from('businesses').select('*').eq('id', campaign.business_id).single();
        const mappedBusiness = {
            id: business.id,
            name: business.name,
            colors: business.colors || {},
            logoUrl: business.logo_url,
        };

        // Determine prompt (use adjusted if provided, else original anchor prompt)
        const originalAnchorPrompt = campaign.prompts[0];
        const effectivePrompt = adjustedPrompt 
            ? `${originalAnchorPrompt}. FEEDBACK ADJUSTMENT: ${adjustedPrompt}` 
            : originalAnchorPrompt;

        console.log(`[Campaign] Regenerating anchor for ${campaignId}. Adjustment: ${!!adjustedPrompt}`);

        // Create Regeration Job
        const { data: job } = await supabase
            .from('generation_jobs')
            .insert({
                business_id: campaign.business_id,
                status: 'processing',
                prompt: effectivePrompt,
                aspect_ratio: campaign.aspect_ratio,
                style_id: campaign.style_id,
                model_tier: campaign.model_tier,
                error_message: 'Regenerating campaign anchor...'
            })
            .select()
            .single();

        if (!job) throw new Error('Failed to create validation job');

        // Execute Generation
        const result = await generateSingleImage(
            job.id,
            campaign.business_id,
            effectivePrompt,
            campaign.aspect_ratio,
            campaign.style_id,
            campaign.model_tier,
            mappedBusiness,
            supabase,
            host,
            null,
            true, // freedom mode
            undefined, // No anchor to follow (we ARE the anchor)
            campaignId,
            true // isAnchor
        );

        if (!result.success || !result.assetUrl) {
            throw new Error(result.error || 'Failed to regenerate anchor');
        }

        // Update Campaign with NEW Anchor
        await supabase
            .from('campaigns')
            .update({ 
                anchor_url: result.assetUrl,
                status: 'preview' // Ensure we stay in preview mode
            })
            .eq('id', campaignId);
            
        // TODO: Credit deduction logic here

        return new Response(JSON.stringify({
            campaignId,
            status: 'preview',
            anchorUrl: result.assetUrl,
            creditCost: 0, // Placeholder
            freeRejectionsRemaining: 0 // Placeholder
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error: any) {
        console.error('[Campaign] Reject Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
