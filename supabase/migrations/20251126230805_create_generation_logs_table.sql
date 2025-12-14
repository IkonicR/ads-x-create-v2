
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  business_id TEXT REFERENCES businesses(id),
  prompt TEXT,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);
