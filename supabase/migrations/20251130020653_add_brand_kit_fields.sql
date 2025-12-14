ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS logo_variants jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS typography jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS core_customer_profile jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS competitors jsonb DEFAULT '[]'::jsonb;
