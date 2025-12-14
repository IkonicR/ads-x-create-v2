ALTER TABLE public.styles ADD COLUMN logo_material text;

-- Backfill existing styles with smart defaults
UPDATE public.styles SET logo_material = 'Glowing neon light source, casting colored light onto the scene.' WHERE id = 'midnight_run';
UPDATE public.styles SET logo_material = 'Gold or Silver foil embossing, reflective and premium.' WHERE id = 'luxury_dark'; -- Mapping from old name if exists, or just general update
UPDATE public.styles SET logo_material = 'Subtle matte print or engraving, natural texture.' WHERE id = 'organic_warm';
UPDATE public.styles SET logo_material = 'High-gloss 3D acrylic signage.' WHERE id = 'vibrant_pop'; -- Assuming vibrant pop exists
UPDATE public.styles SET logo_material = 'Clean, high-contrast digital overlay or screen print.' WHERE id = 'minimalist_tech';
UPDATE public.styles SET logo_material = 'Holographic or iridescent material.' WHERE id = 'ethereal_glow';
UPDATE public.styles SET logo_material = 'Bold, high-contrast magazine print.' WHERE id = 'editorial_flash';
