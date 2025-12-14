ALTER TABLE businesses ADD COLUMN IF NOT EXISTS visual_motifs JSONB DEFAULT '[]'::jsonb;
