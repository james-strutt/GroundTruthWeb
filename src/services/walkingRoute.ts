/**
 * Walking route computation using Mapbox Directions API.
 * Nearest-neighbour ordering + road-following directions.
 */

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '';

interface Coord {
  latitude: number;
  longitude: number;
}

export interface WalkingRouteResult {
  polyline: Coord[];
  totalDistanceMetres: number;
  estimatedMinutes: number;
}

function haversine(a: Coord, b: Coord): number {
  const R = 6371000;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Order waypoints by nearest-neighbour from start */
function orderByNearest<T extends Coord>(start: Coord, points: T[]): T[] {
  const remaining = [...points];
  const ordered: T[] = [];
  let current = start;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(current, remaining[i]!);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    const nearest = remaining.splice(nearestIdx, 1)[0]!;
    ordered.push(nearest);
    current = nearest;
  }

  return ordered;
}

export async function computeWalkingRoute(
  subject: Coord,
  comps: Coord[],
): Promise<WalkingRouteResult> {
  if (comps.length === 0) return { polyline: [], totalDistanceMetres: 0, estimatedMinutes: 0 };

  const ordered = orderByNearest(subject, comps);
  const allCoords = [subject, ...ordered];
  const coordString = allCoords.map((c) => `${c.longitude},${c.latitude}`).join(';');

  // Try Mapbox Directions API
  if (MAPBOX_TOKEN) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordString}?overview=full&geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (response.ok) {
        const data = (await response.json()) as {
          code?: string;
          routes?: { geometry?: { coordinates?: number[][] }; distance?: number; duration?: number }[];
        };

        if (data.code === 'Ok' && data.routes?.length) {
          const route = data.routes[0]!;
          return {
            polyline: (route.geometry?.coordinates ?? []).map((c) => ({ latitude: c[1] ?? 0, longitude: c[0] ?? 0 })),
            totalDistanceMetres: Math.round(route.distance ?? 0),
            estimatedMinutes: Math.ceil((route.duration ?? 0) / 60),
          };
        }
      }
    } catch { /* fall through to straight-line */ }
  }

  // Fallback: straight lines
  let totalDist = 0;
  for (let i = 1; i < allCoords.length; i++) {
    totalDist += haversine(allCoords[i - 1]!, allCoords[i]!);
  }

  return {
    polyline: allCoords,
    totalDistanceMetres: Math.round(totalDist),
    estimatedMinutes: Math.ceil(totalDist / 83),
  };
}
