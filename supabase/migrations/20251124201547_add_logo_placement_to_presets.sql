ALTER TABLE public.presets ADD COLUMN logo_placement text;

-- Backfill Presets with intelligent placement logic
UPDATE public.presets SET logo_placement = 'Composited onto the product packaging as a realistic label. It must conform to the surface curvature.' WHERE id = 'hero_studio';
UPDATE public.presets SET logo_placement = 'Subtle usage on the product itself, appearing natural and incidental.' WHERE id = 'lifestyle_context';
UPDATE public.presets SET logo_placement = 'Placed on a tag, card, or packaging element within the flat lay arrangement.' WHERE id = 'flat_lay';
UPDATE public.presets SET logo_placement = 'Small, unobtrusive watermark in the bottom right corner.' WHERE id = 'text_ready';
UPDATE public.presets SET logo_placement = 'Etched or printed on the material texture being magnified.' WHERE id = 'macro_detail';
UPDATE public.presets SET logo_placement = 'Large, bold, floating 3D element behind the product or integrated into the background geometry.' WHERE id = 'retail_promo';
