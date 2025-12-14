ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;
