import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types for Firecrawl v2.7.0 response
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

interface FirecrawlCrawlResponse {
    success: boolean;
    status: string;
    total: number;
    completed: number;
    data: FirecrawlPage[];
}

// DeepSeek V3.2 extraction result matching our Business type
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
}

interface ExtractionResponse {
    success: boolean;
    data?: ExtractedBusinessData;
    confidence?: Record<string, number>;
    rawBranding?: FirecrawlBranding;
    error?: string;
}

// DeepSeek V3.2 system prompt for business extraction
const EXTRACTION_SYSTEM_PROMPT = `You are an expert business analyst. Given a website's content (markdown) and branding info (JSON), extract as much structured business data as possible.

Return a JSON object with these fields (omit any you can't confidently determine):

{
  "name": "Business name",
  "industry": "e.g. Fashion, Restaurant, Tech, Healthcare",
  "type": "Retail | E-Commerce | Service | Other",
  "description": "2-3 sentence description of what they do",
  "slogan": "Their tagline if found",
  
  "profile": {
    "contactEmail": "email@domain.com",
    "contactPhone": "+1-xxx-xxx-xxxx or local format",
    "address": "Full address if found",
    "publicLocationLabel": "e.g. Downtown Austin, CBD Melbourne",
    "operatingMode": "storefront | online | service | appointment",
    "socials": [{ "platform": "Instagram", "handle": "@handle" }],
    "website": "The canonical website URL"
  },
  
  "voice": {
    "archetypeInferred": "The Creator | The Explorer | The Sage | The Hero | The Outlaw | The Magician | The Guy/Girl Next Door | The Lover | The Jester | The Caregiver | The Ruler",
    "tonePillsInferred": ["Witty", "Premium", "Friendly", "Bold", "Minimal", "Playful", "Professional"],
    "keywords": ["sustainable", "artisan", "local", "premium"]
  },
  
  "usps": ["Unique selling point 1", "..."],
  
  "offerings": [
    { "name": "Product/Service Name", "description": "Brief description", "price": "$XX or price range", "category": "Products | Services | Packages" }
  ]
}

IMPORTANT RULES:
- Be conservative: only include fields you're confident about
- For prices, keep the original format (e.g. "$25", "€30", "R150")
- For brand archetype, infer from tone of voice and messaging
- Extract up to 10 offerings maximum
- For socials, extract all you can find (Instagram, Facebook, TikTok, LinkedIn, Twitter/X, YouTube)
- Return ONLY valid JSON, no markdown formatting`;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<void> {
    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { url } = req.body;

    if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch {
        res.status(400).json({ error: 'Invalid URL format' });
        return;
    }

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!FIRECRAWL_API_KEY || !DEEPSEEK_API_KEY) {
        console.error('Missing API keys');
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }

    try {
        // Step 1: Start Firecrawl crawl job
        console.log('[Extract] Starting Firecrawl crawl for:', url);

        const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                limit: 5, // Crawl up to 5 pages (home, about, contact, products, services)
                scrapeOptions: {
                    formats: ['markdown', 'branding'],
                    onlyMainContent: true,
                },
            }),
        });

        if (!crawlResponse.ok) {
            const errorText = await crawlResponse.text();
            console.error('[Extract] Firecrawl error:', errorText);
            res.status(500).json({ error: 'Failed to start website extraction' });
            return;
        }

        const crawlJob = await crawlResponse.json();
        const jobId = crawlJob.id;

        if (!jobId) {
            console.error('[Extract] No job ID returned from Firecrawl');
            res.status(500).json({ error: 'Failed to start crawl job' });
            return;
        }

        // Step 2: Poll for crawl completion (max 60 seconds)
        console.log('[Extract] Waiting for crawl job:', jobId);
        let crawlResult: FirecrawlCrawlResponse | null = null;
        const maxAttempts = 30;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

            const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                },
            });

            if (!statusResponse.ok) {
                continue;
            }

            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
                crawlResult = statusData;
                break;
            } else if (statusData.status === 'failed') {
                console.error('[Extract] Crawl failed:', statusData);
                res.status(500).json({ error: 'Website extraction failed' });
                return;
            }
        }

        if (!crawlResult || !crawlResult.data || crawlResult.data.length === 0) {
            res.status(500).json({ error: 'No content extracted from website' });
            return;
        }

        console.log('[Extract] Crawl completed, pages extracted:', crawlResult.data.length);

        // Step 3: Combine all page content for DeepSeek
        const combinedMarkdown = crawlResult.data
            .map(page => `## Page: ${page.url}\n\n${page.markdown || ''}`)
            .join('\n\n---\n\n');

        // Get branding from first page (usually homepage)
        const branding = crawlResult.data[0]?.branding || {};

        // Step 4: Call DeepSeek V3.2 to extract structured data
        console.log('[Extract] Calling DeepSeek V3.2 for structured extraction');

        const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-chat', // DeepSeek V3.2
                messages: [
                    { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `Extract business data from this website.

BRANDING DATA (from automated extraction):
${JSON.stringify(branding, null, 2)}

WEBSITE CONTENT:
${combinedMarkdown.slice(0, 50000)}` // Limit to ~50k chars to stay within token limits
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3, // Lower temperature for more consistent extraction
                max_tokens: 4000,
            }),
        });

        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text();
            console.error('[Extract] DeepSeek error:', errorText);
            res.status(500).json({ error: 'Failed to analyze website content' });
            return;
        }

        const deepseekResult = await deepseekResponse.json();
        const aiContent = deepseekResult.choices?.[0]?.message?.content;

        if (!aiContent) {
            res.status(500).json({ error: 'No analysis result from AI' });
            return;
        }

        // Parse AI response
        let extractedData: ExtractedBusinessData;
        try {
            extractedData = JSON.parse(aiContent);
        } catch (parseError) {
            console.error('[Extract] Failed to parse AI response:', aiContent);
            res.status(500).json({ error: 'Failed to parse extraction result' });
            return;
        }

        // Merge Firecrawl branding with AI-extracted data
        // Firecrawl's automated branding detection takes priority for colors/logo
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

        // Build confidence scores based on what was extracted
        const confidence: Record<string, number> = {};
        if (extractedData.name) confidence.identity = 0.9;
        if (extractedData.colors?.primary) confidence.branding = 0.95;
        if (extractedData.profile?.contactEmail || extractedData.profile?.contactPhone) confidence.contact = 0.8;
        if (extractedData.voice?.archetypeInferred) confidence.voice = 0.6;
        if (extractedData.offerings && extractedData.offerings.length > 0) confidence.offerings = 0.7;

        const response: ExtractionResponse = {
            success: true,
            data: extractedData,
            confidence,
            rawBranding: branding,
        };

        console.log('[Extract] Extraction complete for:', url);
        res.status(200).json(response);

    } catch (error) {
        console.error('[Extract] Unexpected error:', error);
        res.status(500).json({
            error: 'An unexpected error occurred during extraction',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
