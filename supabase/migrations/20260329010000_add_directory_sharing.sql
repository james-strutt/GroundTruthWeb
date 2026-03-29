-- Directory sharing: allows users to share directories (and all contained
-- properties / activities) with other users.

-- 1. directory_shares table
create table if not exists public.directory_shares (
  id uuid primary key default gen_random_uuid(),
  directory_id text not null references public.directories(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with_id uuid not null references auth.users(id) on delete cascade,
  permission text not null default 'read' check (permission in ('read', 'edit')),
  created_at timestamptz not null default now(),
  unique (directory_id, shared_with_id)
);

create index idx_directory_shares_shared_with on public.directory_shares(shared_with_id);
create index idx_directory_shares_directory on public.directory_shares(directory_id);
create index idx_directory_shares_owner on public.directory_shares(owner_id);

alter table public.directory_shares enable row level security;

create policy shares_select on public.directory_shares
  for select using (owner_id = auth.uid() or shared_with_id = auth.uid());

create policy shares_insert on public.directory_shares
  for insert with check (owner_id = auth.uid());

create policy shares_delete on public.directory_shares
  for delete using (owner_id = auth.uid() or shared_with_id = auth.uid());

grant all on public.directory_shares to authenticated;

-- 2. Helper: check if a user can access a directory (owner or shared)
create or replace function public.can_access_directory(dir_id text)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.directories where id = dir_id and user_id = auth.uid()
  ) or exists (
    select 1 from public.directory_shares where directory_id = dir_id and shared_with_id = auth.uid()
  )
$$;

-- 3. Update directories RLS — allow shared users to read
drop policy if exists directories_select_policy on public.directories;
create policy directories_select_policy on public.directories
  for select using (
    user_id = auth.uid()
    or id in (select directory_id from public.directory_shares where shared_with_id = auth.uid())
  );

-- 4. Update properties RLS — allow shared users to read
drop policy if exists properties_select_policy on public.properties;
create policy properties_select_policy on public.properties
  for select using (
    user_id = auth.uid()
    or public.can_access_directory(directory_id)
  );

-- 5. Update activity tables RLS — allow shared users to read
-- Snaps
drop policy if exists snaps_select_own on public.snaps;
create policy snaps_select_own on public.snaps
  for select using (
    auth.uid() = user_id
    or (property_id is not null and exists (
      select 1 from public.properties p
      where p.id = property_id
      and public.can_access_directory(p.directory_id)
    ))
  );

-- Inspections
drop policy if exists inspections_select_own on public.inspections;
create policy inspections_select_own on public.inspections
  for select using (
    auth.uid() = user_id
    or (property_id is not null and exists (
      select 1 from public.properties p
      where p.id = property_id
      and public.can_access_directory(p.directory_id)
    ))
  );

-- Appraisals
drop policy if exists appraisals_select_own on public.appraisals;
create policy appraisals_select_own on public.appraisals
  for select using (
    auth.uid() = user_id
    or (property_id is not null and exists (
      select 1 from public.properties p
      where p.id = property_id
      and public.can_access_directory(p.directory_id)
    ))
  );

-- Watched properties
drop policy if exists watched_select_own on public.watched_properties;
create policy watched_select_own on public.watched_properties
  for select using (
    auth.uid() = user_id
    or (property_id is not null and exists (
      select 1 from public.properties p
      where p.id = property_id
      and public.can_access_directory(p.directory_id)
    ))
  );

-- Walk sessions
drop policy if exists walks_select_own on public.walk_sessions;
create policy walks_select_own on public.walk_sessions
  for select using (
    auth.uid() = user_id
    or (property_id is not null and exists (
      select 1 from public.properties p
      where p.id = property_id
      and public.can_access_directory(p.directory_id)
    ))
  );

-- 6. Update users RLS — allow authenticated users to search by name
-- (needed for DM search and share-with-user search)
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (auth.uid() is not null);
