-- Phase 3: Backfill data
-- Creates a default "My Properties" directory per user,
-- generates property records from existing address groupings,
-- and links activity records to their property.

-- Step 3a: Create default directory per user
insert into public.directories (user_id, name, description)
select distinct user_id, 'My Properties', 'Auto-created from existing records'
from (
  select user_id from public.snaps where user_id is not null
  union
  select user_id from public.inspections where user_id is not null
  union
  select user_id from public.appraisals where user_id is not null
  union
  select user_id from public.watched_properties where user_id is not null
  union
  select user_id from public.walk_sessions where user_id is not null
) all_users
on conflict do nothing;

-- Step 3b: Create property records from existing activity address groupings
insert into public.properties (directory_id, user_id, address, normalised_address, suburb, latitude, longitude, propid)
select
  d.id as directory_id,
  grouped.user_id,
  grouped.address,
  grouped.normalised_address,
  grouped.suburb,
  grouped.latitude,
  grouped.longitude,
  grouped.propid
from (
  select
    user_id,
    max(address) as address,
    lower(trim(max(address))) as normalised_address,
    max(suburb) as suburb,
    avg(latitude) as latitude,
    avg(longitude) as longitude,
    max(propid) as propid
  from (
    select user_id, address, suburb, latitude, longitude, propid, lower(trim(address)) as addr_key
    from public.snaps where address is not null and address != ''
    union all
    select user_id, address, suburb, latitude, longitude, propid, lower(trim(address)) as addr_key
    from public.inspections where address is not null and address != ''
    union all
    select user_id, address, suburb, latitude, longitude, propid, lower(trim(address)) as addr_key
    from public.appraisals where address is not null and address != ''
    union all
    select user_id, address, suburb, latitude, longitude, propid, lower(trim(address)) as addr_key
    from public.watched_properties where address is not null and address != ''
  ) all_activities
  group by user_id, addr_key
) grouped
join public.directories d on d.user_id = grouped.user_id and d.name = 'My Properties'
on conflict (directory_id, normalised_address) do nothing;

-- Step 3c: Backfill property_id on snaps
update public.snaps s
set property_id = p.id
from public.properties p
where p.user_id = s.user_id
  and p.normalised_address = lower(trim(s.address))
  and s.property_id is null
  and s.address is not null and s.address != '';

-- Step 3d: Backfill property_id on inspections
update public.inspections i
set property_id = p.id
from public.properties p
where p.user_id = i.user_id
  and p.normalised_address = lower(trim(i.address))
  and i.property_id is null
  and i.address is not null and i.address != '';

-- Step 3e: Backfill property_id on appraisals
update public.appraisals a
set property_id = p.id
from public.properties p
where p.user_id = a.user_id
  and p.normalised_address = lower(trim(a.address))
  and a.property_id is null
  and a.address is not null and a.address != '';

-- Step 3f: Backfill property_id on watched_properties
update public.watched_properties w
set property_id = p.id
from public.properties p
where p.user_id = w.user_id
  and p.normalised_address = lower(trim(w.address))
  and w.property_id is null
  and w.address is not null and w.address != '';

-- Step 3g: Backfill directory_id on walk_sessions (assign to default directory)
update public.walk_sessions ws
set directory_id = d.id
from public.directories d
where d.user_id = ws.user_id
  and d.name = 'My Properties'
  and ws.directory_id is null;
