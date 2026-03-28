import { describe, it, expect } from 'vitest';
import { mapAppraisal } from '../appraisalService';

describe('mapAppraisal', () => {
  it('maps snake_case row to camelCase Appraisal', () => {
    const row = {
      id: 'apr-1',
      user_id: 'user-1',
      property_id: 'prop-1',
      address: '22 Crown St',
      suburb: 'Surry Hills',
      latitude: -33.885,
      longitude: 151.213,
      propid: 101,
      scored_comps: [{ id: 'comp-1', address: '24 Crown St' }],
      price_estimate: { estimatedValue: 1200000 },
      is_favourite: false,
      created_at: '2025-04-10T08:30:00Z',
    };

    const result = mapAppraisal(row);

    expect(result).toEqual({
      id: 'apr-1',
      userId: 'user-1',
      propertyId: 'prop-1',
      address: '22 Crown St',
      suburb: 'Surry Hills',
      latitude: -33.885,
      longitude: 151.213,
      propid: 101,
      scoredComps: [{ id: 'comp-1', address: '24 Crown St' }],
      priceEstimate: { estimatedValue: 1200000 },
      isFavourite: false,
      createdAt: '2025-04-10T08:30:00Z',
    });
  });

  it('applies defaults for missing fields', () => {
    const row = {
      id: 'apr-2',
      user_id: 'user-2',
      created_at: '2025-06-01T00:00:00Z',
    };

    const result = mapAppraisal(row);

    expect(result.propertyId).toBeNull();
    expect(result.address).toBe('');
    expect(result.suburb).toBe('');
    expect(result.scoredComps).toEqual([]);
    expect(result.isFavourite).toBe(false);
  });
});
