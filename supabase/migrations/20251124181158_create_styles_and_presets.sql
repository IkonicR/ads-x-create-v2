-- Create presets table
CREATE TABLE public.presets (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    prompt_modifier text NOT NULL,
    icon text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Create styles table
CREATE TABLE public.styles (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    prompt_modifier text NOT NULL,
    image_url text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;

-- Create policies (Public Read, Admin Write)
-- For now, we'll allow authenticated users to read. Admin check will be implemented in app logic or via role if roles existed.
-- Assuming any logged in user can read for generation.
CREATE POLICY "Authenticated users can read presets" ON public.presets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read styles" ON public.styles FOR SELECT TO authenticated USING (true);

-- Allow all operations for authenticated users for now (simplifying for this prototype phase, usually would restrict write to admins)
CREATE POLICY "Authenticated users can write presets" ON public.presets FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can write styles" ON public.styles FOR ALL TO authenticated USING (true);

-- Seed Presets (Ad Archetypes)
INSERT INTO public.presets (id, name, description, prompt_modifier, icon, sort_order) VALUES
('hero_studio', 'Hero (Studio)', 'Clean, Product First', 'Professional studio product photography, clean solid background, soft main light, subtle rim light, 8k resolution, razor sharp focus on product.', 'camera', 1),
('lifestyle_context', 'Lifestyle (In Use)', 'Authentic, Relatable', 'Photorealistic lifestyle photography showing the product being used in a real-world context, natural lighting, shallow depth of field, human element implied or visible.', 'user', 2),
('flat_lay', 'Flat Lay (Creative)', 'Organized, Aesthetic', 'Top-down flat lay photography, organized composition, aesthetic supporting props, balanced layout, soft even lighting.', 'layers', 3),
('text_ready', 'Text-Ready (Negative Space)', 'Minimal, Ad-Optimized', 'Composition with ample negative space for text overlay, clean background, balanced asymmetry, professional advertising layout.', 'type', 4),
('macro_detail', 'Macro (Detail)', 'Texture, Quality', 'Extreme close-up macro photography, focus on texture and material quality, artistic depth of field, dramatic lighting to highlight details.', 'zoom-in', 5),
('retail_promo', 'Retail Promo (Sale)', 'The Hype. High energy sale composition.', 'High-energy commercial advertising composition, dynamic angles, floating product elements, confetti or geometric particles, excitement, bold solid background optimized for sale overlays.', 'tag', 6);

-- Seed Styles (Visual Vibes)
INSERT INTO public.styles (id, name, description, prompt_modifier, sort_order) VALUES
('midnight_run', 'Midnight Run (Black Friday)', 'Dark, Neon, Urgent', 'Pitch black background, bold neon rim lighting (red or brand accent), glossy reflective surfaces, cyber-Monday energy, high contrast, urgent atmosphere.', 1),
('holiday_cheer', 'Holiday Cheer', 'Festive, Warm, Sparkle', 'Festive holiday atmosphere, warm bokeh lights, subtle sparkles, cozy winter textures, gift-giving mood, emotional connection.', 2),
('editorial_flash', 'Editorial (Flash)', 'Trendy, Raw, High Contrast', 'Direct camera flash, hard shadows, high contrast, vignette, sharp focus, candid fashion magazine aesthetic.', 3),
('ethereal_glow', 'Ethereal (Glow)', 'Premium, Magical, Soft', 'Soft diffusion filter, glowing highlights, dreamy atmosphere, pastel tones, delicate lighting, airy and light.', 4),
('mood_noir', 'Mood (Noir)', 'Sleek, Mysterious, Low-Key', 'Low-key lighting, deep shadows, silhouette edges, moody atmosphere, cinematic color grading, premium and mysterious.', 5),
('minimalist_tech', 'Minimalist (Clean)', 'Modern, Matte, Isometric', 'Soft global illumination, matte surfaces, geometric composition, lack of visual clutter, isometric influence, super clean.', 6),
('organic_warm', 'Organic (Natural)', 'Earthy, Sun-kissed, Authentic', 'Natural window light, sun flares, shadows cast by plants/leaves, warm golden hour tones, earthy textures.', 7);
