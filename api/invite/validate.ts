import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Inline rate limiting to avoid module issues
let rateLimiter: any = null;

async function initRateLimiter() {
    if (rateLimiter !== null) return rateLimiter;

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        console.log('[RateLimit] Upstash not configured');
        rateLimiter = false;
        return false;
    }

    try {
        const { Ratelimit } = await import('@upstash/ratelimit');
        const { Redis } = await import('@upstash/redis');

        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });

        rateLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(10, '1 m'),
            analytics: true,
            prefix: 'ratelimit:invite:validate',
        });

        return rateLimiter;
    } catch (error) {
        console.error('[RateLimit] Failed to init:', error);
        rateLimiter = false;
        return false;
    }
}

function getClientIP(req: VercelRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return ip.trim();
    }
    return 'unknown';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Invite] Validate Request (Vercel)');

    // Rate limiting (optional)
    try {
        const limiter = await initRateLimiter();
        if (limiter) {
            const clientIP = getClientIP(req);
            const result = await limiter.limit(clientIP);

            res.setHeader('X-RateLimit-Limit', result.limit);
            res.setHeader('X-RateLimit-Remaining', result.remaining);

            if (!result.success) {
                console.log('[Invite] Rate limit exceeded for IP:', clientIP);
                return res.status(429).json({ valid: false, error: 'Too many requests. Please try again later.' });
            }
        }
    } catch (err) {
        console.error('[RateLimit] Error:', err);
        // Continue without rate limiting
    }

    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ valid: false, error: 'Code is required' });
    }

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    try {
        const { data: invite, error } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();

        if (error || !invite) {
            return res.json({ valid: false, error: 'Invalid code' });
        }

        if (!invite.is_active) {
            return res.json({ valid: false, error: 'This code has been deactivated' });
        }

        if (invite.max_uses && invite.current_uses >= invite.max_uses) {
            return res.json({ valid: false, error: 'This code has reached its usage limit' });
        }

        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return res.json({ valid: false, error: 'This code has expired' });
        }

        return res.json({ valid: true, note: invite.note });

    } catch (error) {
        console.error('[Invite] Validate error:', error);
        return res.status(500).json({ valid: false, error: 'Validation failed' });
    }
}
