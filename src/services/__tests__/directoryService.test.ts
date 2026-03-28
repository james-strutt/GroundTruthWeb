import { describe, it, expect } from 'vitest';
import { mapDirectory, mapDirectorySummary } from '../directoryService';

describe('mapDirectory', () => {
  it('maps snake_case row to camelCase Directory', () => {
    const row = {
      id: 'dir-1',
      user_id: 'user-1',
      name: 'Eastern Suburbs',
      description: 'Properties in the eastern suburbs',
      colour: '#3B82F6',
      icon: 'building',
      is_archived: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-03-01T00:00:00Z',
    };

    const result = mapDirectory(row);

    expect(result).toEqual({
      id: 'dir-1',
      userId: 'user-1',
      name: 'Eastern Suburbs',
      description: 'Properties in the eastern suburbs',
      colour: '#3B82F6',
      icon: 'building',
      isArchived: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-03-01T00:00:00Z',
    });
  });

  it('applies defaults for missing fields', () => {
    const row = {
      id: 'dir-2',
      user_id: 'user-2',
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    };

    const result = mapDirectory(row);

    expect(result.name).toBe('');
    expect(result.description).toBeNull();
    expect(result.colour).toBeNull();
    expect(result.icon).toBeNull();
    expect(result.isArchived).toBe(false);
  });
});

describe('mapDirectorySummary', () => {
  it('maps snake_case row to camelCase DirectorySummary', () => {
    const row = {
      id: 'dir-1',
      user_id: 'user-1',
      name: 'Inner West',
      description: null,
      colour: '#10B981',
      icon: null,
      is_archived: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-02-01T00:00:00Z',
      property_count: 12,
      total_snap_count: 30,
      total_inspection_count: 8,
      total_appraisal_count: 5,
      total_monitor_count: 3,
      total_activity_count: 46,
      last_activity_at: '2025-05-20T14:00:00Z',
    };

    const result = mapDirectorySummary(row);

    expect(result).toEqual({
      id: 'dir-1',
      userId: 'user-1',
      name: 'Inner West',
      description: null,
      colour: '#10B981',
      icon: null,
      isArchived: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z',
      propertyCount: 12,
      totalSnapCount: 30,
      totalInspectionCount: 8,
      totalAppraisalCount: 5,
      totalMonitorCount: 3,
      totalActivityCount: 46,
      lastActivityAt: '2025-05-20T14:00:00Z',
    });
  });

  it('applies defaults for missing aggregate fields', () => {
    const row = {
      id: 'dir-2',
      user_id: 'user-2',
      created_at: '2025-06-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    };

    const result = mapDirectorySummary(row);

    expect(result.propertyCount).toBe(0);
    expect(result.totalSnapCount).toBe(0);
    expect(result.totalInspectionCount).toBe(0);
    expect(result.totalAppraisalCount).toBe(0);
    expect(result.totalMonitorCount).toBe(0);
    expect(result.totalActivityCount).toBe(0);
    expect(result.lastActivityAt).toBeNull();
  });
});
