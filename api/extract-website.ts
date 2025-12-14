import type { VercelRequest, VercelResponse } from '@vercel/node';
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

/**
 * Website Extraction API - Firecrawl V2
 * 
 * Supports 3 modes:
 * - 'single': Scrape one page (sync, fast)
 * - 'select': Batch scrape selected URLs (async, poll)
 * - 'full': Crawl entire site (async, poll)
 * 
 * Uses Firecrawl V2 + DeepSeek V3.2 for intelligent extraction
 */

// Types for Firecrawl v2 response
interface FirecrawlBranding {
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
        text?: string;
    };
    fonts?: {
        heading?: string;
        body?: string;
    };
    logo?: string;
}

interface FirecrawlPage {
    url: string;
    markdown?: string;
    metadata?: {
        title?: string;
        description?: string;
        ogImage?: string;
    };
    branding?: FirecrawlBranding;
    images?: string[];
}

// DeepSeek extraction result matching our Business type
interface ExtractedBusinessData {
    name?: string;
    industry?: string;
    type?: 'Retail' | 'E-Commerce' | 'Service' | 'Other';
    description?: string;
    slogan?: string;
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
    };
    logoUrl?: string;
    profile?: {
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        publicLocationLabel?: string;
        operatingMode?: 'storefront' | 'online' | 'service' | 'appointment';
        socials?: { platform: string; handle: string }[];
        website?: string;
    };
    voice?: {
        archetypeInferred?: string;
        tonePillsInferred?: string[];
        keywords?: string[];
    };
    usps?: string[];
    offerings?: {
        name: string;
        description?: string;
        price?: string;
        category?: string;
    }[];
    targetAudience?: string;
    targetLanguage?: string;
}

interface ExtractionResponse {
    success: boolean;
    data?: ExtractedBusinessData;
    confidence?: Record<string, number>;
    rawBranding?: FirecrawlBranding;
    error?: string;
    pagesScraped?: number;
}

// DeepSeek system prompt for business extraction
const EXTRACTION_SYSTEM_PROMPT = `You are an expert business analyst. Given website content (markdown) and branding info (JSON), extract structured business data.

Return ONLY valid JSON with these fields (omit any you can't confidently determine):

{
  "name": "Business Name",
  "industry": "MUST be one of: Retail | E-Commerce | Service | Tech | Food | Health | Beauty | Real Estate | Education | Finance | Legal | Construction | Automotive | Entertainment | Travel | Marketing | Non-Profit | Consulting | Fashion | Fitness | Art | Events | Photography | Agriculture | Manufacturing | Logistics",
  "type": "MUST be one of: Retail | E-Commerce | Service | Other",
  "description": "2-3 sentence description",
  "slogan": "Tagline if found",
  
  "profile": {
    "contactEmail": "email if found",
    "contactPhone": "phone if found",
    "address": "full address if found",
    "operatingMode": "MUST be one of: storefront | online | service | appointment",
    "socials": [{"platform": "instagram", "handle": "@example"}],
    "website": "canonical URL"
  },
  
  "voice": {
    "archetypeInferred": "MUST be one of: The Innocent | The Explorer | The Sage | The Hero | The Outlaw | The Magician | The Guy/Girl Next Door | The Lover | The Jester | The Caregiver | The Creator | The Ruler",
    "tonePillsInferred": "MUST select 0-4 from this EXACT list (plain text only, NO emojis): Bold, Premium, Minimal, Playful, Modern, Classic, Elegant, Timeless, Sophisticated, Luxurious, Refined, Curated, Professional, Creative, Energetic, Witty, Urgent, Calm, Warm, Approachable, Sincere, Trustworthy, Friendly, Exclusive, Rebellious, Community Focused, Authoritative, Supportive, Personable, Welcoming, Educational, Insightful, Analytical, Geeky, Direct, Informative, Expert",
    "keywords": ["key", "brand", "words"]
  },
  
  "usps": ["Unique selling point 1", "USP 2"],
  
  "offerings": [
    {"name": "Product/Service", "description": "Brief desc", "price": "R100 or $50", "category": "Products or Services"}
  ],
  
  "targetAudience": "Description of who they serve",
  "targetLanguage": "Primary language of website content"
}

OPERATING MODE RULES:
- storefront: Physical location (has address, hours, "visit us")
- online: E-commerce only (has cart, checkout, shipping)
- service: Goes to customer (has service area, "we come to you")
- appointment: Booking-based (has calendar, scheduling)

CONTACT EXTRACTION RULES:
- Look carefully in the ENTIRE content including headers and footers
- Email addresses often appear as: info@, contact@, hello@, support@
- Phone numbers may be formatted with dashes, spaces, or parentheses
- South African phones: +27, 0xx xxx xxxx
- US phones: (xxx) xxx-xxxx
- Extract ANY email or phone you find - do not skip them

Do your best to extract all available information.`;

