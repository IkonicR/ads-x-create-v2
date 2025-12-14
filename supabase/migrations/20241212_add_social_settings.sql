-- Add social_settings JSONB column to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS social_settings JSONB DEFAULT '{
  "hashtagMode": "ai_plus_brand",
  "brandHashtags": [],
  "firstCommentDefault": false,
  "defaultPlatformIds": []
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN businesses.social_settings IS 'Social media posting preferences: hashtagMode (ai_only/brand_only/ai_plus_brand), brandHashtags, firstCommentDefault, defaultPlatformIds';
