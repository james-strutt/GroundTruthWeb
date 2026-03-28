/**
 * Development Application query service — fetches DAs from
 * the Land iQ Labs Supabase database via PostGIS RPC.
 */

import { createClient } from '@supabase/supabase-js';

const daUrl = import.meta.env.VITE_DA_SUPABASE_URL ?? '';
const daKey = import.meta.env.VITE_DA_SUPABASE_ANON_KEY ?? '';

const daSupabase = daUrl && daKey
  ? createClient(daUrl, daKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export interface DA {
  id: string;
  address: string;
  suburb: string;
  latitude: number;
  longitude: number;
  status: string;
  type: string;
  description: string;
  cost: number | null;
  lodgementDate: string | null;
  council: string;
}

interface DARow {
  application_id: string;
  primary_address: string | null;
  suburb: string | null;
  application_status: string;
  application_type: string;
  development_description: string | null;
  development_types: { DevelopmentType?: string }[] | null;
  cost_of_development: number | null;
  lodgement_date: string | null;
  council_name: string;
  locations: { FullAddress?: string; X?: number; Y?: number; Suburb?: string }[] | null;
}

export async function fetchDAsNearPoint(
  longitude: number,
  latitude: number,
  radiusMetres = 200,
  limit = 20,
): Promise<DA[]> {
  if (!daSupabase) return [];

  try {
    const { data, error } = await daSupabase.rpc('search_da_near_point', {
      p_longitude: longitude,
      p_latitude: latitude,
      p_radius_metres: radiusMetres,
      p_limit: limit,
    });

    if (error || !data) return [];

    return (data as DARow[])
      .map(mapDARow)
      .filter((d): d is DA => d !== null);
  } catch {
    return [];
  }
}

function mapDARow(row: DARow): DA | null {
  const loc = row.locations?.[0];
  const lat = loc?.Y;
  const lng = loc?.X;
  if (!lat || !lng) return null;

  const devTypes = (row.development_types ?? [])
    .map((t) => t.DevelopmentType)
    .filter((t): t is string => !!t);

  return {
    id: row.application_id,
    address: row.primary_address ?? loc?.FullAddress ?? '',
    suburb: row.suburb ?? loc?.Suburb ?? '',
    latitude: lat,
    longitude: lng,
    status: row.application_status ?? 'Unknown',
    type: devTypes.join(', ') || (row.development_description?.slice(0, 60) ?? ''),
    description: row.development_description ?? '',
    cost: row.cost_of_development,
    lodgementDate: row.lodgement_date,
    council: row.council_name,
  };
}

export async function fetchDAsInBounds(
  west: number,
  south: number,
  east: number,
  north: number,
  limit = 200,
): Promise<DA[]> {
  if (!daSupabase) return [];

  const centLng = (west + east) / 2;
  const centLat = (south + north) / 2;
  const dlat = Math.abs(north - south) * 111_320;
  const dlng = Math.abs(east - west) * 111_320 * Math.cos(centLat * Math.PI / 180);
  const radius = Math.sqrt(dlat * dlat + dlng * dlng) / 2;

  try {
    const { data, error } = await daSupabase.rpc('search_da_near_point', {
      p_longitude: centLng,
      p_latitude: centLat,
      p_radius_metres: Math.min(radius, 5000),
      p_limit: limit,
    });

    if (error || !data) return [];

    return (data as DARow[])
      .map(mapDARow)
      .filter((d): d is DA => d !== null);
  } catch {
    return [];
  }
}