// Firecrawl V2 API base
const FIRECRAWL_V2_BASE = 'https://api.firecrawl.dev/v2';

/**
 * Poll for async job completion (crawl or batch-scrape)
 */
async function pollJobStatus(
    jobId: string,
    jobType: 'crawl' | 'batch-scrape',
    apiKey: string,
    maxAttempts = 30,
    delayMs = 2000
): Promise<{ success: boolean; data?: FirecrawlPage[]; error?: string }> {
    const endpoint = `${FIRECRAWL_V2_BASE}/${jobType}/${jobId}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));

        try {
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
                signal: AbortSignal.timeout(10000) // 10s timeout per poll
            });

            if (!response.ok) {
                const errorText = await response.text();
                // 404 might mean job not ready yet? But usually it's failure.
                // 429 = Rate limit (should retry)
                if (response.status === 429) {
                    console.log(`[Extract] Rate limit (attempt ${attempt + 1}), retrying...`);
                    continue;
                }

                console.error(`[Extract] Poll error (attempt ${attempt + 1}):`, response.status, errorText);
                return { success: false, error: `Job status check failed: ${response.status}` };
            }

            const statusData = await response.json();
            console.log(`[Extract] Job status (attempt ${attempt + 1}):`, statusData.status);

            if (statusData.status === 'completed') {
                return { success: true, data: statusData.data || [] };
            } else if (statusData.status === 'failed') {
                return { success: false, error: 'Job failed during processing' };
            }
            // status is 'scraping' or 'crawling' - continue polling
        } catch (err) {
            console.error(`[Extract] Poll network error (attempt ${attempt + 1}):`, err);
            // Don't fail immediately on network blip, but continue
        }
    }

    return { success: false, error: 'Job timed out' };
}

/**
 * Single page scrape (V2 - synchronous)
 */
async function scrapeSinglePage(
    url: string,
    apiKey: string
): Promise<{ success: boolean; data?: FirecrawlPage; error?: string }> {
    console.log('[Extract] V2 Single Scrape:', url);

    const response = await fetch(`${FIRECRAWL_V2_BASE}/scrape`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url,
            formats: ['markdown', 'branding', 'extract'],
            extract: {
                schema: {
                    type: "object",
                    properties: {
                        contactEmail: { type: "string" },
                        contactPhone: { type: "string" },
                        socialLinks: {
                            type: "array",
                            items: { type: "string" }
                        },
                        address: { type: "string" }
                    }
                }
            }
        }),
        signal: AbortSignal.timeout(25000) // 25s timeout
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Extract] V2 Scrape error:', errorText);
        return { success: false, error: 'Failed to scrape page' };
    }

    const result = await response.json();
    if (!result.success) {
        return { success: false, error: result.error || 'Scrape failed' };
    }

    return { success: true, data: result.data };
}

/**
 * Batch scrape multiple URLs (V2 - asynchronous)
 */
async function batchScrapePages(
    urls: string[],
    apiKey: string
): Promise<{ success: boolean; data?: FirecrawlPage[]; error?: string }> {
    console.log('[Extract] V2 Batch Scrape:', urls.length, 'URLs');

    const response = await fetch(`${FIRECRAWL_V2_BASE}/batch-scrape`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            urls,
            formats: ['markdown', 'branding'],
        }),
        signal: AbortSignal.timeout(10000) // 10s to start job
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Extract] V2 Batch Scrape error:', errorText);
        return { success: false, error: 'Failed to start batch scrape' };
    }

    const result = await response.json();
    if (!result.success || !result.id) {
        return { success: false, error: 'Failed to start batch job' };
    }

    console.log('[Extract] Batch job started:', result.id);
    return pollJobStatus(result.id, 'batch-scrape', apiKey);
}

/**
 * Crawl entire site (V2 - asynchronous)
 */
async function crawlSite(
    url: string,
    apiKey: string,
    limit = 5
): Promise<{ success: boolean; data?: FirecrawlPage[]; error?: string }> {
    console.log('[Extract] V2 Crawl:', url, 'limit:', limit);

    const response = await fetch(`${FIRECRAWL_V2_BASE}/crawl`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url,
            limit,
            scrapeOptions: {
                formats: ['markdown', 'branding'],
            },
        }),
        signal: AbortSignal.timeout(10000) // 10s to start job
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Extract] V2 Crawl error:', errorText);
        return { success: false, error: 'Failed to start crawl' };
    }

    const result = await response.json();
    if (!result.success || !result.id) {
        return { success: false, error: 'Failed to start crawl job' };
    }

    console.log('[Extract] Crawl job started:', result.id);
    return pollJobStatus(result.id, 'crawl', apiKey);
}

/**
 * Call DeepSeek to extract structured business data
 */
async function extractWithDeepSeek(
    combinedMarkdown: string,
    branding: FirecrawlBranding,
    _apiKey: string // kept for signature compatibility, not used with gateway
): Promise<{ success: boolean; data?: ExtractedBusinessData; error?: string }> {
    console.log('[Extract] Calling DeepSeek V3.2-Thinking via Vercel Gateway...');

    try {
        const result = await generateText({
            model: gateway('deepseek/deepseek-v3.2-thinking'),
            system: EXTRACTION_SYSTEM_PROMPT,
            prompt: `BRANDING:\n${JSON.stringify(branding)}\n\nCONTENT:\n${combinedMarkdown.slice(0, 50000)}`,
            temperature: 0.2,
        });

        if (!result.text) {
            return { success: false, error: 'No response from AI' };
        }

        // Clean the response - remove markdown code blocks if present
        let jsonText = result.text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7);
        }
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith('```')) {
            jsonText = jsonText.slice(0, -3);
        }

        const extractedData = JSON.parse(jsonText.trim());
        console.log('[Extract] DeepSeek parsing complete via Vercel Gateway');
        return { success: true, data: extractedData };
    } catch (error) {
        console.error('[Extract] DeepSeek error:', error);
        return { success: false, error: 'AI analysis failed' };
    }
}

