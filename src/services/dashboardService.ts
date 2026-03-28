/**
 * Supabase queries for the dashboard — map pins and recent activity feed.
 */

import { supabase } from "../supabaseClient";
import type { MapPin, ActivityItem, FeatureType } from "../types/common";

export async function getAllPins(): Promise<MapPin[]> {
  if (!supabase) return [];
  const pins: MapPin[] = [];

  const [snaps, inspections, appraisals, watched, walks] = await Promise.all([
    supabase
      .from("snaps")
      .select("id, latitude, longitude, address, created_at")
      .limit(100),
    supabase
      .from("inspections")
      .select("id, latitude, longitude, address, created_at")
      .limit(100),
    supabase
      .from("appraisals")
      .select("id, latitude, longitude, address, created_at")
      .limit(100),
    supabase
      .from("watched_properties")
      .select("id, latitude, longitude, address, created_at")
      .limit(100),
    supabase
      .from("walk_sessions")
      .select("id, route, title, started_at")
      .limit(50),
  ]);

  const addPins = (
    rows: Record<string, unknown>[] | null,
    type: FeatureType,
  ): void => {
    for (const r of rows ?? []) {
      const lat = r["latitude"] as number | null;
      const lng = r["longitude"] as number | null;
      if (lat && lng && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        pins.push({
          id: r["id"] as string,
          type,
          latitude: lat,
          longitude: lng,
          address: (r["address"] as string) ?? "",
          createdAt:
            (r["created_at"] as string) ?? (r["started_at"] as string) ?? "",
        });
      }
    }
  };

  addPins(snaps.data, "snap");
  addPins(inspections.data, "inspect");
  addPins(appraisals.data, "appraise");
  addPins(watched.data, "monitor");

  for (const w of walks.data ?? []) {
    const route = w["route"] as [number, number][] | null;
    if (route?.length) {
      const [lng, lat] = route[0]!;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
      pins.push({
        id: w["id"] as string,
        type: "explore",
        latitude: lat,
        longitude: lng,
        address: (w["title"] as string) ?? "",
        createdAt: (w["started_at"] as string) ?? "",
      });
    }
  }

  return pins;
}

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  if (!supabase) return [];
  const items: ActivityItem[] = [];

  const [snaps, inspections, appraisals] = await Promise.all([
    supabase
      .from("snaps")
      .select("id, address, suburb, photo_url, ai_analysis, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("inspections")
      .select("id, address, suburb, overall_score, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("appraisals")
      .select("id, address, suburb, price_estimate, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  for (const s of snaps.data ?? []) {
    const analysis = s["ai_analysis"] as Record<string, unknown> | null;
    items.push({
      id: s["id"] as string,
      type: "snap",
      address: s["address"] as string,
      suburb: s["suburb"] as string,
      summary: (analysis?.["summary"] as string) ?? "Property snap",
      createdAt: s["created_at"] as string,
      photoUrl: s["photo_url"] as string | null,
    });
  }

  for (const i of inspections.data ?? []) {
    const score = i["overall_score"] as number | null;
    items.push({
      id: i["id"] as string,
      type: "inspect",
      address: i["address"] as string,
      suburb: i["suburb"] as string,
      summary: score ? `Condition: ${score}/10` : "Inspection",
      createdAt: i["created_at"] as string,
      photoUrl: null,
    });
  }

  for (const a of appraisals.data ?? []) {
    const est = a["price_estimate"] as Record<string, unknown> | null;
    const value = est?.["estimatedValue"] as number | null;
    items.push({
      id: a["id"] as string,
      type: "appraise",
      address: a["address"] as string,
      suburb: a["suburb"] as string,
      summary: value ? `Est. $${(value / 1_000_000).toFixed(2)}M` : "Appraisal",
      createdAt: a["created_at"] as string,
      photoUrl: null,
    });
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}
