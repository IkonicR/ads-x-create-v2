ALTER TABLE businesses ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]'::jsonb;
