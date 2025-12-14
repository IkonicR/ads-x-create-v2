-- ============================================================================
-- SOCIAL PLANNER DATA ARCHITECTURE
-- Creates the social_posts table for local caching of GHL posts
-- Run this migration in Supabase SQL Editor
-- ============================================================================

-- Create the social_posts table
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ghl_post_id TEXT UNIQUE,                    -- GHL's post ID (for sync/upsert)
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE, -- Changed to TEXT to match businesses.id
    location_id TEXT,                           -- GHL location ID
    summary TEXT NOT NULL DEFAULT '',           -- Post caption/content
    media_urls JSONB DEFAULT '[]'::jsonb,       -- Array of media URLs
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    scheduled_at TIMESTAMPTZ,                   -- When to post
    published_at TIMESTAMPTZ,                   -- When it was published
    platforms JSONB DEFAULT '[]'::jsonb,        -- Array of platform names
    synced_at TIMESTAMPTZ,                      -- Last sync with GHL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_social_posts_business_id ON public.social_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_ghl_post_id ON public.social_posts(ghl_post_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON public.social_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view posts for businesses they own
CREATE POLICY "Users can view own business posts"
    ON public.social_posts
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Users can insert posts for businesses they own
CREATE POLICY "Users can insert posts for own businesses"
    ON public.social_posts
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Users can update posts for businesses they own
CREATE POLICY "Users can update own business posts"
    ON public.social_posts
    FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Users can delete posts for businesses they own
CREATE POLICY "Users can delete own business posts"
    ON public.social_posts
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE owner_id = auth.uid()
        )
    );

-- Grant access to authenticated users
GRANT ALL ON public.social_posts TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.social_posts IS 'Local cache of social media posts synced from GHL for instant loading';
