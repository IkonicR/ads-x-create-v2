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
            limiter: Ratelimit.slidingWindow(5, '1 m'),
            analytics: true,
            prefix: 'ratelimit:invite:use',
        });

        return rateLimiter;
    } catch (error) {
        console.error('[RateLimit] Failed to init:', error);
        rateLimiter = false;
        return false;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Invite] Use Code Request (Vercel)');

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Rate limiting (optional)
    try {
        const limiter = await initRateLimiter();
        if (limiter) {
            const result = await limiter.limit(user.id);

            res.setHeader('X-RateLimit-Limit', result.limit);
            res.setHeader('X-RateLimit-Remaining', result.remaining);

            if (!result.success) {
                console.log('[Invite] Rate limit exceeded for user:', user.id);
                return res.status(429).json({ error: 'Too many requests. Please try again later.' });
            }
        }
    } catch (err) {
        console.error('[RateLimit] Error:', err);
    }

    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        const { data: invite, error } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();

        if (error || !invite || !invite.is_active) {
            return res.status(400).json({ error: 'Invalid or inactive code' });
        }

        if (invite.max_uses && invite.current_uses >= invite.max_uses) {
            return res.status(400).json({ error: 'Code maxed out' });
        }

        await supabase
            .from('invite_codes')
            .update({ current_uses: (invite.current_uses || 0) + 1 })
            .eq('id', invite.id);

        await supabase
            .from('profiles')
            .update({ invite_code_used: code.toUpperCase().trim() })
            .eq('id', user.id);

        console.log('[Invite] Code used by:', user.email, 'Code:', code);
        return res.json({ success: true });

    } catch (error) {
        console.error('[Invite] Use error:', error);
        return res.status(500).json({ error: 'Failed to use code' });
    }
}
