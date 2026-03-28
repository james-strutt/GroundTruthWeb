import { describe, it, expect } from 'vitest';
import { mapInspection } from '../inspectionService';

describe('mapInspection', () => {
  it('maps snake_case row to camelCase Inspection', () => {
    const row = {
      id: 'insp-1',
      user_id: 'user-1',
      property_id: 'prop-1',
      address: '5 Pitt St',
      suburb: 'Redfern',
      latitude: -33.89,
      longitude: 151.2,
      propid: 88,
      photos: [{ id: 'p1', uri: 'https://example.com/p1.jpg' }],
      report: { narrative: 'Good condition' },
      overall_score: 7.5,
      is_favourite: true,
      created_at: '2025-03-15T12:00:00Z',
    };

    const result = mapInspection(row);

    expect(result).toEqual({
      id: 'insp-1',
      userId: 'user-1',
      propertyId: 'prop-1',
      address: '5 Pitt St',
      suburb: 'Redfern',
      latitude: -33.89,
      longitude: 151.2,
      propid: 88,
      photos: [{ id: 'p1', uri: 'https://example.com/p1.jpg' }],
      report: { narrative: 'Good condition' },
      overallScore: 7.5,
      isFavourite: true,
      createdAt: '2025-03-15T12:00:00Z',
    });
  });

  it('applies defaults for null and missing fields', () => {
    const row = {
      id: 'insp-2',
      user_id: 'user-2',
      created_at: '2025-06-01T00:00:00Z',
    };

    const result = mapInspection(row);

    expect(result.propertyId).toBeNull();
    expect(result.address).toBe('');
    expect(result.suburb).toBe('');
    expect(result.photos).toEqual([]);
    expect(result.isFavourite).toBe(false);
    expect(result.report).toBeNull();
    expect(result.overallScore).toBeNull();
  });
});
