/**
 * Rate Limiting Configuration
 * 
 * Uses Upstash Redis for distributed rate limiting.
 * This works across all Vercel serverless instances.
 * 
 * Setup:
 * 1. Create account at upstash.com
 * 2. Create Redis database
 * 3. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to env
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Upstash is configured
const isUpstashConfigured = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client (only if configured)
const redis = isUpstashConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

/**
 * Rate limiter for invite code validation (IP-based)
 * Limit: 10 requests per minute per IP
 */
export const inviteValidateRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
        analytics: true,
        prefix: 'ratelimit:invite:validate',
    })
    : null;

/**
 * Rate limiter for invite code use (User-based)
 * Limit: 5 requests per minute per user
 */
export const inviteUseRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: 'ratelimit:invite:use',
    })
    : null;

/**
 * Helper to get real client IP from request headers
 * Handles proxies and load balancers (Vercel, Cloudflare, etc.)
 */
export function getClientIP(req: any): string {
    // Vercel uses x-forwarded-for
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // Cloudflare uses cf-connecting-ip
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }

    // Standard x-real-ip
    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'];
    }

    // Fallback to socket
    return req.socket?.remoteAddress || req.ip || 'unknown';
}

/**
 * Check rate limit and return result
 * Returns { allowed: true } if Upstash is not configured (graceful degradation)
 */
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{
    allowed: boolean;
    limit?: number;
    remaining?: number;
    reset?: number;
}> {
    // If rate limiting not configured, allow all requests
    if (!limiter) {
        console.log('[RateLimit] Upstash not configured, allowing request');
        return { allowed: true };
    }

    try {
        const result = await limiter.limit(identifier);
        return {
            allowed: result.success,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
        };
    } catch (error) {
        console.error('[RateLimit] Error checking rate limit:', error);
        // On error, allow the request (fail open)
        return { allowed: true };
    }
}

/**
 * Set rate limit headers on response
 */
export function setRateLimitHeaders(
    res: any,
    rateLimit: { limit?: number; remaining?: number; reset?: number }
): void {
    if (rateLimit.limit !== undefined) {
        res.setHeader('X-RateLimit-Limit', rateLimit.limit);
    }
    if (rateLimit.remaining !== undefined) {
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    }
    if (rateLimit.reset !== undefined) {
        res.setHeader('X-RateLimit-Reset', rateLimit.reset);
    }
}

// Export configuration status for debugging
export { isUpstashConfigured };
