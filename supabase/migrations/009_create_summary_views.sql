-- Phase 5: Create summary views

-- Properties summary view (replaces properties_grouped)
create or replace view public.properties_summary as
select
  p.id,
  p.directory_id,
  p.user_id,
  p.address,
  p.normalised_address,
  p.suburb,
  p.latitude,
  p.longitude,
  p.propid,
  p.status,
  p.notes,
  p.created_at,
  p.updated_at,
  d.name as directory_name,
  d.colour as directory_colour,
  count(distinct s.id) as snap_count,
  count(distinct i.id) as inspection_count,
  count(distinct a.id) as appraisal_count,
  count(distinct w.id) as monitor_count,
  (count(distinct s.id) + count(distinct i.id) + count(distinct a.id) + count(distinct w.id)) as total_records,
  greatest(max(s.created_at), max(i.created_at), max(a.created_at), max(w.created_at)) as last_activity_at,
  (select photo_url from public.snaps
   where property_id = p.id
   order by created_at desc limit 1) as thumbnail_url
from public.properties p
join public.directories d on d.id = p.directory_id
left join public.snaps s on s.property_id = p.id
left join public.inspections i on i.property_id = p.id
left join public.appraisals a on a.property_id = p.id
left join public.watched_properties w on w.property_id = p.id
group by p.id, d.name, d.colour;

-- Directory summary view
create or replace view public.directory_summary as
select
  d.id,
  d.user_id,
  d.name,
  d.description,
  d.colour,
  d.icon,
  d.is_archived,
  d.created_at,
  d.updated_at,
  count(distinct p.id) as property_count,
  coalesce(sum(ps.snap_count), 0) as total_snap_count,
  coalesce(sum(ps.inspection_count), 0) as total_inspection_count,
  coalesce(sum(ps.appraisal_count), 0) as total_appraisal_count,
  coalesce(sum(ps.monitor_count), 0) as total_monitor_count,
  coalesce(sum(ps.total_records), 0) as total_activity_count,
  max(ps.last_activity_at) as last_activity_at
from public.directories d
left join public.properties p on p.directory_id = d.id
left join public.properties_summary ps on ps.id = p.id
group by d.id;

grant select on public.properties_summary to authenticated;
grant select on public.directory_summary to authenticated;
