import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import multer from 'multer';
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import bodyParser from 'body-parser';
import {
    inviteValidateRateLimiter,
    inviteUseRateLimiter,
    getClientIP,
    checkRateLimit,
    setRateLimitHeaders,
    isUpstashConfigured
} from './lib/ratelimit';
// Note: PromptFactory is imported dynamically in generateImage route to avoid
// supabase client initialization before dotenv.config() runs

// Load environment variables
dotenv.config({ path: '.env.local' });


import { AI_MODELS } from './config/ai-models';

const app = express();
const port = 3000;

// Middleware - Explicit CORS for Vite dev server
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' })); // Allow large images

// Prevent EIO errors (Standard Input conflict)
// Prevent EIO errors (Standard Input conflict)
// if (typeof process !== 'undefined' && process.stdin && process.stdin.destroy) {
//     process.stdin.destroy();
// }

// Debugging: Log process exit
process.on('exit', (code) => {
    console.log(`[Server] Process exiting with code: ${code}`);
});
process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- API ROUTE: Generate Text ---
app.post('/api/generate-text', async (req, res) => {
    console.log('[Server] Text Generation Request Received');
    try {
        const { messages, prompt, system, modelTier = 'standard' } = req.body;

        // Use Vercel AI Gateway - gemini-2.5-flash for all tiers (2.0-flash is outdated)
        // Use Vercel AI Gateway with centralized config
        const model = gateway(AI_MODELS.text as any);

        const result = await generateText({
            model,
            messages: messages || [{ role: 'user', content: prompt }],
            system,
        });

        console.log('[Server] Text Generated Successfully via Vercel Gateway');
        res.json({ text: result.text });

    } catch (error) {
        console.error('[Server] Text Gen Error:', error);
        res.status(500).json({ error: 'Failed to generate text' });
    }
});

// import generateImageHandler from './api/generate-image';
import exportPrintHandler from './api/export-print';
import businessOrderHandler from './api/business-order';
import testVercelAiHandler from './api/test-vercel-ai';

// Share API Handlers (Printer Share Link)
import shareCreateHandler from './api/share/create';
import shareValidateHandler from './api/share/validate';
import shareRevokeHandler from './api/share/revoke';
import shareListHandler from './api/share/list';

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

// --- API ROUTE: Business Order (Persist drag-drop reordering) ---
app.put('/api/business-order', async (req, res) => {
    console.log('[Server] Business Order Update Request');
    try {
        await businessOrderHandler(req as any, res as any);
    } catch (error: any) {
        console.error('[Server] Business Order Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to update order', details: error.message });
        }
    }
});

// --- API ROUTE: Print Export (Adapter for Vercel Function) ---
app.post('/api/export-print', async (req, res) => {
    console.log('[Server] Print Export Request Received');
    try {
        // Call the Vercel Function Handler
        // Express req/res are compatible enough with VercelRequest/VercelResponse for this use case
        await exportPrintHandler(req as any, res as any);
    } catch (error: any) {
        console.error('[Server] Print Export Adapter Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to execute export handler', details: error.message });
        }
    }
});

// --- API ROUTE: Convert SVG to PNG ---
app.post('/api/convert-svg', async (req, res) => {
    console.log('[Server] SVG Conversion Request Received');
    try {
        const { svgData } = req.body;

        if (!svgData) {
            res.status(400).json({ error: 'No SVG data provided' });
            return;
        }

        // Convert base64 SVG to PNG using Sharp
        const svgBuffer = Buffer.from(svgData, 'base64');
        const pngBuffer = await sharp(svgBuffer)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: false })
            .png({ quality: 90 })
            .toBuffer();

        console.log('[Server] SVG converted to PNG successfully');
        res.json({
            success: true,
            pngData: pngBuffer.toString('base64'),
            mimeType: 'image/png'
        });
    } catch (error: any) {
        console.error('[Server] SVG Conversion Error:', error);
        res.status(500).json({ error: 'Failed to convert SVG', details: error.message });
    }
});

// --- API ROUTES: Share (Printer Share Link Feature) ---
app.post('/api/share/create', async (req, res) => {
    console.log('[Server] Share Create Request');
    try {
        await shareCreateHandler(req as any, res as any);
    } catch (error: any) {
        console.error('[Server] Share Create Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to create share', details: error.message });
        }
    }
});

app.get('/api/share/validate/:token', async (req, res) => {
    console.log('[Server] Share Validate Request:', req.params.token);
    try {
        // Create a mock request with token in query (req.query is read-only)
        const mockReq = {
            ...req,
            method: req.method,
            headers: req.headers,
            query: { token: req.params.token },
        };
        await shareValidateHandler(mockReq as any, res as any);
    } catch (error: any) {
        console.error('[Server] Share Validate Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to validate share', details: error.message });
        }
    }
});

app.post('/api/share/revoke', async (req, res) => {
    console.log('[Server] Share Revoke Request');
    try {
        await shareRevokeHandler(req as any, res as any);
    } catch (error: any) {
        console.error('[Server] Share Revoke Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to revoke share', details: error.message });
        }
    }
});

app.get('/api/share/list', async (req, res) => {
    console.log('[Server] Share List Request');
    try {
        await shareListHandler(req as any, res as any);
    } catch (error: any) {
        console.error('[Server] Share List Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to list shares', details: error.message });
        }
    }
});

// --- Share: Send Email ---
app.post('/api/share/send-email', async (req, res) => {
    console.log('[Server] Share Send Email Request');
    try {
        const { shareId, recipientEmail } = req.body;

        if (!shareId || !recipientEmail) {
            return res.status(400).json({ error: 'shareId and recipientEmail are required' });
        }

        // Check for Resend API key
        if (!process.env.RESEND_API_KEY) {
            return res.status(500).json({ error: 'Email service not configured' });
        }

        // Get auth
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userToken = authHeader.split(' ')[1];

        const supabaseUrl = process.env.VITE_SUPABASE_URL!;
        const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseSecretKey);

        // Verify user
        const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid auth token' });
        }

        // Get share and verify ownership
        const { data: share, error: shareError } = await supabase
            .from('shared_assets')
            .select('*, businesses(name, logo_url)')
            .eq('id', shareId)
            .eq('created_by', user.id)
            .single();

        if (shareError || !share) {
            return res.status(404).json({ error: 'Share not found' });
        }

        // ALWAYS use production URL for share links - recipients click from external email clients
        const shareUrl = `https://app.xcreate.io/print/${share.token}`;

        // Send email using Resend
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const businessName = share.businesses?.name || 'a business';

        const emailHtml = generateShareAssetEmailHtml({
            businessName,
            shareUrl,
            expiresAt: share.expires_at
        });

        const response = await resend.emails.send({
            from: 'Ads x Create <team@mail.xcreate.io>',
            replyTo: 'team@xcreate.io',
            to: recipientEmail,
            subject: `Print-Ready Asset from ${businessName}`,
            html: emailHtml
        });

        if (response.error) {
            console.error('[Share] Resend API Error:', response.error);
            return res.status(500).json({
                error: response.error.message || 'Failed to send email',
                details: response.error
            });
        }

        console.log('[Share] Email sent successfully. ID:', response.data?.id);
        res.json({ success: true });

    } catch (error: any) {
        console.error('[Server] Share Send Email Error:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

// --- API ROUTE: Test Vercel AI Gateway (Isolated POC) ---
app.post('/api/test-vercel-ai', async (req, res) => {
    console.log('[Server] Test Vercel AI Gateway Request Received');
    try {
        await testVercelAiHandler(req as any, res as any);
    } catch (error: any) {
        console.error('[Server] Test Vercel AI Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Test failed', details: error.message });
        }
    }
});

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
// Uses Firecrawl V2 + Gemini 3 Flash for intelligent extraction
// Supports: 'single' (1 page), 'select' (batch URLs), 'full' (crawl site)
const FIRECRAWL_V2_BASE = 'https://api.firecrawl.dev/v2';

// Helper: Poll async job status
async function pollFirecrawlJob(
    jobId: string,
    jobType: 'crawl' | 'batch-scrape',
    apiKey: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
    for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const response = await fetch(`${FIRECRAWL_V2_BASE}/${jobType}/${jobId}`, {
                headers: { 'Authorization': `Bearer ${apiKey}` },
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            if (response.ok) {
                const statusData = await response.json();
                console.log(`[Server] Job status (${attempt + 1}/30):`, statusData.status);

                if (statusData.status === 'completed') {
                    return { success: true, data: statusData.data || [] };
                } else if (statusData.status === 'failed') {
                    return { success: false, error: 'Job failed' };
                }
            } else if (response.status === 429) {
                continue; // Retry on rate limit
            }
        } catch (err) {
            console.error(`[Server] Poll error (attempt ${attempt + 1}):`, err);
        }
    }
    return { success: false, error: 'Job timed out' };
}

// ============================================================================
// SVG TO PNG CONVERSION HELPER
// ============================================================================

/**
 * Check if a URL points to an SVG image
 */
function isSvgUrl(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.svg') || lowerUrl.includes('.svg?');
}

/**
 * Convert an SVG URL to PNG, upload to Supabase Storage, return the PNG URL
 * If not SVG or conversion fails, returns the original URL
 */
