import { describe, it, expect } from 'vitest';
import { mapWalk } from '../walkService';

describe('mapWalk', () => {
  it('maps snake_case row to camelCase WalkSession', () => {
    const row = {
      id: 'walk-1',
      user_id: 'user-1',
      directory_id: 'dir-1',
      property_id: 'prop-1',
      title: 'Morning walk in Newtown',
      suburb: 'Newtown',
      route: [[151.18, -33.9], [151.19, -33.9]],
      photos: [{ id: 'wp1', uri: 'https://example.com/walk1.jpg' }],
      segments: [{ index: 0, distanceMetres: 200 }],
      total_distance_metres: 1500,
      duration_seconds: 900,
      street_score: { overall: 8.2 },
      analysis_narrative: 'Leafy streets with good footpaths',
      started_at: '2025-02-10T07:00:00Z',
      ended_at: '2025-02-10T07:15:00Z',
      is_favourite: false,
    };

    const result = mapWalk(row);

    expect(result).toEqual({
      id: 'walk-1',
      userId: 'user-1',
      directoryId: 'dir-1',
      propertyId: 'prop-1',
      title: 'Morning walk in Newtown',
      suburb: 'Newtown',
      route: [[151.18, -33.9], [151.19, -33.9]],
      photos: [{ id: 'wp1', uri: 'https://example.com/walk1.jpg' }],
      segments: [{ index: 0, distanceMetres: 200 }],
      totalDistanceMetres: 1500,
      durationSeconds: 900,
      streetScore: { overall: 8.2 },
      analysisNarrative: 'Leafy streets with good footpaths',
      startedAt: '2025-02-10T07:00:00Z',
      endedAt: '2025-02-10T07:15:00Z',
      isFavourite: false,
    });
  });

  it('applies defaults for missing fields', () => {
    const row = {
      id: 'walk-2',
      user_id: 'user-2',
      started_at: '2025-06-01T00:00:00Z',
    };

    const result = mapWalk(row);

    expect(result.directoryId).toBeNull();
    expect(result.propertyId).toBeNull();
    expect(result.title).toBe('');
    expect(result.suburb).toBe('');
    expect(result.route).toEqual([]);
    expect(result.photos).toEqual([]);
    expect(result.segments).toEqual([]);
    expect(result.totalDistanceMetres).toBe(0);
    expect(result.durationSeconds).toBe(0);
    expect(result.isFavourite).toBe(false);
  });
});