/**
 * Main API Handler
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<void> {
    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { url, urls, mode = 'single' } = req.body;

    // Validate input
    if (mode === 'select' && (!urls || !Array.isArray(urls) || urls.length === 0)) {
        res.status(400).json({ error: 'URLs array is required for select mode' });
        return;
    }

    if ((mode === 'single' || mode === 'full') && (!url || typeof url !== 'string')) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    // Validate URL format
    const primaryUrl = mode === 'select' ? urls[0] : url;
    try {
        new URL(primaryUrl);
    } catch {
        res.status(400).json({ error: 'Invalid URL format' });
        return;
    }

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

    if (!FIRECRAWL_API_KEY) {
        console.error('[Extract] Missing FIRECRAWL_API_KEY');
        res.status(500).json({ error: 'Server configuration error (missing FIRECRAWL_API_KEY)' });
        return;
    }

    try {
        let pages: FirecrawlPage[] = [];

        // Step 1: Get pages based on mode
        if (mode === 'single') {
            const result = await scrapeSinglePage(url, FIRECRAWL_API_KEY);
            if (!result.success || !result.data) {
                res.status(500).json({ error: result.error || 'Scrape failed' });
                return;
            }
            pages = [result.data];

        } else if (mode === 'select') {
            const result = await batchScrapePages(urls.slice(0, 10), FIRECRAWL_API_KEY);
            if (!result.success || !result.data) {
                res.status(500).json({ error: result.error || 'Batch scrape failed' });
                return;
            }
            pages = result.data;

        } else if (mode === 'full') {
            const result = await crawlSite(url, FIRECRAWL_API_KEY, 5);
            if (!result.success || !result.data) {
                res.status(500).json({ error: result.error || 'Crawl failed' });
                return;
            }
            pages = result.data;
        }

        if (pages.length === 0) {
            res.status(500).json({ error: 'No content extracted' });
            return;
        }

        console.log('[Extract] Firecrawl completed, pages:', pages.length);

        // Step 2: Combine markdown from all pages
        const combinedMarkdown = pages
            .map(page => `## Page: ${page.metadata?.title || page.url}\n\n${page.markdown || ''}`)
            .join('\n\n---\n\n');

        // Get branding from first page (usually homepage)
        const branding = pages[0]?.branding || {};

        // Step 3: DeepSeek extraction (via Vercel Gateway, no API key needed)
        const extractionResult = await extractWithDeepSeek(combinedMarkdown, branding, '');

        if (!extractionResult.success || !extractionResult.data) {
            res.status(500).json({ error: extractionResult.error || 'AI extraction failed' });
            return;
        }

        let extractedData = extractionResult.data;

        // Step 4: Merge Firecrawl branding (colors + logo)
        if (branding.colors) {
            extractedData.colors = {
                primary: branding.colors.primary || extractedData.colors?.primary,
                secondary: branding.colors.secondary || extractedData.colors?.secondary,
                accent: branding.colors.accent || extractedData.colors?.accent,
            };
        }

        if (branding.logo && !extractedData.logoUrl) {
            extractedData.logoUrl = branding.logo;
        }

        // Fallback: check branding.images.logo if top-level logo is missing
        if (!extractedData.logoUrl && (branding as any).images?.logo) {
            extractedData.logoUrl = (branding as any).images.logo;
        }

        // Feature: Merge Firecrawl "extract" data (structured JSON)
        // This is more reliable for contact info than the LLM extraction
        const firecrawlExtract = (pages[0] as any).extract;
        if (firecrawlExtract) {
            if (!extractedData.profile) extractedData.profile = {};

            // Prioritize Firecrawl extraction for contact info
            if (firecrawlExtract.contactEmail) extractedData.profile.contactEmail = firecrawlExtract.contactEmail;
            if (firecrawlExtract.contactPhone) extractedData.profile.contactPhone = firecrawlExtract.contactPhone;
            if (firecrawlExtract.address) extractedData.profile.address = firecrawlExtract.address;

            // Merge socials
            if (firecrawlExtract.socialLinks && Array.isArray(firecrawlExtract.socialLinks)) {
                const currentSocials = extractedData.profile.socials || [];
                firecrawlExtract.socialLinks.forEach((link: string) => {
                    // Simple parser for social links
                    let platform = 'website';
                    if (link.includes('instagram')) platform = 'instagram';
                    else if (link.includes('facebook')) platform = 'facebook';
                    else if (link.includes('twitter') || link.includes('x.com')) platform = 'twitter';
                    else if (link.includes('linkedin')) platform = 'linkedin';
                    else if (link.includes('tiktok')) platform = 'tiktok';
                    else if (link.includes('whatsapp')) platform = 'whatsapp';

                    // Add if not already present
                    if (!currentSocials.some(s => s.handle === link)) {
                        currentSocials.push({ platform, handle: link });
                    }
                });
                extractedData.profile.socials = currentSocials;
            }
        }

        // Build confidence scores
        const confidence: Record<string, number> = {};
        if (extractedData.name) confidence.identity = 0.9;
        if (extractedData.colors?.primary) confidence.branding = 0.95;
        if (extractedData.profile?.contactEmail || extractedData.profile?.contactPhone) confidence.contact = 0.8;
        if (extractedData.voice?.archetypeInferred) confidence.voice = 0.7;
        if (extractedData.offerings?.length) confidence.offerings = 0.7;
        if (extractedData.logoUrl) confidence.logo = 0.95;

        const response: ExtractionResponse = {
            success: true,
            data: extractedData,
            confidence,
            rawBranding: branding,
            pagesScraped: pages.length,
        };

        console.log('[Extract] Extraction complete, pages scraped:', pages.length);
        res.status(200).json(response);

    } catch (error) {
        console.error('[Extract] Unexpected error:', error);
        res.status(500).json({
            error: 'An unexpected error occurred during extraction',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