async function convertSvgToPngIfNeeded(
    imageUrl: string,
    businessId: string,
    supabase: any,
    label: string = 'image'
): Promise<string> {
    // Skip if not SVG
    if (!isSvgUrl(imageUrl)) {
        return imageUrl;
    }

    console.log(`[SVG Convert] Converting ${label} SVG to PNG:`, imageUrl);

    try {
        // 1. Fetch the SVG
        const response = await fetch(imageUrl, {
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            console.error(`[SVG Convert] Failed to fetch SVG: ${response.status}`);
            return imageUrl;
        }

        const svgBuffer = Buffer.from(await response.arrayBuffer());

        // 2. Convert SVG to PNG using Sharp
        // Sharp automatically handles SVG input and converts to PNG
        const pngBuffer = await sharp(svgBuffer)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: false })
            .png({ quality: 90 })
            .toBuffer();

        // 3. Upload to Supabase Storage
        const fileName = `${businessId || 'system'}/logos/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

        const { error: uploadError } = await supabase.storage
            .from('business-assets')
            .upload(fileName, pngBuffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            console.error('[SVG Convert] Upload failed:', uploadError);
            return imageUrl;
        }

        // 4. Get the public URL
        const { data: urlData } = supabase.storage
            .from('business-assets')
            .getPublicUrl(fileName);

        console.log(`[SVG Convert] ✅ Converted ${label} to PNG:`, urlData.publicUrl);
        return urlData.publicUrl;

    } catch (error) {
        console.error('[SVG Convert] Conversion error:', error);
        return imageUrl; // Fallback to original on error
    }
}

app.post('/api/extract-website', async (req, res) => {
    console.log('[Server] Website Extraction Request Received');

    const { url, urls, mode = 'single' } = req.body;

    // Validate input
    if (mode === 'select' && (!urls || !Array.isArray(urls) || urls.length === 0)) {
        res.status(400).json({ error: 'URLs array required for select mode' });
        return;
    }

    if ((mode === 'single' || mode === 'full') && !url) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

    if (!FIRECRAWL_API_KEY) {
        console.error('[Server] Missing FIRECRAWL_API_KEY');
        res.status(500).json({ error: 'Missing FIRECRAWL_API_KEY in .env.local' });
        return;
    }

    try {
        let pages: any[] = [];

        // Step 1: Get pages based on mode
        if (mode === 'single') {
            console.log('[Server] V2 Single Scrape:', url);
            const response = await fetch(`${FIRECRAWL_V2_BASE}/scrape`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    formats: ['markdown', 'branding']
                }),
                signal: AbortSignal.timeout(25000)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Server] V2 Scrape error:', errorText);
                res.status(500).json({ error: 'Scrape failed' });
                return;
            }

            const result = await response.json();
            pages = [result.data];

        } else if (mode === 'select') {
            console.log('[Server] V2 Batch Scrape:', urls.length, 'URLs');
            const response = await fetch(`${FIRECRAWL_V2_BASE}/batch-scrape`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    urls: urls.slice(0, 10),
                    formats: ['markdown', 'branding'],
                }),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Server] V2 Batch error:', errorText);
                res.status(500).json({ error: 'Batch scrape failed' });
                return;
            }

            const result = await response.json();
            if (!result.id) {
                res.status(500).json({ error: 'Failed to start batch job' });
                return;
            }

            console.log('[Server] Batch job started:', result.id);
            const pollResult = await pollFirecrawlJob(result.id, 'batch-scrape', FIRECRAWL_API_KEY);

            if (!pollResult.success) {
                res.status(500).json({ error: pollResult.error });
                return;
            }
            pages = pollResult.data || [];

        } else if (mode === 'full') {
            console.log('[Server] V2 Crawl:', url);
            const response = await fetch(`${FIRECRAWL_V2_BASE}/crawl`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    limit: 5,
                    scrapeOptions: {
                        formats: ['markdown', 'branding'],
                    },
                }),
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Server] V2 Crawl error:', errorText);
                res.status(500).json({ error: 'Crawl failed' });
                return;
            }

            const result = await response.json();
            if (!result.id) {
                res.status(500).json({ error: 'Failed to start crawl job' });
                return;
            }

            console.log('[Server] Crawl job started:', result.id);
            const pollResult = await pollFirecrawlJob(result.id, 'crawl', FIRECRAWL_API_KEY);

            if (!pollResult.success) {
                res.status(500).json({ error: pollResult.error });
                return;
            }
            pages = pollResult.data || [];
        }

        if (!pages.length) {
            res.status(500).json({ error: 'No content extracted' });
            return;
        }

        console.log('[Server] Firecrawl V2 completed, pages:', pages.length);

        // Step 2: Combine markdown from all pages
        const combinedMarkdown = pages
            .map((page: any) => `## Page: ${page.metadata?.title || page.url || url}\n\n${page.markdown || ''}`)
            .join('\n\n---\n\n');

        const branding = pages[0]?.branding || {};

        // Step 2b: Call Firecrawl /extract for structured contact info (more reliable than LLM)
        let firecrawlExtractData: any = null;
        try {
            console.log('[Server] Calling Firecrawl /extract for contact info...');
            const extractUrl = mode === 'single' ? url : (urls?.[0] || url);
            const extractResponse = await fetch(`${FIRECRAWL_V2_BASE}/extract`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    urls: [extractUrl],
                    prompt: "Extract contact information from this website including email addresses, phone numbers, physical address, and social media links (Instagram, Facebook, LinkedIn, Twitter/X, TikTok, YouTube, Pinterest, WhatsApp)",
                    schema: {
                        type: "object",
                        properties: {
                            emails: { type: "array", items: { type: "string" } },
                            phones: { type: "array", items: { type: "string" } },
                            address: { type: "string" },
                            socials: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        platform: { type: "string" },
                                        url: { type: "string" }
                                    }
                                }
                            }
                        }
                    }
                }),
                signal: AbortSignal.timeout(15000) // 15s timeout for extract
            });

            if (extractResponse.ok) {
                const extractResult = await extractResponse.json();
                if (extractResult.success && extractResult.data) {
                    firecrawlExtractData = extractResult.data;
                    console.log('[Server] Firecrawl /extract success:', firecrawlExtractData);
                }
            } else {
                console.log('[Server] Firecrawl /extract failed (non-critical):', await extractResponse.text());
            }
        } catch (extractError) {
            console.log('[Server] Firecrawl /extract error (non-critical):', extractError);
        }

        // Step 3: Gemini 3 Flash extraction
        const EXTRACTION_PROMPT = `You are an expert business analyst. Extract business data from this website into JSON.

HALLUCINATION FIREWALL (SAFETY FIRST):
1. HARD FACTS (Hours, Phone, Team, Address): STRICTLY extract. Return null if not explicitly found. DO NOT INFER or invent.
2. VIBE (Archetype, Strategy, Voice): Infer from content and intent. If not explicit, analyze the brand's potential strategy.
3. CREATIVE (Slogan): Extract if present. Do not generate unless instructed.

## REQUIRED FORMAT
Return ONLY valid JSON with these fields:

{
  "name": "Business Name",
  "industry": "Specific Industry",
  "type": "Retail | E-Commerce | Service | Other",
  "description": "2-3 sentence description",
  "slogan": "Tagline if found",
  
  "profile": {
    "contactEmail": "email if found",
    "contactPhone": "phone if found", 
    "address": "full address if found",
    "publicLocationLabel": "City, Country",
    "hours": { "Mon-Fri": "9am-5pm" },
    "timezone": "e.g. Africa/Johannesburg",
    "bookingUrl": "booking url if found",
    "operatingMode": "MUST be one of: storefront | online | service | appointment",
    "socials": [{"platform": "instagram", "handle": "@example"}]
  },

  "brandKit": {
     "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex" },
     "typography": { "headings": "Font Name", "body": "Font Name" },
     "visualMotifs": ["motif 1", "motif 2"]
  },
  
  "strategy": {
     "coreCustomerProfile": {
        "demographics": "e.g. Women 25-45, urban",
        "psychographics": "e.g. Eco-conscious, value quality",
        "painPoints": ["pain 1", "pain 2 or NULL"],
        "desires": ["desire 1", "desire 2"]
     },
     "competitors": ["Competitor A", "Competitor B"]
  },

  "voice": {
    "archetypeInferred": "MUST be one of: The Innocent | The Explorer | The Sage | The Hero | The Outlaw | The Magician | The Guy/Girl Next Door | The Lover | The Jester | The Caregiver | The Creator | The Ruler",
    "tonePillsInferred": "MUST select exactly 4 from: Bold, Premium, Minimal, Playful, Modern, Classic, Elegant, Timeless, Sophisticated, Luxurious, Refined, Curated, Professional, Creative, Energetic, Witty, Urgent, Calm, Warm, Approachable, Sincere, Trustworthy, Friendly, Exclusive, Rebellious, Community Focused, Authoritative, Supportive, Personable, Welcoming, Educational, Insightful, Analytical, Geeky, Direct, Informative, Expert",
    "keywords": ["key", "brand", "words"]
  },
  
  "content": {
     "teamMembers": [{"name": "Name", "role": "Role", "imageUrl": "url"}],
     "locations": [{"name": "Branch Name", "address": "Address", "imageUrl": "url"}],
     "testimonials": [{"text": "Quote", "author": "Name"}]
  },

  "usps": ["Unique selling point 1", "USP 2"],
  "offerings": [{"name": "Product/Service", "description": "Brief desc", "price": "R100 or $50", "category": "Products or Services"}],
  "targetAudience": "Description of who they serve",
  "targetLanguage": "Primary language of website content"
}

CONTACT EXTRACTION RULES:
- Look carefully in the ENTIRE content including headers and footers
- Email addresses often appear as: info@, contact@, hello@, support@
- Phone numbers may be formatted with dashes, spaces, or parentheses
- South African phones: +27, 0xx xxx xxxx
- US phones: (xxx) xxx-xxxx
- Extract ANY email or phone you find - do not skip them

Do your best to extract all available information while respecting the Hallucination Firewall.`;

        console.log('[Server] Calling Gemini 3 Flash via Vercel AI Gateway...');

        // Use Vercel AI Gateway for Text Generation
        const deepseekResult = await generateText({
            model: gateway(AI_MODELS.text as any),
            system: EXTRACTION_PROMPT,
            prompt: `BRANDING:\n${JSON.stringify(branding)}\n\nCONTENT:\n${combinedMarkdown.slice(0, 50000)}`,
            temperature: 0.2,
        });

        console.log('[Server] Gemini 3 Flash parsing complete');

        let extractedData;
        try {
            // Clean the response - remove markdown code blocks if present
            let jsonText = deepseekResult.text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.slice(7);
            }
            if (jsonText.startsWith('```')) {
                jsonText = jsonText.slice(3);
            }
            if (jsonText.endsWith('```')) {
                jsonText = jsonText.slice(0, -3);
            }
            extractedData = JSON.parse(jsonText.trim());
        } catch {
            console.error('[Server] Failed to parse AI response:', deepseekResult.text.slice(0, 500));
            res.status(500).json({ error: 'Failed to parse AI response' });
            return;
        }

        // Merge Firecrawl branding
        if (branding.colors) {
            extractedData.colors = {
                primary: branding.colors.primary || extractedData.colors?.primary,
                secondary: branding.colors.secondary || extractedData.colors?.secondary,
                accent: branding.colors.accent || extractedData.colors?.accent,
            };
        }

        // Logo validation heuristics - reject likely hero/banner images
        const isLikelyLogo = (url: string): boolean => {
            const lowerUrl = url.toLowerCase();

            // Negative signals (likely hero/banner images)
            const isHeroImage = /hero|banner|bg|background|cover|featured|slide/i.test(lowerUrl);
            const isLargeImage = /\d{4}x\d{3,4}|w=\d{4}|h=\d{3,4}|width=\d{4}|height=\d{3,4}/i.test(lowerUrl);
            const isStockPhoto = /unsplash|pexels|shutterstock|istock|depositphotos/i.test(lowerUrl);
            const isContentImage = /blog|post|article|news|gallery|product-image/i.test(lowerUrl);

            // Reject if negative signals found
            if (isHeroImage || isLargeImage || isStockPhoto || isContentImage) {
                console.log('[Server] Rejected likely non-logo image:', url.slice(0, 100));
                return false;
            }

            return true;
        };

        if (branding.logo && isLikelyLogo(branding.logo)) {
            extractedData.logoUrl = branding.logo;
        }

        // Fallback: check branding.images.logo if top-level logo is missing
        if (!extractedData.logoUrl && (branding as any).images?.logo) {
            const fallbackLogo = (branding as any).images.logo;
            if (isLikelyLogo(fallbackLogo)) {
                extractedData.logoUrl = fallbackLogo;
            }
        }

        // Convert SVG logos to PNG for Gemini compatibility
        if (extractedData.logoUrl && isSvgUrl(extractedData.logoUrl)) {
            console.log('[Server] Detected SVG logo, converting to PNG...');
            const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
            extractedData.logoUrl = await convertSvgToPngIfNeeded(
                extractedData.logoUrl,
                'extracted', // Temporary ID for extraction, will be moved when business is created
                supabase,
                'logo'
            );
        }

        // Feature: Merge Firecrawl /extract data (structured JSON from Step 2b)
        // This is more reliable for contact info than the LLM extraction
        if (firecrawlExtractData) {
            if (!extractedData.profile) extractedData.profile = {};

            // Prioritize Firecrawl extraction for contact info
            if (firecrawlExtractData.emails?.length) {
                extractedData.profile.contactEmail = firecrawlExtractData.emails[0];
            }
            if (firecrawlExtractData.phones?.length) {
                extractedData.profile.contactPhone = firecrawlExtractData.phones[0];
            }
            if (firecrawlExtractData.address) {
                extractedData.profile.address = firecrawlExtractData.address;
            }

            // Merge socials from /extract endpoint
            if (firecrawlExtractData.socials && Array.isArray(firecrawlExtractData.socials)) {
                const currentSocials = extractedData.profile.socials || [];
                firecrawlExtractData.socials.forEach((social: { platform?: string; url?: string }) => {
                    if (!social.url) return;

                    // Normalize platform name
                    let platform = social.platform?.toLowerCase() || 'website';
                    if (social.url.includes('instagram')) platform = 'instagram';
                    else if (social.url.includes('facebook')) platform = 'facebook';
                    else if (social.url.includes('twitter') || social.url.includes('x.com')) platform = 'twitter';
                    else if (social.url.includes('linkedin')) platform = 'linkedin';
                    else if (social.url.includes('tiktok')) platform = 'tiktok';
                    else if (social.url.includes('youtube')) platform = 'youtube';
                    else if (social.url.includes('pinterest')) platform = 'pinterest';
                    else if (social.url.includes('whatsapp')) platform = 'whatsapp';

                    // Add if not already present
                    if (!currentSocials.some(s => s.handle === social.url)) {
                        currentSocials.push({ platform, handle: social.url });
                    }
                });
                extractedData.profile.socials = currentSocials;
            }
        }

        const confidence: Record<string, number> = {};
        if (extractedData.name) confidence.identity = 0.9;
        if (extractedData.colors?.primary) confidence.branding = 0.95;
        if (extractedData.profile?.contactEmail || extractedData.profile?.contactPhone) confidence.contact = 0.8;
        if (extractedData.voice?.archetypeInferred) confidence.voice = 0.7;
        if (extractedData.offerings?.length) confidence.offerings = 0.7;
        if (extractedData.logoUrl) confidence.logo = 0.95;

        console.log('[Server] Extraction complete, pages scraped:', pages.length);
        res.json({ success: true, data: extractedData, confidence, rawBranding: branding, pagesScraped: pages.length });

    } catch (error) {
        console.error('[Server] Extraction error:', error);
        res.status(500).json({ error: 'Extraction failed' });
    }
});


