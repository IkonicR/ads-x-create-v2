-- V2 God-Tier Style System Migration
-- Adds config JSONB column to styles table for Production Preset Schema (v3.0)

-- Add config column if not exists
ALTER TABLE styles ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN styles.config IS 'V2 God-Tier Production Preset Config (schemaVersion 3.0). Contains: mediumController, viewpoint, brandApplication, lighting, aesthetics.';

-- Index for JSONB queries on medium type (optional, for future filtering)
CREATE INDEX IF NOT EXISTS idx_styles_config_medium ON styles ((config->'mediumController'->>'medium'));
