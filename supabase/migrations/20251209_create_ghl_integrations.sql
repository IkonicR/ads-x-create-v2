create table if not exists ghl_integrations (
  id uuid primary key default gen_random_uuid(),
  business_id text references businesses(id) on delete cascade,
  location_id text not null,
  access_token text not null,
  refresh_token text not null,
  user_id text, -- GHL user ID associated with the token (for "actor" calls)
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one token set per location
  constraint ghl_integrations_location_id_key unique (location_id)
);

-- Index for fast lookups by location
create index if not exists idx_ghl_integrations_location_id on ghl_integrations(location_id);
create index if not exists idx_ghl_integrations_business_id on ghl_integrations(business_id);

-- RLS Policies (Only intended for backend access usually, but good practice)
alter table ghl_integrations enable row level security;

-- Allow authenticated users to read their own relevant integrations? 
-- For now, we'll keep it strictly backend-accessible or business-owner accessible.
create policy "Users can view integrations for their business"
  on ghl_integrations for select
  using (
    exists (
      select 1 from businesses
      where businesses.id = ghl_integrations.business_id
      and businesses.owner_id = auth.uid()
    )
  );
