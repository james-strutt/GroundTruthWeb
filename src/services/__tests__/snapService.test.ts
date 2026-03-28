import { describe, it, expect } from 'vitest';
import { mapSnap, listSnaps, getSnap } from '../snapService';

describe('mapSnap', () => {
  it('maps snake_case row to camelCase Snap', () => {
    const row = {
      id: 'snap-1',
      user_id: 'user-1',
      property_id: 'prop-1',
      address: '10 George St',
      suburb: 'Sydney',
      latitude: -33.8688,
      longitude: 151.2093,
      propid: 42,
      photo_url: 'https://example.com/photo.jpg',
      spatial_data: { zone: 'R2' },
      ai_analysis: { summary: 'Brick house' },
      confidence: 0.95,
      is_favourite: true,
      created_at: '2025-01-01T00:00:00Z',
    };

    const result = mapSnap(row);

    expect(result).toEqual({
      id: 'snap-1',
      userId: 'user-1',
      propertyId: 'prop-1',
      address: '10 George St',
      suburb: 'Sydney',
      latitude: -33.8688,
      longitude: 151.2093,
      propid: 42,
      photoUrl: 'https://example.com/photo.jpg',
      spatialData: { zone: 'R2' },
      aiAnalysis: { summary: 'Brick house' },
      confidence: 0.95,
      isFavourite: true,
      createdAt: '2025-01-01T00:00:00Z',
    });
  });

  it('applies defaults for null and missing fields', () => {
    const row = {
      id: 'snap-2',
      user_id: 'user-2',
      latitude: -33.87,
      longitude: 151.21,
      created_at: '2025-06-01T00:00:00Z',
    };

    const result = mapSnap(row);

    expect(result.propertyId).toBeNull();
    expect(result.address).toBe('');
    expect(result.suburb).toBe('');
    expect(result.spatialData).toEqual({});
    expect(result.isFavourite).toBe(false);
    expect(result.photoUrl).toBeNull();
    expect(result.aiAnalysis).toBeNull();
    expect(result.confidence).toBeNull();
  });
});

describe('listSnaps', () => {
  it('returns empty array when supabase is null', async () => {
    const result = await listSnaps();
    expect(result).toEqual([]);
  });
});

describe('getSnap', () => {
  it('returns null when supabase is null', async () => {
    const result = await getSnap('snap-1');
    expect(result).toBeNull();
  });
});
