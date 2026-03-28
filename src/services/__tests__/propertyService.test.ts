import { describe, it, expect } from 'vitest';
import { mapProperty, mapPropertySummary } from '../propertyService';

describe('mapProperty', () => {
  it('maps snake_case row to camelCase Property', () => {
    const row = {
      id: 'prop-1',
      directory_id: 'dir-1',
      user_id: 'user-1',
      address: '15 Elizabeth St',
      normalised_address: '15 elizabeth st',
      suburb: 'Sydney',
      latitude: -33.8688,
      longitude: 151.2093,
      propid: 55,
      status: 'active',
      notes: 'Corner block',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-03-01T00:00:00Z',
    };

    const result = mapProperty(row);

    expect(result).toEqual({
      id: 'prop-1',
      directoryId: 'dir-1',
      userId: 'user-1',
      address: '15 Elizabeth St',
      normalisedAddress: '15 elizabeth st',
      suburb: 'Sydney',
      latitude: -33.8688,
      longitude: 151.2093,
      propid: 55,
      status: 'active',
      notes: 'Corner block',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-03-01T00:00:00Z',
    });
  });

  it('applies defaults for missing fields', () => {
    const row = {
      id: 'prop-2',
      directory_id: 'dir-2',
      user_id: 'user-2',
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    };

    const result = mapProperty(row);

    expect(result.address).toBe('');
    expect(result.normalisedAddress).toBe('');
    expect(result.suburb).toBeNull();
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.propid).toBeNull();
    expect(result.status).toBe('active');
    expect(result.notes).toBeNull();
  });
});

describe('mapPropertySummary', () => {
  it('maps snake_case row to camelCase PropertySummary', () => {
    const row = {
      id: 'prop-1',
      directory_id: 'dir-1',
      user_id: 'user-1',
      address: '20 King St',
      normalised_address: '20 king st',
      suburb: 'Newtown',
      latitude: -33.897,
      longitude: 151.179,
      propid: 77,
      status: 'under_offer',
      notes: 'Heritage listed',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-04-01T00:00:00Z',
      directory_name: 'Inner West',
      directory_colour: '#10B981',
      snap_count: 4,
      inspection_count: 2,
      appraisal_count: 1,
      monitor_count: 1,
      total_records: 8,
      last_activity_at: '2025-05-15T10:00:00Z',
      thumbnail_url: 'https://example.com/thumb.jpg',
    };

    const result = mapPropertySummary(row);

    expect(result).toEqual({
      id: 'prop-1',
      directoryId: 'dir-1',
      userId: 'user-1',
      address: '20 King St',
      normalisedAddress: '20 king st',
      suburb: 'Newtown',
      latitude: -33.897,
      longitude: 151.179,
      propid: 77,
      status: 'under_offer',
      notes: 'Heritage listed',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-04-01T00:00:00Z',
      directoryName: 'Inner West',
      directoryColour: '#10B981',
      snapCount: 4,
      inspectionCount: 2,
      appraisalCount: 1,
      monitorCount: 1,
      totalRecords: 8,
      lastActivityAt: '2025-05-15T10:00:00Z',
      thumbnailUrl: 'https://example.com/thumb.jpg',
    });
  });

  it('applies defaults for missing aggregate fields', () => {
    const row = {
      id: 'prop-2',
      directory_id: 'dir-2',
      user_id: 'user-2',
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    };

    const result = mapPropertySummary(row);

    expect(result.directoryName).toBe('');
    expect(result.directoryColour).toBeNull();
    expect(result.snapCount).toBe(0);
    expect(result.inspectionCount).toBe(0);
    expect(result.appraisalCount).toBe(0);
    expect(result.monitorCount).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.lastActivityAt).toBeNull();
    expect(result.thumbnailUrl).toBeNull();
  });
});
