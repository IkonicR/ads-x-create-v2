-- ============================================================================
-- CONTENT PILLARS - Database Schema
-- Creates tables for recurring content themes (Content Pillars feature)
-- ============================================================================

-- 1. CONTENT PILLARS TABLE
-- Stores the pillar definitions (recurring content rules)
CREATE TABLE IF NOT EXISTS public.content_pillars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    
    -- Identity
    name TEXT NOT NULL,                           -- e.g. "Motivation Monday"
    theme TEXT NOT NULL DEFAULT 'custom',         -- motivation | product | team | testimonial | educational | custom
    
    -- Schedule
    schedule_type TEXT NOT NULL DEFAULT 'weekly' CHECK (schedule_type IN ('weekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Sunday, 6=Saturday
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
    
    -- Content Source
    subject_mode TEXT NOT NULL DEFAULT 'static' CHECK (subject_mode IN ('static', 'rotate_offerings', 'rotate_team', 'rotate_locations')),
    static_subject_id TEXT,                       -- Specific offering/team member ID (when mode=static)
    last_rotated_index INTEGER DEFAULT 0,         -- Tracks rotation position
    
    -- Style & Generation
    style_preset_id TEXT,                         -- Link to styles table
    prompt_template TEXT,                         -- Custom prompt instructions
    generate_image BOOLEAN DEFAULT true,          -- Whether to auto-generate images
    
    -- Platforms
    platforms JSONB DEFAULT '[]'::jsonb,          -- Array of platform IDs to post to
    
    -- State
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PILLAR DRAFTS TABLE
-- Stores AI-generated content awaiting approval
CREATE TABLE IF NOT EXISTS public.pillar_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pillar_id UUID NOT NULL REFERENCES public.content_pillars(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    
    -- Generated Content
    caption TEXT NOT NULL DEFAULT '',
    image_asset_id UUID,                          -- Link to assets table (if image generated)
    image_url TEXT,                               -- Direct URL (backup)
    
    -- Target
    scheduled_for DATE NOT NULL,                  -- The date this content is meant for
    platforms JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'skipped', 'posted', 'expired')),
    approved_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    
    -- Subject tracking (for rotation history)
    subject_type TEXT,                            -- offering | team | location
    subject_id TEXT,                              -- The specific item used
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_content_pillars_business_id ON public.content_pillars(business_id);
CREATE INDEX IF NOT EXISTS idx_content_pillars_active ON public.content_pillars(is_active);
CREATE INDEX IF NOT EXISTS idx_content_pillars_day_of_week ON public.content_pillars(day_of_week);

CREATE INDEX IF NOT EXISTS idx_pillar_drafts_business_id ON public.pillar_drafts(business_id);
CREATE INDEX IF NOT EXISTS idx_pillar_drafts_pillar_id ON public.pillar_drafts(pillar_id);
CREATE INDEX IF NOT EXISTS idx_pillar_drafts_status ON public.pillar_drafts(status);
CREATE INDEX IF NOT EXISTS idx_pillar_drafts_scheduled_for ON public.pillar_drafts(scheduled_for);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_drafts ENABLE ROW LEVEL SECURITY;

-- Pillars: Users can manage pillars for businesses they own
CREATE POLICY "Users can view own business pillars"
    ON public.content_pillars FOR SELECT
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert pillars for own businesses"
    ON public.content_pillars FOR INSERT
    WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own business pillars"
    ON public.content_pillars FOR UPDATE
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete own business pillars"
    ON public.content_pillars FOR DELETE
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Drafts: Same RLS pattern
CREATE POLICY "Users can view own business drafts"
    ON public.pillar_drafts FOR SELECT
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert drafts for own businesses"
    ON public.pillar_drafts FOR INSERT
    WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own business drafts"
    ON public.pillar_drafts FOR UPDATE
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete own business drafts"
    ON public.pillar_drafts FOR DELETE
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- 5. GRANTS
GRANT ALL ON public.content_pillars TO authenticated;
GRANT ALL ON public.pillar_drafts TO authenticated;

-- 6. COMMENTS
COMMENT ON TABLE public.content_pillars IS 'Recurring content themes (Content Pillars) for automated content generation';
COMMENT ON TABLE public.pillar_drafts IS 'AI-generated content drafts awaiting user approval';
