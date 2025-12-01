alter table styles
add column reference_images text[] default array[]::text[];
