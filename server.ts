
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Allow large images

// Prevent EIO errors (Standard Input conflict)
if (typeof process !== 'undefined' && process.stdin && process.stdin.destroy) {
    process.stdin.destroy();
}

// --- API ROUTE: Generate Text ---
app.post('/api/generate-text', async (req, res) => {
    console.log('[Server] Text Generation Request Received');
    try {
        const { messages, prompt, system, modelTier = 'standard' } = req.body;

        const modelName = modelTier === 'premium' ? 'gemini-1.5-pro' : 'gemini-2.0-flash';
        const model = google(modelName);

        const result = await generateText({
            model,
            messages: messages || [{ role: 'user', content: prompt }],
            system,
        });

        console.log('[Server] Text Generated Successfully');
        res.json({ text: result.text });

    } catch (error) {
        console.error('[Server] Text Gen Error:', error);
        res.status(500).json({ error: 'Failed to generate text' });
    }
});

// import generateImageHandler from './api/generate-image';

// --- API ROUTE: Generate Image (Adapter for Vercel Function) ---
// This ensures we run the EXACT same code (Brain -> Hand) locally as in production.
/*
app.post('/api/generate-image', async (req, res) => {
    console.log('[Server] Image Generation Request Received (Brain Mode)');
    
    try {
        // 1. Convert Express Request to Web Standard Request
        // We need to create a fake URL for the constructor
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        const webReq = new Request('http://localhost:3000/api/generate-image', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body)
        });

        // 2. Call the Vercel Function Handler
        // const webRes = await generateImageHandler(webReq);

        // 3. Convert Web Response back to Express Response
        // const data = await webRes.json();
        // res.status(webRes.status).json(data);

        res.status(501).json({ error: "Server-side generation temporarily disabled locally." });

    } catch (error) {
        console.error('[Server] Image Gen Adapter Error:', error);
        res.status(500).json({ error: 'Failed to execute image generation handler' });
    }
});
*/

