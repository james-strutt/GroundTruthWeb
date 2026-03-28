import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('trainStationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchTrainStationsInBounds returns empty array on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const { fetchTrainStationsInBounds } = await import('../trainStationService');
    const result = await fetchTrainStationsInBounds(151.0, -33.9, 151.3, -33.7);
    expect(result).toEqual([]);
  });

  it('fetchTrainStationsInBounds returns empty array on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    const { fetchTrainStationsInBounds } = await import('../trainStationService');
    const result = await fetchTrainStationsInBounds(151.0, -33.9, 151.3, -33.7);
    expect(result).toEqual([]);
  });

  it('fetchTrainStationsInBounds maps feature data to TrainStation objects', async () => {
    const mockData = {
      features: [
        {
          attributes: { generalname: 'Central' },
          geometry: { x: 151.2069, y: -33.8832 },
        },
        {
          attributes: { generalname: 'Redfern' },
          geometry: { x: 151.1983, y: -33.8914 },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const { fetchTrainStationsInBounds } = await import('../trainStationService');
    const result = await fetchTrainStationsInBounds(151.0, -33.9, 151.3, -33.7);

    expect(result).toEqual([
      { name: 'Central', latitude: -33.8832, longitude: 151.2069 },
      { name: 'Redfern', latitude: -33.8914, longitude: 151.1983 },
    ]);
  });

  it('fetchTrainStationsInBounds filters out features without geometry', async () => {
    const mockData = {
      features: [
        { attributes: { generalname: 'Ghost Station' }, geometry: {} },
        {
          attributes: { generalname: 'Real Station' },
          geometry: { x: 151.2, y: -33.8 },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const { fetchTrainStationsInBounds } = await import('../trainStationService');
    const result = await fetchTrainStationsInBounds(151.0, -33.9, 151.3, -33.7);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Real Station');
  });
});
