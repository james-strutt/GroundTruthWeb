-- Phase 1: Create directories and properties tables
-- Non-breaking, additive-only changes.

-- updated_at trigger function (reusable)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- normalised_address trigger function
create or replace function public.set_normalised_address()
returns trigger as $$
begin
  new.normalised_address = lower(trim(new.address));
  return new;
end;
$$ language plpgsql;

-- Directories table
create table if not exists public.directories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  colour text,
  icon text,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_directories_user_archived
  on public.directories (user_id, is_archived);

create trigger directories_updated_at
  before update on public.directories
  for each row execute function public.set_updated_at();

-- Properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  directory_id uuid not null references public.directories(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  address text not null,
  normalised_address text not null,
  suburb text,
  latitude float8,
  longitude float8,
  propid int8,
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (directory_id, normalised_address)
);

create index if not exists idx_properties_directory on public.properties (directory_id);
create index if not exists idx_properties_user on public.properties (user_id);
create index if not exists idx_properties_normalised on public.properties (normalised_address);

create trigger properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create trigger properties_normalise_address
  before insert or update on public.properties
  for each row execute function public.set_normalised_address();

-- RLS policies
alter table public.directories enable row level security;
alter table public.properties enable row level security;

create policy directories_select_policy on public.directories
  for select using (user_id = auth.uid());

create policy directories_insert_policy on public.directories
  for insert with check (user_id = auth.uid());

create policy directories_update_policy on public.directories
  for update using (user_id = auth.uid());

create policy directories_delete_policy on public.directories
  for delete using (user_id = auth.uid());

create policy properties_select_policy on public.properties
  for select using (user_id = auth.uid());

create policy properties_insert_policy on public.properties
  for insert with check (user_id = auth.uid());

create policy properties_update_policy on public.properties
  for update using (user_id = auth.uid());

create policy properties_delete_policy on public.properties
  for delete using (user_id = auth.uid());

-- Grant access
grant all on public.directories to authenticated;
grant all on public.properties to authenticated;