// --- API ROUTE: Discover Pages (Local Development) ---
// Uses Firecrawl v1/map to get a list of pages for selection
app.post('/api/discover-pages', async (req, res) => {
    console.log('[Server] Page Discovery Request Received');

    const { url } = req.body;

    if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

    if (!FIRECRAWL_API_KEY) {
        console.error('[Server] FIRECRAWL_API_KEY not set');
        res.status(500).json({ error: 'Firecrawl API key not configured' });
        return;
    }

    try {
        console.log('[Server] Calling Firecrawl map:', url);

        const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url,
                limit: 50, // Get up to 50 pages for thorough discovery
            }),
        });

        if (!mapResponse.ok) {
            const errorText = await mapResponse.text();
            console.error('[Server] Firecrawl map error:', errorText);
            res.status(500).json({ error: 'Failed to discover pages' });
            return;
        }

        const mapResult = await mapResponse.json();
        console.log('[Server] ===== PAGE DISCOVERY DEBUG =====');
        console.log('[Server] Raw pages from Firecrawl:', mapResult.links?.length || 0);
        console.log('[Server] All URLs:', mapResult.links || []);

        // Filter out admin, category, author, and other non-content pages
        const EXCLUDE_PATTERNS = [
            /\/author\//,
            /\/category\//,
            /\/tag\//,
            /\/product-category\//,
            /\/brand\//,
            /\/admin/,
            /\/wp-admin/,
            /\/wp-content/,
            /\/login/,
            /\/cart/,
            /\/checkout/,
            /\/my-account/,
            /\/feed/,
            /\/sitemap/,
            /\.xml$/i,  // XML files (sitemaps)
            /\/purchase/i,
            /\/track/i,
            /\?/,  // Query string parameters
            /#/,   // Hash fragments
        ];

        const filteredLinks = (mapResult.links || []).filter((link: string) => {
            return !EXCLUDE_PATTERNS.some(pattern => pattern.test(link));
        });

        console.log('[Server] Filtered pages:', filteredLinks.length);

        // Smart scoring system - prioritize main pages over blog posts
        const scorePage = (url: string): number => {
            const pathname = new URL(url).pathname.toLowerCase();
            const slug = pathname.split('/').pop() || '';
            const pathDepth = pathname.split('/').filter(Boolean).length;

            let score = 50; // Base score

            // HIGH PRIORITY - Main structural pages
            if (pathname === '/' || pathname === '') score += 100; // Homepage
            if (/\/(shop|store|products?)($|\/)/.test(pathname)) score += 90;
            if (/\/(about|about-us|our-story)($|\/)/.test(pathname)) score += 85;
            if (/\/(contact|contact-us|get-in-touch)($|\/)/.test(pathname)) score += 85;
            if (/\/(services?|pricing|faq|team)($|\/)/.test(pathname)) score += 80;
            if (/\/(menu|gallery|portfolio|work)($|\/)/.test(pathname)) score += 75;
            if (/\/(accommodation|rooms?|booking)($|\/)/.test(pathname)) score += 75;
            if (/\/(stockists?|where-to-buy|locations?)($|\/)/.test(pathname)) score += 70;

            // MEDIUM PRIORITY - Category/collection pages
            if (/\/(collections?|categories?)($|\/)/.test(pathname)) score += 60;
            if (/\/shop\/[^/]+$/.test(pathname)) score += 55; // Shop subcategory

            // DEPRIORITIZE - Blog-like content (more aggressive)
            const hyphenCount = (slug.match(/-/g) || []).length;
            if (hyphenCount >= 3) score -= 30; // 3+ hyphens = likely blog
            if (hyphenCount >= 5) score -= 30; // 5+ hyphens = definitely blog
            if (hyphenCount >= 7) score -= 20; // Very long

            // Blog paths
            if (pathname === '/blog' || pathname === '/blog/') score -= 20; // /blog index page
            if (/\/blog\//.test(pathname)) score -= 50; // Blog post
            if (/\/news\//.test(pathname)) score -= 40;
            if (/\/post\//.test(pathname)) score -= 50;
            if (/\/article\//.test(pathname)) score -= 50;
            if (/\/(20[0-9]{2})\//.test(pathname)) score -= 60; // Date in URL = blog

            // Blog keywords in slug (expanded)
            if (/-(ideas?|tips?|guide|how-to|what-is|why-|new-|allegedly|opportunity|producing|love)/i.test(slug)) score -= 40;
            if (/^(why|how|what|when|the)-/i.test(slug)) score -= 30; // Starts with question/article word
            if (slug.length > 40) score -= 20; // Very long slugs = articles

            // Penalize deep paths
            if (pathDepth > 3) score -= (pathDepth - 3) * 10;

            // Penalize setup/guide pages
            if (/setup|guide|tutorial/i.test(slug)) score -= 20;

            return score;
        };

        // Score and sort all pages
        const scoredLinks = filteredLinks
            .map((link: string) => ({ url: link, score: scorePage(link) }))
            .sort((a, b) => b.score - a.score);

        console.log('[Server] Top scored pages:', scoredLinks.slice(0, 8).map(p => ({ url: p.url, score: p.score })));

        // Filter out low-quality pages (score < 20) - more lenient to include more pages
        let qualityLinks = scoredLinks.filter(p => p.score >= 20);
        console.log('[Server] Quality pages (score >= 20):', qualityLinks.length);

        // ===== HYBRID FALLBACK: Probe common paths if we got too few pages =====
        const MIN_QUALITY_THRESHOLD = 5;
        if (qualityLinks.length < MIN_QUALITY_THRESHOLD) {
            console.log('[Server] 🔍 Insufficient pages from sitemap, probing common paths...');

            // Common business page paths to probe
            const COMMON_PATHS = [
                '/shop', '/store', '/products', '/collections',
                '/about', '/about-us', '/our-story',
                '/contact', '/contact-us', '/get-in-touch',
                '/services', '/our-services',
                '/menu', '/pricing', '/rates',
                '/gallery', '/portfolio', '/work', '/projects',
                '/team', '/our-team', '/staff',
                '/faq', '/faqs', '/help',
                '/blog', '/news', '/articles',
                '/locations', '/find-us', '/stockists',
                '/booking', '/book', '/reservations', '/appointments',
                '/accommodation', '/rooms', '/stays',
            ];

            // Get base URL (handle www vs non-www)
            const parsedUrl = new URL(url);
            const baseUrls = [
                `${parsedUrl.protocol}//${parsedUrl.hostname}`,
                parsedUrl.hostname.startsWith('www.')
                    ? `${parsedUrl.protocol}//${parsedUrl.hostname.replace('www.', '')}`
                    : `${parsedUrl.protocol}//www.${parsedUrl.hostname}`
            ];

            // Existing URLs we already have (to avoid duplicates)
            const existingPaths = new Set(qualityLinks.map(l => new URL(l.url).pathname.toLowerCase()));

            // Probe each path with both base URLs
            const probePromises: Promise<{ url: string; exists: boolean; path: string }>[] = [];

            for (const base of baseUrls) {
                for (const path of COMMON_PATHS) {
                    if (!existingPaths.has(path)) {
                        const testUrl = `${base}${path}`;
                        probePromises.push(
                            fetch(testUrl, {
                                method: 'HEAD',
                                redirect: 'follow',
                                signal: AbortSignal.timeout(3000) // 3s timeout per probe
                            })
                                .then(resp => ({
                                    url: resp.url, // Use final URL after redirects
                                    exists: resp.ok,
                                    path
                                }))
                                .catch(() => ({ url: testUrl, exists: false, path }))
                        );
                    }
                }
            }

            const probeResults = await Promise.all(probePromises);
            const foundPages = probeResults
                .filter(r => r.exists)
                .filter((r, i, arr) => arr.findIndex(x => x.url === r.url) === i) // Dedupe by final URL
                .filter(r => !existingPaths.has(new URL(r.url).pathname.toLowerCase())); // Exclude already found

            console.log('[Server] 🔍 Probed paths, found:', foundPages.length, 'new pages');
            console.log('[Server] 🔍 Found URLs:', foundPages.map(p => p.url));

            // Add found pages to quality links with high scores
            for (const found of foundPages) {
                qualityLinks.push({
                    url: found.url,
                    score: 80 // Good score for probed pages
                });
            }

            // Re-sort by score
            qualityLinks.sort((a, b) => b.score - a.score);
        }

        // Return simplified page list - cap at 15 quality pages
        const pages = qualityLinks.slice(0, 15).map((item: { url: string; score: number }, index: number) => {
            const pathname = new URL(item.url).pathname.replace(/^\/|\/$/g, '');
            const title = pathname
                ? pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                : 'Homepage';
            return {
                id: `page-${index}`,
                url: item.url,
                title: title || 'Page',
                score: item.score, // Include score for debugging
            };
        });

        res.json({ success: true, pages });

    } catch (error) {
        console.error('[Server] Page discovery error:', error);
        res.status(500).json({ error: 'Page discovery failed' });
    }
});

// --- API ROUTE: Extract Website (Local Development) ---
// Uses Firecrawl v2.7.0 + DeepSeek V3.2 for intelligent extraction
app.post('/api/extract-website', async (req, res) => {
    console.log('[Server] Website Extraction Request Received');

    const { url, mode = 'full' } = req.body; // mode: 'single' or 'full'

    if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

    if (!FIRECRAWL_API_KEY || !DEEPSEEK_API_KEY) {
        console.error('[Server] Missing API keys. Add FIRECRAWL_API_KEY and DEEPSEEK_API_KEY to .env.local');
        res.status(500).json({ error: 'Missing API keys in .env.local' });
        return;
    }

    try {
        // Step 1: Call Firecrawl (scrape for single page, crawl for full)
        const endpoint = mode === 'single'
            ? 'https://api.firecrawl.dev/v1/scrape'
            : 'https://api.firecrawl.dev/v1/crawl';

        console.log(`[Server] Calling Firecrawl ${mode === 'single' ? 'scrape' : 'crawl'}:`, url);

        const firecrawlBody = mode === 'single'
            ? {
                url,
                formats: ['markdown', 'branding'],
                onlyMainContent: true,
            }
            : {
                url,
                limit: 5,
                scrapeOptions: {
                    formats: ['markdown', 'branding'],
                    onlyMainContent: true,
                },
            };

        const crawlResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(firecrawlBody),
        });

        if (!crawlResponse.ok) {
            const errorText = await crawlResponse.text();
            console.error('[Server] Firecrawl error:', errorText);
            res.status(500).json({ error: 'Failed to extract website' });
            return;
        }

        let firecrawlData: any;

        if (mode === 'single') {
            // Scrape returns data directly
            firecrawlData = await crawlResponse.json();
            firecrawlData = { data: [firecrawlData.data || firecrawlData] };
        } else {
            // Crawl returns a job ID, need to poll
            const crawlJob = await crawlResponse.json();
            const jobId = crawlJob.id;

            if (!jobId) {
                res.status(500).json({ error: 'Failed to start crawl job' });
                return;
            }

            console.log('[Server] Waiting for crawl job:', jobId);

            for (let attempt = 0; attempt < 30; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 2000));

                const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
                    headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` },
                });

                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    if (statusData.status === 'completed') {
                        firecrawlData = statusData;
                        break;
                    } else if (statusData.status === 'failed') {
                        res.status(500).json({ error: 'Crawl failed' });
                        return;
                    }
                }
            }
        }

        if (!firecrawlData?.data?.length) {
            res.status(500).json({ error: 'No content extracted' });
            return;
        }

        console.log('[Server] Firecrawl completed, pages:', firecrawlData.data.length);

        // Step 2: DeepSeek V3.2 extraction
        const combinedMarkdown = firecrawlData.data
            .map((page: any) => `## Page: ${page.url || url}\n\n${page.markdown || ''}`)
            .join('\n\n---\n\n');

        const branding = firecrawlData.data[0]?.branding || {};

        const EXTRACTION_PROMPT = `You are an expert business analyst. Extract business data from this website into JSON.

## REQUIRED FORMAT
Return ONLY valid JSON with these fields:

{
  "name": "Business Name",
  "industry": "MUST be one of: Retail | E-Commerce | Service | Tech | Food | Health | Beauty | Real Estate | Education | Finance | Legal | Construction | Automotive | Entertainment | Travel | Marketing | Non-Profit | Consulting | Fashion | Fitness | Art | Events | Photography | Agriculture | Manufacturing | Logistics",
  "type": "MUST be one of: Retail | E-Commerce | Service | Other",
  "description": "2-3 sentence description",
  "slogan": "Tagline if found",
  "profile": {
    "contactEmail": "email if found",
    "contactPhone": "phone if found", 
    "address": "full address if found (for storefront/appointment only)",
    "operatingMode": "MUST be one of: storefront | online | service | appointment",
    "socials": [{"platform": "instagram", "handle": "@example"}]
  },
  "voice": {
    "archetypeInferred": "MUST be one of: The Innocent | The Explorer | The Sage | The Hero | The Outlaw | The Magician | The Guy/Girl Next Door | The Lover | The Jester | The Caregiver | The Creator | The Ruler",
    "tonePillsInferred": ["Professional", "Friendly", etc - max 3],
    "keywords": ["key", "brand", "words"]
  },
  "usps": ["Unique selling point 1", "USP 2"],
  "offerings": [{"name": "Product/Service", "description": "Brief desc", "price": "R100 or $50", "category": "Products or Services"}],
  "targetAudience": "Description of who they serve",
  "targetLanguage": "Primary language of website content"
}

## OPERATING MODE RULES
- storefront: Physical location (has address, hours, "visit us")
- online: E-commerce only (has cart, checkout, shipping)
- service: Goes to customer (has service area, "we come to you")
- appointment: Booking-based (has calendar, scheduling, appointments)

## ARCHETYPE INFERENCE RULES
- The Innocent: Pure, optimistic, simple
- The Hero: Bold, achievement-focused, empowering
- The Sage: Expert, educational, intellectual
- The Outlaw: Rebellious, provocative, disruptive
- The Magician: Transformative, visionary, innovative
- The Caregiver: Nurturing, compassionate, supportive
- The Creator: Artistic, innovative, perfectionist
- The Ruler: Premium, authoritative, exclusive
- The Lover: Passionate, intimate, sensual
- The Jester: Fun, playful, humorous
- The Explorer: Adventurous, authentic, free-spirited
- The Guy/Girl Next Door: Relatable, down-to-earth, friendly

Be conservative. Only include data you're confident about.`;

        console.log('[Server] Calling DeepSeek V3.2...');

        const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: EXTRACTION_PROMPT },
                    { role: 'user', content: `BRANDING:\n${JSON.stringify(branding)}\n\nCONTENT:\n${combinedMarkdown.slice(0, 50000)}` }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
                max_tokens: 4000,
            }),
        });

        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text();
            console.error('[Server] DeepSeek error:', errorText);
            res.status(500).json({ error: 'AI analysis failed' });
            return;
        }

        const deepseekResult = await deepseekResponse.json();
        const aiContent = deepseekResult.choices?.[0]?.message?.content;

        let extractedData;
        try {
            extractedData = JSON.parse(aiContent);
        } catch {
            res.status(500).json({ error: 'Failed to parse AI response' });
            return;
        }

        // Merge Firecrawl branding (colors + logo)
        if (branding.colors) {
            extractedData.colors = {
                primary: branding.colors.primary || extractedData.colors?.primary,
                secondary: branding.colors.secondary || extractedData.colors?.secondary,
                accent: branding.colors.accent || extractedData.colors?.accent,
            };
        }

        // Extract logo from branding
        if (branding.logo) {
            extractedData.logoUrl = branding.logo;
        }

        const confidence: Record<string, number> = {};
        if (extractedData.name) confidence.identity = 0.9;
        if (extractedData.colors?.primary) confidence.branding = 0.95;
        if (extractedData.profile?.contactEmail || extractedData.profile?.contactPhone) confidence.contact = 0.8;
        if (extractedData.voice?.archetypeInferred) confidence.voice = 0.7;
        if (extractedData.offerings?.length) confidence.offerings = 0.7;
        if (extractedData.logoUrl) confidence.logo = 0.95;

        console.log('[Server] Extraction complete for:', url);
        res.json({ success: true, data: extractedData, confidence, rawBranding: branding });

    } catch (error) {
        console.error('[Server] Extraction error:', error);
        res.status(500).json({ error: 'Extraction failed' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`✅ Local API Server running at http://localhost:${port}`);
    console.log(`   - POST /api/generate-text`);
    console.log(`   - POST /api/generate-image`);
    console.log(`   - POST /api/extract-website`);
});
