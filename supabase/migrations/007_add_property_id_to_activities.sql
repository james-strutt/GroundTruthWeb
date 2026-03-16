-- Phase 2: Add property_id FK columns to activity tables
-- All nullable for backward compatibility during migration.

alter table public.snaps
  add column if not exists property_id uuid references public.properties(id);

alter table public.inspections
  add column if not exists property_id uuid references public.properties(id);

alter table public.appraisals
  add column if not exists property_id uuid references public.properties(id);

alter table public.watched_properties
  add column if not exists property_id uuid references public.properties(id);

alter table public.walk_sessions
  add column if not exists directory_id uuid references public.directories(id);

alter table public.walk_sessions
  add column if not exists property_id uuid references public.properties(id);

-- Indexes on FK columns
create index if not exists idx_snaps_property on public.snaps (property_id);
create index if not exists idx_inspections_property on public.inspections (property_id);
create index if not exists idx_appraisals_property on public.appraisals (property_id);
create index if not exists idx_watched_property on public.watched_properties (property_id);
create index if not exists idx_walks_directory on public.walk_sessions (directory_id);
create index if not exists idx_walks_property on public.walk_sessions (property_id);