// --- SOCIAL PLANNER API ROUTES (Ported from Serverless) ---

import { createClient } from '@supabase/supabase-js';

const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

// Helper: Refresh expired token
async function refreshToken(refreshTokenValue: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
} | null> {
    try {
        const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: GHL_CLIENT_ID,
                client_secret: GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshTokenValue,
            }),
        });

        if (!response.ok) {
            console.error('[GHL Refresh] Failed:', await response.text());
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('[GHL Refresh] Error:', error);
        return null;
    }
}

// 1. Install Endpoint
app.get('/api/social/install', (req, res) => {
    const { businessId } = req.query;

    // HARDCODED: Must match exactly what's in GHL Marketplace App settings
    // Note: For local dev, we might need a tunnel, but for now we keep the vercel URL as redirect (or change to localhost if GHL app allows)
    // The user's GHL app likely expects the vercel URL.
    const redirectUri = 'https://ads-x-create-v2.vercel.app/api/social/callback';

    const SCOPES = [
        'socialplanner/account.readonly',
        'socialplanner/account.write',
        'socialplanner/oauth.readonly',
        'socialplanner/oauth.write',
        'socialplanner/post.readonly',
        'socialplanner/post.write',
        'locations.readonly',
        'users.readonly',
        'medias.readonly',
        'medias.write',
    ].join(' ');

    const params = new URLSearchParams({
        response_type: 'code',
        redirect_uri: redirectUri,
        client_id: GHL_CLIENT_ID!,
        scope: SCOPES,
    });

    if (businessId) {
        params.set('state', String(businessId));
    }

    const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?${params.toString()}`;
    res.json({ url: authUrl });
});

// 2. Callback Endpoint
app.get('/api/social/callback', async (req, res) => {
    const { code, state: businessId } = req.query;

    if (!code) {
        res.status(400).json({ error: 'Missing authorization code' });
        return;
    }

    const redirectUri = 'https://ads-x-create-v2.vercel.app/api/social/callback';
    const baseUrl = 'http://localhost:5173'; // Redirect back to local frontend

    try {
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: GHL_CLIENT_ID!,
                client_secret: GHL_CLIENT_SECRET!,
                grant_type: 'authorization_code',
                code: String(code),
                redirect_uri: redirectUri,
                user_type: 'Location',
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('[GHL Callback] Token exchange failed:', errorText);
            res.status(500).json({ error: 'Token exchange failed', details: errorText });
            return;
        }

        const tokenData = await tokenResponse.json();
        const { access_token, refresh_token, expires_in, locationId, userId } = tokenData;

        if (!locationId) {
            res.status(400).json({ error: 'No locationId in token response' });
            return;
        }

        const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString();
        const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

        const { error: dbError } = await supabase
            .from('ghl_integrations')
            .upsert({
                location_id: locationId,
                business_id: businessId || null,
                access_token,
                refresh_token,
                user_id: userId,
                expires_at: expiresAt,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'location_id' });

        if (dbError) {
            console.error('[GHL Callback] DB Error:', dbError);
            res.status(500).json({ error: 'Failed to store tokens', details: dbError.message });
            return;
        }

        if (businessId) {
            await supabase.from('businesses').update({ social_config: { ghlLocationId: locationId } }).eq('id', businessId);
        }

        const successUrl = businessId
            ? `${baseUrl}/business/${businessId}?ghl_connected=true`
            : `${baseUrl}?ghl_connected=true`;

        res.redirect(302, successUrl);

    } catch (error: any) {
        console.error('[GHL Callback] Error:', error);
        res.status(500).json({ error: 'OAuth callback failed', details: error.message });
    }
});

// 3. Accounts Endpoint
app.get('/api/social/accounts', async (req, res) => {
    const { locationId } = req.query;

    if (!locationId) {
        res.status(400).json({ error: 'Missing locationId' });
        return;
    }

    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
        const { data: integration, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('*')
            .eq('location_id', locationId)
            .single();

        if (dbError || !integration) {
            res.status(404).json({ error: 'No GHL integration found', accounts: [] });
            return;
        }

        let accessToken = integration.access_token;

        // Check for expiry
        if (new Date(integration.expires_at) < new Date()) {
            console.log('[GHL Accounts] Token expired, refreshing...');
            const refreshed = await refreshToken(integration.refresh_token);

            if (!refreshed) {
                console.error('[GHL Accounts] Refresh failed');
                res.status(401).json({ error: 'Token expired and refresh failed. Please reconnect.' });
                return;
            }

            // Update DB
            const { error: updateError } = await supabase.from('ghl_integrations').update({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
                expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('location_id', locationId);

            if (updateError) {
                console.error('[GHL Accounts] Failed to update token in DB:', updateError);
            } else {
                console.log('[GHL Accounts] Token refreshed and saved');
            }

            accessToken = refreshed.access_token;
        }

        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/accounts`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                },
            }
        );

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[GHL Accounts] Failed:', errorText);
            res.status(500).json({ error: 'Failed to fetch accounts', accounts: [] });
            return;
        }

        const data = await ghlResponse.json();
        const accounts = (data.results?.accounts || []).map((acc: any) => ({
            id: acc.id,
            platform: acc.platform?.toLowerCase() || 'unknown',
            name: acc.name || acc.username || 'Unknown Account',
            avatar: acc.avatar || acc.profilePicture,
            type: acc.type,
        }));

        res.status(200).json({ accounts });

    } catch (error: any) {
        console.error('[GHL Accounts] Error:', error);
        res.status(500).json({ error: 'Failed to fetch accounts', details: error.message });
    }
});

