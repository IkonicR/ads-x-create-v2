-- ============================================================================
-- CONTENT PILLARS V2 - Schema Enhancement
-- Adds new columns for V2 chat-driven builder features
-- ============================================================================

-- 1. ADD NEW COLUMNS

-- Natural language instructions from chat
ALTER TABLE public.content_pillars 
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Per-platform output configuration (aspect ratios, caption styles)
-- Format: [{ platform: "instagram_feed", aspectRatio: "1:1", captionStyle: "short_punchy" }]
ALTER TABLE public.content_pillars 
ADD COLUMN IF NOT EXISTS platform_outputs JSONB DEFAULT '[]'::jsonb;

-- Style rotation configuration
-- Format: { enabled: true, styleIds: ["uuid1", "uuid2"], currentIndex: 0 }
ALTER TABLE public.content_pillars 
ADD COLUMN IF NOT EXISTS style_rotation JSONB;

-- 2. COMMENTS
COMMENT ON COLUMN public.content_pillars.instructions IS 'Natural language instructions captured from chat-driven builder';
COMMENT ON COLUMN public.content_pillars.platform_outputs IS 'Per-platform configuration: aspect ratios, caption styles';
COMMENT ON COLUMN public.content_pillars.style_rotation IS 'Style rotation config: { enabled, styleIds[], currentIndex }';
