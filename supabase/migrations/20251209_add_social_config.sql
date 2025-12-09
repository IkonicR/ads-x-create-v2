-- Migration: Add social_config to businesses table
-- Purpose: Store GHL Location ID, Access Token, and connected social accounts

-- Add the social_config JSONB column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'social_config'
    ) THEN
        ALTER TABLE businesses 
        ADD COLUMN social_config JSONB DEFAULT NULL;
        
        COMMENT ON COLUMN businesses.social_config IS 
        'GoHighLevel social media integration config: { ghlLocationId, ghlAccessToken, onboardingStatus, connectedAccounts[] }';
    END IF;
END $$;

-- Create an index for quick lookups by ghlLocationId
CREATE INDEX IF NOT EXISTS idx_businesses_social_config_location 
ON businesses ((social_config->>'ghlLocationId')) 
WHERE social_config IS NOT NULL;
