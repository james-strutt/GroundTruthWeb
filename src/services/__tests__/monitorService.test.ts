import { describe, it, expect } from 'vitest';
import { mapWatched } from '../monitorService';

describe('mapWatched', () => {
  it('maps snake_case row to camelCase WatchedProperty', () => {
    const row = {
      id: 'watch-1',
      user_id: 'user-1',
      property_id: 'prop-1',
      address: '8 Oxford St',
      suburb: 'Paddington',
      latitude: -33.886,
      longitude: 151.227,
      baseline_photo_url: 'https://example.com/baseline.jpg',
      latest_photo_url: 'https://example.com/latest.jpg',
      changes: [{ id: 'c1', severity: 'high' }],
      alerts: [{ id: 'a1', message: 'New DA lodged' }],
      visit_count: 5,
      last_visited_at: '2025-05-20T14:00:00Z',
      is_favourite: true,
      created_at: '2025-01-15T09:00:00Z',
    };

    const result = mapWatched(row);

    expect(result).toEqual({
      id: 'watch-1',
      userId: 'user-1',
      propertyId: 'prop-1',
      address: '8 Oxford St',
      suburb: 'Paddington',
      latitude: -33.886,
      longitude: 151.227,
      baselinePhotoUrl: 'https://example.com/baseline.jpg',
      latestPhotoUrl: 'https://example.com/latest.jpg',
      changes: [{ id: 'c1', severity: 'high' }],
      alerts: [{ id: 'a1', message: 'New DA lodged' }],
      visitCount: 5,
      lastVisitedAt: '2025-05-20T14:00:00Z',
      isFavourite: true,
      createdAt: '2025-01-15T09:00:00Z',
    });
  });

  it('applies defaults for missing fields', () => {
    const row = {
      id: 'watch-2',
      user_id: 'user-2',
      last_visited_at: '2025-06-01T00:00:00Z',
      created_at: '2025-06-01T00:00:00Z',
    };

    const result = mapWatched(row);

    expect(result.propertyId).toBeNull();
    expect(result.address).toBe('');
    expect(result.suburb).toBe('');
    expect(result.changes).toEqual([]);
    expect(result.alerts).toEqual([]);
    expect(result.visitCount).toBe(0);
    expect(result.isFavourite).toBe(false);
  });
});
