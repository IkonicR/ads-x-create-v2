-- Add new JSONB column
alter table styles
add column reference_images_json jsonb default '[]'::jsonb;

-- Migrate existing text[] data to jsonb structure
-- We assume all existing images are active and generate a random UUID for them (or just use index as ID for now, but UUID is better for React keys)
-- Since we can't easily generate UUIDs in a pure SQL update without extensions sometimes, we'll just use the URL as ID or a simple structure.
-- Actually, let's use a simple transform.

update styles
set reference_images_json = (
  select jsonb_agg(
    jsonb_build_object(
      'id', gen_random_uuid(),
      'url', elem,
      'isActive', true
    )
  )
  from unnest(reference_images) as elem
)
where reference_images is not null and array_length(reference_images, 1) > 0;