// 4. Social OAuth Proxy (Start)
app.post('/api/social/social-oauth', async (req, res) => {
    const { locationId, platform } = req.body;

    if (!locationId || !platform) {
        res.status(400).json({ error: 'Missing locationId or platform' });
        return;
    }

    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
        const { data: integration, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('*')
            .eq('location_id', locationId)
            .single();

        if (dbError || !integration) {
            res.status(404).json({ error: 'No GHL integration found for this location' });
            return;
        }

        let accessToken = integration.access_token;
        if (new Date(integration.expires_at) < new Date()) {
            const refreshed = await refreshToken(integration.refresh_token);
            if (!refreshed) {
                res.status(401).json({ error: 'Token expired and refresh failed' });
                return;
            }
            await supabase.from('ghl_integrations').update({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
                expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('location_id', locationId);
            accessToken = refreshed.access_token;
        }

        const usersResponse = await fetch(
            `https://services.leadconnectorhq.com/users/?locationId=${locationId}`,
            { headers: { 'Authorization': `Bearer ${accessToken}`, 'Version': '2021-07-28' } }
        );

        if (!usersResponse.ok) {
            res.status(500).json({ error: 'Failed to get users for location' });
            return;
        }

        const usersData = await usersResponse.json();
        const userId = usersData.users?.[0]?.id || integration.user_id;

        if (!userId) {
            res.status(400).json({ error: 'No user found in location' });
            return;
        }

        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/oauth/${platform}/start?locationId=${locationId}&userId=${userId}`,
            {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Version': '2021-07-28' },
                redirect: 'manual',
            }
        );

        const redirectUrl = ghlResponse.headers.get('location');
        if (!redirectUrl) {
            res.status(500).json({ error: 'No OAuth URL returned from GHL' });
            return;
        }

        res.status(200).json({ url: redirectUrl });

    } catch (error: any) {
        console.error('[GHL Social OAuth] Error:', error);
        res.status(500).json({ error: 'Social OAuth proxy failed', details: error.message });
    }
});

// 5. Post Endpoint
app.post('/api/social/post', async (req, res) => {
    const { accountIds, content, caption, media, mediaUrls, locationId, scheduledAt, firstComment } = req.body;
    const postCaption = caption || content; // Support both field names
    const postMedia = mediaUrls || media; // Support both field names

    if (!accountIds?.length || !locationId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
        const { data: integration, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('*')
            .eq('location_id', locationId)
            .single();

        if (dbError || !integration) {
            res.status(404).json({ error: 'No GHL integration found' });
            return;
        }

        let accessToken = integration.access_token;
        if (new Date(integration.expires_at) < new Date()) {
            const refreshed = await refreshToken(integration.refresh_token);
            if (!refreshed) {
                res.status(401).json({ error: 'Token expired and refresh failed' });
                return;
            }
            await supabase.from('ghl_integrations').update({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
                expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('location_id', locationId);
            accessToken = refreshed.access_token;
        }

        // Build base post body
        let summary = postCaption;
        let followUpComment: string | undefined = undefined;

        // If firstComment is enabled, extract hashtags from caption and put them in followUpComment
        if (firstComment && postCaption) {
            const hashtagRegex = /#[\w]+/g;
            const hashtags = postCaption.match(hashtagRegex);
            if (hashtags && hashtags.length > 0) {
                followUpComment = hashtags.join(' ');
                summary = postCaption.replace(hashtagRegex, '').trim().replace(/\s+/g, ' ');
            }
        }

        const postBody: any = {
            userId: integration.user_id,
            accountIds,
            summary,
            type: 'post',
            status: scheduledAt ? 'scheduled' : 'published',
            ...(postMedia?.length ? { media: postMedia.map((url: string) => ({ url, type: 'image/jpeg' })) } : {}),
            ...(scheduledAt ? { scheduleDate: scheduledAt } : { process: 'instant' }),
            ...(followUpComment ? { followUpComment } : {}),
        };

        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postBody),
            }
        );

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[GHL Post] Failed:', errorText);
            res.status(500).json({ error: 'Failed to create post', details: errorText });
            return;
        }

        const result = await ghlResponse.json();
        res.json({ success: true, result });

    } catch (error: any) {
        console.error('[GHL Post] Error:', error);
        res.status(500).json({ error: 'Failed to create post', details: error.message });
    }
});

// 6. Sync Endpoint
app.post('/api/social/sync', async (req, res) => {
    // Support both query params (from frontend) and body (for flexibility)
    const locationId = (req.query.locationId as string) || req.body?.locationId;
    const businessId = (req.query.businessId as string) || req.body?.businessId;

    if (!locationId) {
        res.status(400).json({ error: 'Missing locationId' });
        return;
    }

    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
        const { data: integration, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('*')
            .eq('location_id', locationId)
            .single();

        if (dbError || !integration) {
            res.status(404).json({ error: 'No GHL integration found' });
            return;
        }

        let accessToken = integration.access_token;

        // Check for expiry and refresh if needed
        if (new Date(integration.expires_at) < new Date()) {
            console.log('[GHL Sync] Token expired, refreshing...');
            const refreshed = await refreshToken(integration.refresh_token);
            if (!refreshed) {
                res.status(401).json({ error: 'Token expired and refresh failed' });
                return;
            }
            await supabase.from('ghl_integrations').update({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
                expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('location_id', locationId);
            accessToken = refreshed.access_token;
            console.log('[GHL Sync] Token refreshed successfully');
        }

        // Fetch posts from GHL - use POST /posts/list endpoint (not GET /posts)
        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts/list`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    limit: "50",
                    skip: "0",
                }),
            }
        );

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[GHL Sync] GHL API Error:', ghlResponse.status, errorText);
            res.status(500).json({ error: 'Failed to fetch GHL posts', status: ghlResponse.status, details: errorText });
            return;
        }

        const data = await ghlResponse.json();
        console.log('[GHL Sync] Got response:', JSON.stringify(data).slice(0, 200));
        const posts = data.results?.posts || data.posts || [];
        console.log('[GHL Sync] Processing', posts.length, 'posts');

        for (const post of posts) {
            // Log first post to understand structure
            if (posts.indexOf(post) === 0) {
                console.log('[GHL Sync] Sample post structure:', JSON.stringify(post, null, 2).slice(0, 500));
            }

            const ghlId = post._id || post.id;

            // Check if post already exists by ghl_post_id
            const { data: existing } = await supabase
                .from('social_posts')
                .select('id, updated_at')
                .eq('ghl_post_id', ghlId)
                .single();

            // Only update if GHL version is newer (or post doesn't exist locally)
            const ghlUpdatedAt = post.updatedAt ? new Date(post.updatedAt) : new Date();
            const localUpdatedAt = existing?.updated_at ? new Date(existing.updated_at) : new Date(0);

            // Skip if local version is newer (user edited locally)
            if (existing && localUpdatedAt > ghlUpdatedAt) {
                console.log('[GHL Sync] Skipping post (local is newer):', ghlId);
                continue;
            }

            const upsertData = {
                id: existing?.id || crypto.randomUUID(),  // Use existing or generate new UUID
                ghl_post_id: ghlId,
                business_id: integration.business_id,
                location_id: locationId,
                summary: post.summary || '',
                media_urls: post.media?.map((m: any) => m.url) || [],
                platforms: post.platform ? [post.platform] : [],
                parent_post_id: post.parentPostId || null,  // For grouping multi-platform posts
                scheduled_at: post.displayDate || post.scheduleDate || null,
                // Better status detection: check publishedAt for published, displayDate for scheduled
                status: post.publishedAt ? 'published'
                    : post.status === 'approved' ? 'scheduled'
                        : post.status === 'published' ? 'published'
                            : (post.displayDate && new Date(post.displayDate) > new Date()) ? 'scheduled'
                                : 'draft',
                synced_at: new Date().toISOString(),
                updated_at: ghlUpdatedAt.toISOString(),  // Use GHL's timestamp
            };

            console.log('[GHL Sync] Upserting post:', ghlId);
            const { error: upsertError } = await supabase.from('social_posts').upsert(upsertData, { onConflict: 'ghl_post_id' });

            if (upsertError) {
                console.error('[GHL Sync] Upsert error:', upsertError);
            }
        }

        res.json({ success: true, count: posts.length });

    } catch (error: any) {
        console.error('[GHL Sync] Error:', error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
});

// 7. Generate Caption Endpoint (Gemini 3 Flash)
app.post('/api/social/generate-caption', async (req, res) => {
    console.log('[Server] Caption Generation Request Received');

    const { assetPrompt, business, platform = 'general', hashtagMode = 'ai_plus_brand', brandHashtags = [] } = req.body;

    if (!assetPrompt || !business?.name) {
        res.status(400).json({ error: 'Missing required fields: assetPrompt, business.name' });
        return;
    }

    // Build dynamic hashtag instructions based on mode
    function buildHashtagInstruction(mode: string, tags: string[]): string {
        const brandTagsFormatted = tags.length > 0
            ? tags.map(t => `#${t.replace(/^#/, '')}`).join(' ')
            : '';

        switch (mode) {
            case 'brand_only':
                if (!brandTagsFormatted) {
                    return 'No brand hashtags provided. Add 3-5 relevant industry hashtags.';
                }
                return `Use ONLY these brand hashtags at the end: ${brandTagsFormatted}. Do NOT add any other hashtags.`;

            case 'ai_only':
                return 'Generate 3-5 relevant hashtags based on the content and industry. Do NOT use any provided brand hashtags.';

            case 'ai_plus_brand':
            default:
                if (brandTagsFormatted) {
                    return `Always include these brand hashtags: ${brandTagsFormatted}. You may add 1-2 additional relevant hashtags.`;
                }
                return 'Generate 3-5 relevant hashtags based on the content and industry.';
        }
    }

    try {
        const CAPTION_SYSTEM_PROMPT = `You are an expert social media copywriter. Given context about a business and an image description, write an engaging social media caption.

RULES:
1. Keep it concise (2-4 sentences max for Instagram, 1-2 for Twitter)
2. Match the brand voice and tone
3. Include a clear call-to-action when appropriate
4. Follow the HASHTAG RULES provided in each request
5. Use emojis sparingly and tastefully (1-3 max)
6. Never be generic - make it specific to THIS business

PLATFORM NUANCES:
- Instagram: Storytelling, lifestyle, emojis welcome
- LinkedIn: Professional, value-focused, minimal emojis
- Facebook: Conversational, community-focused
- Twitter: Punchy, witty, under 280 chars

Return ONLY the caption text. No explanations.`;

        const voiceContext = business.voice
            ? `Brand Voice: ${business.voice.archetype || 'Professional'}. Tone: ${business.voice.tonePills?.join(', ') || 'Engaging'}. ${business.voice.slogan ? `Slogan: "${business.voice.slogan}"` : ''}`
            : 'Brand Voice: Professional and engaging.';

        const hashtagInstruction = buildHashtagInstruction(hashtagMode, brandHashtags);

        const userPrompt = `
BUSINESS: ${business.name}
INDUSTRY: ${business.industry || 'General'}
TARGET AUDIENCE: ${business.targetAudience || 'General audience'}
${voiceContext}
PLATFORM: ${platform}

HASHTAG RULES: ${hashtagInstruction}

IMAGE/CONTENT DESCRIPTION:
${assetPrompt}

Write the caption now:`;

        console.log('[Server] Generating caption via Gemini 3 Flash...');

        // Use Vercel AI Gateway for Captioning
        const result = await generateText({
            model: gateway(AI_MODELS.text as any),
            system: CAPTION_SYSTEM_PROMPT,
            prompt: userPrompt,
            temperature: 0.7,
        });

        const caption = result.text?.trim();

        if (!caption) {
            res.status(500).json({ error: 'No caption generated' });
            return;
        }

        console.log('[Server] Caption generated successfully via Vercel Gateway');
        res.status(200).json({ caption });

    } catch (error: any) {
        console.error('[Caption API] Error:', error);
        res.status(500).json({ error: 'Failed to generate caption', details: error.message });
    }
});

// 8. Delete Post Endpoint
app.delete('/api/social/delete', async (req, res) => {
    console.log('[Server] Delete Post Request Received');

    const { locationId, postId, ghlPostId } = req.query;

    if (!locationId || !postId) {
        res.status(400).json({ error: 'Missing required params: locationId, postId' });
        return;
    }

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    try {
        // 1. Get GHL access token
        const { data: integration, error: intError } = await supabase
            .from('ghl_integrations')
            .select('access_token')
            .eq('location_id', locationId)
            .maybeSingle();

        if (intError || !integration?.access_token) {
            console.error('[Delete API] No integration found:', intError);
            res.status(401).json({ error: 'GHL integration not found' });
            return;
        }

        // 2. Delete from GHL (if we have a GHL post ID)
        if (ghlPostId) {
            console.log('[Delete API] Deleting from GHL:', ghlPostId);
            const ghlResponse = await fetch(
                `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts/${ghlPostId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${integration.access_token}`,
                        'Version': '2021-07-28',
                        'Content-Type': 'application/json',
                    },
                    signal: AbortSignal.timeout(10000)
                }
            );

            if (!ghlResponse.ok) {
                const errorText = await ghlResponse.text();
                console.error('[Delete API] GHL delete failed:', ghlResponse.status, errorText);
                // Don't fail entirely - still delete local cache
            } else {
                console.log('[Delete API] Deleted from GHL successfully');
            }
        }

        // 3. Delete from local Supabase cache
        const { error: deleteError } = await supabase
            .from('social_posts')
            .delete()
            .eq('id', postId);

        if (deleteError) {
            console.error('[Delete API] Supabase delete failed:', deleteError);
            res.status(500).json({ error: 'Failed to delete from local cache' });
            return;
        }

        console.log('[Delete API] Post deleted successfully:', postId);
        res.status(200).json({ success: true, deletedId: postId });

    } catch (error: any) {
        console.error('[Delete API] Error:', error);
        res.status(500).json({ error: 'Failed to delete post', details: error.message });
    }
});

