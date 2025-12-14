-- Create notifications table
create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id text references public.businesses(id) on delete set null,
  type varchar(50) not null check (type in ('info', 'success', 'warning', 'error', 'system')),
  title text not null,
  message text not null,
  link text,
  metadata jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz default now(),
  constraint notifications_pkey primary key (id)
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can insert their own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

-- Indexes
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_user_read_idx on public.notifications(user_id, is_read);