// 9. Reschedule Post Endpoint
app.patch('/api/social/reschedule', async (req, res) => {
    console.log('[Reschedule API] Request received:', JSON.stringify(req.body));

    const { locationId, ghlPostId, newDate, localPostId } = req.body;

    if (!locationId || !ghlPostId || !newDate) {
        res.status(400).json({ error: 'Missing required fields: locationId, ghlPostId, newDate' });
        return;
    }

    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

        // Get GHL token
        const { data: integration, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('*')
            .eq('location_id', locationId)
            .single();

        if (dbError || !integration) {
            res.status(404).json({ error: 'No GHL integration found' });
            return;
        }

        let accessToken = integration.access_token;

        // Check for expiry and refresh if needed
        if (new Date(integration.expires_at) < new Date()) {
            const refreshed = await refreshToken(integration.refresh_token);
            if (!refreshed) {
                res.status(401).json({ error: 'Token expired and refresh failed' });
                return;
            }
            await supabase.from('ghl_integrations').update({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
                expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('location_id', locationId);
            accessToken = refreshed.access_token;
        }

        // Fetch the local post to get the platform name
        const { data: localPost } = await supabase
            .from('social_posts')
            .select('*')
            .eq('id', localPostId)
            .single();

        if (!localPost) {
            res.status(404).json({ error: 'Local post not found' });
            return;
        }

        // Get the platform from the local post (e.g., ["google"])
        const platforms = localPost.platforms || [];
        console.log('[Reschedule API] Post platforms:', platforms);

        // Fetch connected accounts to map platform name -> account ID
        const accountsResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/accounts`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                },
            }
        );

        if (!accountsResponse.ok) {
            const errorText = await accountsResponse.text();
            console.error('[Reschedule API] Failed to fetch accounts:', errorText);
            res.status(500).json({ error: 'Failed to fetch accounts', details: errorText });
            return;
        }

        const accountsData = await accountsResponse.json();
        const accounts = accountsData.results?.accounts || accountsData.accounts || [];
        console.log('[Reschedule API] Available accounts:', accounts.map((a: any) => ({ id: a.id, platform: a.platform })));

        // Map our platform names to GHL account IDs
        const accountIds = platforms
            .map((platformName: string) => {
                const account = accounts.find((a: any) =>
                    a.platform?.toLowerCase() === platformName?.toLowerCase()
                );
                return account?.id;
            })
            .filter(Boolean);

        console.log('[Reschedule API] Mapped accountIds:', accountIds);

        if (accountIds.length === 0) {
            res.status(400).json({ error: 'No matching account found for platforms: ' + platforms.join(', ') });
            return;
        }

        // Build payload with real account IDs
        const ghlPayload: any = {
            scheduleDate: new Date(newDate).toISOString(),
            accountIds,
            media: localPost.media_urls?.length > 0
                ? localPost.media_urls.map((url: string) => ({ url, type: 'image/jpeg' }))
                : [],
            type: 'post',
            userId: integration.user_id,
            summary: localPost.summary || '',
        };

        console.log('[Reschedule API] Sending to GHL:', JSON.stringify(ghlPayload));

        // Update the post on GHL
        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts/${ghlPostId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ghlPayload),
            }
        );

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[Reschedule API] GHL Error:', errorText);
            res.status(500).json({ error: 'Failed to reschedule on GHL', details: errorText });
            return;
        }

        // Update local cache too
        if (localPostId) {
            console.log('[Reschedule API] Updating local post:', localPostId);
            const { error: localError } = await supabase.from('social_posts').update({
                scheduled_at: new Date(newDate).toISOString(),  // Column is scheduled_at not scheduled_date
                updated_at: new Date().toISOString(),
            }).eq('id', localPostId);

            if (localError) {
                console.error('[Reschedule API] Local DB error:', localError);
            }
        }

        console.log('[Reschedule API] Post rescheduled successfully');
        res.json({ success: true, newDate });

    } catch (error: any) {
        console.error('[Reschedule API] Error:', error);
        res.status(500).json({ error: 'Failed to reschedule post', details: error.message });
    }
});

// 10. Update Post Endpoint (Full Edit)
app.put('/api/social/post', async (req, res) => {
    console.log('[Server] Update Post Request Received');

    const { locationId, ghlPostId, localPostId, caption, scheduledAt } = req.body;

    if (!locationId || !ghlPostId) {
        res.status(400).json({ error: 'Missing required fields: locationId, ghlPostId' });
        return;
    }

    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

        // Get GHL token
        const { data: integration, error: dbError } = await supabase
            .from('ghl_integrations')
            .select('*')
            .eq('location_id', locationId)
            .single();

        if (dbError || !integration) {
            res.status(404).json({ error: 'No GHL integration found' });
            return;
        }

        let accessToken = integration.access_token;

        // Check for expiry and refresh if needed
        if (new Date(integration.expires_at) < new Date()) {
            const refreshed = await refreshToken(integration.refresh_token);
            if (!refreshed) {
                res.status(401).json({ error: 'Token expired and refresh failed' });
                return;
            }
            await supabase.from('ghl_integrations').update({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
                expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('location_id', locationId);
            accessToken = refreshed.access_token;
        }
        // Fetch the local post to get existing data
        const { data: localPost } = await supabase
            .from('social_posts')
            .select('*')
            .eq('id', localPostId)
            .single();

        if (!localPost) {
            res.status(404).json({ error: 'Local post not found' });
            return;
        }

        // Get the platform from the local post to map to account ID
        const platforms = localPost.platforms || [];

        // Fetch connected accounts to get real account IDs
        const accountsResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/accounts`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                },
            }
        );

        const accountsData = await accountsResponse.json();
        const accounts = accountsData.results?.accounts || accountsData.accounts || [];

        // Map platform names to account IDs
        const accountIds = platforms
            .map((platformName: string) => {
                const account = accounts.find((a: any) =>
                    a.platform?.toLowerCase() === platformName?.toLowerCase()
                );
                return account?.id;
            })
            .filter(Boolean);

        if (accountIds.length === 0) {
            res.status(400).json({ error: 'No matching account found for platforms: ' + platforms.join(', ') });
            return;
        }

        // Build full GHL payload (GHL requires complete payload for PUT)
        const ghlPayload: any = {
            accountIds,
            media: localPost.media_urls?.length > 0
                ? localPost.media_urls.map((url: string) => ({ url, type: 'image/jpeg' }))
                : [],
            type: 'post',
            userId: integration.user_id,
            summary: caption !== undefined ? caption : localPost.summary,
        };

        if (scheduledAt) {
            ghlPayload.scheduleDate = new Date(scheduledAt).toISOString();
        }

        console.log('[Update Post API] Sending to GHL:', JSON.stringify(ghlPayload));

        // Update the post on GHL
        const ghlResponse = await fetch(
            `https://services.leadconnectorhq.com/social-media-posting/${locationId}/posts/${ghlPostId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ghlPayload),
            }
        );

        if (!ghlResponse.ok) {
            const errorText = await ghlResponse.text();
            console.error('[Update Post API] GHL Error:', errorText);
            res.status(500).json({ error: 'Failed to update on GHL', details: errorText });
            return;
        }

        // Update local cache with correct column names
        const localUpdate: any = { updated_at: new Date().toISOString() };
        if (caption !== undefined) localUpdate.summary = caption;  // Fixed: was 'caption'
        if (scheduledAt) localUpdate.scheduled_at = new Date(scheduledAt).toISOString();  // Fixed: was 'scheduled_date'

        const { error: localError } = await supabase.from('social_posts').update(localUpdate).eq('id', localPostId);

        if (localError) {
            console.error('[Update Post API] Local DB error:', localError);
        }

        console.log('[Update Post API] Post updated successfully');
        res.json({ success: true });

    } catch (error: any) {
        console.error('[Update Post API] Error:', error);
        res.status(500).json({ error: 'Failed to update post', details: error.message });
    }
});

// ============================================================================
// INVITE CODE API ROUTES (Platform Access Codes)
// ============================================================================

// Validate an invite code (public endpoint - called before OAuth)
app.post('/api/invite/validate', async (req, res) => {
    console.log('[Invite] Validate Request');

    // Rate limiting by IP
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(inviteValidateRateLimiter, clientIP);
    setRateLimitHeaders(res, rateLimit);

    if (!rateLimit.allowed) {
        console.log('[Invite] Rate limit exceeded for IP:', clientIP);
        res.status(429).json({ valid: false, error: 'Too many requests. Please try again later.' });
        return;
    }

    const { code } = req.body;
    if (!code) {
        res.status(400).json({ valid: false, error: 'Code is required' });
        return;
    }

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    try {
        const { data: invite, error } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();

        if (error || !invite) {
            res.json({ valid: false, error: 'Invalid code' });
            return;
        }

        // Check if active
        if (!invite.is_active) {
            res.json({ valid: false, error: 'This code has been deactivated' });
            return;
        }

        // Check if maxed out
        if (invite.max_uses && invite.current_uses >= invite.max_uses) {
            res.json({ valid: false, error: 'This code has reached its usage limit' });
            return;
        }

        // Check if expired
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            res.json({ valid: false, error: 'This code has expired' });
            return;
        }

        res.json({ valid: true, note: invite.note });

    } catch (error) {
        console.error('[Invite] Validate error:', error);
        res.status(500).json({ valid: false, error: 'Validation failed' });
    }
});

// Use/consume an invite code (called after successful OAuth signup)
app.post('/api/invite/use', async (req, res) => {
    console.log('[Invite] Use Code Request');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Rate limiting by user ID
    const rateLimit = await checkRateLimit(inviteUseRateLimiter, user.id);
    setRateLimitHeaders(res, rateLimit);

    if (!rateLimit.allowed) {
        console.log('[Invite] Rate limit exceeded for user:', user.id);
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
    }

    const { code } = req.body;
    if (!code) {
        res.status(400).json({ error: 'Code is required' });
        return;
    }

    try {
        // Re-validate (in case of race condition)
        const { data: invite, error } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();

        if (error || !invite || !invite.is_active) {
            res.status(400).json({ error: 'Invalid or inactive code' });
            return;
        }

        if (invite.max_uses && invite.current_uses >= invite.max_uses) {
            res.status(400).json({ error: 'Code maxed out' });
            return;
        }

        // Increment usage
        await supabase
            .from('invite_codes')
            .update({ current_uses: (invite.current_uses || 0) + 1 })
            .eq('id', invite.id);

        // Mark code used on profile
        await supabase
            .from('profiles')
            .update({ invite_code_used: code.toUpperCase().trim() })
            .eq('id', user.id);

        // Auto-provision subscription with beta package credits
        const creditsToGrant = invite.credits_granted ?? 25;
        const maxBusinesses = invite.max_businesses ?? 1;

        const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: user.id,
                plan_id: 'beta',
                status: 'active',
                credits_remaining: creditsToGrant,
                extra_businesses: Math.max(0, maxBusinesses - 1), // base plan allows 1, extra on top
                period_start: new Date().toISOString(),
                period_end: null // once-off, no renewal
            }, { onConflict: 'user_id' });

        if (subError) {
            console.error('[Invite] Subscription provision error:', subError);
        } else {
            console.log('[Invite] Provisioned beta subscription:', creditsToGrant, 'credits,', maxBusinesses, 'businesses');
        }

        console.log('[Invite] Code used by:', user.email, 'Code:', code);
        res.json({ success: true, creditsGranted: creditsToGrant, maxBusinesses });

    } catch (error) {
        console.error('[Invite] Use error:', error);
        res.status(500).json({ error: 'Failed to use code' });
    }
});

// Admin: List all invite codes
app.get('/api/invite/list', async (req, res) => {
    console.log('[Invite] List Request');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    const { data: codes, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });

    res.json({ codes: codes || [] });
});

// Admin: Create new invite code
app.post('/api/invite/create', async (req, res) => {
    console.log('[Invite] Create Request');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    const {
        prefix = 'BETA',
        maxUses = 1,
        expiresInDays,
        note,
        // Beta package configuration
        creditsGranted = 25,
        maxBusinesses = 1
    } = req.body;

    // Generate unique code: PREFIX-XXXX (4 alphanumeric)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (0,O,1,I)
    let suffix = '';
    for (let i = 0; i < 4; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const code = `${prefix.toUpperCase()}-${suffix}`;

    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    try {
        const { data: newCode, error } = await supabase
            .from('invite_codes')
            .insert({
                code,
                created_by: user.id,
                max_uses: maxUses,
                expires_at: expiresAt,
                note,
                is_active: true,
                // Beta package
                credits_granted: creditsGranted,
                max_businesses: maxBusinesses
            })
            .select()
            .single();

        if (error) {
            // Handle duplicate (unlikely but possible)
            if (error.code === '23505') {
                res.status(409).json({ error: 'Code collision, please try again' });
                return;
            }
            throw error;
        }

        console.log('[Invite] Created code:', code);
        res.json({ success: true, code: newCode });

    } catch (error) {
        console.error('[Invite] Create error:', error);
        res.status(500).json({ error: 'Failed to create code' });
    }
});

// Admin: Deactivate an invite code
app.post('/api/invite/deactivate', async (req, res) => {
    console.log('[Invite] Deactivate Request');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    const { codeId } = req.body;
    if (!codeId) {
        res.status(400).json({ error: 'codeId is required' });
        return;
    }

    await supabase
        .from('invite_codes')
        .update({ is_active: false })
        .eq('id', codeId);

    console.log('[Invite] Deactivated code:', codeId);
    res.json({ success: true });
});

// Admin: Delete an invite code permanently
app.post('/api/invite/delete', async (req, res) => {
    console.log('[Invite] Delete Request');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    const { codeId } = req.body;
    if (!codeId) {
        res.status(400).json({ error: 'codeId is required' });
        return;
    }

    await supabase
        .from('invite_codes')
        .delete()
        .eq('id', codeId);

    console.log('[Invite] Deleted code:', codeId);
    res.json({ success: true });
});

// ============================================================================
// ADMIN API ROUTES
// ============================================================================

// Admin: Delete user completely (including auth.users)
app.post('/api/admin/delete-user', async (req, res) => {
    console.log('[Admin] Delete User Request');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    const { userId } = req.body;
    if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
    }

    // Prevent self-deletion
    if (userId === user.id) {
        res.status(400).json({ error: 'Cannot delete yourself' });
        return;
    }

    try {
        // 1. Get all businesses owned by this user
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', userId);

        const businessIds = (businesses || []).map(b => b.id);

        // 2. Delete assets for their businesses
        if (businessIds.length > 0) {
            await supabase.from('assets').delete().in('business_id', businessIds);
        }

        // 3. Delete tasks owned by this user
        await supabase.from('tasks').delete().eq('owner_id', userId);

        // 4. Delete business_members entries
        await supabase.from('business_members').delete().eq('user_id', userId);
        if (businessIds.length > 0) {
            await supabase.from('business_members').delete().in('business_id', businessIds);
        }

        // 5. Delete their businesses
        await supabase.from('businesses').delete().eq('owner_id', userId);

        // 6. Delete subscription
        await supabase.from('subscriptions').delete().eq('user_id', userId);

        // 7. Delete profile
        await supabase.from('profiles').delete().eq('id', userId);

        // 8. DELETE AUTH USER (the key new step!)
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
        if (authDeleteError) {
            console.error('[Admin] Auth delete error:', authDeleteError);
            // Continue even if auth delete fails - user data is already removed
        }

        console.log('[Admin] User fully deleted:', userId);
        res.json({ success: true });

    } catch (error: any) {
        console.error('[Admin] Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

// --- TEAM API ROUTES ---
import { Resend } from 'resend';
// NOTE: Using pure TypeScript email templates instead of React Email components
// because TSX can't be dynamically processed at runtime in Express/Node.
import { generateInviteEmailHtml, generateShareAssetEmailHtml } from './lib/email-templates/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: Verify user's role in a business
async function verifyBusinessRole(
    supabase: any,
    businessId: string,
    userId: string,
    allowedRoles: string[]
): Promise<{ allowed: boolean; role?: string }> {
    const { data, error } = await supabase
        .from('business_members')
        .select('role')
        .eq('business_id', businessId)
        .eq('user_id', userId)
        .single();

    if (error || !data) return { allowed: false };
    return { allowed: allowedRoles.includes(data.role), role: data.role };
}

// 1. Create Invitation (Multi-business support)
app.post('/api/team/invite', async (req, res) => {
    console.log('[Team] Invite Request Received');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Support both old (businessId) and new (businessIds) format
    let { businessIds, businessId, accessScope = 'single', email, role, sendEmail = false } = req.body;

    // Backward compatibility: convert single businessId to array
    if (!businessIds && businessId) {
        businessIds = [businessId];
    }

    if (!businessIds || businessIds.length === 0) {
        res.status(400).json({ error: 'At least one businessId is required' });
        return;
    }

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
        res.status(400).json({ error: 'Valid role is required (admin, editor, viewer)' });
        return;
    }

    // Verify permission for ALL selected businesses
    for (const bizId of businessIds) {
        const { allowed } = await verifyBusinessRole(supabase, bizId, user.id, ['owner', 'admin']);
        if (!allowed) {
            res.status(403).json({ error: `No permission to invite for business: ${bizId}` });
            return;
        }
    }

    try {
        // Get business names for email
        const { data: businesses } = await supabase
            .from('businesses')
            .select('id, name')
            .in('id', businessIds);

        const businessNames = businesses?.map(b => b.name).join(', ') || 'your businesses';
        const primaryBusiness = businesses?.[0];

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Generate a shared token for all invitations in this batch
        const sharedToken = crypto.randomUUID();

        // Create invitation(s) - all share the same token
        let insertData: any[] = [];

        if (accessScope === 'all') {
            // Single invitation with 'all' access
            insertData = [{
                business_id: businessIds[0],
                email: email?.toLowerCase() || null,
                role,
                token: sharedToken,
                invited_by: user.id,
                expires_at: expiresAt.toISOString()
            }];
        } else {
            // Separate invitation for each business, same token so they're accepted together
            insertData = businessIds.map((bizId: string) => ({
                business_id: bizId,
                email: email?.toLowerCase() || null,
                role,
                token: sharedToken,
                invited_by: user.id,
                expires_at: expiresAt.toISOString()
            }));
        }

        const { data: invitations, error: inviteError } = await supabase
            .from('invitations')
            .insert(insertData)
            .select();

        if (inviteError) {
            console.error('[Team] Invite error:', inviteError);
            res.status(500).json({ error: 'Failed to create invitation' });
            return;
        }

        // ALWAYS use production URL for invite links - recipients click from external email clients
        const inviteLink = `https://app.xcreate.io/invite/${sharedToken}`;

        // Send email if requested
        if (sendEmail && email && process.env.RESEND_API_KEY) {
            try {
                const emailHtml = generateInviteEmailHtml({
                    businessName: businessNames,
                    role,
                    inviteLink
                });

                // Smart Subject Line
                let subject = 'You\'ve been invited to join the team';
                if (businesses && businesses.length > 0) {
                    if (businesses.length === 1) {
                        subject = `You've been invited to join ${businesses[0].name}`;
                    } else if (businesses.length === 2) {
                        subject = `You've been invited to join ${businesses[0].name} and ${businesses[1].name}`;
                    } else {
                        subject = `You've been invited to join ${businesses[0].name} and ${businesses.length - 1} others`;
                    }
                }

                await resend.emails.send({
                    from: 'Ads x Create <team@mail.xcreate.io>',
                    replyTo: 'team@xcreate.io',
                    to: email,
                    subject,
                    html: emailHtml
                });
                console.log('[Team] Invite email sent to:', email);
            } catch (emailError) {
                console.error('[Team] Email send error:', emailError);
            }
        }

        res.json({
            success: true,
            invitation: {
                id: invitations?.[0]?.id,
                token: sharedToken,
                expiresAt: expiresAt.toISOString(),
                businessCount: businessIds.length,
                accessScope
            },
            inviteLink
        });

    } catch (error) {
        console.error('[Team] Invite error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Accept Invitation
app.post('/api/team/accept', async (req, res) => {
    console.log('[Team] Accept Request Received');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    const { inviteToken, accessScope: requestedScope } = req.body;
    if (!inviteToken) {
        res.status(400).json({ error: 'inviteToken is required' });
        return;
    }

    try {
        // Get all invitations with this token (for multi-business)
        const { data: invitations, error: inviteError } = await supabase
            .from('invitations')
            .select('*, businesses(name)')
            .eq('token', inviteToken);

        if (inviteError || !invitations || invitations.length === 0) {
            res.status(404).json({ error: 'Invitation not found' });
            return;
        }

        const primaryInvite = invitations[0];

        if (primaryInvite.accepted_at) {
            res.status(400).json({ error: 'Invitation already accepted' });
            return;
        }

        if (new Date(primaryInvite.expires_at) < new Date()) {
            res.status(400).json({ error: 'Invitation expired' });
            return;
        }

        // Determine access scope
        const accessScope = requestedScope || 'single';
        const addedBusinesses: string[] = [];

        if (accessScope === 'all') {
            // Check if already member of the primary business
            const { data: existing } = await supabase
                .from('business_members')
                .select('id')
                .eq('business_id', primaryInvite.business_id)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                res.status(400).json({ error: 'Already a member' });
                return;
            }

            // Add ONE membership with access_scope = 'all'
            const { error: memberError } = await supabase
                .from('business_members')
                .insert({
                    business_id: primaryInvite.business_id,
                    user_id: user.id,
                    role: primaryInvite.role,
                    invited_by: primaryInvite.invited_by,
                    access_scope: 'all'
                });

            if (memberError) {
                console.error('[Team] Member add error:', memberError);
                res.status(500).json({ error: 'Failed to add member' });
                return;
            }
            addedBusinesses.push(primaryInvite.business_id);
        } else {
            // Add membership for each business
            for (const inv of invitations) {
                // Check if already member
                const { data: existing } = await supabase
                    .from('business_members')
                    .select('id')
                    .eq('business_id', inv.business_id)
                    .eq('user_id', user.id)
                    .single();

                if (!existing) {
                    const { error: memberError } = await supabase
                        .from('business_members')
                        .insert({
                            business_id: inv.business_id,
                            user_id: user.id,
                            role: inv.role,
                            invited_by: inv.invited_by,
                            access_scope: 'single'
                        });

                    if (!memberError) {
                        addedBusinesses.push(inv.business_id);
                    }
                }
            }
        }

        // Mark all invitations as accepted
        await supabase
            .from('invitations')
            .update({ accepted_at: new Date().toISOString() })
            .in('id', invitations.map(inv => inv.id));

        // NOTE: Do NOT auto-complete onboarding here. Invited users should still
        // go through UserOnboarding to fill in their profile (name, role, etc.)

        // Notify the inviter
        if (primaryInvite.invited_by) {
            await supabase.from('notifications').insert({
                user_id: primaryInvite.invited_by,
                type: 'success',
                title: 'Invite Accepted!',
                message: `${user.email} has joined ${primaryInvite.businesses?.name || 'your business'} as ${primaryInvite.role}`,
                link: `/profile?tab=team`
            });
        }

        console.log('[Team] Invite accepted, user added to businesses:', addedBusinesses);

        res.json({
            success: true,
            businessId: primaryInvite.business_id,
            businessName: primaryInvite.businesses?.name,
            role: primaryInvite.role,
            accessScope,
            businessCount: addedBusinesses.length
        });

    } catch (error) {
        console.error('[Team] Accept error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Revoke Invitation
app.delete('/api/team/revoke', async (req, res) => {
    console.log('[Team] Revoke Request Received');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    const { invitationId } = req.body;
    if (!invitationId) {
        res.status(400).json({ error: 'invitationId is required' });
        return;
    }

    try {
        // Get invitation
        const { data: invitation } = await supabase
            .from('invitations')
            .select('business_id')
            .eq('id', invitationId)
            .single();

        if (!invitation) {
            res.status(404).json({ error: 'Invitation not found' });
            return;
        }

        // Verify permission
        const { allowed } = await verifyBusinessRole(supabase, invitation.business_id, user.id, ['owner', 'admin']);
        if (!allowed) {
            res.status(403).json({ error: 'No permission to revoke' });
            return;
        }

        // Delete
        await supabase.from('invitations').delete().eq('id', invitationId);

        console.log('[Team] Invitation revoked:', invitationId);
        res.json({ success: true });

    } catch (error) {
        console.error('[Team] Revoke error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Send Test Email
app.post('/api/admin/test-email', async (req, res) => {
    console.log('[Admin] Test Email Request');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }

    const { type } = req.body;
    if (!type) {
        res.status(400).json({ error: 'Type is required' });
        return;
    }

    try {
        let emailHtml;
        let subject;

        if (type === 'invite') {
            subject = 'Test: You\'re Invited!';
            emailHtml = generateInviteEmailHtml({
                businessName: 'Acme Corp (Test)',
                role: 'Admin',
                inviteLink: 'https://app.xcreate.io/test-invite'
            });
        } else if (type === 'share') {
            subject = 'Test: Asset Shared';
            emailHtml = generateShareAssetEmailHtml({
                businessName: 'Acme Corp (Test)',
                shareUrl: 'https://app.xcreate.io/test-share',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        } else {
            res.status(400).json({ error: 'Invalid email type' });
            return;
        }

        await resend.emails.send({
            from: 'Ads x Create <team@mail.xcreate.io>',
            replyTo: 'team@xcreate.io',
            to: user.email!,
            subject,
            html: emailHtml
        });

        console.log('[Admin] Test email sent to:', user.email);
        res.json({ success: true });

    } catch (error) {
        console.error('[Admin] Test email error:', error);
        res.status(500).json({ error: 'Failed to send test email' });
    }
});

// ============================================================================
// IMAGE GENERATION API (Server-Side with Job Persistence)
// ============================================================================



// Helper: Convert URL to Base64 with proper MIME type detection
async function urlToBase64WithMime(url: string): Promise<{ base64: string; mimeType: string } | null> {
    try {
        let finalUrl = url;
        if (url.startsWith('/artifacts/')) {
            // Local dev assumes port 5173 for artifacts
            finalUrl = `http://localhost:5173${url}`;
        }

        const response = await fetch(finalUrl);
        if (!response.ok) {
            console.error(`[Generate] Failed to fetch image: ${response.status} ${finalUrl}`);
            return null;
        }

        // Get actual MIME type from response headers
        const contentType = response.headers.get('content-type') || 'image/png';
        // Clean up MIME type (remove charset or other parameters)
        let mimeType = contentType.split(';')[0].trim();

        const arrayBuffer = await response.arrayBuffer();
        let buffer: Buffer = Buffer.from(arrayBuffer) as Buffer;

        // Convert SVG to PNG since Gemini doesn't support SVG
        if (mimeType === 'image/svg+xml' || url.toLowerCase().endsWith('.svg')) {
            console.log(`[Generate] Converting SVG to PNG: ${url.substring(0, 80)}...`);
            try {
                buffer = await sharp(buffer)
                    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: false })
                    .png({ quality: 90 })
                    .toBuffer();
                mimeType = 'image/png';
            } catch (conversionError) {
                console.error(`[Generate] SVG conversion failed: ${url}`, conversionError);
                return null; // Skip this image if conversion fails
            }
        }

        const base64 = buffer.toString('base64');
        return { base64, mimeType };
    } catch (e) {
        console.error("[Generate] Failed to fetch image:", url, e);
        return null;
    }
}

// Backward compat wrapper
async function urlToBase64(url: string): Promise<string | null> {
    const result = await urlToBase64WithMime(url);
    return result?.base64 || null;
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

// POST /api/generate-image
// Creates a job, runs generation, saves result
app.post('/api/generate-image', async (req, res) => {
    console.log('[Generate] Image Generation Request Received');

    const {
        businessId,
        prompt,
        aspectRatio = '1:1',
        styleId,
        subjectId,
        modelTier = 'pro',
        thinkingMode, // 'LOW' | 'HIGH' | undefined (default = no thinkingConfig)
        strategy,
        subjectContext,
        stylePreset,
        isFreedomMode // NEW: Freedom Mode flag
    } = req.body;

    if (!businessId || !prompt) {
        res.status(400).json({ error: 'businessId and prompt are required' });
        return;
    }

    // Vercel AI Gateway uses AI_GATEWAY_API_KEY (set automatically)

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    try {
        // 1. Fetch Business Data
        const { data: business, error: bizError } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .single();

        if (bizError || !business) {
            res.status(404).json({ error: 'Business not found' });
            return;
        }

        // Map DB business to app format (simplified)
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
            res.status(500).json({ error: 'Failed to create job' });
            return;
        }

        console.log('[Generate] Job created:', job.id);

        // Return job ID immediately so frontend can track
        res.json({ jobId: job.id, status: 'processing' });

        // 3. Run Generation in Background (after response sent)
        // This is a "fire-and-forget" pattern for the HTTP response
        // The job status in DB is the source of truth
        (async () => {
            try {
                // Dynamic import to avoid supabase init before dotenv
                const { PromptFactory } = await import('./services/prompts.js');
                // Using Vercel AI Gateway for image generation

                // Build prompt - use Freedom Mode or Standard
                let finalPrompt: string;

                if (isFreedomMode) {
                    // FREEDOM MODE: Simplified prompt with brand colors + logo only
                    const { createFreedomModePrompt } = await import('./services/freedomPrompt.js');
                    finalPrompt = createFreedomModePrompt(prompt, mappedBusiness as any, aspectRatio);
                    console.log('[Generate] 🔓 FREEDOM MODE - Using simplified prompt');
                } else {
                    // STANDARD MODE: Full business context (existing code)
                    let visualPrompt = prompt;
                    if (subjectContext) {
                        visualPrompt += `\nPRIMARY SUBJECT: ${subjectContext.type}. ${subjectContext.preserveLikeness ? 'Maintain strict visual likeness.' : ''}`;
                    }

                    finalPrompt = await PromptFactory.createImagePrompt(
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
                        subjectContext?.termsAndConditions
                    );
                }

                console.log('[Generate] Final prompt length:', finalPrompt.length);

                // Log full prompt for debugging
                console.log('[Generate] === PROMPT ===');
                console.log(finalPrompt);
                console.log('[Generate] === END PROMPT ===');

                // DEBUG BYPASS
                if (prompt.toLowerCase().startsWith('debug:')) {
                    // LOG THE FULL PROMPT - This is the whole point of debug mode!
                    console.log('');
                    console.log('='.repeat(60));
                    console.log('=== DEBUG MODE: FULL CONSTRUCTED PROMPT ===');
                    console.log('='.repeat(60));
                    console.log(finalPrompt);
                    console.log('='.repeat(60));
                    console.log('=== END PROMPT ===');
                    console.log('');
                    console.log('[Generate] Prompt length:', finalPrompt.length, 'characters');
                    console.log('[Generate] Subject context:', subjectContext ? JSON.stringify(subjectContext, null, 2) : 'None');
                    console.log('[Generate] Style preset:', stylePreset?.name || 'None');
                    console.log('[Generate] Strategy:', strategy ? JSON.stringify(strategy, null, 2) : 'Default');
                    console.log('='.repeat(60));

                    // Check for slow debug mode (debug: slow) - waits before completing
                    const isSlowDebug = prompt.toLowerCase().includes('slow');
                    if (isSlowDebug) {
                        console.log('[Generate] DEBUG SLOW: Waiting 8 seconds to simulate generation...');
                        await new Promise(r => setTimeout(r, 8000));
                    }

                    const debugUrl = "https://placehold.co/1024x1024/png?text=DEBUG+MODE";

                    // Create asset
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
                        .eq('id', job.id);

                    console.log('[Generate] DEBUG: Job completed (check full prompt above)');
                    return;
                }

                // Build message content with images (Vercel AI Gateway format)
                const contentParts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [
                    { type: 'text', text: finalPrompt }
                ];

                // Add subject image if provided
                if (subjectContext?.imageUrl) {
                    const subjectResult = await urlToBase64WithMime(subjectContext.imageUrl);
                    if (subjectResult) {
                        contentParts.push({ type: 'image', image: `data:${subjectResult.mimeType};base64,${subjectResult.base64}` });
                        contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE 1: MAIN PRODUCT] ' });
                        console.log('[Generate] ✓ Subject image loaded');
                    } else {
                        console.error('[Generate] ✗ Subject image FAILED');
                    }
                }

                // Add logo if available (with retry)
                if (mappedBusiness.logoUrl) {
                    let logoResult = await urlToBase64WithMime(mappedBusiness.logoUrl);

                    // Retry once if failed
                    if (!logoResult) {
                        console.log('[Generate] ⚠️ Logo fetch failed, retrying...');
                        await new Promise(r => setTimeout(r, 500));
                        logoResult = await urlToBase64WithMime(mappedBusiness.logoUrl);
                    }

                    if (logoResult) {
                        contentParts.push({ type: 'image', image: `data:${logoResult.mimeType};base64,${logoResult.base64}` });
                        contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE: BUSINESS LOGO — PRESERVE ALL TEXT/LETTERING EXACTLY] ' });
                        console.log('[Generate] ✓ Logo loaded');
                    } else {
                        console.error('[Generate] ✗ Logo fetch FAILED after retry');
                    }
                }

                // Add style references if provided - FILTER to get ALL active, not just first
                if (stylePreset?.referenceImages?.length > 0) {
                    console.log('[Generate] Style has', stylePreset.referenceImages.length, 'reference images');

                    // Handle both formats: plain URLs and objects with isActive
                    const activeRefs = stylePreset.referenceImages.filter((r: any) => {
                        // If it's an object with isActive property, check it
                        if (typeof r === 'object' && r !== null && 'isActive' in r) {
                            return r.isActive === true;
                        }
                        // If it's just a URL string, include it
                        return typeof r === 'string';
                    });

                    console.log('[Generate] Active style references:', activeRefs.length);

                    let refCount = 0;
                    for (const ref of activeRefs) {
                        const url = typeof ref === 'string' ? ref : (ref.url || ref);
                        const styleResult = await urlToBase64WithMime(url);
                        if (styleResult) {
                            refCount++;
                            contentParts.push({ type: 'image', image: `data:${styleResult.mimeType};base64,${styleResult.base64}` });
                            contentParts.push({ type: 'text', text: ` [REFERENCE IMAGE ${refCount}: STYLE] ` });
                            console.log(`[Generate] ✓ Style ref ${refCount} loaded`);
                        } else {
                            console.error(`[Generate] ✗ Style ref FAILED: ${url.substring(0, 50)}...`);
                        }
                    }
                    console.log('[Generate] Successfully loaded', refCount, 'style reference images');
                } else if (stylePreset?.imageUrl) {
                    const styleResult = await urlToBase64WithMime(stylePreset.imageUrl);
                    if (styleResult) {
                        contentParts.push({ type: 'image', image: `data:${styleResult.mimeType};base64,${styleResult.base64}` });
                        contentParts.push({ type: 'text', text: ' [REFERENCE IMAGE: STYLE] ' });
                        console.log('[Generate] ✓ Style image loaded');
                    } else {
                        console.error('[Generate] ✗ Style image FAILED');
                    }
                }

                // === DETAILED GENERATION LOG ===
                const imageCount = contentParts.filter(p => p.type === 'image').length;
                const totalPayloadSize = JSON.stringify(contentParts).length;
                const payloadSizeMB = (totalPayloadSize / 1024 / 1024).toFixed(2);

                console.log('');
                console.log('='.repeat(60));
                console.log('[Generate] === FINAL PAYLOAD SUMMARY ===');
                console.log('[Generate] Prompt length:', finalPrompt.length, 'chars');
                console.log('[Generate] Images included:', imageCount);
                console.log('[Generate] Aspect ratio:', aspectRatio);
                console.log('[Generate] Payload Size:', payloadSizeMB, 'MB');
                console.log('[Generate] Image size config:', modelTier === 'ultra' ? '4K' : '2K');
                console.log('[Generate] Model tier:', modelTier);
                console.log('[Generate] Thinking mode:', thinkingMode || 'DEFAULT (no config)');
                console.log('='.repeat(60));

                // Debug large payloads
                if (parseFloat(payloadSizeMB) > 10) {
                    console.warn('[Generate] WARNING: Payload is very large (>10MB). This may cause timeouts.');
                }

                console.log('[Generate] Calling Gemini 3 Pro Image via Direct Google API...');
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
                // NOTE: thinkingConfig is NOT supported by gemini-3-pro-image-preview
                // despite Google's model docs claiming "Thinking: Supported"
                // See: https://github.com/google-gemini/generative-ai-js/issues/XXX
                const configToSend = {
                    responseModalities: ['TEXT', 'IMAGE'],
                    imageConfig: {
                        aspectRatio: aspectRatio,
                        imageSize: modelTier === 'ultra' ? '4K' : '2K',
                    },
                };
                console.log('[Generate] Config being sent:', JSON.stringify(configToSend, null, 2));

                const result = await googleClient.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: [{ role: 'user', parts: googleParts }],
                    config: configToSend as any,
                });

                // Extract image from response
                const genEndTime = Date.now();
                console.log(`[Generate] ⏱️ AI Generation took: ${((genEndTime - genStartTime) / 1000).toFixed(2)}s`);

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

                // Create asset record
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

                // Update job to completed
                await supabase
                    .from('generation_jobs')
                    .update({
                        status: 'completed',
                        result_asset_id: assetId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', job.id);

                console.log('[Generate] Job completed:', job.id, '-> Asset:', assetId);

            } catch (error: any) {
                console.error('[Generate] Generation failed:', error);

                await supabase
                    .from('generation_jobs')
                    .update({
                        status: 'failed',
                        error_message: error.message || 'Unknown error',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', job.id);
            }
        })();

    } catch (error: any) {
        console.error('[Generate] Error:', error);
        res.status(500).json({ error: 'Generation failed', details: error.message });
    }
});

// GET /api/generate-image/status/:jobId
// Check job status (for polling)
app.get('/api/generate-image/status/:jobId', async (req, res) => {
    const { jobId } = req.params;

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: job, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (error || !job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    // If completed, also fetch the asset
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

    res.json({
        id: job.id,
        status: job.status,
        errorMessage: job.error_message,
        resultAssetId: job.result_asset_id,
        asset,
        createdAt: job.created_at,
        updatedAt: job.updated_at
    });
});

// GET /api/generate-image/pending/:businessId
// Get all pending/processing jobs for a business (for page load)
app.get('/api/generate-image/pending/:businessId', async (req, res) => {
    const { businessId } = req.params;

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { data: jobs, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('business_id', businessId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

    if (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
        return;
    }

    res.json({ jobs: jobs || [] });
});

// DELETE /api/generate-image/job/:jobId
// Kill a stuck job (Admin only UI-side, but standard route here)
app.delete('/api/generate-image/job/:jobId', async (req, res) => {
    const { jobId } = req.params;
    console.log(`[Generate] Killing job: ${jobId}`);

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    const { error } = await supabase
        .from('generation_jobs')
        .delete()
        .eq('id', jobId);

    if (error) {
        console.error('[Generate] Failed to kill job:', error);
        res.status(500).json({ error: 'Failed to kill job' });
        return;
    }

    res.json({ success: true });
});

// ============================================================================
// TASK ATTACHMENTS API
// ============================================================================

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            // Documents
            'application/pdf',
            'text/plain',
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.log('[Tasks] File type rejected:', file.mimetype, file.originalname);
            cb(new Error(`File type not allowed: ${file.mimetype}`));
        }
    }
});

app.post('/api/tasks/upload', upload.single('file'), async (req, res) => {
    console.log('[Tasks] Upload Request Received');
    console.log('[Tasks] Body keys:', Object.keys(req.body));
    console.log('[Tasks] taskId:', req.body.taskId);
    console.log('[Tasks] businessId:', req.body.businessId);
    console.log('[Tasks] File present:', !!req.file);
    if (req.file) {
        console.log('[Tasks] File details:', { name: req.file.originalname, type: req.file.mimetype, size: req.file.size });
    }

    const { taskId, businessId } = req.body;
    const file = req.file;

    if (!taskId || !businessId || !file) {
        console.log('[Tasks] ❌ Missing required fields:', { taskId: !!taskId, businessId: !!businessId, file: !!file });
        res.status(400).json({ error: 'taskId, businessId, and file are required' });
        return;
    }

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    try {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `tasks/${businessId}/${taskId}/${timestamp}_${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (uploadError) {
            console.error('[Tasks] Upload error:', uploadError);
            res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
            return;
        }

        const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(storagePath);

        const attachment = {
            id: `att_${timestamp}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'file' as const,
            name: file.originalname,
            url: urlData.publicUrl,
            mimeType: file.mimetype,
            size: file.size,
            createdAt: new Date().toISOString(),
        };

        console.log('[Tasks] ✓ File uploaded:', attachment.name);
        res.json({ success: true, attachment });

    } catch (error) {
        console.error('[Tasks] Upload handler error:', error);
        res.status(500).json({ error: 'Upload failed', details: String(error) });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`✅ Local API Server running at http://localhost:${port}`);
    console.log(`   - POST /api/generate-text`);
    console.log(`   - POST /api/generate-image (NEW: Job-based)`);
    console.log(`   - GET  /api/generate-image/status/:jobId`);
    console.log(`   - GET  /api/generate-image/pending/:businessId`);
    console.log(`   - POST /api/extract-website`);
    console.log(`   - POST /api/export-print`);
    console.log(`   - SOCIAL: /api/social/* (install, callback, accounts, post, sync)`);
    console.log(`   - TEAM: /api/team/* (invite, accept, revoke)`);
    console.log(`   - POST /api/tasks/upload`);
});

// ============================================================================
// ADMIN: Migrate SVG logos to PNG (one-time cleanup)
// ============================================================================
app.post('/api/admin/migrate-svg-logos', async (req, res) => {
    console.log('[Admin] Migrating SVG logos to PNG...');

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

    try {
        // Find all businesses with SVG logos
        const { data: businesses, error } = await supabase
            .from('businesses')
            .select('id, name, logo_url')
            .or('logo_url.ilike.%.svg,logo_url.ilike.%.svg?%');

        if (error) {
            console.error('[Admin] Query error:', error);
            res.status(500).json({ error: 'Query failed' });
            return;
        }

        if (!businesses || businesses.length === 0) {
            res.json({ success: true, message: 'No SVG logos found', converted: 0 });
            return;
        }

        console.log(`[Admin] Found ${businesses.length} businesses with SVG logos`);
        const results: { id: string; name: string; oldUrl: string; newUrl: string }[] = [];

        for (const biz of businesses) {
            if (!biz.logo_url || !isSvgUrl(biz.logo_url)) continue;

            console.log(`[Admin] Converting logo for: ${biz.name}`);

            const newLogoUrl = await convertSvgToPngIfNeeded(
                biz.logo_url,
                biz.id,
                supabase,
                `logo-${biz.name}`
            );

            if (newLogoUrl !== biz.logo_url) {
                // Update the business with the new PNG URL
                const { error: updateError } = await supabase
                    .from('businesses')
                    .update({ logo_url: newLogoUrl })
                    .eq('id', biz.id);

                if (updateError) {
                    console.error(`[Admin] Failed to update ${biz.name}:`, updateError);
                } else {
                    results.push({
                        id: biz.id,
                        name: biz.name,
                        oldUrl: biz.logo_url,
                        newUrl: newLogoUrl
                    });
                }
            }
        }

        console.log(`[Admin] ✅ Converted ${results.length} SVG logos`);
        res.json({ success: true, converted: results.length, results });

    } catch (error) {
        console.error('[Admin] Migration error:', error);
        res.status(500).json({ error: 'Migration failed' });
    }
});
